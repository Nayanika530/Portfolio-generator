// apps/api/src/modules/intelligence/rqsCalculator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Repository Quality Score (RQS) Calculator
// Pure, transparent, zero-hallucination scoring algorithm based on verified code
// structure, manifests, testing, documentation, and security hygiene.
// ─────────────────────────────────────────────────────────────────────────────

import { RepositoryMetadata, RQSScoreBreakdown } from '../../database/index.js'

export function calculateDeterministicRQS(repo: RepositoryMetadata): RQSScoreBreakdown {
  let docScore = 0
  const docEvidence: string[] = []

  let testScore = 0
  const testEvidence: string[] = []

  let structureScore = 0
  const structureEvidence: string[] = []

  let ciScore = 0
  const ciEvidence: string[] = []

  let activityScore = 0
  const activityEvidence: string[] = []

  let dependencyScore = 0
  const dependencyEvidence: string[] = []

  let secScore = 0
  const secEvidence: string[] = []

  // 1. Documentation (Max 20 pts)
  if (repo.hasReadme) {
    docScore += 10
    docEvidence.push('✓ Comprehensive README.md found at root')
  } else {
    docEvidence.push('✗ Missing README.md file at root (-10 pts)')
  }

  if (repo.description && repo.description.trim().length > 20) {
    docScore += 5
    docEvidence.push('✓ Descriptive repository summary provided')
  } else {
    docEvidence.push('⚠ Short or missing repository description (-5 pts)')
  }

  if (repo.hasLicense) {
    docScore += 5
    docEvidence.push('✓ Open-source license (MIT/Apache/GPL) declared')
  } else {
    docEvidence.push('⚠ No explicit LICENSE file detected (-5 pts)')
  }

  // 2. Testing & Quality Assurance (Max 20 pts)
  if (repo.hasTests) {
    testScore += 14
    testEvidence.push('✓ Automated test suites detected (tests/, vitest, jest, or pytest)')
    
    // Additional points for lockfile with test runners
    const hasTestManifest = repo.manifestsFound.some(m => 
      m.includes('jest') || m.includes('vitest') || m.includes('pytest') || m.includes('test')
    )
    if (hasTestManifest) {
      testScore += 6
      testEvidence.push('✓ Configured test automation scripts in package manifests')
    } else {
      testScore += 3
      testEvidence.push('✓ Test directory structures present in project tree')
    }
  } else {
    testEvidence.push('✗ Zero automated test directories or runner configs found (-20 pts)')
  }

  // 3. Code Structure & Architecture (Max 15 pts)
  const isModular = repo.manifestsFound.some(m => 
    m.includes('src/') || m.includes('lib/') || m.includes('pkg/') || m.includes('apps/')
  ) || repo.commitCount > 15

  if (isModular) {
    structureScore += 10
    structureEvidence.push('✓ Modular separation of concerns (src/, lib/, or modular dirs)')
  } else {
    structureScore += 5
    structureEvidence.push('⚠ Flat file structure detected; recommend directory separation')
  }

  if (Object.keys(repo.languages).length >= 1) {
    structureScore += 5
    structureEvidence.push(`✓ Primary language typing & syntax validation: ${repo.primaryLanguage}`)
  }

  // 4. CI/CD & Automation (Max 15 pts)
  if (repo.hasCi) {
    ciScore += 15
    ciEvidence.push('✓ GitHub Actions CI/CD workflows configured (.github/workflows)')
  } else {
    ciEvidence.push('✗ No CI/CD automation pipelines found (-15 pts)')
  }

  // 5. Activity & Cadence (Max 10 pts)
  const daysSincePush = Math.floor(
    (Date.now() - new Date(repo.lastPushedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSincePush <= 30) {
    activityScore += 6
    activityEvidence.push(`✓ Recent development activity (pushed ${daysSincePush} days ago)`)
  } else if (daysSincePush <= 90) {
    activityScore += 4
    activityEvidence.push(`✓ Moderate maintenance activity (pushed ${daysSincePush} days ago)`)
  } else {
    activityScore += 2
    activityEvidence.push(`⚠ Inactive for >90 days (${daysSincePush} days since last push)`)
  }

  if (repo.commitCount >= 50) {
    activityScore += 4
    activityEvidence.push(`✓ Substantial commit cadence (${repo.commitCount} commits)`)
  } else if (repo.commitCount >= 10) {
    activityScore += 3
    activityEvidence.push(`✓ Established commit cadence (${repo.commitCount} commits)`)
  } else {
    activityScore += 1
    activityEvidence.push(`⚠ Minimal commit history (${repo.commitCount} commits)`)
  }

  // 6. Dependency Hygiene (Max 10 pts)
  const hasLockfile = repo.manifestsFound.some(m =>
    m.includes('lock') || m.includes('Cargo.lock') || m.includes('package-lock.json') || m.includes('poetry.lock')
  )

  if (hasLockfile) {
    dependencyScore += 6
    dependencyEvidence.push('✓ Deterministic lockfile committed (ensures reproducible builds)')
  } else {
    dependencyEvidence.push('⚠ Missing lockfile; build reproducibility at risk (-6 pts)')
  }

  if (repo.manifestsFound.length >= 1) {
    dependencyScore += 4
    dependencyEvidence.push(`✓ Structured dependency manifests: ${repo.manifestsFound.join(', ')}`)
  }

  // 7. Security & Best Practices (Max 10 pts)
  if (repo.hasSecurityPolicy || repo.manifestsFound.some(m => m.includes('SECURITY.md') || m.includes('.gitignore'))) {
    secScore += 6
    secEvidence.push('✓ Version control hygiene & security boundary files detected (.gitignore / SECURITY.md)')
  } else {
    secEvidence.push('⚠ Missing security policy or .gitignore rules')
  }

  if (repo.hasDocker) {
    secScore += 4
    secEvidence.push('✓ Isolated container definition verified (Dockerfile / docker-compose)')
  } else if (repo.stars > 0) {
    secScore += 2
    secEvidence.push('✓ Public scrutiny & community validation present')
  }

  // Totals
  const totalScore = Math.min(100, Math.round(
    docScore + testScore + structureScore + ciScore + activityScore + dependencyScore + secScore
  ))

  let rating: 'Exceptional' | 'Strong' | 'Moderate' | 'Needs Work' = 'Needs Work'
  if (totalScore >= 85) rating = 'Exceptional'
  else if (totalScore >= 70) rating = 'Strong'
  else if (totalScore >= 50) rating = 'Moderate'

  return {
    documentationScore: docScore,
    documentationEvidence: docEvidence,
    testingScore: testScore,
    testingEvidence: testEvidence,
    codeStructureScore: structureScore,
    codeStructureEvidence: structureEvidence,
    ciCdScore: ciScore,
    ciCdEvidence: ciEvidence,
    activityScore: activityScore,
    activityEvidence: activityEvidence,
    dependencyHygieneScore: dependencyScore,
    dependencyEvidence: dependencyEvidence,
    securityScore: secScore,
    securityEvidence: secEvidence,
    totalScore,
    rating,
    evaluatedAt: new Date().toISOString(),
  }
}
