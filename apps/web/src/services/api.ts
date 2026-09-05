// apps/web/src/services/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client API Service for Portfolio Intelligence Platform
// ─────────────────────────────────────────────────────────────────────────────

import {
  PortfolioConfig,
  PortfolioStrategy,
  ReferenceProfile,
  RepositoryWithScore,
  ResumeClaim,
  HiddenGemSkill,
  SkillEvidenceItem,
  StrategyRecommendation,
  UserSession,
} from '../types'

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
const API_BASE = envApiUrl ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/+$/, '')}/api`) : '/api'

function getSessionHeader(): HeadersInit {
  const sessionId = sessionStorage.getItem('portfolio_session_id')
  return sessionId ? { 'x-session-id': sessionId } : {}
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`)
    return res.json()
  },

  async loginDemo(): Promise<{ session: UserSession; sessionId: string }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Demo login failed')
    const data = await res.json()
    if (data.sessionId) {
      sessionStorage.setItem('portfolio_session_id', data.sessionId)
    }
    return data
  },

  async getSession(): Promise<{ session: UserSession } | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getSessionHeader(),
        credentials: 'include',
      })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getSessionHeader(),
      credentials: 'include',
    })
    sessionStorage.removeItem('portfolio_session_id')
  },

  async getRepositories(): Promise<{ repos: RepositoryWithScore[] }> {
    const res = await fetch(`${API_BASE}/github/repos`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch repositories')
    return res.json()
  },

  async syncRepositories(): Promise<{ repos: RepositoryWithScore[] }> {
    const res = await fetch(`${API_BASE}/github/sync`, {
      method: 'POST',
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to sync repositories')
    return res.json()
  },

  async getRqsDetails(repoId: string): Promise<{ repo: RepositoryWithScore }> {
    const res = await fetch(`${API_BASE}/intelligence/rqs/${repoId}`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch RQS details')
    return res.json()
  },

  async getSkills(): Promise<{ skills: SkillEvidenceItem[] }> {
    const res = await fetch(`${API_BASE}/skills/evidence`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch skills')
    return res.json()
  },

  async getResumeMatrix(): Promise<{ claims: ResumeClaim[]; hiddenGems: HiddenGemSkill[] }> {
    const res = await fetch(`${API_BASE}/resume/matrix`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch resume matrix')
    return res.json()
  },

  async analyzeResume(resumeClaims: string[]): Promise<{ claims: ResumeClaim[]; hiddenGems: HiddenGemSkill[] }> {
    const res = await fetch(`${API_BASE}/resume/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getSessionHeader(),
      },
      credentials: 'include',
      body: JSON.stringify({ resumeClaims }),
    })
    if (!res.ok) throw new Error('Failed to analyze resume')
    return res.json()
  },

  async getPortfolioConfig(): Promise<{ config: PortfolioConfig }> {
    const res = await fetch(`${API_BASE}/portfolio/config`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch portfolio config')
    return res.json()
  },

  async updatePortfolioConfig(updates: Partial<PortfolioConfig>): Promise<{ config: PortfolioConfig }> {
    const res = await fetch(`${API_BASE}/portfolio/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getSessionHeader(),
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update portfolio config')
    return res.json()
  },

  getPreviewUrl(): string {
    return `${API_BASE}/portfolio/preview`
  },

  async deployPortfolio(): Promise<{ success: boolean; deployedUrl: string; deployedAt: string }> {
    const res = await fetch(`${API_BASE}/portfolio/deploy`, {
      method: 'POST',
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to deploy portfolio')
    return res.json()
  },

  async getReferences(category?: string, tag?: string): Promise<{ references: ReferenceProfile[] }> {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.append('category', category)
    if (tag) params.append('tag', tag)
    const url = `${API_BASE}/references${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch references')
    return res.json()
  },

  async getReferenceCategories(): Promise<{ categories: string[] }> {
    const res = await fetch(`${API_BASE}/references/categories`)
    if (!res.ok) throw new Error('Failed to fetch reference categories')
    return res.json()
  },

  async getPortfolioStrategy(): Promise<{ strategy: PortfolioStrategy }> {
    const res = await fetch(`${API_BASE}/portfolio/strategy`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch portfolio strategy')
    return res.json()
  },

  async updatePortfolioStrategy(
    selectedReferenceIds: string[],
    customWeights?: Record<string, number>
  ): Promise<{ strategy: PortfolioStrategy }> {
    const res = await fetch(`${API_BASE}/portfolio/strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getSessionHeader(),
      },
      credentials: 'include',
      body: JSON.stringify({ selectedReferenceIds, customWeights }),
    })
    if (!res.ok) throw new Error('Failed to update portfolio strategy')
    return res.json()
  },

  async getStrategyRecommendations(): Promise<{ recommendation: StrategyRecommendation }> {
    const res = await fetch(`${API_BASE}/portfolio/strategy/recommendations`, {
      headers: getSessionHeader(),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch strategy recommendations')
    return res.json()
  },
}

