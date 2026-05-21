import { useState } from 'react'

const POSITION_LABELS = {
  pitcher:   'Pitcher',
  catcher:   'Catcher',
  first:     '1st Base',
  second:    '2nd Base',
  shortstop: 'Short Stop',
  third:     '3rd Base',
  bench:     'Bench',
}

const POSITION_ICONS = {
  pitcher:   '⚾',
  catcher:   '🥎',
  first:     '1️⃣',
  second:    '2️⃣',
  shortstop: '🔷',
  third:     '3️⃣',
  bench:     '🪑',
}

export default function InningCard({ plan }) {
  const { innings = [] } = plan
  const [selectedInning, setSelectedInning] = useState(1)

  const inning = innings.find((i) => i.inning === selectedInning) ?? innings[0]

  if (!inning) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 text-sm">
        No inning data yet.
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="font-semibold text-white tracking-tight">Field Assignments</h3>
      </div>

      {/* Inning tabs */}
      <div className="flex gap-1 px-4 py-3 border-b border-gray-800 overflow-x-auto">
        {innings.map((inn) => (
          <button
            key={inn.inning}
            onClick={() => setSelectedInning(inn.inning)}
            className={`
              px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition
              ${selectedInning === inn.inning
                ? 'bg-brand-700 text-brand-100'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }
            `}
          >
            Inn {inn.inning}
          </button>
        ))}
      </div>

      {/* Position grid */}
      <div className="divide-y divide-gray-800/60">
        {Object.entries(POSITION_LABELS).map(([key, label]) => {
          const player = inning[key]
          if (!player) return null
          const isBench = key === 'bench'
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-5 py-3.5 ${isBench ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg w-7 text-center" aria-hidden="true">
                  {POSITION_ICONS[key]}
                </span>
                <span className="text-sm text-gray-400">{label}</span>
              </div>
              <span className={`font-semibold text-sm ${isBench ? 'text-gray-400' : 'text-white'}`}>
                {player}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
