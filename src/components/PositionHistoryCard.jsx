const POSITION_SHORT = {
  pitcher:   'P',
  catcher:   'C',
  first:     '1B',
  second:    '2B',
  shortstop: 'SS',
  third:     '3B',
  bench:     'BN',
}

const POSITION_COLORS = {
  pitcher:   'bg-violet-800/70 text-violet-200 border-violet-700/50',
  catcher:   'bg-blue-800/70 text-blue-200 border-blue-700/50',
  first:     'bg-emerald-800/70 text-emerald-200 border-emerald-700/50',
  second:    'bg-teal-800/70 text-teal-200 border-teal-700/50',
  shortstop: 'bg-orange-800/70 text-orange-200 border-orange-700/50',
  third:     'bg-yellow-800/70 text-yellow-200 border-yellow-700/50',
  bench:     'bg-gray-800/70 text-gray-500 border-gray-700/50',
}

// For each player and inning, find what position they played
function buildMatrix(innings, players) {
  return players.map((name) => {
    const row = { name, innings: [] }
    for (const inning of innings) {
      const posKey = Object.keys(POSITION_SHORT).find((k) => inning[k] === name) ?? null
      row.innings.push(posKey)
    }
    return row
  })
}

// Flag if a player plays the same (non-bench) position in back-to-back innings
function hasConsecutiveRepeat(inningPositions) {
  for (let i = 1; i < inningPositions.length; i++) {
    const prev = inningPositions[i - 1]
    const curr = inningPositions[i]
    if (prev && curr && prev !== 'bench' && prev === curr) return true
  }
  return false
}

export default function PositionHistoryCard({ plan }) {
  const { innings = [], battingOrder = [] } = plan
  if (innings.length === 0) return null

  const players = battingOrder.map((b) => b.name)
  const matrix = buildMatrix(innings, players)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <h3 className="font-semibold text-white tracking-tight">Position History</h3>
        <span className="ml-auto text-xs text-gray-500">This game</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 w-32">Player</th>
              {innings.map((inn) => (
                <th key={inn.inning} className="px-3 py-2.5 text-xs font-medium text-gray-500 text-center">
                  Inn {inn.inning}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {matrix.map((row) => {
              const hasRepeat = hasConsecutiveRepeat(row.innings)
              return (
                <tr key={row.name} className="hover:bg-gray-800/30 transition">
                  <td className="px-5 py-3 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {row.name.split(' ')[0]}
                      {hasRepeat && (
                        <span
                          title="Same position in back-to-back innings"
                          className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                        />
                      )}
                    </div>
                  </td>
                  {row.innings.map((posKey, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {posKey ? (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold border ${POSITION_COLORS[posKey]}`}>
                          {POSITION_SHORT[posKey]}
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-gray-800 flex flex-wrap gap-2">
        {Object.entries(POSITION_SHORT).map(([key, short]) => (
          <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${POSITION_COLORS[key]}`}>
            {short}
            <span className="font-normal opacity-70 capitalize">{key === 'first' ? '1st' : key === 'second' ? '2nd' : key === 'third' ? '3rd' : key}</span>
          </span>
        ))}
        <span className="text-xs text-gray-600 flex items-center gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> repeat position
        </span>
      </div>
    </div>
  )
}
