/**
 * Seed script — populates Netlify Blob storage with Game #2 data from the Word doc.
 *
 * Usage (local, against a deployed Netlify site):
 *   NETLIFY_SITE_ID=<your-site-id> NETLIFY_TOKEN=<your-personal-token> node scripts/seed.js
 *
 * Or just run:  netlify dev  then in a second terminal:
 *   node scripts/seed.js
 * (when running locally via netlify dev, the blob store is automatically available)
 *
 * Alternatively, paste the data into the chat ("Create the Game 2 plan…") and let
 * Claude handle it — the seed script is just a convenience shortcut.
 */

import { getStore } from '@netlify/blobs'

const GAME2_PLAN = {
  gameId: 'game-2-2026-05-14',
  title: 'Minor 4 — Game 2',
  date: '2026-05-14',
  version: 1,
  lastUpdated: new Date().toISOString(),
  battingOrder: [
    { slot: 1, name: 'Grace Lee' },
    { slot: 2, name: 'Blakely Kolesnik' },
    { slot: 3, name: 'Anna Eliason' },
    { slot: 4, name: 'Halle Raugust' },
    { slot: 5, name: 'Eleanor Maynard' },
    { slot: 6, name: 'Lila Haggins' },
    { slot: 7, name: 'Kaia Loach' },
  ],
  leadoffNote:
    'Per league rules, the lead-off batter rotates each game — if Game 1 ended on batter #5, Game 2 starts with batter #6.',
  innings: [
    {
      inning: 1,
      pitcher: 'Grace Lee',
      catcher: 'Blakely Kolesnik',
      first: 'Anna Eliason',
      second: 'Halle Raugust',
      shortstop: 'Eleanor Maynard',
      third: 'Lila Haggins',
      bench: 'Kaia Loach',
    },
    {
      inning: 2,
      pitcher: 'Blakely Kolesnik',
      catcher: 'Kaia Loach',
      first: 'Grace Lee',
      second: 'Anna Eliason',
      shortstop: 'Halle Raugust',
      third: 'Eleanor Maynard',
      bench: 'Lila Haggins',
    },
    {
      inning: 3,
      pitcher: 'Anna Eliason',
      catcher: 'Eleanor Maynard',
      first: 'Lila Haggins',
      second: 'Grace Lee',
      shortstop: 'Kaia Loach',
      third: 'Blakely Kolesnik',
      bench: 'Halle Raugust',
    },
    {
      inning: 4,
      pitcher: 'Halle Raugust',
      catcher: 'Lila Haggins',
      first: 'Eleanor Maynard',
      second: 'Kaia Loach',
      shortstop: 'Blakely Kolesnik',
      third: 'Anna Eliason',
      bench: 'Grace Lee',
    },
  ],
}

async function seed() {
  const store = getStore({ name: 'softball', consistency: 'strong' })

  console.log('Seeding Game #2 plan…')
  await store.setJSON(`plan-${GAME2_PLAN.gameId}`, GAME2_PLAN)
  await store.setJSON('active-plan', GAME2_PLAN)

  const manifest = [
    { id: GAME2_PLAN.gameId, title: GAME2_PLAN.title, date: GAME2_PLAN.date },
  ]
  await store.setJSON('plan-manifest', manifest)

  console.log('Done! Game #2 is now the active plan.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
