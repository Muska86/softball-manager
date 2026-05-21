export default function BattingOrderCard({ plan }) {
  const { battingOrder = [], leadoffNote } = plan

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="font-semibold text-white tracking-tight">Batting Order</h3>
      </div>

      {/* Batter list */}
      <ol className="divide-y divide-gray-800/60">
        {battingOrder.map((batter) => (
          <li key={batter.slot} className="flex items-center gap-4 px-5 py-3.5">
            <span className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
              {batter.slot}
            </span>
            <span className="text-white font-medium">{batter.name}</span>
          </li>
        ))}
      </ol>

      {/* Lead-off note */}
      {leadoffNote && (
        <div className="px-5 py-3.5 border-t border-gray-800 flex items-start gap-2.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd" />
          </svg>
          <span>{leadoffNote}</span>
        </div>
      )}
    </div>
  )
}
