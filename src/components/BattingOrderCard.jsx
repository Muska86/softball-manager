import { useState } from 'react'

export default function BattingOrderCard({ plan }) {
  const { battingOrder = [], leadoffNote } = plan

  // slot number (1-based) of who leads off the current display
  const [leadoffSlot, setLeadoffSlot] = useState(1)
  // slot number of the last batter marked, or null
  const [lastBatterSlot, setLastBatterSlot] = useState(null)

  // Rotate the batting order so it starts at leadoffSlot
  const rotatedOrder = (() => {
    if (battingOrder.length === 0) return []
    const startIdx = battingOrder.findIndex((b) => b.slot === leadoffSlot)
    if (startIdx < 0) return battingOrder
    return [...battingOrder.slice(startIdx), ...battingOrder.slice(0, startIdx)]
  })()

  function toggleLastBatter(slot) {
    setLastBatterSlot((prev) => (prev === slot ? null : slot))
  }

  function advanceInning() {
    if (lastBatterSlot === null) return
    const slots = battingOrder.map((b) => b.slot).sort((a, b) => a - b)
    const currentIdx = slots.indexOf(lastBatterSlot)
    const nextIdx = (currentIdx + 1) % slots.length
    setLeadoffSlot(slots[nextIdx])
    setLastBatterSlot(null)
  }

  function resetOrder() {
    setLeadoffSlot(1)
    setLastBatterSlot(null)
  }

  const leadoffName = battingOrder.find((b) => b.slot === leadoffSlot)?.name

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden h-full">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="font-semibold text-white tracking-tight">Batting Order</h3>
        </div>

        {leadoffSlot !== 1 && (
          <button
            onClick={resetOrder}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Lead-off indicator */}
      <div className="px-5 py-2.5 bg-brand-900/20 border-b border-brand-800/30 flex items-center justify-between">
        <span className="text-xs text-brand-400 font-medium">
          Leads off: <span className="text-brand-300">{leadoffName}</span>
        </span>
        {lastBatterSlot !== null && (
          <button
            onClick={advanceInning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold transition"
          >
            Next Inning
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Batter list */}
      <ol className="divide-y divide-gray-800/60">
        {rotatedOrder.map((batter, displayIdx) => {
          const isLeadoff = displayIdx === 0
          const isLastBatter = batter.slot === lastBatterSlot

          return (
            <li
              key={batter.slot}
              className={`flex items-center gap-4 px-5 py-3.5 transition ${isLeadoff ? 'bg-brand-900/10' : ''}`}
            >
              {/* Position number */}
              <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition
                ${isLeadoff
                  ? 'bg-brand-700/60 text-brand-300'
                  : 'bg-gray-800 text-gray-400'
                }`}
              >
                {displayIdx + 1}
              </span>

              {/* Name */}
              <span className={`flex-1 font-medium ${isLeadoff ? 'text-brand-100' : 'text-white'}`}>
                {batter.name}
                {isLeadoff && (
                  <span className="ml-2 text-xs text-brand-500 font-normal">leads off</span>
                )}
              </span>

              {/* Last-at-bat marker */}
              <button
                onClick={() => toggleLastBatter(batter.slot)}
                title={isLastBatter ? 'Clear last at bat' : 'Mark as last at bat'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition
                  ${isLastBatter
                    ? 'bg-amber-600/30 border border-amber-600/60 text-amber-400'
                    : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
                  }`}
              >
                {isLastBatter ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    Last at bat
                  </>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100">·· ·</span>
                )}
                {!isLastBatter && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {/* Instruction hint */}
      <div className="px-5 py-3 border-t border-gray-800 flex items-start gap-2 text-xs text-gray-600">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd" />
        </svg>
        <span>
          {lastBatterSlot
            ? `${battingOrder.find(b => b.slot === lastBatterSlot)?.name} was last at bat — tap Next Inning to advance the order.`
            : leadoffNote || 'Tap the circle next to any batter to mark them as last at bat, then tap Next Inning.'}
        </span>
      </div>
    </div>
  )
}
