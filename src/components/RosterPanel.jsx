import { useState } from 'react'

const FIELD_POSITIONS = [
  { key: 'pitcher',   label: 'P',  full: 'Pitcher' },
  { key: 'catcher',   label: 'C',  full: 'Catcher' },
  { key: 'first',     label: '1B', full: '1st Base' },
  { key: 'second',    label: '2B', full: '2nd Base' },
  { key: 'shortstop', label: 'SS', full: 'Shortstop' },
  { key: 'third',     label: '3B', full: '3rd Base' },
]

export default function RosterPanel({ isOpen, onClose, roster, preferences = {}, passcode, onRosterUpdate }) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedPlayer, setExpandedPlayer] = useState(null)

  async function save(updatedRoster, updatedPreferences) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Passcode': passcode },
        body: JSON.stringify({ roster: updatedRoster, preferences: updatedPreferences }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save.')
        return
      }
      onRosterUpdate(updatedRoster, updatedPreferences)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name || roster.includes(name)) return
    setNewName('')
    save([...roster, name], preferences)
  }

  function handleRemove(name) {
    const next = { ...preferences }
    delete next[name]
    setExpandedPlayer((p) => (p === name ? null : p))
    save(roster.filter((p) => p !== name), next)
  }

  function handleMoveUp(idx) {
    if (idx === 0) return
    const next = [...roster]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    save(next, preferences)
  }

  function handleMoveDown(idx) {
    if (idx === roster.length - 1) return
    const next = [...roster]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    save(next, preferences)
  }

  function toggleDislikedPosition(playerName, posKey) {
    const current = preferences[playerName]?.dislikedPositions ?? []
    const updated = current.includes(posKey)
      ? current.filter((p) => p !== posKey)
      : [...current, posKey]
    const nextPrefs = {
      ...preferences,
      [playerName]: { ...preferences[playerName], dislikedPositions: updated },
    }
    save(roster, nextPrefs)
  }

  function getDisliked(playerName) {
    return preferences[playerName]?.dislikedPositions ?? []
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-96
          bg-gray-900 border-l border-gray-800 shadow-2xl
          flex flex-col transition-transform duration-200
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-semibold text-white">Team Roster</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="px-5 py-3 text-xs text-gray-500 border-b border-gray-800 shrink-0">
          Claude uses this roster and position preferences when creating game plans.
        </p>

        {/* Player list */}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-800/60 scrollbar-thin">
          {roster.length === 0 && (
            <li className="px-5 py-8 text-center text-gray-600 text-sm">No players yet.</li>
          )}
          {roster.map((name, idx) => {
            const disliked = getDisliked(name)
            const isExpanded = expandedPlayer === name

            return (
              <li key={name} className="divide-y divide-gray-800/40">
                {/* Player row */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-white text-sm font-medium">{name}</span>

                  {/* Disliked positions badge */}
                  {disliked.length > 0 && (
                    <span className="text-xs text-amber-500 font-medium shrink-0">
                      {disliked.length} avoided
                    </span>
                  )}

                  {/* Expand preferences */}
                  <button
                    onClick={() => setExpandedPlayer(isExpanded ? null : name)}
                    title="Position preferences"
                    className={`transition shrink-0 ${isExpanded ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300'}`}
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMoveUp(idx)} disabled={idx === 0 || saving}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition" title="Move up">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button onClick={() => handleMoveDown(idx)} disabled={idx === roster.length - 1 || saving}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition" title="Move down">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Remove */}
                  <button onClick={() => handleRemove(name)} disabled={saving}
                    className="text-gray-600 hover:text-red-400 disabled:opacity-20 transition" title="Remove player">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Position preferences (expanded) */}
                {isExpanded && (
                  <div className="px-5 py-3 bg-gray-800/40">
                    <p className="text-xs text-gray-500 mb-2">Positions to avoid assigning:</p>
                    <div className="flex flex-wrap gap-2">
                      {FIELD_POSITIONS.map(({ key, label, full }) => {
                        const isDis = disliked.includes(key)
                        return (
                          <button
                            key={key}
                            onClick={() => toggleDislikedPosition(name, key)}
                            disabled={saving}
                            title={full}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition disabled:opacity-40
                              ${isDis
                                ? 'bg-red-900/40 border-red-700/60 text-red-300'
                                : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                              }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    {disliked.length > 0 && (
                      <p className="text-xs text-red-400/70 mt-2">
                        Avoiding: {disliked.map((k) => FIELD_POSITIONS.find((p) => p.key === k)?.full).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Add player form */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Player name"
              disabled={saving}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={saving || !newName.trim()}
              className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium transition"
            >
              Add
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-2">Order sets batting slot preference for new plans.</p>
        </div>
      </div>
    </>
  )
}
