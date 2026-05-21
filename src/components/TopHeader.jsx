export default function TopHeader({ title, date, liveStatus, onMenuToggle, onChatToggle }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="text-gray-400 hover:text-white transition lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🦝</span>
          <span className="hidden sm:inline">Trash Pandas</span>
          <span className="hidden lg:inline text-gray-500 font-normal text-sm">— Softball Game Plan Manager</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {liveStatus === 'live' && (
          <span className="flex items-center gap-1.5 text-xs text-brand-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live
          </span>
        )}
        {liveStatus === 'syncing' && (
          <span className="text-xs text-gray-400">Syncing…</span>
        )}
        {liveStatus === 'readonly' && (
          <span className="text-xs text-amber-400">Read-only</span>
        )}

        <button
          onClick={onChatToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
          </svg>
          Ask Claude
        </button>
      </div>
    </header>
  )
}
