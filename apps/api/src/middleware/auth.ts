// apps/api/src/middleware/auth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Session Authentication Guard
// Extracts session token from HttpOnly cookie and validates against server session vault.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'
import { UserSession, db } from '../database/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: UserSession
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.cookies?.['portfolio_session_id'] || (req.headers['x-session-id'] as string)

  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized', message: 'No active session found' })
    return
  }

  const session = db.getSession(sessionId)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized', message: 'Session has expired or is invalid' })
    return
  }

  req.user = session
  next()
}
