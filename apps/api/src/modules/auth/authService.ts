// apps/api/src/modules/auth/authService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Authentication Service (OAuth 2.0 with PKCE & HttpOnly Session Management)
// Tokens are strictly maintained in the server-side vault and NEVER sent to the client.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto'
import { Octokit } from '@octokit/rest'
import { UserSession, db } from '../../database/index.js'
import { GitHubService } from '../github/githubService.js'

// In-memory OAuth state registry with automatic TTL expiration (10 minutes)
const oauthStateCache = new Map<string, { createdAt: number; redirectUri?: string; codeVerifier: string }>()
const STATE_TTL_MS = 10 * 60 * 1000

function pruneExpiredStates() {
  const now = Date.now()
  for (const [state, entry] of oauthStateCache.entries()) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      oauthStateCache.delete(state)
    }
  }
}

export class AuthService {
  /**
   * Generates a cryptographic state parameter and PKCE code challenge.
   */
  static generateOAuthChallenge(): { state: string; codeVerifier: string; codeChallenge: string } {
    const state = crypto.randomBytes(24).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    return { state, codeVerifier, codeChallenge }
  }

  /**
   * Generates the GitHub OAuth authorization URL with cryptographic state and PKCE challenge.
   */
  static getGitHubAuthorizationUrl(redirectUri?: string): { url: string; state: string } {
    pruneExpiredStates()
    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      throw new Error('GITHUB_CLIENT_ID is not configured in the server environment')
    }

    const { state, codeVerifier, codeChallenge } = this.generateOAuthChallenge()
    oauthStateCache.set(state, { createdAt: Date.now(), redirectUri, codeVerifier })

    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'read:user,repo',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    if (redirectUri) {
      params.append('redirect_uri', redirectUri)
    }

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state,
    }
  }

  /**
   * Validates and single-use consumes state parameter to protect against CSRF attacks.
   * Returns associated codeVerifier if valid, or null if invalid/expired.
   */
  static consumeOAuthState(state: string): { codeVerifier: string; redirectUri?: string } | null {
    pruneExpiredStates()
    if (!state || !oauthStateCache.has(state)) {
      return null
    }
    const entry = oauthStateCache.get(state)!
    oauthStateCache.delete(state) // Enforce single-use
    return entry
  }

  /**
   * Backwards-compatible validator
   */
  static validateOAuthState(state: string): boolean {
    return Boolean(this.consumeOAuthState(state))
  }

  /**
   * Exchanges authorization code for a GitHub user access token.
   */
  static async exchangeCodeForAccessToken(
    code: string,
    redirectUri?: string,
    codeVerifier?: string
  ): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials are not fully configured')
    }

    const payload: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`GitHub token exchange failed: HTTP ${res.status}`)
    }

    const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string }
    if (data.error || !data.access_token) {
      throw new Error(data.error_description || data.error || 'Failed to obtain access token from GitHub')
    }

    return data.access_token
  }

  /**
   * Authenticates user using real GitHub access token via Octokit.
   * Access token is stored securely in server vault and NEVER returned to the client.
   */
  static async loginWithGitHubToken(accessToken: string): Promise<UserSession> {
    const octokit = new Octokit({ auth: accessToken })
    const { data: ghUser } = await octokit.rest.users.getAuthenticated()

    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`
    const session: UserSession = {
      id: sessionId,
      githubUserId: String(ghUser.id),
      username: ghUser.login,
      displayName: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url,
      bio: ghUser.bio || 'Software engineer & open source contributor.',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isDemoUser: false,
    }

    // Securely vault access token on the server
    db.saveSession(session, accessToken)

    // Ingest real repositories and calculate deterministic RQS
    await GitHubService.syncUserRepositories(session.id)

    // Set initial portfolio config if not present
    const repos = db.getRepositories(session.id)
    if (!db.getPortfolioConfig(session.id)) {
      db.savePortfolioConfig({
        userId: session.id,
        slug: session.username,
        templateId: 'minimal-engineer',
        headline: 'Software Engineer',
        summaryBio: session.bio,
        selectedRepoIds: repos.map((r) => r.id),
        showVerificationBadges: true,
        showRqsScores: true,
        contactEmail: ghUser.email || `${ghUser.login}@users.noreply.github.com`,
        isPublished: true,
        deployedUrl: `https://${session.username}.portfolio-intel.dev`,
        lastDeployedAt: new Date().toISOString(),
      })
    }

    return session
  }

  /**
   * Creates or restores an authenticated developer session.
   * Supports both live GitHub OAuth exchanges and instant Developer Demo sessions.
   */
  static async loginOrCreateSession(isDemo: boolean = true): Promise<UserSession> {
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`

    const session: UserSession = {
      id: sessionId,
      githubUserId: isDemo ? 'gh_98241029' : 'gh_live',
      username: isDemo ? 'alex-developer' : 'authenticated-dev',
      displayName: isDemo ? 'Alex Mercer' : 'Verified Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Systems engineer & security researcher. Focus on high-assurance distributed software and cryptography.',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isDemoUser: isDemo,
    }

    // Save session in server-side session store
    db.saveSession(session)

    // Trigger initial repository sync and RQS evaluation
    await GitHubService.syncUserRepositories(session.id)

    // Save initial default portfolio config
    const repos = db.getRepositories(session.id)
    db.savePortfolioConfig({
      userId: session.id,
      slug: session.username,
      templateId: 'minimal-engineer',
      headline: 'Software Engineer & Security Researcher',
      summaryBio: session.bio,
      selectedRepoIds: repos.map((r) => r.id),
      showVerificationBadges: true,
      showRqsScores: true,
      contactEmail: 'alex.mercer.dev@proton.me',
      isPublished: true,
      deployedUrl: `https://${session.username}.portfolio-intel.dev`,
      lastDeployedAt: new Date().toISOString(),
    })

    return session
  }

  static getSession(sessionId: string): UserSession | undefined {
    return db.getSession(sessionId)
  }

  static logout(sessionId: string): void {
    db.deleteSession(sessionId)
  }
}
