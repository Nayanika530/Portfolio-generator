// packages/types/src/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared Domain Models for Portfolio Intelligence Platform
// Consumed by both apps/web (frontend) and apps/api (backend)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSession {
  id: string
  githubUserId: string
  username: string
  displayName: string
  avatarUrl: string
  bio: string
  createdAt: string
  lastActiveAt: string
  isDemoUser: boolean
}

export interface RepositoryMetadata {
  id: string
  userId: string
  name: string
  fullName: string
  description: string
  isPrivate: boolean
  isFork: boolean
  stars: number
  forks: number
  openIssues: number
  primaryLanguage: string
  languages: Record<string, number>
  commitCount: number
  lastPushedAt: string
  createdAt: string
  defaultBranch: string
  manifestsFound: string[]
  hasReadme: boolean
  hasLicense: boolean
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  hasSecurityPolicy: boolean
}

export interface RQSScoreBreakdown {
  documentationScore: number
  documentationEvidence: string[]
  testingScore: number
  testingEvidence: string[]
  codeStructureScore: number
  codeStructureEvidence: string[]
  ciCdScore: number
  ciCdEvidence: string[]
  activityScore: number
  activityEvidence: string[]
  dependencyHygieneScore: number
  dependencyEvidence: string[]
  securityScore: number
  securityEvidence: string[]
  totalScore: number
  rating: 'Exceptional' | 'Strong' | 'Moderate' | 'Needs Work'
  evaluatedAt: string
}

export interface RepositoryWithScore extends RepositoryMetadata {
  rqs: RQSScoreBreakdown
}

export interface SkillCitation {
  repositoryName: string
  filePath: string
  lineRange?: string
  evidenceSnippet: string
}

export interface SkillEvidenceItem {
  id: string
  userId: string
  skillName: string
  category: 'Languages' | 'Frameworks' | 'Cloud & DevOps' | 'Databases' | 'Security & Systems'
  confidencePercentage: number
  primaryRepositoryId: string
  primaryRepositoryName: string
  citations: SkillCitation[]
  verifiedInCode: boolean
}

export interface ResumeClaim {
  id: string
  userId: string
  claimText: string
  category: string
  statedProficiency?: string
  verificationStatus: 'VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED'
  matchedSkillId?: string
  evidenceSummary?: string
  confidenceScore: number
}

export interface HiddenGemSkill {
  skillName: string
  category: string
  foundInRepo: string
  evidenceCitation: string
  reason: string
}

export interface PortfolioConfig {
  userId: string
  slug: string
  customDomain?: string
  templateId: 'minimal-engineer' | 'cybersecurity-systems'
  headline: string
  summaryBio: string
  selectedRepoIds: string[]
  showVerificationBadges: boolean
  showRqsScores: boolean
  contactEmail: string
  linkedinUrl?: string
  twitterUrl?: string
  isPublished: boolean
  deployedUrl?: string
  lastDeployedAt?: string
}

export interface ReferenceProfile {
  id: string
  name: string
  institutionArchetype: string
  category:
    | 'Research Institution'
    | 'Software Engineering'
    | 'Cybersecurity'
    | 'Systems & Infrastructure'
    | 'Academic'
    | 'Open Source'
    | 'Creative Technologist'
    | 'AI & Machine Learning'
  profileType: string
  description: string
  sectionStructure: string[]
  contentPriorities: {
    research: number
    projects: number
    experience: number
    education: number
    publications: number
    skills: number
    certifications?: number
    securityAdvisories?: number
  }
  designCharacteristics: {
    minimalismScore: number
    contentDensity: number
    technicalDepth: number
    visualEmphasis: number
    navigationStyle: 'single-page-scroll' | 'tabbed-telemetry' | 'minimal-dossier'
  }
  recommendedFor: string
  tags: string[]
}

export interface PortfolioStrategy {
  userId: string
  selectedReferenceIds: string[]
  blendedWeights: Record<string, number>
  sectionsToInclude: string[]
  sectionsToExclude: string[]
  sectionOrdering: string[]
  contentPriorities: {
    research: number
    projects: number
    experience: number
    education: number
    publications: number
    skills: number
    certifications?: number
    securityAdvisories?: number
  }
  technicalDepth: number
  visualDensity: number
  minimalismScore: number
  navigationStyle: 'single-page-scroll' | 'tabbed-telemetry' | 'minimal-dossier'
  explainabilityRationale: string[]
  updatedAt: string
}

export interface StrategyRecommendation {
  primaryReferenceId: string
  secondaryReferenceId?: string
  confidenceMatchPercentage: number
  matchingSignals: string[]
  recommendedWeights: Record<string, number>
}
