// ─────────────────────────────────────────────────────────────
// HeroSection.jsx — Above-the-Fold Landing Section
// ─────────────────────────────────────────────────────────────
// This is the first thing a visitor sees. Goals:
//   1. Make a bold, striking first impression
//   2. Communicate what this page is about immediately
//   3. Guide the user to the next section (CTA button)
//
// Tailwind concepts used here:
//   • Flexbox layout   (flex, flex-col, items-center, justify-center)
//   • Gradient text    (bg-gradient-to-r, bg-clip-text, text-transparent)
//   • Backdrop blur    (backdrop-blur-sm) for the glass badge
//   • Responsive text  (text-5xl md:text-7xl) — mobile first!
//   • Hover transitions (hover:scale-105, transition-transform)
// ─────────────────────────────────────────────────────────────

// No imports needed — this component uses no hooks or child components.
// It IS self-contained: pure JSX + Tailwind.

function HeroSection() {

  // ── Smooth Scroll Handler ────────────────────────────────────
  // When the CTA button is clicked, we programmatically scroll
  // the page down to the TeamSection (which has id="team-section").
  // 'behavior: smooth' triggers a CSS smooth scroll animation.
  const handleScrollToTeam = () => {
    const teamSection = document.getElementById('team-section')
    if (teamSection) {
      teamSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    // Section wrapper:
    //   • relative          → needed so child absolute elements (the blobs) position correctly
    //   • min-h-screen      → takes up the full viewport height
    //   • flex + center     → vertically & horizontally centers the content
    //   • overflow-hidden   → clips the decorative background blobs at the edges
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6">

      {/* ── Decorative Background Blobs ────────────────────────
          These are large, blurred, semi-transparent circles that
          sit behind the content to create an ambient neon glow.
          • absolute / -translate → position them off-center
          • blur-3xl             → extreme Gaussian blur
          • opacity-20           → very subtle, doesn't overpower text
          • pointer-events-none  → clicks pass straight through them  */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500 rounded-full
                   blur-3xl opacity-20 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500 rounded-full
                   blur-3xl opacity-20 pointer-events-none"
      />

      {/* ── Content Container ──────────────────────────────────
          max-w-4xl   → keeps lines from stretching too wide on ultrawide monitors
          z-10        → stacks above the blobs (z-index: 10)           */}
      <div className="relative z-10 max-w-4xl animate-float-up">

        {/* ── Glassmorphic Badge ─────────────────────────────────
            A small pill above the main heading to set context.
            • bg-white/5        → white at 5% opacity (glass base)
            • backdrop-blur-sm  → blurs whatever is behind the pill
            • border/white/10   → a very subtle white border
            • rounded-full      → pill shape                          */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6
                        bg-white/5 backdrop-blur-sm border border-white/10
                        rounded-full text-sm text-cyan-300 font-medium">
          {/* Pulsing green dot to signal "live" / active club */}
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          University Tech Club — Web Dev Domain
        </div>

        {/* ── Main Heading ────────────────────────────────────────
            We split the heading into two lines for visual hierarchy.
            Line 1: plain white
            Line 2: gradient from cyan → indigo (the "wow" effect)

            bg-gradient-to-r   → gradient flows left → right
            from-cyan-400      → starts at cyan
            via-blue-400       → passes through blue
            to-indigo-500      → ends at indigo
            bg-clip-text       → clips the gradient INSIDE the text glyphs
            text-transparent   → makes the text fill transparent so gradient shows */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
          Welcome to the
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500
                           bg-clip-text text-transparent">
            Web Dev Domain
          </span>
        </h1>

        {/* ── Animated Glowing Subtitle ───────────────────────────
            .neon-text is defined in index.css — it applies the
            neonPulse keyframe animation, creating a breathing glow. */}
        <p className="neon-text text-lg md:text-2xl font-semibold mb-4 tracking-widest uppercase">
          ⚡ Building the future, one commit at a time ⚡
        </p>

        {/* ── Secondary Description ───────────────────────────────
            Softer, smaller text for supporting context.
            text-slate-400 keeps it readable but visually secondary. */}
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          We're a team of student developers, designers, and tinkerers.
          Scroll down to meet the crew, and don't forget to sign our guestbook!
        </p>

        {/* ── Call-To-Action Button ───────────────────────────────
            onClick → calls handleScrollToTeam defined above.

            Styling breakdown:
            • bg-cyan-400        → vibrant neon-cyan fill
            • text-slate-950     → very dark text for contrast (AA accessible)
            • hover:bg-cyan-300  → lightens on hover (feedback)
            • hover:scale-105    → subtle scale-up on hover (micro-animation)
            • transition-all     → smooth transition for ALL changed properties
            • duration-300       → 300ms transition speed (snappy but smooth)
            • shadow-lg          → base shadow
            • hover:shadow-cyan-400/50 → colored glow shadow on hover         */}
        <button
          onClick={handleScrollToTeam}
          className="px-8 py-4 bg-cyan-400 text-slate-950 font-bold rounded-xl
                     text-base tracking-wide
                     hover:bg-cyan-300 hover:scale-105
                     transition-all duration-300
                     shadow-lg hover:shadow-cyan-400/50 hover:shadow-2xl
                     focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2
                     focus:ring-offset-slate-950"
          aria-label="Scroll down to meet the team"
        >
          Meet the Team →
        </button>
      </div>

      {/* ── Scroll Indicator ────────────────────────────────────
          A small bouncing arrow at the bottom of the hero to hint
          there's more content below the fold.
          animate-bounce → Tailwind's built-in bounce animation     */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}

export default HeroSection
