import { useState, useEffect } from 'react'

const scoreInputClass =
  'w-10 h-9 text-center font-mono font-semibold bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-600 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export default function ScoreboardCard({ plan, onPlanPatch }) {
  const inningCount = Math.max(plan?.innings?.length ?? 0, 6)
  const saved = plan?.scoreboard
  const isHome = plan?.homeOrAway === 'home'

  const [opponentName, setOpponentName] = useState(saved?.opponentName ?? 'Opponent')
  const [editingOpponent, setEditingOpponent] = useState(false)
  const [usScores, setUsScores] = useState(() => saved?.usScores ?? Array(inningCount).fill(''))
  const [themScores, setThemScores] = useState(() => saved?.themScores ?? Array(inningCount).fill(''))

  // Sync local state when plan updates from Realtime (another coach's changes)
  useEffect(() => {
    if (!plan?.scoreboard) return
    setOpponentName(plan.scoreboard.opponentName ?? 'Opponent')
    setUsScores(plan.scoreboard.usScores ?? Array(inningCount).fill(''))
    setThemScores(plan.scoreboard.themScores ?? Array(inningCount).fill(''))
  }, [plan?.scoreboard]) // eslint-disable-line react-hooks/exhaustive-deps

  function parseScore(raw) {
    return raw === '' ? '' : String(Math.max(0, parseInt(raw) || 0))
  }

  function setScore(setter, idx, raw) {
    setter((prev) => prev.map((s, i) => (i === idx ? parseScore(raw) : s)))
  }

  function saveScoreboard(latestUs, latestThem, latestOpponent) {
    onPlanPatch?.({
      scoreboard: {
        opponentName: latestOpponent ?? opponentName,
        usScores:     latestUs    ?? usScores,
        themScores:   latestThem  ?? themScores,
      },
    })
  }

  function total(scores) {
    return scores.reduce((sum, s) => sum + (parseInt(s) || 0), 0)
  }

  const usTotal    = total(usScores)
  const themTotal  = total(themScores)
  const usWinning  = usTotal > themTotal
  const themWinning = themTotal > usTotal
  const innings    = Array.from({ length: inningCount }, (_, i) => i + 1)

  // ── Row renderers ──────────────────────────────────────────────────────────

  function renderUsRow() {
    return (
      <tr>
        <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">🦝 Trash Pandas</td>
        {usScores.map((score, i) => (
          <td key={i} className="px-1.5 py-2 text-center">
            <input
              type="number" min="0" value={score} disabled={!onPlanPatch}
              onChange={(e) => setScore(setUsScores, i, e.target.value)}
              onBlur={(e) => {
                const next = usScores.map((s, idx) => idx === i ? parseScore(e.target.value) : s)
                saveScoreboard(next, null, null)
              }}
              placeholder="—" style={{ fontSize: '16px' }}
              className={scoreInputClass}
            />
          </td>
        ))}
        <td className="px-4 py-2 text-center border-l border-gray-700">
          <span className={`text-lg font-bold font-mono ${usWinning ? 'text-green-400' : 'text-white'}`}>
            {usTotal}
          </span>
        </td>
      </tr>
    )
  }

  function renderThemRow() {
    return (
      <tr>
        <td className="px-5 py-3 font-semibold text-gray-300 whitespace-nowrap">
          {editingOpponent ? (
            <input
              autoFocus value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              onBlur={() => { setEditingOpponent(false); saveScoreboard(null, null, opponentName) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setEditingOpponent(false); saveScoreboard(null, null, opponentName) } }}
              style={{ fontSize: '16px' }}
              className="bg-transparent border-b border-brand-500 text-white font-semibold focus:outline-none w-28"
            />
          ) : (
            <button
              onClick={() => onPlanPatch && setEditingOpponent(true)}
              title={onPlanPatch ? 'Tap to rename opponent' : undefined}
              className={`flex items-center gap-1.5 transition group ${onPlanPatch ? 'hover:text-white' : 'cursor-default'}`}
            >
              {opponentName}
              {onPlanPatch && (
                <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
                </svg>
              )}
            </button>
          )}
        </td>
        {themScores.map((score, i) => (
          <td key={i} className="px-1.5 py-2 text-center">
            <input
              type="number" min="0" value={score} disabled={!onPlanPatch}
              onChange={(e) => setScore(setThemScores, i, e.target.value)}
              onBlur={(e) => {
                const next = themScores.map((s, idx) => idx === i ? parseScore(e.target.value) : s)
                saveScoreboard(null, next, null)
              }}
              placeholder="—" style={{ fontSize: '16px' }}
              className={scoreInputClass}
            />
          </td>
        ))}
        <td className="px-4 py-2 text-center border-l border-gray-700">
          <span className={`text-lg font-bold font-mono ${themWinning ? 'text-red-400' : 'text-white'}`}>
            {themTotal}
          </span>
        </td>
      </tr>
    )
  }

  // Away on top, home on bottom (standard scoreboard convention)
  const topRow    = isHome ? renderThemRow() : renderUsRow()
  const bottomRow = isHome ? renderUsRow()   : renderThemRow()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="font-semibold text-white tracking-tight">Scoreboard</h3>
        {plan?.homeOrAway && (
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {isHome ? '· Home' : '· Away'}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-500">
          {onPlanPatch ? 'Tap a cell to enter score' : 'Read-only'}
        </span>
      </div>

      {/* Scoreboard table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 w-36">Team</th>
              {innings.map((n) => (
                <th key={n} className="px-3 py-2.5 text-xs font-medium text-gray-500 text-center min-w-[2.5rem]">{n}</th>
              ))}
              <th className="px-4 py-2.5 text-xs font-bold text-gray-300 text-center border-l border-gray-700 min-w-[3rem]">R</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {topRow}
            {bottomRow}
          </tbody>
        </table>
      </div>
    </div>
  )
}
