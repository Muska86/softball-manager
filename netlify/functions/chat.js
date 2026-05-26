import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

const SYSTEM_PROMPT = `You are the game-day assistant for a youth softball team (Minor 4 division).
You help coaches manage the batting order and field assignments during games.

League rules:
- 7 players total; 6 on the field each inning, 1 on bench
- No player repeats the same position in consecutive innings
- Pitching rotates across innings within the game (and across the season)
- The bench player rotates too — no player should bench consecutively if avoidable
- The player on the bench in inning N MUST be the pitcher in inning N+1 (e.g. if Blakely benches in inning 1, she pitches in inning 2)
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

function checkPasscode(req) {
  const provided = req.headers.get('x-passcode')
  return provided === process.env.SITE_PASSCODE
}

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!checkPasscode(req)) {
    return Response.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, currentPlan } = body

  if (!message) {
    return Response.json({ error: 'Missing message' }, { status: 400 })
  }

  // Pull roster + preferences from Supabase to give Claude team context
  const supabase = getSupabase()
  const { data: rosterData } = await supabase.from('roster').select('roster, preferences').eq('id', 1).single()
  const roster = rosterData?.roster ?? []
  const prefs = rosterData?.preferences ?? {}

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
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawText = response.content[0]?.text ?? ''

    // Extract JSON — Claude should return only JSON but be defensive
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({
        message: rawText,
        updatedPlan: null,
      })
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return Response.json({
        message: 'I had trouble formatting my response. Please try again.',
        updatedPlan: null,
      })
    }

    // If Claude returned an updated plan, persist it to Supabase
    if (parsed.updatedPlan) {
      // Merge coach-entered fields (scoreboard, battingState) so Claude doesn't wipe them
      const plan = { ...currentPlan, ...parsed.updatedPlan }
      plan.version = (currentPlan?.version || 0) + 1
      plan.lastUpdated = new Date().toISOString()
      parsed.updatedPlan = plan

      // Clear current active flag
      await supabase.from('plans').update({ is_active: false }).eq('is_active', true)

      // Upsert this plan as active
      await supabase.from('plans').upsert({
        game_id: plan.gameId,
        title: plan.title,
        date: plan.date,
        data: plan,
        version: plan.version,
        last_updated: plan.lastUpdated,
        is_active: true,
      })
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('chat error:', err)
    return Response.json({ error: 'Claude request failed' }, { status: 500 })
  }
}

export const config = {
  path: '/api/chat',
}
