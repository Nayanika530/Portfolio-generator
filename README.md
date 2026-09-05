# Portfolio Intelligence Platform

A developer intelligence platform that transforms raw GitHub commit history, repository quality metrics, and resume claims into verified, proof-backed developer portfolios.

Unlike simple template generators, this platform performs deep static and algorithmic analysis on repositories to establish verified skill evidence, detect hidden gem skills, calculate deterministic Repository Quality Scores (RQS), and synthesize institutional portfolio strategies.

---

## Key Capabilities

* **Deterministic Repository Quality Score (RQS)**: Evaluates repositories across 7 weighted pillars (Commit Cadence, Test Density, Documentation Depth, Architectural Hygiene, CI/CD Maturity, License & Security, Code Originality).
* **Skill Evidence Engine**: Extracts verified technical proficiencies directly from repository trees, package manifests, and dependency files (Docker, Kubernetes, GitHub Actions, Rust, Go, Python, React, etc.) with proof links.
* **Resume Claim Verification Matrix**: Cross-verifies resume claims against cryptographic and repository evidence, categorizing claims as *Verified*, *Partially Verified*, or *Unverified*, and unearthing *Hidden Gem* competencies.
* **Institutional Reference & Strategy Library**: Analyzes portfolio structural archetypes (e.g., *Stanford Systems Research*, *MIT CSAIL Deep Tech*, *FAANG Principal Engineer*) and recommends optimal layout, narrative tone, and repository presentation.
* **Autonomous Portfolio Generation Engine**: Synthesizes verified evidence into clean, production-ready static portfolio HTML and responsive web layouts (*Minimal Engineer* and *Cybersecurity / Systems* archetypes).

---

## Monorepo Architecture

```text
Portfolio-generator/
├── apps/
│   ├── web/                     # Frontend Application (React 19, TypeScript, Tailwind CSS v4, Lucide)
│   │   ├── src/
│   │   │   ├── components/      # UI components (RQS, Evidence, Strategy, Preview, Settings)
│   │   │   ├── services/        # API service layer with configurable VITE_API_URL
│   │   │   └── types/           # Shared client domain models
│   │   └── package.json
│   └── api/                     # Backend Modular Monolith (Node.js, Express, TypeScript)
│       ├── src/
│       │   ├── database/        # In-memory typed state store & session repository
│       │   ├── middleware/      # Auth guard, rate limiter, security headers
│       │   ├── modules/
│       │   │   ├── auth/        # Session management & OAuth PKCE challenge generator
│       │   │   ├── github/      # Repository synchronization & metadata engine
│       │   │   ├── intelligence/# RQS calculator, reference library & strategy engine
│       │   │   ├── resume/      # Claim verification & hidden gem detector
│       │   │   ├── skills/      # Skill evidence extraction engine
│       │   │   └── portfolio/   # Template rendering engine
│       │   └── main.ts          # Express API server entry point
│       └── package.json
├── package.json                 # Root npm workspaces configuration
├── tsconfig.json                # Project references TypeScript configuration
└── .env.example                 # Environment configuration template
```

---

## Quickstart

### Prerequisites

* Node.js `>= 20.0.0`
* npm `>= 10.0.0`

### Installation

```bash
npm install
```

### Local Development

Run both the API and Web applications:

```bash
# Start backend API (runs on http://localhost:3001)
npm run dev:api

# Start frontend Vite server (runs on http://localhost:5173)
npm run dev:web
```

### Typechecking, Linting & Production Build

```bash
# Strict TypeScript validation across both workspaces
npm run typecheck

# Code quality and style linting
npm run lint

# Production compilation
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env` to customize production environments:

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listen port | `3001` |
| `CLIENT_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `VITE_API_URL` | Frontend API target URL (optional for cross-domain hosting) | `/api` |
| `NODE_ENV` | Runtime environment mode | `development` |
| `GITHUB_CLIENT_ID` | Optional GitHub OAuth Client ID | - |
| `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth Client Secret | - |
| `SESSION_SECRET` | Secret used for cookie/session signature | - |

---

## License

MIT
