import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from './supabaseClient.js'
import PasscodeModal from './components/PasscodeModal.jsx'
import TopHeader from './components/TopHeader.jsx'
import Sidebar from './components/Sidebar.jsx'
import BattingOrderCard from './components/BattingOrderCard.jsx'
import InningCard from './components/InningCard.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import RosterPanel from './components/RosterPanel.jsx'
import ScoreboardCard from './components/ScoreboardCard.jsx'

export default function App() {
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem('softball-passcode') || '')
  const [plan, setPlan] = useState(null)
  const [plans, setPlans] = useState([])
  const [activePlanId, setActivePlanId] = useState(null) // null = active plan
  const [liveStatus, setLiveStatus] = useState('live')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [newPlanMode, setNewPlanMode] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [roster, setRoster] = useState([])
  const [preferences, setPreferences] = useState({})
  const [toast, setToast] = useState(null)
  const versionRef = useRef(0)

  const isReadOnly = activePlanId !== null

  // Show a transient toast message
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch the plans list for the sidebar
  async function fetchPlansList() {
    try {
      const res = await fetch('/api/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
      }
    } catch {
      // non-fatal
    }
  }

  // Fetch a specific plan or the active plan
  const fetchPlan = useCallback(async (id = null) => {
    const url = id ? `/api/plan?id=${id}` : '/api/plan'
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        versionRef.current = data.version ?? 0
        return data
      }
    } catch {
      // non-fatal
    }
    return null
  }, [])

  // Fetch roster
  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch('/api/roster')
      if (res.ok) {
        const data = await res.json()
        setRoster(data.roster ?? [])
        setPreferences(data.preferences ?? {})
      }
    } catch { /* non-fatal */ }
  }, [])

  // Initial load
  useEffect(() => {
    if (!passcode) return
    fetchPlansList()
    fetchPlan()
    fetchRoster()
  }, [passcode, fetchPlan, fetchRoster])

  // Realtime — subscribe to changes on the active plan row
  useEffect(() => {
    if (!passcode || isReadOnly) return

    const channel = supabase
      .channel('active-plan-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: 'is_active=eq.true' },
        async (payload) => {
          const newVersion = payload.new?.version ?? 0
          if (newVersion > versionRef.current) {
            setLiveStatus('syncing')
            await fetchPlan()
            setLiveStatus('live')
            showToast('Plan updated by another coach')
            fetchPlansList()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [passcode, isReadOnly, fetchPlan])

  // When user selects a past plan from sidebar
  async function handleSelectPlan(id) {
    if (id === null) {
      // Back to active plan
      setActivePlanId(null)
      setLiveStatus('live')
      await fetchPlan()
    } else {
      setActivePlanId(id)
      setLiveStatus('readonly')
      await fetchPlan(id)
    }
  }

  // Direct plan patch — used by UI components (scoreboard, batting order)
  const savePlanPatch = useCallback(async (patch) => {
    if (isReadOnly || !plan) return
    const updated = { ...plan, ...patch }
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-passcode': passcode },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        const { version } = await res.json()
        setPlan({ ...updated, version })
        versionRef.current = version
      }
    } catch {
      // non-fatal
    }
  }, [isReadOnly, plan, passcode])

  // When Claude returns an updated plan (from chat)
  function handlePlanUpdate(updatedPlan) {
    setPlan(updatedPlan)
    versionRef.current = updatedPlan.version ?? 0
    fetchPlansList()
    // If a new plan was created, reset to active view
    setActivePlanId(null)
    setLiveStatus('live')
  }

  // Delete a plan
  async function handleDeletePlan(id) {
    try {
      const res = await fetch(`/api/plan?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-passcode': passcode },
      })
      if (!res.ok) return
      const wasViewing = activePlanId === id || (!activePlanId && plan?.gameId === id)
      await fetchPlansList()
      if (wasViewing) {
        setActivePlanId(null)
        const next = await fetchPlan()
        if (!next) setPlan(null)
      }
    } catch {
      // non-fatal
    }
  }

  // New plan button
  function handleNewPlan() {
    setNewPlanMode(true)
    setChatOpen(true)
  }

  if (!passcode) {
    return <PasscodeModal onSuccess={setPasscode} />
  }

  return (
    <div className="flex flex-col bg-gray-950 min-h-dvh overflow-x-clip lg:h-dvh lg:overflow-hidden">
      <TopHeader
        liveStatus={isReadOnly ? 'readonly' : liveStatus}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        onChatToggle={() => { setNewPlanMode(false); setChatOpen((o) => !o) }}
      />

      <div className="flex flex-1 min-w-0 lg:overflow-hidden">
        <Sidebar
          plans={plans}
          activePlanId={activePlanId}
          onSelectPlan={(id) => {
            if (id === (plan?.gameId) && !isReadOnly) return
            handleSelectPlan(id)
          }}
          onNewPlan={handleNewPlan}
          onDeletePlan={handleDeletePlan}
          onOpenRoster={() => { setSidebarOpen(false); setRosterOpen(true) }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:overflow-y-auto overscroll-none p-4 pb-10 lg:p-6 lg:pb-10">
          {!plan ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
              <span className="text-5xl">⚾</span>
              <p className="text-lg">No game plan loaded.</p>
              <button
                onClick={handleNewPlan}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition"
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <>
              {/* Plan title bar */}
              <div className="flex items-baseline justify-between mb-6 gap-2">
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-xl font-bold text-white">{plan.title}</h2>
                  {plan.date && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(plan.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                {isReadOnly && (
                  <button
                    onClick={() => handleSelectPlan(null)}
                    className="text-xs text-brand-400 hover:text-brand-300 underline shrink-0"
                  >
                    Back to live plan
                  </button>
                )}
              </div>

              {/* Dashboard grid */}
              <div className="flex flex-col gap-4 lg:gap-6">
                <ScoreboardCard plan={plan} onPlanPatch={isReadOnly ? null : savePlanPatch} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                  <BattingOrderCard plan={plan} onPlanPatch={isReadOnly ? null : savePlanPatch} />
                  <InningCard plan={plan} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Chat panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setNewPlanMode(false) }}
        plan={isReadOnly ? null : plan}
        passcode={passcode}
        onPlanUpdate={handlePlanUpdate}
        newPlanMode={newPlanMode}
        onNewPlanModeEnd={() => setNewPlanMode(false)}
      />

      {/* Roster panel */}
      <RosterPanel
        isOpen={rosterOpen}
        onClose={() => setRosterOpen(false)}
        roster={roster}
        preferences={preferences}
        passcode={passcode}
        onRosterUpdate={(r, p) => { setRoster(r); if (p !== undefined) setPreferences(p) }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 shadow-xl pointer-events-none animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
