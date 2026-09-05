// apps/api/tests/intelligence.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateDeterministicRQS } from '../dist/modules/intelligence/rqsCalculator.js'
import { extractSkillsFromRepositories } from '../dist/modules/skills/skillExtractor.js'
import { computeVerificationMatrix } from '../dist/modules/resume/verificationMatrix.js'
import type { RepositoryMetadata, RepositoryWithScore } from '@portfolio/types'

describe('Deterministic RQS Calculator (Pure Engine)', () => {
  const sampleRepo: RepositoryMetadata = {
    id: 'repo-sample',
    userId: 'user-test',
    name: 'VaultService',
    fullName: 'org/vault-service',
    description: 'Cryptographic key management service with audit logging.',
    isPrivate: false,
    isFork: false,
    stars: 120,
    forks: 18,
    openIssues: 3,
    primaryLanguage: 'Rust',
    languages: { Rust: 90, Shell: 10 },
    commitCount: 150,
    lastPushedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    defaultBranch: 'main',
    manifestsFound: ['Cargo.toml', 'Cargo.lock', 'Dockerfile', '.github/workflows/ci.yml'],
    hasReadme: true,
    hasLicense: true,
    hasTests: true,
    hasCi: true,
    hasDocker: true,
    hasSecurityPolicy: true,
  }

  it('should deterministically score all 7 pillars with zero variance across identical inputs', () => {
    const score1 = calculateDeterministicRQS(sampleRepo)
    const score2 = calculateDeterministicRQS(sampleRepo)

    assert.strictEqual(score1.totalScore, score2.totalScore)
    assert.strictEqual(score1.documentationScore, score2.documentationScore)
    assert.strictEqual(score1.testingScore, score2.testingScore)
    assert.strictEqual(score1.codeStructureScore, score2.codeStructureScore)
    assert.strictEqual(score1.ciCdScore, score2.ciCdScore)
    assert.strictEqual(score1.activityScore, score2.activityScore)
    assert.strictEqual(score1.dependencyHygieneScore, score2.dependencyHygieneScore)
    assert.strictEqual(score1.securityScore, score2.securityScore)
    assert.strictEqual(score1.rating, score2.rating)

    // Verify all 7 pillars contribute positive score on high-assurance repo
    assert.ok(score1.documentationScore > 0)
    assert.ok(score1.testingScore > 0)
    assert.ok(score1.codeStructureScore > 0)
    assert.ok(score1.ciCdScore > 0)
    assert.ok(score1.activityScore > 0)
    assert.ok(score1.dependencyHygieneScore > 0)
    assert.ok(score1.securityScore > 0)
    assert.ok(score1.totalScore >= 80)
    assert.strictEqual(score1.rating, 'Exceptional')
  })

  it('should penalize repositories lacking tests, documentation, and CI', () => {
    const poorRepo: RepositoryMetadata = {
      ...sampleRepo,
      id: 'repo-poor',
      name: 'UnmaintainedToy',
      description: '',
      hasReadme: false,
      hasLicense: false,
      hasTests: false,
      hasCi: false,
      hasDocker: false,
      hasSecurityPolicy: false,
      commitCount: 2,
      stars: 0,
      lastPushedAt: '2022-01-01T00:00:00Z',
      manifestsFound: [],
    }

    const score = calculateDeterministicRQS(poorRepo)
    assert.ok(score.totalScore < 35)
    assert.strictEqual(score.rating, 'Needs Work')
    assert.strictEqual(score.testingScore, 0)
    assert.strictEqual(score.ciCdScore, 0)
    assert.strictEqual(score.securityScore, 0)
  })
})

describe('Skill Extraction & Resume Matrix Verification', () => {
  it('should extract concrete code-grounded citations from ingested repositories', () => {
    const repoWithScore: RepositoryWithScore = {
      id: 'repo-1',
      userId: 'user-test',
      name: 'Qryptis',
      fullName: 'dev/qryptis',
      description: 'Rust encryption service',
      isPrivate: false,
      isFork: false,
      stars: 50,
      forks: 5,
      openIssues: 0,
      primaryLanguage: 'Rust',
      languages: { Rust: 100 },
      commitCount: 100,
      lastPushedAt: new Date().toISOString(),
      createdAt: '2025-01-01T00:00:00Z',
      defaultBranch: 'main',
      manifestsFound: ['Cargo.toml', 'Dockerfile'],
      hasReadme: true,
      hasLicense: true,
      hasTests: true,
      hasCi: true,
      hasDocker: true,
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
    }

    const skills = extractSkillsFromRepositories('user-test', [repoWithScore])
    assert.ok(skills.length > 0)

    const rustSkill = skills.find((s) => s.skillName === 'Rust')
    assert.ok(rustSkill)
    assert.strictEqual(rustSkill.verifiedInCode, true)
    assert.ok(rustSkill.citations.length > 0)
    assert.strictEqual(rustSkill.citations[0].repositoryName, 'Qryptis')
    assert.ok(rustSkill.citations[0].filePath.includes('Cargo.toml') || rustSkill.citations[0].filePath.includes('src'))
  })

  it('should classify verified vs insufficient evidence claims in resume verification matrix', () => {
    const repoWithScore: RepositoryWithScore = {
      id: 'repo-1',
      userId: 'user-test',
      name: 'Qryptis',
      fullName: 'dev/qryptis',
      description: 'Rust encryption service',
      isPrivate: false,
      isFork: false,
      stars: 50,
      forks: 5,
      openIssues: 0,
      primaryLanguage: 'Rust',
      languages: { Rust: 100 },
      commitCount: 100,
      lastPushedAt: new Date().toISOString(),
      createdAt: '2025-01-01T00:00:00Z',
      defaultBranch: 'main',
      manifestsFound: ['Cargo.toml'],
      hasReadme: true,
      hasLicense: true,
      hasTests: true,
      hasCi: true,
      hasDocker: false,
      hasSecurityPolicy: false,
      rqs: {
        documentationScore: 10,
        documentationEvidence: [],
        testingScore: 10,
        testingEvidence: [],
        codeStructureScore: 10,
        codeStructureEvidence: [],
        ciCdScore: 10,
        ciCdEvidence: [],
        activityScore: 10,
        activityEvidence: [],
        dependencyHygieneScore: 10,
        dependencyEvidence: [],
        securityScore: 10,
        securityEvidence: [],
        totalScore: 70,
        rating: 'Strong',
        evaluatedAt: new Date().toISOString(),
      },
    }

    const skills = extractSkillsFromRepositories('user-test', [repoWithScore])
    const matrix = computeVerificationMatrix('user-test', skills, ['Rust', 'Cobol', 'Expert in distributed systems'])

    const rustClaim = matrix.claims.find((c) => c.claimText === 'Rust')
    assert.ok(rustClaim)
    assert.strictEqual(rustClaim.verificationStatus, 'VERIFIED')

    const cobolClaim = matrix.claims.find((c) => c.claimText === 'Cobol')
    assert.ok(cobolClaim)
    assert.strictEqual(cobolClaim.verificationStatus, 'UNVERIFIED')

    const distClaim = matrix.claims.find((c) => c.claimText.includes('distributed systems'))
    assert.ok(distClaim)
    assert.strictEqual(distClaim.verificationStatus, 'INSUFFICIENT_EVIDENCE')
  })
})
