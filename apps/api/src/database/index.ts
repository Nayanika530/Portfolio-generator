// apps/api/src/database/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Transactional Store & Data Models
// Provides persistence for users, imported repositories, calculated RQS scores,
// extracted skills, resume claims, and generated portfolio settings.
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
  languages: Record<string, number> // e.g. { "TypeScript": 65, "Rust": 35 }
  commitCount: number
  lastPushedAt: string
  createdAt: string
  defaultBranch: string
  manifestsFound: string[] // e.g. ["package.json", "Dockerfile", ".github/workflows/ci.yml"]
  hasReadme: boolean
  hasLicense: boolean
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  hasSecurityPolicy: boolean
}

export interface RQSScoreBreakdown {
  documentationScore: number // Max 20
  documentationEvidence: string[]
  testingScore: number        // Max 20
  testingEvidence: string[]
  codeStructureScore: number  // Max 15
  codeStructureEvidence: string[]
  ciCdScore: number           // Max 15
  ciCdEvidence: string[]
  activityScore: number       // Max 10
  activityEvidence: string[]
  dependencyHygieneScore: number // Max 10
  dependencyEvidence: string[]
  securityScore: number       // Max 10
  securityEvidence: string[]
  totalScore: number          // Max 100
  rating: 'Exceptional' | 'Strong' | 'Moderate' | 'Needs Work'
  evaluatedAt: string
}

export interface RepositoryWithScore extends RepositoryMetadata {
  rqs: RQSScoreBreakdown
}

export interface SkillEvidenceItem {
  id: string
  userId: string
  skillName: string
  category: 'Languages' | 'Frameworks' | 'Cloud & DevOps' | 'Databases' | 'Security & Systems'
  confidencePercentage: number
  primaryRepositoryId: string
  primaryRepositoryName: string
  citations: Array<{
    repositoryName: string
    filePath: string
    lineRange?: string
    evidenceSnippet: string
  }>
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
    research: number     // 0.0 - 1.0
    projects: number     // 0.0 - 1.0
    experience: number   // 0.0 - 1.0
    education: number    // 0.0 - 1.0
    publications: number // 0.0 - 1.0
    skills: number       // 0.0 - 1.0
    certifications?: number
    securityAdvisories?: number
  }
  designCharacteristics: {
    minimalismScore: number // 0.0 - 1.0
    contentDensity: number   // 0.0 - 1.0
    technicalDepth: number   // 0.0 - 1.0
    visualEmphasis: number   // 0.0 - 1.0
    navigationStyle: 'single-page-scroll' | 'tabbed-telemetry' | 'minimal-dossier'
  }
  recommendedFor: string
  tags: string[]
}

export interface PortfolioStrategy {
  userId: string
  selectedReferenceIds: string[]
  blendedWeights: Record<string, number> // e.g. { "ref-sec-cert": 0.6, "ref-eng-faang": 0.4 }
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

// In-Memory Thread-Safe Data Store
class InMemoryDatabase {
  private sessions: Map<string, UserSession> = new Map()
  private repositories: Map<string, RepositoryWithScore[]> = new Map() // Keyed by userId
  private skills: Map<string, SkillEvidenceItem[]> = new Map() // Keyed by userId
  private resumeClaims: Map<string, ResumeClaim[]> = new Map() // Keyed by userId
  private hiddenGems: Map<string, HiddenGemSkill[]> = new Map() // Keyed by userId
  private portfolios: Map<string, PortfolioConfig> = new Map() // Keyed by userId
  private oauthTokens: Map<string, string> = new Map() // Keyed by sessionId (AES-encrypted in production)
  private references: Map<string, ReferenceProfile> = new Map()
  private strategies: Map<string, PortfolioStrategy> = new Map() // Keyed by userId

  // Session Methods
  saveSession(session: UserSession, token?: string): void {
    this.sessions.set(session.id, session)
    if (token) {
      this.oauthTokens.set(session.id, token)
    }
  }

  getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId)
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.oauthTokens.delete(sessionId)
  }

  // Repository Methods
  saveRepositories(userId: string, repos: RepositoryWithScore[]): void {
    this.repositories.set(userId, repos)
  }

  getRepositories(userId: string): RepositoryWithScore[] {
    return this.repositories.get(userId) || []
  }

  getRepository(userId: string, repoId: string): RepositoryWithScore | undefined {
    const userRepos = this.getRepositories(userId)
    return userRepos.find((r) => r.id === repoId)
  }

  // Skills Methods
  saveSkills(userId: string, skills: SkillEvidenceItem[]): void {
    this.skills.set(userId, skills)
  }

  getSkills(userId: string): SkillEvidenceItem[] {
    return this.skills.get(userId) || []
  }

  // Resume Claims & Hidden Gems
  saveResumeClaims(userId: string, claims: ResumeClaim[], hiddenGems: HiddenGemSkill[]): void {
    this.resumeClaims.set(userId, claims)
    this.hiddenGems.set(userId, hiddenGems)
  }

  getResumeClaims(userId: string): { claims: ResumeClaim[]; hiddenGems: HiddenGemSkill[] } {
    return {
      claims: this.resumeClaims.get(userId) || [],
      hiddenGems: this.hiddenGems.get(userId) || [],
    }
  }

  // Portfolio Config
  savePortfolioConfig(config: PortfolioConfig): void {
    this.portfolios.set(config.userId, config)
  }

  getPortfolioConfig(userId: string): PortfolioConfig | undefined {
    return this.portfolios.get(userId)
  }

  // Reference Library Methods
  saveReferenceProfile(ref: ReferenceProfile): void {
    this.references.set(ref.id, ref)
  }

  getReferences(category?: string, tag?: string): ReferenceProfile[] {
    let list = Array.from(this.references.values())
    if (category) {
      list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase())
    }
    if (tag) {
      list = list.filter((r) => r.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()))
    }
    return list
  }

  getReference(id: string): ReferenceProfile | undefined {
    return this.references.get(id)
  }

  // Portfolio Strategy Methods
  saveStrategy(strategy: PortfolioStrategy): void {
    this.strategies.set(strategy.userId, strategy)
  }

  getStrategy(userId: string): PortfolioStrategy | undefined {
    return this.strategies.get(userId)
  }
}

export const db = new InMemoryDatabase()
