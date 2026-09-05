// apps/api/src/main.ts
// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Intelligence Platform — API Modular Monolith Entry Point
// ─────────────────────────────────────────────────────────────────────────────

import express, { Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { db } from './database/index.js'
import { AuthService } from './modules/auth/authService.js'
import { computeVerificationMatrix } from './modules/resume/verificationMatrix.js'
import { renderPortfolioHtml } from './modules/portfolio/templateEngine.js'
import { initializeReferenceLibrary } from './modules/intelligence/referenceLibrary.js'
import { StrategyEngine } from './modules/intelligence/strategyEngine.js'
import { SyncCoordinator } from './jobs/syncCoordinator.js'
import { requireAuth } from './middleware/auth.js'
import { rateLimiterMiddleware, securityHeadersMiddleware } from './middleware/security.js'

// Initialize Seed Reference Library
initializeReferenceLibrary()

// Async route boundary wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: express.NextFunction) => Promise<any>
) => (req: Request, res: Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

const app = express()
const PORT = process.env.PORT || 3001

// Support reverse proxies (Render, Railway, Fly.io, Cloudflare)
app.set('trust proxy', 1)

// Cookie configuration helper
export const getCookieOptions = (maxAgeMs: number) => {
  const isCrossDomain = process.env.NODE_ENV === 'production' && process.env.CROSS_DOMAIN_COOKIES === 'true'
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (isCrossDomain ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: maxAgeMs,
  }
}

// Global Middlewares
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// CORS origin configuration (supports comma-separated origins via CLIENT_ORIGIN or FRONTEND_ORIGIN)
const configuredOrigins = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_ORIGIN)
  ? (process.env.CLIENT_ORIGIN || process.env.FRONTEND_ORIGIN)!.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, same-origin)
      if (!origin || configuredOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)
app.use(securityHeadersMiddleware)
app.use(rateLimiterMiddleware)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'portfolio-intelligence-api',
  })
})

// ── Authentication Routes ─────────────────────────────────────────────────────
// GitHub OAuth: Get Authorization URL
app.get('/api/auth/github/url', (req: Request, res: Response) => {
  const clientOrigin = configuredOrigins[0] || 'http://localhost:5173'
  const isHtml = req.headers.accept?.includes('text/html')

  try {
    const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/github/callback`
    const { url, state } = AuthService.getGitHubAuthorizationUrl(callbackUrl)

    res.cookie('oauth_state', state, getCookieOptions(10 * 60 * 1000)) // 10 minutes

    if (isHtml) {
      res.redirect(url)
    } else {
      res.json({ url, state })
    }
  } catch (err: any) {
    if (isHtml) {
      res.redirect(
        `${clientOrigin}/?auth_error=${encodeURIComponent(
          err.message || 'GitHub OAuth is not configured on the server. Please use Demo Mode.'
        )}`
      )
    } else {
      res.status(400).json({
        error: 'OAuthConfigurationError',
        message: err.message || 'GitHub OAuth is not configured. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or use Demo Mode.',
      })
    }
  }
})


// GitHub OAuth: Callback & Token Exchange
app.get('/api/auth/github/callback', asyncHandler(async (req: Request, res: Response) => {
  const clientOrigin = configuredOrigins[0] || 'http://localhost:5173'
  const { code, state, error, error_description } = req.query

  if (error) {
    res.redirect(
      `${clientOrigin}/?auth_error=${encodeURIComponent(
        String(error_description || error || 'GitHub authorization failed')
      )}`
    )
    return
  }

  if (!code || !state) {
    res.redirect(`${clientOrigin}/?auth_error=${encodeURIComponent('Missing OAuth code or state parameter')}`)
    return
  }

  const cookieState = req.cookies?.['oauth_state']
  const stateEntry = AuthService.consumeOAuthState(String(state))

  if (!stateEntry || (cookieState && cookieState !== state)) {
    res.redirect(`${clientOrigin}/?auth_error=${encodeURIComponent('Invalid or expired OAuth state parameter')}`)
    return
  }

  try {
    const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/github/callback`
    const accessToken = await AuthService.exchangeCodeForAccessToken(
      String(code),
      callbackUrl,
      stateEntry.codeVerifier
    )
    const session = await AuthService.loginWithGitHubToken(accessToken)

    res.cookie('portfolio_session_id', session.id, getCookieOptions(7 * 24 * 60 * 60 * 1000))
    res.clearCookie('oauth_state', getCookieOptions(0))

    res.redirect(`${clientOrigin}/?authenticated=true`)
  } catch (err: any) {
    res.redirect(`${clientOrigin}/?auth_error=${encodeURIComponent(err.message || 'Token exchange failed')}`)
  }
}))

// Direct GitHub Token Authentication (PAT - Strictly Restricted to Dev/Testing Environments)
app.post('/api/auth/github/token', asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_PAT_AUTH !== 'true') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Direct Personal Access Token (PAT) ingestion is disabled in production environments. Please authenticate via the secure GitHub OAuth flow.',
    })
    return
  }

  const { token } = req.body
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'ValidationError', message: 'GitHub token is required' })
    return
  }

  const session = await AuthService.loginWithGitHubToken(token.trim())

  res.cookie('portfolio_session_id', session.id, getCookieOptions(7 * 24 * 60 * 60 * 1000))

  res.json({
    success: true,
    session,
    sessionId: session.id,
  })
}))

// Developer Demo Login / One-Click Test
app.post('/api/auth/demo-login', async (_req: Request, res: Response) => {
  try {
    const session = await AuthService.loginOrCreateSession(true)
    
    // Set secure HttpOnly cookie
    res.cookie('portfolio_session_id', session.id, getCookieOptions(7 * 24 * 60 * 60 * 1000))

    res.json({
      success: true,
      session,
      // Provide header fallback for environments without cookie reflection
      sessionId: session.id,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', details: err.message })
  }
})

// Current Session Info
app.get('/api/auth/me', (req: Request, res: Response) => {
  const sessionId = req.cookies?.['portfolio_session_id'] || (req.headers['x-session-id'] as string)
  if (!sessionId) {
    res.status(401).json({ error: 'Unauthenticated' })
    return
  }
  const session = db.getSession(sessionId)
  if (!session) {
    res.status(401).json({ error: 'Session expired' })
    return
  }
  res.json({ session })
})

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.['portfolio_session_id'] || (req.headers['x-session-id'] as string)
  if (sessionId) {
    AuthService.logout(sessionId)
  }
  res.clearCookie('portfolio_session_id', getCookieOptions(0))
  res.json({ success: true })
})

// ── GitHub Ingestion & Repositories ───────────────────────────────────────────
app.get('/api/github/repos', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const repos = db.getRepositories(userId)
  res.json({ repos })
})

app.post('/api/github/sync', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const result = await SyncCoordinator.triggerUserSync(userId)
  const updatedRepos = db.getRepositories(userId)
  res.json({ success: true, result, repos: updatedRepos })
})

// ── Repository Quality Score (RQS) Drill-Down ─────────────────────────────────
app.get('/api/intelligence/rqs/:repoId', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const repoId = String(req.params['repoId'] || '')
  const repo = db.getRepository(userId, repoId)
  if (!repo) {
    res.status(404).json({ error: 'Repository not found' })
    return
  }
  res.json({ repo, rqs: repo.rqs })
})

// ── Skill Evidence Engine ─────────────────────────────────────────────────────
app.get('/api/skills/evidence', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const skills = db.getSkills(userId)
  res.json({ skills })
})

// ── Resume Claim Verification Matrix ──────────────────────────────────────────
app.get('/api/resume/matrix', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const { claims, hiddenGems } = db.getResumeClaims(userId)
  
  // If not yet computed, compute default cross-verification
  if (claims.length === 0) {
    const skills = db.getSkills(userId)
    const result = computeVerificationMatrix(userId, skills)
    db.saveResumeClaims(userId, result.claims, result.hiddenGems)
    res.json(result)
    return
  }

  res.json({ claims, hiddenGems })
})

app.post('/api/resume/analyze', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const { resumeClaims } = req.body
  const skills = db.getSkills(userId)
  const result = computeVerificationMatrix(userId, skills, resumeClaims)
  db.saveResumeClaims(userId, result.claims, result.hiddenGems)
  res.json(result)
})

// ── Institutional Reference Library ──────────────────────────────────────────
app.get('/api/references', (_req: Request, res: Response) => {
  const category = _req.query['category'] as string | undefined
  const tag = _req.query['tag'] as string | undefined
  const references = db.getReferences(category, tag)
  res.json({ references })
})

app.get('/api/references/categories', (_req: Request, res: Response) => {
  const allRefs = db.getReferences()
  const categories = Array.from(new Set(allRefs.map(r => r.category)))
  res.json({ categories })
})

app.get('/api/references/:id', (req: Request, res: Response) => {
  const id = String(req.params['id'] || '')
  const reference = db.getReference(id)
  if (!reference) {
    res.status(404).json({ error: 'Reference profile not found' })
    return
  }
  res.json({ reference })
})

// ── Portfolio Strategy Intelligence ──────────────────────────────────────────
app.get('/api/portfolio/strategy', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  let strategy = db.getStrategy(userId)
  if (!strategy) {
    const recommendation = StrategyEngine.recommendStrategy(userId)
    strategy = StrategyEngine.synthesizeStrategy(
      userId,
      recommendation.secondaryReferenceId
        ? [recommendation.primaryReferenceId, recommendation.secondaryReferenceId]
        : [recommendation.primaryReferenceId],
      recommendation.recommendedWeights
    )
  }
  res.json({ strategy })
})

app.post('/api/portfolio/strategy', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const { selectedReferenceIds, customWeights } = req.body
  const strategy = StrategyEngine.synthesizeStrategy(
    userId,
    selectedReferenceIds || [],
    customWeights
  )
  res.json({ success: true, strategy })
})

app.get('/api/portfolio/strategy/recommendations', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const recommendation = StrategyEngine.recommendStrategy(userId)
  res.json({ recommendation })
})

// ── Portfolio Generator & Deployment ──────────────────────────────────────────
app.get('/api/portfolio/config', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const config = db.getPortfolioConfig(userId)
  res.json({ config })
})

app.put('/api/portfolio/config', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const currentConfig = db.getPortfolioConfig(userId)
  if (!currentConfig) {
    res.status(404).json({ error: 'Portfolio config not initialized' })
    return
  }

  const updatedConfig = {
    ...currentConfig,
    ...req.body,
    userId, // Enforce tenant boundary
  }

  db.savePortfolioConfig(updatedConfig)
  res.json({ success: true, config: updatedConfig })
})

// Live Preview: Returns compiled HTML string
app.get('/api/portfolio/preview', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const session = req.user!
  const config = db.getPortfolioConfig(userId)
  const repos = db.getRepositories(userId)
  const skills = db.getSkills(userId)
  const strategy = db.getStrategy(userId)

  if (!config) {
    res.status(404).send('<h1>Portfolio not configured</h1>')
    return
  }

  const html = renderPortfolioHtml(session, config, repos, skills, strategy)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// One-Click Static Deployment
app.post('/api/portfolio/deploy', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id
  const config = db.getPortfolioConfig(userId)
  if (!config) {
    res.status(404).json({ error: 'Portfolio not configured' })
    return
  }

  const deployedUrl = `https://${config.slug || req.user!.username}.portfolio-intel.dev`
  config.isPublished = true
  config.deployedUrl = deployedUrl
  config.lastDeployedAt = new Date().toISOString()
  db.savePortfolioConfig(config)

  res.json({
    success: true,
    deployedUrl,
    deployedAt: config.lastDeployedAt,
    deploymentType: 'Edge Static Object Deployment (Cloudflare R2 / S3)',
  })
})

// Test endpoint for verifying asynchronous error boundaries
if (process.env.NODE_ENV === 'test') {
  app.get('/api/test/async-error', asyncHandler(async () => {
    throw new Error('Simulated internal failure')
  }))
}

// ── 404 Route Not Found Handler ───────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  })
})

// ── Global Centralized Express Error Handler ──────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('[Unhandled API Exception]:', err?.message || err)
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: status === 500 ? 'An unexpected error occurred processing your request.' : (err.message || 'Error occurred'),
  })
})

export { app }

// Start server (only in non-test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Portfolio Intelligence API] Modular Monolith running on http://localhost:${PORT}`)
  })
}
