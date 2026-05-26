import { useState } from 'react'

export default function Sidebar({ plans, activePlanId, onSelectPlan, onNewPlan, onOpenRoster, onDeletePlan, isOpen, onClose }) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)

  function handleDeleteClick(e, plan) {
    e.stopPropagation()
    setConfirmingDeleteId(plan.id)
  }

  function handleConfirmDelete(id) {
    setConfirmingDeleteId(null)
    onDeletePlan(id)
  }

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

            if (confirmingDeleteId === plan.id) {
              return (
                <div key={plan.id} className="mb-1 px-3 py-2.5 rounded-lg bg-red-950/60 border border-red-800/60">
                  <p className="text-xs text-red-300 mb-2 leading-snug">
                    Delete <span className="font-semibold">{plan.title}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmDelete(plan.id)}
                      className="flex-1 py-1 rounded-md bg-red-700 hover:bg-red-600 text-white text-xs font-semibold transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="flex-1 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={plan.id} className="relative group mb-1">
                <button
                  onClick={() => { onSelectPlan(plan.id); onClose() }}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg pr-8 transition
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

                {/* Delete button — visible on hover (desktop) or always (touch) */}
                <button
                  onClick={(e) => handleDeleteClick(e, plan)}
                  title="Delete plan"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </nav>

        <div className="p-3 pb-10 border-t border-gray-800 flex flex-col gap-2 lg:pb-3">
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
