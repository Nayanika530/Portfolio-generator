// ─────────────────────────────────────────────────────────────
// GuestbookComponent.jsx — Interactive Visitor Guestbook
// ─────────────────────────────────────────────────────────────
// This component teaches two critical React patterns:
//
//   1. CONTROLLED INPUTS
//      The <input> value is driven by React state, not the DOM.
//      This means React always knows exactly what the user typed.
//
//   2. LIFTING STATE UP
//      The 'messages' array lives in App.jsx (the parent).
//      This component receives it as a prop and can ADD to it
//      by calling the 'setMessages' setter — also passed as a prop.
//      The child NEVER owns the data; it just reads and updates it.
//
// Props received from App.jsx:
//   messages    → string[] — the current list of guestbook notes
//   setMessages → function — the state setter to add a new note
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'

function GuestbookComponent({ messages, setMessages }) {

  // ── Local State: Controlled Input ────────────────────────────
  // 'inputValue' tracks what the user is currently typing.
  // This is LOCAL state — it only matters to this component, so
  // we don't need to lift it up to App.jsx.
  const [inputValue, setInputValue] = useState('')

  // ── Local State: Submission Feedback ─────────────────────────
  // A simple boolean to show a "Thanks!" confirmation flash
  // after the user submits a note.
  const [showConfirmation, setShowConfirmation] = useState(false)

  // ── handleSubmit ─────────────────────────────────────────────
  // Called when the form is submitted (button click or Enter key).
  // 'event' is the native browser Form Submit event object.
  const handleSubmit = async (event) => {
    // Prevent the browser's default form behaviour (page reload).
    // Without this, the page would refresh and we'd lose all state!
    event.preventDefault()

    // Guard: do nothing if the input is blank or only whitespace
    const trimmed = inputValue.trim()
    if (!trimmed) return

    try {
      // TODO: Connect to Antigravity Backend POST route here
      // ───────────────────────────────────────────────────────
      // Replace the block below with a real API call, e.g.:
      //
      //   const response = await fetch('https://your-api.com/guestbook', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ message: trimmed }),
      //   })
      //   if (!response.ok) throw new Error('Failed to save message')
      //
      // For now, we update state locally so the UI still works
      // during the workshop without a live backend.

      // ── Updating the messages array ────────────────────────
      // IMPORTANT: Never mutate state directly (e.g. messages.push()).
      // Always use the setter with a NEW array.
      //
      // We use the FUNCTIONAL UPDATE form of setMessages:
      //   setMessages(prev => [...])
      //
      // 'prev' is guaranteed to be the latest state value, even
      // inside async callbacks. The spread operator [...prev]
      // creates a shallow copy, then we append the new message.
      setMessages((prev) => [...prev, trimmed])

      // Clear the input field after a successful submission
      setInputValue('')

      // Show the "Thanks!" confirmation for 2.5 seconds
      setShowConfirmation(true)
      setTimeout(() => setShowConfirmation(false), 2500)

    } catch (error) {
      console.error('Failed to submit guestbook message:', error)
      // TODO: Display a user-facing error toast here
    }
  }

  return (
    <section
      id="guestbook"
      className="py-24 px-6 border-t border-slate-800"
    >
      <div className="max-w-2xl mx-auto">

        {/* ── Section Header ──────────────────────────────────── */}
        <div className="text-center mb-12">
          <p className="text-indigo-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3">
            You're Part of This
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Sign the{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400
                             bg-clip-text text-transparent">
              Guestbook
            </span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Drop a note for the crew. This form uses a{' '}
            <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded text-sm">
              controlled input
            </code>
            {' '}— React owns the value, not the browser.
          </p>
        </div>

        {/* ── Glassmorphic Form Card ───────────────────────────── */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10
                        rounded-2xl p-6 md:p-8 mb-8">

          {/* onSubmit wires the form's submit event to handleSubmit */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <label
              htmlFor="guestbook-input"
              className="text-slate-300 text-sm font-medium"
            >
              Your message
            </label>

            {/* ── Controlled Input ──────────────────────────────────
                This is the heart of the controlled component pattern:
                
                value={inputValue}
                  → The input's displayed text is ALWAYS React state.
                    React is the "source of truth", not the DOM.
                
                onChange={(e) => setInputValue(e.target.value)}
                  → Every keystroke fires onChange. We call setInputValue
                    with the new value from e.target.value.
                    React re-renders, the input shows the updated value.
                
                This creates a two-way binding:
                  State → Input (value prop)
                  Input → State (onChange handler)                       */}
            <input
              id="guestbook-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Leave a note for the crew..."
              maxLength={120}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl
                         bg-slate-900 border border-slate-700
                         text-slate-100 placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:border-transparent
                         transition-all duration-200 text-sm"
            />

            {/* Character counter — derived directly from state, no extra hook needed */}
            <p className="text-xs text-slate-600 text-right -mt-2">
              {inputValue.length} / 120
            </p>

            {/* Submit button — disabled when input is empty */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-indigo-500 to-cyan-500
                         text-white
                         hover:from-indigo-400 hover:to-cyan-400
                         disabled:opacity-40 disabled:cursor-not-allowed
                         hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-200
                         shadow-lg hover:shadow-indigo-500/30"
            >
              Post Note ✦
            </button>
          </form>

          {/* ── Confirmation Flash Message ───────────────────────
              Only renders when showConfirmation is true.
              This is CONDITIONAL RENDERING — a core React pattern.
              The && short-circuit: if left is true, render right.    */}
          {showConfirmation && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex items-center gap-2 text-green-400
                         text-sm font-medium animate-float-up"
            >
              <span>✓</span>
              <span>Note posted! Thanks for signing the guestbook.</span>
            </div>
          )}
        </div>

        {/* ── Messages List ────────────────────────────────────── */}
        {/* Only render the list section if there are messages to show */}
        {messages.length > 0 && (
          <div>
            <h3 className="text-slate-400 text-sm font-semibold tracking-widest
                           uppercase mb-4 text-center">
              — Notes from the Community —
            </h3>

            {/* Scrollable container: max-h clips the height, overflow-y adds scrollbar */}
            <ul
              className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1"
              aria-label="Guestbook messages"
            >
              {/* ── messages.map() ──────────────────────────────────
                  We map over the 'messages' array prop to render
                  each note as a styled list item.

                  Note the key: we use index here since messages are
                  append-only and never reordered — acceptable in this case.
                  For a deletable/reorderable list, use a unique ID instead. */}
              {messages.map((msg, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl
                             bg-white/5 border border-white/10
                             text-slate-300 text-sm leading-relaxed
                             animate-float-up"
                >
                  {/* Message index badge */}
                  <span
                    className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20
                               text-indigo-300 text-xs font-bold
                               flex items-center justify-center mt-0.5"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state — shown when messages array is empty */}
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-4">
            No notes yet — be the first to leave one! 👆
          </p>
        )}

      </div>
    </section>
  )
}

export default GuestbookComponent
