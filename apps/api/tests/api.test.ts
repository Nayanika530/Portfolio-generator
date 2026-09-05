// apps/api/tests/api.test.ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

process.env.NODE_ENV = 'test'
const { app } = await import('../dist/main.js')

describe('P1 — Backend Reliability: Error Boundaries & HTTP Handling', () => {
  let server: http.Server
  let baseUrl: string

  before(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const addr = server.address()
        if (typeof addr === 'object' && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`
        }
        resolve()
      })
    })
  })

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  it('should return consistent JSON 404 for unknown routes', async () => {
    const res = await fetch(`${baseUrl}/api/completely-nonexistent-endpoint`)
    assert.strictEqual(res.status, 404)
    assert.strictEqual(res.headers.get('content-type')?.includes('application/json'), true)

    const data = await res.json()
    assert.strictEqual(data.error, 'Not Found')
    assert.ok(data.message.includes('Cannot GET'))
  })

  it('should handle unhandled asynchronous errors without leaking stack traces or internal details', async () => {
    const res = await fetch(`${baseUrl}/api/test/async-error`)
    assert.strictEqual(res.status, 500)
    assert.strictEqual(res.headers.get('content-type')?.includes('application/json'), true)

    const data = await res.json()
    assert.strictEqual(data.error, 'Error')
    assert.strictEqual(data.message, 'An unexpected error occurred processing your request.')
    assert.strictEqual(data.stack, undefined, 'Stack trace must NEVER be exposed to client')
  })

  it('should return 401 for unauthenticated protected route access', async () => {
    const res = await fetch(`${baseUrl}/api/github/repos`)
    assert.strictEqual(res.status, 401)
    const data = await res.json()
    assert.strictEqual(data.error, 'Unauthorized')
  })

  it('should respond to health checks with defense-in-depth security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff')
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN')
    assert.ok(res.headers.get('content-security-policy'), 'CSP header must be set')
    const data = await res.json()
    assert.strictEqual(data.status, 'healthy')
  })
})
