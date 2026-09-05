// apps/api/tests/security.test.ts
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, renderPortfolioHtml } from '../dist/modules/portfolio/templateEngine.js'
import {
  pruneExpiredEntries,
  _injectTrackedIp,
  _getTrackedIpCount,
  _clearTrackedIps,
} from '../dist/middleware/security.js'
import type {
  PortfolioConfig,
  PortfolioStrategy,
  RepositoryWithScore,
  SkillEvidenceItem,
  UserSession,
} from '@portfolio/types'

describe('P0 — Security: HTML Injection & XSS Mitigation', () => {
  it('should neutralize basic script tags and quotes via escapeHtml', () => {
    const malicious = '"><script>alert(1)</script>'
    const escaped = escapeHtml(malicious)
    assert.strictEqual(escaped, '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
    assert.ok(!escaped.includes('<script>'))
    assert.ok(!escaped.includes('">'))
  })

  it('should prevent XSS injection via strategy.explainabilityRationale and selectedReferenceIds in generated portfolio', () => {
    const session: UserSession = {
      id: 'sess_test_sec',
      githubUserId: 'gh_sec_01',
      username: 'security-researcher',
      displayName: 'Sec Researcher <script>alert("name")</script>',
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Bio with <img src=x onerror=alert(2)> injection',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isDemoUser: false,
    }

    const config: PortfolioConfig = {
      userId: session.id,
      slug: 'sec-res',
      templateId: 'minimal-engineer',
      headline: 'Headline"><script>alert("headline")</script>',
      summaryBio: 'Summary"><svg onload=alert("bio")>',
      selectedRepoIds: ['repo-1'],
      showVerificationBadges: true,
      showRqsScores: true,
      contactEmail: 'sec@example.com',
      isPublished: true,
    }

    const repos: RepositoryWithScore[] = [
      {
        id: 'repo-1',
        userId: session.id,
        name: 'Repo"><script>alert("repo")</script>',
        fullName: 'developer/repo',
        description: 'Description with <iframe src="evil.com"></iframe>',
        isPrivate: false,
        isFork: false,
        stars: 10,
        forks: 2,
        openIssues: 0,
        primaryLanguage: 'TypeScript',
        languages: { TypeScript: 100 },
        commitCount: 25,
        lastPushedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        defaultBranch: 'main',
        manifestsFound: ['package.json'],
        hasReadme: true,
        hasLicense: true,
        hasTests: true,
        hasCi: true,
        hasDocker: false,
        hasSecurityPolicy: true,
        rqs: {
          documentationScore: 20,
          documentationEvidence: [],
          testingScore: 20,
          testingEvidence: [],
          codeStructureScore: 15,
          codeStructureEvidence: [],
          ciCdScore: 15,
          ciCdEvidence: [],
          activityScore: 10,
          activityEvidence: [],
          dependencyHygieneScore: 10,
          dependencyEvidence: [],
          securityScore: 10,
          securityEvidence: [],
          totalScore: 100,
          rating: 'Exceptional',
          evaluatedAt: new Date().toISOString(),
        },
      },
    ]

    const skills: SkillEvidenceItem[] = [
      {
        id: 'skill-1',
        userId: session.id,
        skillName: 'Skill"><script>alert("skill")</script>',
        category: 'Languages',
        confidencePercentage: 99,
        primaryRepositoryId: 'repo-1',
        primaryRepositoryName: 'repo-1',
        citations: [],
        verifiedInCode: true,
      },
    ]

    const strategy: PortfolioStrategy = {
      userId: session.id,
      selectedReferenceIds: ['ref"><script>alert("ref")</script>'],
      blendedWeights: { 'ref-1': 1.0 },
      sectionsToInclude: ['Projects', 'Skills'],
      sectionsToExclude: [],
      sectionOrdering: ['Projects', 'Skills'],
      contentPriorities: {
        research: 0.2,
        projects: 0.9,
        experience: 0.5,
        education: 0.4,
        publications: 0.1,
        skills: 0.8,
      },
      technicalDepth: 0.9,
      visualDensity: 0.7,
      minimalismScore: 0.8,
      navigationStyle: 'single-page-scroll',
      explainabilityRationale: [
        'Rationale item 1',
        '"><script>alert("rationale-xss")</script>',
      ],
      updatedAt: new Date().toISOString(),
    }

    // Render both minimal-engineer and cybersecurity-systems templates
    const minimalHtml = renderPortfolioHtml(session, config, repos, skills, strategy)
    config.templateId = 'cybersecurity-systems'
    const cyberHtml = renderPortfolioHtml(session, config, repos, skills, strategy)

    for (const html of [minimalHtml, cyberHtml]) {
      // Must NOT contain raw unescaped script tags
      assert.ok(!html.includes('<script>alert('), 'HTML must not contain unescaped script tags')
      assert.ok(!html.includes('<img src=x onerror='), 'HTML must not contain unescaped img onerror')
      assert.ok(!html.includes('<iframe'), 'HTML must not contain unescaped iframe tags')
      assert.ok(!html.includes('<svg onload='), 'HTML must not contain unescaped svg onload')

      // Must contain properly escaped entities
      assert.ok(html.includes('&lt;script&gt;alert('), 'HTML must contain escaped script entity')
    }
  })
})

describe('P0 — Security: Rate-Limiter TTL Eviction & Memory Protection', () => {
  beforeEach(() => {
    _clearTrackedIps()
  })

  it('should prune expired IP records while retaining active ones', () => {
    const now = Date.now()

    // Inject expired entries (resetTime was 5 minutes ago)
    _injectTrackedIp('192.168.1.100', 50, now - 300000)
    _injectTrackedIp('192.168.1.101', 120, now - 1000)

    // Inject active entry (resetTime is in the future)
    _injectTrackedIp('10.0.0.1', 10, now + 60000)
    _injectTrackedIp('10.0.0.2', 5, now + 45000)

    assert.strictEqual(_getTrackedIpCount(), 4)

    const prunedCount = pruneExpiredEntries(now)
    assert.strictEqual(prunedCount, 2, 'Should prune exactly 2 expired IP entries')
    assert.strictEqual(_getTrackedIpCount(), 2, 'Should leave 2 active entries in map')
  })

  it('should handle empty map and all-expired entries gracefully', () => {
    _clearTrackedIps()
    assert.strictEqual(pruneExpiredEntries(), 0)

    const now = Date.now()
    _injectTrackedIp('1.1.1.1', 1, now - 1000)
    _injectTrackedIp('2.2.2.2', 1, now - 2000)

    const pruned = pruneExpiredEntries(now)
    assert.strictEqual(pruned, 2)
    assert.strictEqual(_getTrackedIpCount(), 0)
  })
})
