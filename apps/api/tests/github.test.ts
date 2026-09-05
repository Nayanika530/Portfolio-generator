// apps/api/tests/github.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AuthService } from '../dist/modules/auth/authService.js'
import { GitHubService } from '../dist/modules/github/githubService.js'
import { FileStorageAdapter, PersistentDatabase } from '../dist/database/index.js'
import type { RepositoryMetadata } from '@portfolio/types'
import fs from 'node:fs'
import path from 'node:path'

describe('P2 — GitHub Integration & OAuth Security', () => {
  it('should generate valid cryptographic PKCE challenges and OAuth state', () => {
    const challenge = AuthService.generateOAuthChallenge()
    assert.ok(challenge.state && challenge.state.length >= 24)
    assert.ok(challenge.codeVerifier && challenge.codeVerifier.length >= 32)
    assert.ok(challenge.codeChallenge && challenge.codeChallenge.length >= 32)

    // Ensure successive challenges generate unique cryptographic entropy
    const challenge2 = AuthService.generateOAuthChallenge()
    assert.notStrictEqual(challenge.state, challenge2.state)
    assert.notStrictEqual(challenge.codeVerifier, challenge2.codeVerifier)
  })

  it('should validate and consume OAuth state correctly to prevent CSRF replay', () => {
    // Temporarily set client id for testing URL generation
    process.env.GITHUB_CLIENT_ID = 'test-client-id-xyz'
    const { url, state } = AuthService.getGitHubAuthorizationUrl('http://localhost:5173/callback')
    assert.ok(url.includes('https://github.com/login/oauth/authorize'))
    assert.ok(url.includes('client_id=test-client-id-xyz'))
    assert.ok(url.includes(`state=${state}`))

    // First validation must succeed
    assert.strictEqual(AuthService.validateOAuthState(state), true)

    // Replay attack with same state must be rejected
    assert.strictEqual(AuthService.validateOAuthState(state), false)

    // Bogus state must be rejected
    assert.strictEqual(AuthService.validateOAuthState('forged-state-token'), false)
  })

  it('should throw an informative configuration error when GITHUB_CLIENT_ID is missing', () => {
    const originalClientId = process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_ID

    assert.throws(
      () => AuthService.getGitHubAuthorizationUrl(),
      /GITHUB_CLIENT_ID is not configured/
    )

    process.env.GITHUB_CLIENT_ID = originalClientId
  })

  it('should provide complete fallback demo repositories when user is unauthenticated or demo mode', () => {
    const repos = GitHubService.getDemoRepositories('demo-test-user')
    assert.ok(Array.isArray(repos))
    assert.ok(repos.length >= 4)

    const qryptis = repos.find((r) => r.name === 'Qryptis')
    assert.ok(qryptis)
    assert.strictEqual(qryptis.primaryLanguage, 'Rust')
    assert.strictEqual(qryptis.hasReadme, true)
    assert.strictEqual(qryptis.hasTests, true)
    assert.strictEqual(qryptis.hasCi, true)
    assert.ok(qryptis.manifestsFound.includes('Cargo.toml'))
  })
})

describe('Persistence Layer: FileStorageAdapter & State Recovery', () => {
  const testStoreDir = path.resolve(process.cwd(), 'scratch')
  const testStoreFile = path.join(testStoreDir, `test-store-${Date.now()}.json`)

  it('should save and reload database state across restarts without loss', () => {
    const adapter = new FileStorageAdapter(testStoreFile)
    const testDb = new PersistentDatabase(adapter)

    testDb.saveSession(
      {
        id: 'sess_persist_1',
        githubUserId: 'gh_persist_01',
        username: 'persist-dev',
        displayName: 'Persistent Dev',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'Persistence test bio',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isDemoUser: false,
      },
      'vaulted_token_secret_123'
    )

    // Verify token and session saved in memory
    assert.strictEqual(testDb.getSession('sess_persist_1')?.username, 'persist-dev')
    assert.strictEqual(testDb.getOAuthToken('sess_persist_1'), 'vaulted_token_secret_123')

    // Verify file written to disk
    assert.ok(fs.existsSync(testStoreFile))

    // Create a brand new database instance simulating server process reboot
    const rebootedDb = new PersistentDatabase(new FileStorageAdapter(testStoreFile))
    const reloadedSession = rebootedDb.getSession('sess_persist_1')
    assert.ok(reloadedSession)
    assert.strictEqual(reloadedSession.username, 'persist-dev')
    assert.strictEqual(rebootedDb.getOAuthToken('sess_persist_1'), 'vaulted_token_secret_123')

    // Clean up test file
    try {
      fs.unlinkSync(testStoreFile)
    } catch {}
  })
})
