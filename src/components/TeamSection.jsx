// ─────────────────────────────────────────────────────────────
// TeamSection.jsx — Team Grid Component
// ─────────────────────────────────────────────────────────────
// Receives a 'members' array prop from App.jsx and renders
// a responsive grid of glassmorphic MemberCard components.
//
// Key React concepts here:
//   • Props destructuring  → ({ members })
//   • Array.map()          → data array → JSX elements
//   • key prop             → required for efficient list rendering
//   • Sub-components       → MemberCard defined in the same file
// ─────────────────────────────────────────────────────────────

// ── MemberCard Sub-Component ─────────────────────────────────
// Renders a single team member's glassmorphic profile card.
// Props: member → { id, name, role, github, avatar, tagline }
function MemberCard({ member }) {
  return (
    // 'group' enables group-hover: targeting — hovering the card
    // can trigger style changes on any child with group-hover:
    <div
      className="group relative flex flex-col items-center text-center
                 bg-white/5 backdrop-blur-md
                 border border-white/10 hover:border-cyan-400/60
                 rounded-2xl p-6
                 hover:-translate-y-2 transition-all duration-300
                 hover:shadow-xl hover:shadow-cyan-400/10"
    >
      {/* Subtle cyan overlay that fades in on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl
                   bg-gradient-to-b from-cyan-400/5 to-transparent
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-300 pointer-events-none"
      />

      {/* Avatar — emoji inside a glowing circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4
                   bg-gradient-to-br from-slate-800 to-slate-900
                   ring-2 ring-cyan-400/30 group-hover:ring-cyan-400/70
                   transition-all duration-300"
        aria-label={`${member.name}'s avatar`}
      >
        {member.avatar}
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        {member.name}
      </h3>

      {/* Role badge pill */}
      <span
        className="inline-block px-3 py-1 mb-3 text-xs font-medium rounded-full
                   bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
      >
        {member.role}
      </span>

      {/* Tagline — personality touch */}
      <p className="text-slate-500 text-sm italic mb-5 leading-relaxed">
        "{member.tagline}"
      </p>

      {/* GitHub link — opens in new tab */}
      <a
        href={member.github}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg
                   bg-slate-800 hover:bg-slate-700
                   text-slate-300 hover:text-white text-sm font-medium
                   border border-slate-700 hover:border-slate-500
                   transition-all duration-200"
        aria-label={`Visit ${member.name}'s GitHub profile`}
      >
        {/* Inline GitHub SVG — no icon library dependency */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TeamSection — Main Export
// Props: members → array of team member objects from App.jsx
// ─────────────────────────────────────────────────────────────
function TeamSection({ members }) {
  return (
    // id="team-section" is the scroll target for HeroSection's CTA button
    <section id="team-section" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3">
            The People Behind the Code
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Meet the{' '}
            <span className="relative inline-block">
              Crew
              {/* Gradient underline accent */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 w-full h-0.5
                           bg-gradient-to-r from-cyan-400 to-indigo-500"
              />
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            Each card is rendered dynamically from an array using{' '}
            <code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded text-sm">
              Array.map()
            </code>
            {' '}— a core React pattern you'll use every day.
          </p>
        </div>

        {/* ── Responsive CSS Grid ──────────────────────────────
            Tailwind is mobile-first, so we start with 1 column
            and ADD columns at larger breakpoints:
              grid-cols-1    → phones   (< 640px)
              sm:grid-cols-2 → tablets  (≥ 640px)
              lg:grid-cols-3 → desktops (≥ 1024px)               */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ── Array.map() list render ──────────────────────────
              For each 'member' in the array, return a <MemberCard />.
              The 'key' prop MUST be unique — React uses it internally
              to track which items changed so it can re-render efficiently.
              Never use array index as key if the list can be reordered. */}
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TeamSection
