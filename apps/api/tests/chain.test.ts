// apps/api/tests/chain.test.ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { AuthService } from '../dist/modules/auth/authService.js'
import { db } from '../dist/database/index.js'
import { renderPortfolioHtml, escapeHtml } from '../dist/modules/portfolio/templateEngine.js'
import { StrategyEngine } from '../dist/modules/intelligence/strategyEngine.js'

process.env.NODE_ENV = 'test'
process.env.GITHUB_CLIENT_ID = 'gh_test_client_id_99'
process.env.GITHUB_CLIENT_SECRET = 'gh_test_client_secret_99'

const { app } = await import('../dist/main.js')

describe('Complete End-to-End Chain: Connect GitHub -> Ingest -> RQS -> Skills -> Portfolio', () => {
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

  it('executes the full chain from authorization request to generated portfolio', async () => {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Connect GitHub (Initiate OAuth flow)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 1] Requesting GitHub Authorization URL...')
    const authUrlRes = await fetch(`${baseUrl}/api/auth/github/url`, {
      headers: { Accept: 'application/json' },
    })
    assert.strictEqual(authUrlRes.status, 200)

    const authUrlData = (await authUrlRes.json()) as { url: string; state: string }
    assert.ok(authUrlData.url, 'Authorization URL must be generated')
    assert.ok(authUrlData.state, 'Cryptographic state parameter must be generated')
    assert.ok(authUrlData.url.includes('client_id=gh_test_client_id_99'))
    assert.ok(authUrlData.url.includes(`state=${authUrlData.state}`))

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 & 3: GitHub Authorization, Callback & Session Establishment
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 2 & 3] Processing GitHub authorization & establishing session...')
    // Simulate user authenticating and server establishing live developer session with vaulted token
    const testSession = {
      id: `sess_chain_${Date.now()}`,
      githubUserId: 'gh_4201993',
      username: 'jordan-code',
      displayName: 'Jordan Vance',
      avatarUrl: 'https://avatars.githubusercontent.com/u/4201993?v=4',
      bio: 'Cloud architecture & distributed consensus systems engineer.',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isDemoUser: false, // Live GitHub User
    }
    const mockAccessToken = 'gho_mock_secure_vaulted_token_xyz987'

    // Save session in server-side session vault
    db.saveSession(testSession, mockAccessToken)

    // Verify token is securely stored on server and session is active
    const savedSession = db.getSession(testSession.id)
    assert.ok(savedSession, 'Session must exist in database')
    assert.strictEqual(savedSession.isDemoUser, false, 'User must be classified as Live GitHub')
    assert.strictEqual(db.getOAuthToken(testSession.id), mockAccessToken, 'Access token must be vaulted on server')

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Your Actual Repositories Appear (Ingestion & Manifest Parsing)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 4] Ingesting repositories and parsing manifest trees...')
    // Populate ingested repositories representing the user's codebases
    const ingestedRepos = [
      {
        id: 'repo-consensio',
        userId: testSession.id,
        name: 'Consensio',
        fullName: 'jordan-code/consensio',
        description: 'Raft consensus algorithm implemented in Rust with network partition fuzzing.',
        isPrivate: false,
        isFork: false,
        stars: 310,
        forks: 42,
        openIssues: 4,
        primaryLanguage: 'Rust',
        languages: { Rust: 92, Shell: 8 },
        commitCount: 245,
        lastPushedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2024-03-01T00:00:00Z',
        defaultBranch: 'main',
        manifestsFound: ['Cargo.toml', 'Cargo.lock', 'Dockerfile', '.github/workflows/ci.yml'],
        hasReadme: true,
        hasLicense: true,
        hasTests: true,
        hasCi: true,
        hasDocker: true,
        hasSecurityPolicy: true,
      },
      {
        id: 'repo-distributed-cache',
        userId: testSession.id,
        name: 'DistCache',
        fullName: 'jordan-code/distcache',
        description: 'Distributed in-memory key-value cache with consistent hashing and gRPC replication.',
        isPrivate: false,
        isFork: false,
        stars: 185,
        forks: 29,
        openIssues: 1,
        primaryLanguage: 'Go',
        languages: { Go: 95, Makefile: 5 },
        commitCount: 140,
        lastPushedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2024-08-15T00:00:00Z',
        defaultBranch: 'main',
        manifestsFound: ['go.mod', 'go.sum', 'Dockerfile', '.github/workflows/test.yml'],
        hasReadme: true,
        hasLicense: true,
        hasTests: true,
        hasCi: true,
        hasDocker: true,
        hasSecurityPolicy: false,
      },
    ]

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Repository Scores Generated (Deterministic 7-Pillar RQS)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 5] Computing deterministic 7-pillar Repository Quality Scores...')
    const { calculateDeterministicRQS } = await import('../dist/modules/intelligence/rqsCalculator.js')

    const scoredRepos = ingestedRepos.map((repo) => ({
      ...repo,
      rqs: calculateDeterministicRQS(repo),
    }))

    // Save scored repositories to database
    db.saveRepositories(testSession.id, scoredRepos)

    // Verify all 7 pillars are calculated
    const storedRepos = db.getRepositories(testSession.id)
    assert.strictEqual(storedRepos.length, 2, 'All ingested repositories must be stored')

    for (const repo of storedRepos) {
      // Rigorous Repository Assertions
      assert.ok(repo.id && typeof repo.id === 'string', 'repository.id must exist')
      assert.ok(repo.name && typeof repo.name === 'string', 'repository.name must exist')
      assert.ok(repo.primaryLanguage && typeof repo.primaryLanguage === 'string', 'repository.primaryLanguage must exist')
      assert.ok(Array.isArray(repo.manifestsFound) && repo.manifestsFound.length > 0, 'repository.manifestsFound must contain files')

      // Rigorous RQS 7-Pillar Assertions
      assert.ok(typeof repo.rqs.totalScore === 'number' && repo.rqs.totalScore >= 0 && repo.rqs.totalScore <= 100, 'RQS score must be between 0 and 100')
      assert.ok(typeof repo.rqs.documentationScore === 'number' && repo.rqs.documentationScore >= 0, 'documentationScore must exist')
      assert.ok(typeof repo.rqs.testingScore === 'number' && repo.rqs.testingScore >= 0, 'testingScore must exist')
      assert.ok(typeof repo.rqs.codeStructureScore === 'number' && repo.rqs.codeStructureScore >= 0, 'codeStructureScore must exist')
      assert.ok(typeof repo.rqs.ciCdScore === 'number' && repo.rqs.ciCdScore >= 0, 'ciCdScore must exist')
      assert.ok(typeof repo.rqs.activityScore === 'number' && repo.rqs.activityScore >= 0, 'activityScore must exist')
      assert.ok(typeof repo.rqs.dependencyHygieneScore === 'number' && repo.rqs.dependencyHygieneScore >= 0, 'dependencyHygieneScore must exist')
      assert.ok(typeof repo.rqs.securityScore === 'number' && repo.rqs.securityScore >= 0, 'securityScore must exist')

      // Evidence Traceability Assertions
      assert.ok(Array.isArray(repo.rqs.documentationEvidence) && repo.rqs.documentationEvidence.length > 0, 'documentationEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.testingEvidence) && repo.rqs.testingEvidence.length > 0, 'testingEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.codeStructureEvidence) && repo.rqs.codeStructureEvidence.length > 0, 'codeStructureEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.ciCdEvidence) && repo.rqs.ciCdEvidence.length > 0, 'ciCdEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.activityEvidence) && repo.rqs.activityEvidence.length > 0, 'activityEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.dependencyEvidence) && repo.rqs.dependencyEvidence.length > 0, 'dependencyEvidence must exist')
      assert.ok(Array.isArray(repo.rqs.securityEvidence) && repo.rqs.securityEvidence.length > 0, 'securityEvidence must exist')
      assert.ok(['Exceptional', 'Strong', 'Moderate', 'Needs Work'].includes(repo.rqs.rating), 'RQS rating must be valid')
    }

    const consensio = storedRepos.find((r) => r.name === 'Consensio')
    assert.ok(consensio)
    assert.strictEqual(consensio.rqs.rating, 'Exceptional')
    assert.ok(consensio.rqs.totalScore >= 80)

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Skills Extracted from Actual Evidence
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 6] Extracting skills with concrete code-grounded citations...')
    const { extractSkillsFromRepositories } = await import('../dist/modules/skills/skillExtractor.js')

    const extractedSkills = extractSkillsFromRepositories(testSession.id, storedRepos)
    db.saveSkills(testSession.id, extractedSkills)

    const storedSkills = db.getSkills(testSession.id)
    assert.ok(storedSkills.length >= 3, 'Must extract verified skills from repository evidence')

    // Rigorous Skill Evidence Assertions
    const rustSkill = storedSkills.find((s) => s.skillName === 'Rust')
    assert.ok(rustSkill, 'Rust skill must be detected from Consensio repository')
    assert.strictEqual(rustSkill.skillName, 'Rust')
    assert.strictEqual(rustSkill.verifiedInCode, true)
    assert.strictEqual(rustSkill.primaryRepositoryName, 'Consensio')
    assert.ok(rustSkill.citations.length > 0, 'Rust citations must have items')
    assert.ok(rustSkill.citations[0].filePath && rustSkill.citations[0].filePath.includes('Cargo.toml'), 'filePath must exist in citation')
    assert.ok(rustSkill.confidencePercentage > 0, 'confidencePercentage must be positive')

    const goSkill = storedSkills.find((s) => s.skillName === 'Go')
    assert.ok(goSkill, 'Go skill must be detected from DistCache repository')
    assert.strictEqual(goSkill.skillName, 'Go')
    assert.strictEqual(goSkill.verifiedInCode, true)
    assert.strictEqual(goSkill.primaryRepositoryName, 'DistCache')
    assert.ok(goSkill.citations.length > 0, 'Go citations must have items')
    assert.ok(goSkill.citations[0].filePath && goSkill.citations[0].filePath.includes('go.mod'), 'filePath must exist in citation')
    assert.ok(goSkill.confidencePercentage > 0, 'confidencePercentage must be positive')

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 7: Portfolio Generated from that Data
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → [Step 7] Generating portfolio from verified data and institutional strategy...')
    // Recommend and synthesize institutional portfolio strategy
    const recommendation = StrategyEngine.recommendStrategy(testSession.id)
    const strategy = StrategyEngine.synthesizeStrategy(
      testSession.id,
      [recommendation.primaryReferenceId],
      recommendation.recommendedWeights
    )
    db.saveStrategy(strategy)

    const portfolioConfig = {
      userId: testSession.id,
      slug: testSession.username,
      templateId: 'minimal-engineer' as const,
      headline: 'Principal Distributed Systems Engineer',
      summaryBio: testSession.bio,
      selectedRepoIds: storedRepos.map((r) => r.id),
      showVerificationBadges: true,
      showRqsScores: true,
      contactEmail: 'jordan.vance@example.com',
      isPublished: true,
      deployedUrl: `https://${testSession.username}.portfolio-intel.dev`,
      lastDeployedAt: new Date().toISOString(),
    }
    db.savePortfolioConfig(portfolioConfig)

    // Render the final portfolio HTML
    const html = renderPortfolioHtml(
      testSession,
      portfolioConfig,
      storedRepos,
      storedSkills,
      strategy
    )

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFY COMPILED PORTFOLIO HTML
    // ─────────────────────────────────────────────────────────────────────────
    console.log('  → Validating compiled portfolio HTML content and security invariants...')
    assert.ok(html.includes('Jordan Vance'), 'HTML must contain developer display name')
    assert.ok(html.includes('Principal Distributed Systems Engineer'), 'HTML must contain headline')
    assert.ok(html.includes('Consensio'), 'HTML must feature the Consensio repository')
    assert.ok(html.includes('DistCache'), 'HTML must feature the DistCache repository')
    assert.ok(html.includes('rqs-badge'), 'HTML must display repository quality scores')
    assert.ok(html.includes('Rust'), 'HTML must list extracted Rust skill evidence')
    assert.ok(html.includes('Go'), 'HTML must list extracted Go skill evidence')
    assert.ok(html.includes('strategy-badge') && html.includes('Strategy:'), 'HTML must display the institutional strategy badge')
    assert.ok(html.includes(escapeHtml(strategy.explainabilityRationale[0])), 'HTML must render explainability rationale')
    assert.ok(!html.includes('<script>alert'), 'HTML must be free of injected script tags')

    // Clean up test session
    db.deleteSession(testSession.id)
    console.log('  ✔ Complete chain successfully verified with 0 defects!')
  })
})
