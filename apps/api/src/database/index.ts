// apps/api/src/database/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Transactional Persistent Store & Data Models
// Provides file-backed persistence for users, imported repositories,
// calculated RQS scores, extracted skills, resume claims, reference templates,
// and generated portfolio settings across server restarts.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import path from 'node:path'

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

export interface DatabaseSnapshot {
  sessions: [string, UserSession][]
  repositories: [string, RepositoryWithScore[]][]
  skills: [string, SkillEvidenceItem[]][]
  resumeClaims: [string, ResumeClaim[]][]
  hiddenGems: [string, HiddenGemSkill[]][]
  portfolios: [string, PortfolioConfig][]
  oauthTokens: [string, string][]
  references: [string, ReferenceProfile][]
  strategies: [string, PortfolioStrategy][]
}

export interface IStorageAdapter {
  load(): DatabaseSnapshot | null
  save(snapshot: DatabaseSnapshot): void
}

/**
 * Atomic file-backed storage adapter.
 * Writes to a temporary file before atomic rename to prevent corruption.
 */
export class FileStorageAdapter implements IStorageAdapter {
  private filePath: string

  constructor(filePath?: string) {
    this.filePath = filePath || process.env.DATA_STORE_PATH || path.resolve(process.cwd(), 'data', 'portfolio-store.json')
  }

  load(): DatabaseSnapshot | null {
    try {
      if (!fs.existsSync(this.filePath)) {
        return null
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      if (!raw || !raw.trim()) {
        return null
      }
      return JSON.parse(raw) as DatabaseSnapshot
    } catch (err) {
      console.warn(`[FileStorageAdapter] Could not load state from ${this.filePath}:`, (err as Error).message)
      return null
    }
  }

  save(snapshot: DatabaseSnapshot): void {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const serialized = JSON.stringify(snapshot, null, 2)
      try {
        const tmpPath = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`
        fs.writeFileSync(tmpPath, serialized, 'utf-8')
        fs.renameSync(tmpPath, this.filePath)
      } catch {
        fs.writeFileSync(this.filePath, serialized, 'utf-8')
      }
    } catch (err) {
      console.error(`[FileStorageAdapter] Failed to persist state to ${this.filePath}:`, (err as Error).message)
    }
  }
}

/**
 * Memory-cached, storage-persisted Database.
 * Read operations are zero-latency Map lookups.
 * Write operations update the cache and synchronously/safely persist via the storage adapter.
 */
export class PersistentDatabase {
  private adapter: IStorageAdapter
  private sessions: Map<string, UserSession> = new Map()
  private repositories: Map<string, RepositoryWithScore[]> = new Map()
  private skills: Map<string, SkillEvidenceItem[]> = new Map()
  private resumeClaims: Map<string, ResumeClaim[]> = new Map()
  private hiddenGems: Map<string, HiddenGemSkill[]> = new Map()
  private portfolios: Map<string, PortfolioConfig> = new Map()
  private oauthTokens: Map<string, string> = new Map()
  private references: Map<string, ReferenceProfile> = new Map()
  private strategies: Map<string, PortfolioStrategy> = new Map()

  constructor(adapter?: IStorageAdapter) {
    this.adapter = adapter || new FileStorageAdapter()
    this.loadInitialSnapshot()
  }

  private loadInitialSnapshot(): void {
    const snapshot = this.adapter.load()
    if (!snapshot) return

    if (Array.isArray(snapshot.sessions)) this.sessions = new Map(snapshot.sessions)
    if (Array.isArray(snapshot.repositories)) this.repositories = new Map(snapshot.repositories)
    if (Array.isArray(snapshot.skills)) this.skills = new Map(snapshot.skills)
    if (Array.isArray(snapshot.resumeClaims)) this.resumeClaims = new Map(snapshot.resumeClaims)
    if (Array.isArray(snapshot.hiddenGems)) this.hiddenGems = new Map(snapshot.hiddenGems)
    if (Array.isArray(snapshot.portfolios)) this.portfolios = new Map(snapshot.portfolios)
    if (Array.isArray(snapshot.oauthTokens)) this.oauthTokens = new Map(snapshot.oauthTokens)
    if (Array.isArray(snapshot.references)) this.references = new Map(snapshot.references)
    if (Array.isArray(snapshot.strategies)) this.strategies = new Map(snapshot.strategies)
  }

  public persist(): void {
    const snapshot: DatabaseSnapshot = {
      sessions: Array.from(this.sessions.entries()),
      repositories: Array.from(this.repositories.entries()),
      skills: Array.from(this.skills.entries()),
      resumeClaims: Array.from(this.resumeClaims.entries()),
      hiddenGems: Array.from(this.hiddenGems.entries()),
      portfolios: Array.from(this.portfolios.entries()),
      oauthTokens: Array.from(this.oauthTokens.entries()),
      references: Array.from(this.references.entries()),
      strategies: Array.from(this.strategies.entries()),
    }
    this.adapter.save(snapshot)
  }

  // Session Methods
  saveSession(session: UserSession, token?: string): void {
    this.sessions.set(session.id, session)
    if (token) {
      this.oauthTokens.set(session.id, token)
    }
    this.persist()
  }

  getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId)
  }

  getOAuthToken(sessionId: string): string | undefined {
    return this.oauthTokens.get(sessionId)
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.oauthTokens.delete(sessionId)
    this.persist()
  }

  // Repository Methods
  saveRepositories(userId: string, repos: RepositoryWithScore[]): void {
    this.repositories.set(userId, repos)
    this.persist()
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
    this.persist()
  }

  getSkills(userId: string): SkillEvidenceItem[] {
    return this.skills.get(userId) || []
  }

  // Resume Claims & Hidden Gems
  saveResumeClaims(userId: string, claims: ResumeClaim[], hiddenGems: HiddenGemSkill[]): void {
    this.resumeClaims.set(userId, claims)
    this.hiddenGems.set(userId, hiddenGems)
    this.persist()
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
    this.persist()
  }

  getPortfolioConfig(userId: string): PortfolioConfig | undefined {
    return this.portfolios.get(userId)
  }

  // Reference Library Methods
  saveReferenceProfile(ref: ReferenceProfile): void {
    this.references.set(ref.id, ref)
    this.persist()
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
    this.persist()
  }

  getStrategy(userId: string): PortfolioStrategy | undefined {
    return this.strategies.get(userId)
  }

  /**
   * Helper for tests or resets
   */
  clearAll(): void {
    this.sessions.clear()
    this.repositories.clear()
    this.skills.clear()
    this.resumeClaims.clear()
    this.hiddenGems.clear()
    this.portfolios.clear()
    this.oauthTokens.clear()
    this.references.clear()
    this.strategies.clear()
    this.persist()
  }
}

export const db = new PersistentDatabase()
