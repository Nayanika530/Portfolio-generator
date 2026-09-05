// apps/web/src/App.tsx
import { useState, useEffect } from 'react'
import {
  UserSession,
  RepositoryWithScore,
  SkillEvidenceItem,
  ResumeClaim,
  HiddenGemSkill,
  PortfolioConfig,
  ReferenceProfile,
  PortfolioStrategy,
  StrategyRecommendation,
} from './types'
import { api } from './services/api'
import { DashboardView } from './components/DashboardView'
import { SkillEvidenceView } from './components/SkillEvidenceView'
import { ResumeVerificationView } from './components/ResumeVerificationView'
import { PortfolioBuilderView } from './components/PortfolioBuilderView'
import { PortfolioIntelligenceView } from './components/PortfolioIntelligenceView'
import {
  LayoutDashboard,
  ShieldCheck,
  FileCheck2,
  Globe,
  Github,
  Terminal,
  LogOut,
  RefreshCw,
  Sparkles,
  BookOpen,
} from 'lucide-react'

export function App() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [repos, setRepos] = useState<RepositoryWithScore[]>([])
  const [skills, setSkills] = useState<SkillEvidenceItem[]>([])
  const [claims, setClaims] = useState<ResumeClaim[]>([])
  const [hiddenGems, setHiddenGems] = useState<HiddenGemSkill[]>([])
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig | null>(null)
  const [references, setReferences] = useState<ReferenceProfile[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [strategy, setStrategy] = useState<PortfolioStrategy | null>(null)
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'intelligence' | 'skills' | 'resume' | 'portfolio'>('dashboard')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

  // Initialize session and data
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true)
      try {
        const sessionData = await api.getSession()
        if (sessionData && sessionData.session) {
          setSession(sessionData.session)
          await loadAllData()
        } else {
          // Auto-connect with demo developer session for instant out-of-the-box demonstration
          await handleDemoConnect()
        }
      } catch (err) {
        console.error('Failed to initialize session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initApp()
  }, [])

  const loadAllData = async () => {
    try {
      const [
        reposRes,
        skillsRes,
        matrixRes,
        configRes,
        refsRes,
        catsRes,
        stratRes,
        recRes,
      ] = await Promise.allSettled([
        api.getRepositories(),
        api.getSkills(),
        api.getResumeMatrix(),
        api.getPortfolioConfig(),
        api.getReferences(),
        api.getReferenceCategories(),
        api.getPortfolioStrategy(),
        api.getStrategyRecommendations(),
      ])

      if (reposRes.status === 'fulfilled' && reposRes.value?.repos) {
        setRepos(reposRes.value.repos)
      }
      if (skillsRes.status === 'fulfilled' && skillsRes.value?.skills) {
        setSkills(skillsRes.value.skills)
      }
      if (matrixRes.status === 'fulfilled' && matrixRes.value) {
        setClaims(matrixRes.value.claims || [])
        setHiddenGems(matrixRes.value.hiddenGems || [])
      }
      if (configRes.status === 'fulfilled' && configRes.value?.config) {
        setPortfolioConfig(configRes.value.config)
      }
      if (refsRes.status === 'fulfilled' && refsRes.value?.references) {
        setReferences(refsRes.value.references)
      }
      if (catsRes.status === 'fulfilled' && catsRes.value?.categories) {
        setCategories(catsRes.value.categories)
      }
      if (stratRes.status === 'fulfilled' && stratRes.value?.strategy) {
        setStrategy(stratRes.value.strategy)
      }
      if (recRes.status === 'fulfilled' && recRes.value?.recommendation) {
        setRecommendation(recRes.value.recommendation)
      }
    } catch (err) {
      console.error('Failed to load portfolio intelligence data:', err)
    }
  }

  const handleDemoConnect = async () => {
    setIsLoggingIn(true)
    try {
      const data = await api.loginDemo()
      setSession(data.session)
      await loadAllData()
    } catch (err) {
      console.error('Connect failed:', err)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSyncRepositories = async () => {
    const res = await api.syncRepositories()
    setRepos(res.repos)
    const skillsRes = await api.getSkills()
    setSkills(skillsRes.skills)
    const recRes = await api.getStrategyRecommendations()
    setRecommendation(recRes.recommendation)
  }

  const handleAddResumeClaim = async (claimText: string) => {
    const currentClaims = claims.map(c => c.claimText)
    const updatedClaims = [...currentClaims, claimText]
    const res = await api.analyzeResume(updatedClaims)
    setClaims(res.claims)
    setHiddenGems(res.hiddenGems)
  }

  const handleUpdatePortfolioConfig = async (updates: Partial<PortfolioConfig>) => {
    const res = await api.updatePortfolioConfig(updates)
    setPortfolioConfig(res.config)
  }

  const handleUpdateStrategy = async (selectedIds: string[], weights?: Record<string, number>) => {
    const res = await api.updatePortfolioStrategy(selectedIds, weights)
    setStrategy(res.strategy)
  }

  const handleDeployPortfolio = async () => {
    const res = await api.deployPortfolio()
    if (portfolioConfig) {
      setPortfolioConfig({
        ...portfolioConfig,
        isPublished: true,
        deployedUrl: res.deployedUrl,
        lastDeployedAt: res.deployedAt,
      })
    }
    return res
  }

  const handleLogout = async () => {
    await api.logout()
    setSession(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-mono">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm font-semibold">Initializing Portfolio Intelligence Pipeline...</p>
        <p className="text-xs text-slate-500 mt-1">Grounding AST analysis, strategy models, and session vault</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ── Top Navigation Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base">Portfolio Intelligence</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                  v2.5 PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Institutional Reference Intelligence & RQS
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          {session ? (
            <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">GitHub & RQS</span>
              </button>

              <button
                onClick={() => setActiveTab('intelligence')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'intelligence'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Portfolio Intelligence</span>
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'skills'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Skill Evidence</span>
              </button>

              <button
                onClick={() => setActiveTab('resume')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'resume'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Resume Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Portfolio Studio</span>
              </button>
            </nav>
          ) : null}

          {/* Right Action: Connect or Session Profile */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right font-mono">
                  <span className="text-xs font-semibold text-white">{session.displayName}</span>
                  <span className="text-[10px] text-cyan-400">SESSION_ACTIVE</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleDemoConnect}
                disabled={isLoggingIn}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg hover:shadow-cyan-400/25 transition-all"
              >
                <Github className="w-4 h-4 text-slate-950" />
                <span>Connect GitHub</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6">
        {!session ? (
          <div className="py-20 text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Sparkles className="w-3.5 h-3.5" />
              Not a Generic AI Wrapper
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Evidence-Grounded Developer Intelligence
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Ingest your GitHub repositories, compute transparent 7-pillar Repository Quality Scores (RQS), cross-verify resume claims against concrete code artifacts, and synthesize institutional portfolio strategies.
            </p>
            <div>
              <button
                onClick={handleDemoConnect}
                disabled={isLoggingIn}
                className="px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm font-mono shadow-xl hover:shadow-cyan-400/30 transition-all inline-flex items-center gap-2.5"
              >
                <Github className="w-5 h-5" />
                <span>Connect GitHub & Ingest Repositories</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                session={session}
                repos={repos}
                skills={skills}
                onSync={handleSyncRepositories}
              />
            )}

            {activeTab === 'intelligence' && (
              <PortfolioIntelligenceView
                references={references}
                categories={categories}
                currentStrategy={strategy}
                recommendation={recommendation}
                onUpdateStrategy={handleUpdateStrategy}
                onNavigateToStudio={() => setActiveTab('portfolio')}
              />
            )}

            {activeTab === 'skills' && (
              <SkillEvidenceView skills={skills} />
            )}

            {activeTab === 'resume' && (
              <ResumeVerificationView
                claims={claims}
                hiddenGems={hiddenGems}
                onAddClaim={handleAddResumeClaim}
              />
            )}

            {activeTab === 'portfolio' && portfolioConfig && (
              <PortfolioBuilderView
                config={portfolioConfig}
                onUpdateConfig={handleUpdatePortfolioConfig}
                onDeploy={handleDeployPortfolio}
                previewUrl={api.getPreviewUrl()}
              />
            )}
          </>
        )}
      </main>

      {/* ── Global Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ARCHITECTURE: MODULAR MONOLITH (APPS/WEB + APPS/API)</span>
          </div>
          <div>INSTITUTIONAL REFERENCE INTELLIGENCE • ZERO SCRAPED CONTENT</div>
        </div>
      </footer>
    </div>
  )
}

export default App
