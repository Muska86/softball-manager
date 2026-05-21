// Used in local dev (import.meta.env.DEV) so UI changes can be tested without a backend.
export const DEMO_PLAN = {
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

export const DEMO_PLANS_LIST = [
  { id: 'game-2-2026-05-14', title: 'Minor 4 — Game 2', date: '2026-05-14' },
  { id: 'game-1-2026-05-07', title: 'Minor 4 — Game 1', date: '2026-05-07' },
]
