// main.jsx — React Entry Point
// ─────────────────────────────────────────────────────────────
// This is the very first JavaScript file that runs.
// It grabs the <div id="root"> from index.html and tells React
// to render our <App /> component tree inside it.
// ─────────────────────────────────────────────────────────────
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import our global stylesheet (Tailwind + custom CSS)
import './index.css'

// Import the top-level App component
import App from './App.jsx'

// createRoot is the modern React 18 API for rendering.
// document.getElementById('root') finds our <div id="root"> in index.html.
createRoot(document.getElementById('root')).render(
  // StrictMode is a development tool — it double-invokes renders
  // to help catch side effects and deprecated API usage early.
  <StrictMode>
    <App />
  </StrictMode>,
)
