import { useState, useEffect, useRef, useCallback } from 'react'
import MarkdownMessage from './MarkdownMessage.jsx'

const NEW_PLAN_PROMPT = "I'd like to create a new game plan. Please ask me for the details you need (game number, date, player roster, lead-off batter)."

export default function ChatPanel({ isOpen, onClose, plan, passcode, onPlanUpdate, newPlanMode, onNewPlanModeEnd }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const panelRef = useRef(null)
  const initializedRef = useRef(false)
  const abortRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Lock background scroll on mobile when panel is open
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (!isMobile) return
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Resize panel to match visual viewport so keyboard doesn't cover the input
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (!isOpen || !isMobile || !window.visualViewport) return

    function update() {
      if (!panelRef.current) return
      panelRef.current.style.top = `${window.visualViewport.offsetTop}px`
      panelRef.current.style.height = `${window.visualViewport.height}px`
      panelRef.current.style.bottom = 'auto'
    }

    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    update()

    return () => {
      window.visualViewport.removeEventListener('resize', update)
      window.visualViewport.removeEventListener('scroll', update)
      if (panelRef.current) {
        panelRef.current.style.top = ''
        panelRef.current.style.height = ''
        panelRef.current.style.bottom = ''
      }
    }
  }, [isOpen])

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  // Seed new-plan prompt when entering new plan mode
  useEffect(() => {
    if (isOpen && newPlanMode && !initializedRef.current) {
      initializedRef.current = true
      sendMessage(NEW_PLAN_PROMPT, true)
    }
    if (!isOpen) {
      initializedRef.current = false
    }
  }, [isOpen, newPlanMode])

  const sendMessage = useCallback(async (text, silent = false) => {
    if (!silent) {
      setMessages((prev) => [...prev, { role: 'user', content: text }])
    }
    setInput('')
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Passcode': passcode,
        },
        body: JSON.stringify({ message: text, currentPlan: plan }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong. Please try again.', error: true },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

      if (data.updatedPlan) {
        onPlanUpdate(data.updatedPlan)
        onNewPlanModeEnd?.()
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Stopped.', stopped: true },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Network error. Please try again.', error: true },
        ])
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [plan, passcode, onPlanUpdate, onNewPlanModeEnd])

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleKeyDown(e) {
    // Enter submits; Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const text = input.trim()
      if (!text || loading) return
      sendMessage(text)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    sendMessage(text)
  }

  const isReadOnly = !plan && !newPlanMode

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel — right drawer on mobile, bottom-right popup on desktop */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96
          lg:inset-auto lg:bottom-4 lg:right-4 lg:top-auto lg:w-96 lg:max-h-[75vh] lg:rounded-2xl
          bg-gray-900 border-l border-gray-800 lg:border shadow-2xl
          flex flex-col transition-transform duration-300
          ${isOpen
            ? 'translate-x-0 lg:translate-x-0 lg:translate-y-0 opacity-100'
            : 'translate-x-full lg:translate-x-0 lg:translate-y-8 opacity-0 pointer-events-none'}
        `}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-sm">⚾</span>
            <span className="font-semibold text-white text-sm">Claude — Game Assistant</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.length === 0 && !loading && (
            <div className="text-center text-gray-500 text-sm py-8">
              {isReadOnly
                ? 'Viewing a past plan. Chat is only available for the live plan.'
                : newPlanMode
                ? 'Starting new plan…'
                : <>
                    Ask Claude to make changes, check rules, or create a new plan.
                    <br />
                    <span className="text-xs text-gray-600 mt-1 block">Shift+Enter for a new line</span>
                  </>
              }
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                  max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm
                  ${msg.role === 'user'
                    ? 'bg-brand-700 text-white rounded-br-sm'
                    : msg.error
                    ? 'bg-red-900/40 border border-red-800 text-red-300 rounded-bl-sm'
                    : msg.stopped
                    ? 'bg-gray-800/60 border border-gray-700 text-gray-500 rounded-bl-sm italic'
                    : 'bg-gray-800 rounded-bl-sm'
                  }
                `}
              >
                {msg.role === 'user' ? (
                  // Preserve newlines in user messages
                  <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <MarkdownMessage content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-3">
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-900/50 border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-400 text-xs font-medium transition"
                title="Stop generating"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Stop
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isReadOnly && (
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-800 shrink-0 items-end" style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 2.5rem))' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={newPlanMode ? 'Describe your team… (Shift+Enter for new line)' : 'Ask Claude… (Shift+Enter for new line)'}
              disabled={loading}
              rows={1}
              style={{ fontSize: '16px' }}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition resize-none overflow-hidden leading-relaxed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </>
  )
}
