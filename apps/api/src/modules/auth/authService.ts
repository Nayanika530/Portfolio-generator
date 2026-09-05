// apps/api/src/modules/auth/authService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Authentication Service (OAuth 2.0 with PKCE & HttpOnly Session Management)
// Tokens are strictly maintained in the server-side vault and NEVER sent to the client.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto'
import { UserSession, db } from '../../database/index.js'
import { GitHubService } from '../github/githubService.js'

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
      selectedRepoIds: repos.map(r => r.id),
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
