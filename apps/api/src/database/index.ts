// apps/api/src/database/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Transactional Store & Data Models
// Provides persistence for users, imported repositories, calculated RQS scores,
// extracted skills, resume claims, and generated portfolio settings.
// ─────────────────────────────────────────────────────────────────────────────
export * from '@portfolio/types'
import {
  UserSession,
  RepositoryWithScore,
  SkillEvidenceItem,
  ResumeClaim,
  HiddenGemSkill,
  PortfolioConfig,
  ReferenceProfile,
  PortfolioStrategy,
} from '@portfolio/types'

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
