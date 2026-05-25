// ─────────────────────────────────────────────────────────────
// App.jsx — Root Application Component
// ─────────────────────────────────────────────────────────────
// This is the top-level component. It acts as the "brain" of the
// app — owning global state and composing all page sections together.
//
// Concepts demonstrated here:
//   • Importing and composing child components
//   • useState  — managing dynamic data (the guestbook messages)
//   • useEffect — running side effects (e.g. fetching data on load)
//   • Props     — passing data DOWN to child components
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// Import each page section as a separate, self-contained component.
// This modular approach keeps each file small and focused.
import HeroSection      from './components/HeroSection'
import TeamSection      from './components/TeamSection'
import GuestbookComponent from './components/GuestbookComponent'

// ── Team Data ────────────────────────────────────────────────
// We define our team array HERE (in the parent) so it lives in
// one place and can be easily updated or later fetched from an API.
// Each object has: name, role, github, and an emoji avatar.
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Nayanika Halder',
    role: 'Team Lead & Full-Stack Dev',
    github: 'https://github.com',
    avatar: '👩‍💻',
    tagline: 'Turning caffeine into components, one sprint at a time.',
  },
  {
    id: 2,
    name: 'Raunak Das',
    role: 'Backend & Cloud Engineer',
    github: 'https://github.com',
    avatar: '🧑‍🔧',
    tagline: 'If it scales, it ships. Your endpoints are safe with me.',
  },
  {
    id: 3,
    name: 'Souptika Manna',
    role: 'Frontend & UI/UX',
    github: 'https://github.com',
    avatar: '🎨',
    tagline: 'Design is the silent ambassador of your code.',
  },
]

// ─────────────────────────────────────────────────────────────
// App Component
// ─────────────────────────────────────────────────────────────
function App() {
  // ── useState ───────────────────────────────────────────────
  // useState returns a pair: [currentValue, setterFunction]
  // React re-renders the component whenever the setter is called.
  //
  // 'messages' is an array of guestbook note strings.
  // We initialize it as an empty array [].
  const [messages, setMessages] = useState([])

  // ── useEffect ──────────────────────────────────────────────
  // useEffect runs AFTER the component mounts (appears on screen).
  // The empty dependency array [] means "run this only once on mount".
  // This is the perfect place to load initial data from a server.
  useEffect(() => {
    // ── Async function defined inside useEffect ─────────────
    // We can't make useEffect itself async, so we define an
    // inner async function and immediately call it.
    const loadInitialMessages = async () => {
      try {
        // TODO: Connect to Antigravity Backend GET route here
        // ─────────────────────────────────────────────────────
        // Replace the line below with a real fetch call, e.g.:
        //
        //   const response = await fetch('https://your-api.com/guestbook')
        //   const data = await response.json()
        //   setMessages(data.messages)
        //
        // For now, we seed the UI with some sample messages so
        // the guestbook list is never empty during the workshop.
        const seedMessages = [
          '🔥 This site looks incredible! — Alex',
          '💚 Web Dev Domain is the best club on campus!',
          '⚡ Huge shoutout to the team for building this!',
        ]
        setMessages(seedMessages)
      } catch (error) {
        // Always handle errors! In production we'd show a toast/alert.
        console.error('Failed to load guestbook messages:', error)
      }
    }

    loadInitialMessages()
  }, []) // <-- Empty array = "run once on mount"

  // ── JSX Return ─────────────────────────────────────────────
  // JSX looks like HTML but it's actually JavaScript. React
  // transforms it into calls to React.createElement() under the hood.
  return (
    // Main page wrapper:
    //   • bg-slate-950    → deep midnight background (dark mode base)
    //   • text-slate-100  → off-white default text color
    //   • min-h-screen    → always at least 100% of the viewport height
    //   • overflow-x-hidden → prevent horizontal scroll from glow effects
    <div className="bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden">

      {/* ── Hero Section ─────────────────────────────────────
          No props needed — HeroSection is fully self-contained.
          The CTA button inside it scrolls to #team-section.      */}
      <HeroSection />

      {/* ── Team Section ─────────────────────────────────────
          We pass the TEAM_MEMBERS array down as a prop.
          TeamSection just RECEIVES and RENDERS it — it doesn't
          own or mutate the data. This is a core React pattern.   */}
      <TeamSection members={TEAM_MEMBERS} />

      {/* ── Guestbook Component ───────────────────────────────
          We pass down:
            • messages      → the current list (read-only for child)
            • setMessages   → the setter, so the child can ADD a new
                              message without "owning" the state itself.
          This pattern is called "lifting state up".              */}
      <GuestbookComponent messages={messages} setMessages={setMessages} />

      {/* ── Footer ───────────────────────────────────────────  */}
      <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-800">
        <p>
          Built with{' '}
          <span className="text-cyan-400">💙</span>
          {' '}by the{' '}
          <span className="font-semibold text-slate-300">Web Dev Domain</span>
          {' '}— University Club
        </p>
      </footer>
    </div>
  )
}

// Every component file must export its component so other files can import it.
export default App
