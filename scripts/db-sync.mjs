/**
 * db:sync — pulls all game plans from the deployed Netlify Blobs store
 * and writes them to data/plans.json in the repo.
 *
 * Usage:
 *   NETLIFY_SITE_ID=<your-site-id> NETLIFY_TOKEN=<your-pat> node scripts/db-sync.mjs
 *
 * Get a personal access token at:
 *   https://app.netlify.com/user/applications#personal-access-tokens
 *
 * Your site ID: 43e5f29f-e8a5-4974-bc5e-030e9e54d980
 *
 * After running, review changes with:
 *   git diff data/plans.json
 * Then commit:
 *   git add data/plans.json && git commit -m "sync: pull plans from Netlify"
 */

import { getStore } from '@netlify/blobs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../data/plans.json')

const siteID = process.env.NETLIFY_SITE_ID
const token  = process.env.NETLIFY_TOKEN

if (!siteID || !token) {
  console.error('\x1b[31mERROR:\x1b[0m NETLIFY_SITE_ID and NETLIFY_TOKEN must both be set.')
  console.error('')
  console.error('Example:')
  console.error('  NETLIFY_SITE_ID=43e5f29f-e8a5-4974-bc5e-030e9e54d980 NETLIFY_TOKEN=<your-pat> node scripts/db-sync.mjs')
  console.error('')
  console.error('Get a token at: https://app.netlify.com/user/applications#personal-access-tokens')
  process.exit(1)
}

async function sync() {
  console.log('\x1b[36m→\x1b[0m Connecting to Netlify Blobs…')

  const store = getStore({ name: 'softball', siteID, token, consistency: 'strong' })

  const manifestRaw = await store.get('plan-manifest', { type: 'text' })
  if (!manifestRaw) {
    console.log('\x1b[33m!\x1b[0m No plan-manifest found in Blobs — nothing to sync.')
    console.log('  Deploy the site and create at least one game plan first.')
    process.exit(0)
  }

  const manifest = JSON.parse(manifestRaw)
  console.log(`\x1b[36m→\x1b[0m Found ${manifest.length} plan(s) in manifest`)

  const plans = []
  for (const entry of manifest) {
    const raw = await store.get(`plan-${entry.id}`, { type: 'text' })
    if (!raw) {
      console.warn(`  \x1b[33mWARN:\x1b[0m plan-${entry.id} not found in Blobs — skipping`)
      continue
    }
    plans.push(JSON.parse(raw))
    console.log(`  \x1b[32m✓\x1b[0m ${entry.title} (${entry.id})`)
  }

  // Determine the active plan
  const activePlanRaw = await store.get('active-plan', { type: 'text' })
  let activePlanId = plans[0]?.gameId ?? null
  if (activePlanRaw) {
    activePlanId = JSON.parse(activePlanRaw).gameId
  }

  const db = {
    activePlanId,
    plans: plans.sort((a, b) => new Date(b.date) - new Date(a.date)),
  }

  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf-8')

  console.log('')
  console.log(`\x1b[32m✓\x1b[0m Wrote ${plans.length} plan(s) to data/plans.json`)
  console.log(`  Active plan: \x1b[1m${activePlanId}\x1b[0m`)
  console.log('')
  console.log('Next steps:')
  console.log('  git diff data/plans.json')
  console.log('  git add data/plans.json && git commit -m "sync: pull plans from Netlify"')
}

sync().catch((err) => {
  console.error('\x1b[31mSync failed:\x1b[0m', err.message)
  process.exit(1)
})
