// apps/api/src/middleware/security.ts
// ─────────────────────────────────────────────────────────────────────────────
// Security Headers & Rate Limiting Middleware
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'

// In-Memory Token Bucket Rate Limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Defense-in-depth headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
  )
  next()
}

export function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1'
  const now = Date.now()

  const clientData = requestCounts.get(clientIp)
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return next()
  }

  clientData.count++
  if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down your requests.',
      retryAfterSeconds: Math.ceil((clientData.resetTime - now) / 1000),
    })
    return
  }

  next()
}
