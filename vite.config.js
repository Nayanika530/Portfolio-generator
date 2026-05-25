// vite.config.js
// ─────────────────────────────────────────────────────────────
// Vite build-tool configuration file.
// We register the official Tailwind CSS Vite plugin here so
// Tailwind's utility classes are processed at build time.
// ─────────────────────────────────────────────────────────────
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),       // Enables JSX + Fast Refresh for React
    tailwindcss(), // Scans JSX/TSX files and generates CSS utilities
  ],
})
