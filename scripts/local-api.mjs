/**
 * Local development API server — mirrors the Netlify Functions surface.
 * Reads/writes data/plans.json instead of Netlify Blobs.
 *
 * Requires a .env.local file (or environment variables) with:
 *   CLAUDE_API_KEY=sk-ant-...
 *   SITE_PASSCODE=dev   (or whatever you want locally)
 *
 * Start with: node scripts/local-api.mjs
 * (normally launched via "npm run dev" through scripts/dev.mjs)
 *
 * SYSTEM_PROMPT: keep in sync with netlify/functions/chat.js
 */

import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../data/plans.json')
const PORT = 3002
const PASSCODE = process.env.SITE_PASSCODE || 'dev'

// ── SYSTEM_PROMPT — keep in sync with netlify/functions/chat.js ──────────────

const SYSTEM_PROMPT = `You are the game-day assistant for a youth softball team (Minor 4 division).
You help coaches manage the batting order and field assignments during games.

League rules:
- 7 players total; 6 on the field each inning, 1 on bench
- No player repeats the same position in consecutive innings
- Pitching rotates across innings within the game (and across the season)
- The bench player rotates too — no player should bench consecutively if avoidable
- The batting order lead-off rotates each game based on where the prior game ended

The plan JSON schema is:
{
  "gameId": "game-N-YYYY-MM-DD",          // e.g. "game-3-2026-05-21"
  "title": "Minor 4 — Game N",
  "date": "YYYY-MM-DD",
  "homeOrAway": "home" | "away",          // whether Trash Pandas are home or away
  "lastUpdated": "ISO timestamp",
  "version": number,
  "battingOrder": [
    { "slot": 1, "name": "Player Name" },
    ...up to 7 players
  ],
  "leadoffNote": "string describing lead-off rotation status",
  "innings": [
    {
      "inning": 1,
      "pitcher": "Player Name",
      "catcher": "Player Name",
      "first": "Player Name",
      "second": "Player Name",
      "shortstop": "Player Name",
      "third": "Player Name",
      "bench": "Player Name"
    },
    ...one object per inning
  ]
}

You will receive:
1. The current game plan as JSON (may be null if creating a new plan)
2. A coach's request in natural language

IMPORTANT: Always respond with ONLY a valid JSON object in this exact format — no markdown, no extra text:
{
  "message": "Short plain-English confirmation of what you did or answered.",
  "updatedPlan": <full plan JSON object if the plan changed, or null if it did not change>
}

When creating a new plan, always ask "Are you Home or Away for this game?" if the coach hasn't specified, and include the answer as "homeOrAway": "home" or "homeOrAway": "away" in the plan. Generate a complete plan with all innings populated (typically 4 innings for Minor 4). Ensure the no-consecutive-repeat-position rule is satisfied across all innings.`

// ── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY })

// ── DB helpers ───────────────────────────────────────────────────────────────

async function readDB() {
  const raw = await fs.readFile(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writeDB(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf-8')
}

async function persistPlan(plan) {
  const db = await readDB()
  const idx = db.plans.findIndex((p) => p.gameId === plan.gameId)
  if (idx >= 0) {
    db.plans[idx] = plan
  } else {
    db.plans.push(plan)
  }
  db.activePlanId = plan.gameId
  await writeDB(db)
  return plan
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Passcode')
}

function checkPasscode(req) {
  return req.headers['x-passcode'] === PASSCODE
}

// ── Route handlers ───────────────────────────────────────────────────────────

async function handlePlan(req, res) {
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const id = url.searchParams.get('id')
    const db = await readDB()
    const plan = id
      ? db.plans.find((p) => p.gameId === id)
      : db.plans.find((p) => p.gameId === db.activePlanId)
    if (!plan) return json(res, 404, { error: 'Plan not found' })
    return json(res, 200, plan)
  }

  if (req.method === 'POST') {
    if (!checkPasscode(req)) return json(res, 401, { error: 'Invalid passcode' })
    let plan
    try {
      plan = await readBody(req)
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    if (!plan.gameId) return json(res, 400, { error: 'Missing gameId' })

    const db = await readDB()
    const current = db.plans.find((p) => p.gameId === plan.gameId)
    plan.version = (current?.version || plan.version || 0) + 1
    plan.lastUpdated = new Date().toISOString()
    await persistPlan(plan)
    return json(res, 200, { ok: true, version: plan.version })
  }

  json(res, 405, { error: 'Method not allowed' })
}

async function handlePlans(req, res) {
  const db = await readDB()
  const manifest = db.plans
    .map((p) => ({ id: p.gameId, title: p.title, date: p.date }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  json(res, 200, manifest)
}

async function handleVersion(req, res) {
  const db = await readDB()
  const plan = db.plans.find((p) => p.gameId === db.activePlanId)
  if (!plan) return json(res, 200, { version: 0, lastUpdated: null })
  json(res, 200, { version: plan.version, lastUpdated: plan.lastUpdated })
}

async function handleChat(req, res) {
  if (!checkPasscode(req)) return json(res, 401, { error: 'Invalid passcode' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const { message, currentPlan } = body
  if (!message) return json(res, 400, { error: 'Missing message' })

  if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return json(res, 500, { error: 'CLAUDE_API_KEY or ANTHROPIC_API_KEY is not set in .env.local' })
  }

  // Include roster + preferences context so Claude can use it when building new plans
  const db = await readDB()
  const roster = db.roster ?? []
  const prefs = db.preferences ?? {}

  const rosterContext = roster.length > 0
    ? `\n\nTeam roster (use these players for new plans): ${roster.join(', ')}`
    : ''

  const prefLines = roster
    .map((name) => {
      const disliked = prefs[name]?.dislikedPositions ?? []
      return disliked.length > 0 ? `- ${name}: avoid ${disliked.join(', ')}` : null
    })
    .filter(Boolean)
  const prefsContext = prefLines.length > 0
    ? `\n\nPlayer position preferences (avoid these assignments where possible):\n${prefLines.join('\n')}`
    : ''

  const userContent = currentPlan
    ? `Current game plan:\n${JSON.stringify(currentPlan, null, 2)}${rosterContext}${prefsContext}\n\nCoach request: ${message}`
    : `No current plan exists yet.${rosterContext}${prefsContext}\n\nCoach request: ${message}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawText = response.content[0]?.text ?? ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return json(res, 200, { message: rawText, updatedPlan: null })

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return json(res, 200, {
        message: 'I had trouble formatting my response. Please try again.',
        updatedPlan: null,
      })
    }

    if (parsed.updatedPlan) {
      // Merge coach-entered fields (scoreboard, battingState) so Claude doesn't wipe them
      const plan = { ...currentPlan, ...parsed.updatedPlan }
      plan.version = (currentPlan?.version || 0) + 1
      plan.lastUpdated = new Date().toISOString()
      parsed.updatedPlan = plan
      await persistPlan(plan)
    }

    json(res, 200, parsed)
  } catch (err) {
    console.error('[chat]', err.message)
    json(res, 500, { error: 'Claude request failed' })
  }
}

async function handleRoster(req, res) {
  if (req.method === 'GET') {
    const db = await readDB()
    return json(res, 200, { roster: db.roster ?? [], preferences: db.preferences ?? {} })
  }

  if (req.method === 'POST') {
    if (!checkPasscode(req)) return json(res, 401, { error: 'Invalid passcode' })
    let body
    try {
      body = await readBody(req)
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    if (!Array.isArray(body.roster)) return json(res, 400, { error: 'roster must be an array' })
    const db = await readDB()
    db.roster = body.roster
    if (body.preferences !== undefined) db.preferences = body.preferences
    await writeDB(db)
    return json(res, 200, { ok: true })
  }

  json(res, 405, { error: 'Method not allowed' })
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  setCORSHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  const { pathname } = new URL(req.url, `http://localhost:${PORT}`)

  try {
    if (pathname === '/api/plan')    return await handlePlan(req, res)
    if (pathname === '/api/plans')   return await handlePlans(req, res)
    if (pathname === '/api/version') return await handleVersion(req, res)
    if (pathname === '/api/chat')    return await handleChat(req, res)
    if (pathname === '/api/roster')  return await handleRoster(req, res)

    res.writeHead(404)
    res.end('Not found')
  } catch (err) {
    console.error('[server error]', err)
    json(res, 500, { error: 'Internal server error' })
  }
})

server.listen(PORT, () => {
  console.log(`  \x1b[36m[api]\x1b[0m Local API ready at \x1b[1mhttp://localhost:${PORT}\x1b[0m`)
  console.log(`  \x1b[36m[api]\x1b[0m Database: ${DB_PATH}`)
  if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.warn(`  \x1b[33m[api]\x1b[0m WARNING: No API key set — /api/chat will return an error`)
  }
})
