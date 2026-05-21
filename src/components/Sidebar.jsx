export default function Sidebar({ plans, activePlanId, onSelectPlan, onNewPlan, onOpenRoster, isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-40 w-64 bg-gray-900 border-r border-gray-800
          flex flex-col transition-transform duration-200
          lg:relative lg:top-0 lg:translate-x-0 lg:z-auto lg:shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-4 pt-5 pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Game Plans</p>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2">
          {plans.length === 0 && (
            <p className="text-sm text-gray-600 px-2 py-4">No plans yet.</p>
          )}
          {plans.map((plan) => {
            const isActive = plan.id === activePlanId
            return (
              <button
                key={plan.id}
                onClick={() => {
                  onSelectPlan(plan.id)
                  onClose()
                }}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg mb-1 transition
                  ${isActive
                    ? 'bg-brand-700/40 text-brand-300 font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />}
                  {!isActive && <span className="w-1.5 h-1.5 shrink-0" />}
                  <div>
                    <p className="text-sm leading-tight">{plan.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.date
                        ? new Date(plan.date + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="p-3 pb-16 border-t border-gray-800 flex flex-col gap-2 lg:pb-3">
          <button
            onClick={() => { onNewPlan(); onClose() }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Game Plan
          </button>
          <button
            onClick={() => { onOpenRoster(); onClose() }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Roster
          </button>
        </div>
      </aside>
    </>
  )
}
