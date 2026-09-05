// apps/web/src/components/DashboardView.tsx
import React, { useState } from 'react'
import { RepositoryWithScore, SkillEvidenceItem, UserSession } from '../types'
import { RqsModal } from './RqsModal'
import {
  FolderGit2,
  GitCommit,
  Sparkles,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

interface DashboardViewProps {
  session: UserSession
  repos: RepositoryWithScore[]
  skills: SkillEvidenceItem[]
  onSync: () => Promise<void>
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  session,
  repos,
  skills,
  onSync,
}) => {
  const [selectedRepo, setSelectedRepo] = useState<RepositoryWithScore | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncClick = async () => {
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
  }

  // Calculate high-level summary metrics
  const totalCommits = repos.reduce((acc, r) => acc + r.commitCount, 0)
  const avgRqs = repos.length > 0
    ? Math.round(repos.reduce((acc, r) => acc + r.rqs.totalScore, 0) / repos.length)
    : 0

  return (
    <div className="space-y-8">
      {/* ── User Overview & Telemetry Bar ─────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={session.avatarUrl}
              alt={session.displayName}
              className="w-16 h-16 rounded-2xl border-2 border-cyan-400/40 object-cover shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">{session.displayName}</h2>
                {session.isDemoUser ? (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    DEMO DATA (SYNTHESIZED PROFILE)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE GITHUB VERIFIED
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">{session.bio}</p>
            </div>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            {isSyncing ? 'Re-analyzing ASTs...' : 'Re-sync & Analyze GitHub'}
          </button>
        </div>
      </div>

      {/* ── Metrics Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Repositories</span>
            <FolderGit2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">{repos.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">100% Ingested & Evaluated</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Contributions</span>
            <GitCommit className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">{totalCommits}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified Commit History</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Proven Skills</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-indigo-400">{skills.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">With File Citations</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Avg Quality (RQS)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{avgRqs} / 100</div>
          <div className="text-[11px] text-slate-500 mt-1">Deterministic Formula</div>
        </div>
      </div>

      {/* ── Ranked Repository Intelligence Table ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Ranked Technical Projects</h3>
            <p className="text-xs text-slate-400 font-mono">Ranked by deterministic Repository Quality Score (RQS)</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/40">
            Click any row to inspect 7-pillar evidence breakdown
          </span>
        </div>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Repository</th>
                  <th className="py-3.5 px-4">Primary Stack</th>
                  <th className="py-3.5 px-4">Architecture Signals</th>
                  <th className="py-3.5 px-4">Commits</th>
                  <th className="py-3.5 px-4">RQS Score</th>
                  <th className="py-3.5 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {repos.map(repo => {
                  const score = repo.rqs.totalScore
                  return (
                    <tr
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                          {repo.name}
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
                        </div>
                        <div className="text-slate-400 font-sans text-xs line-clamp-1 mt-0.5">
                          {repo.description}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {repo.primaryLanguage}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {repo.hasTests && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Tests
                            </span>
                          )}
                          {repo.hasCi && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-sky-950 text-sky-400 border border-sky-800">
                              CI/CD
                            </span>
                          )}
                          {repo.hasDocker && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                              Docker
                            </span>
                          )}
                          {repo.hasSecurityPolicy && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-rose-950 text-rose-400 border border-rose-800">
                              SecPolicy
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {repo.commitCount} commits
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              score >= 85
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : score >= 70
                                ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                                : 'bg-amber-950 text-amber-400 border-amber-800'
                            }`}
                          >
                            RQS {score}
                          </span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            [{repo.rqs.rating}]
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 text-xs">
                          Inspect <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Security Architecture Highlights ─────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white">Platform Security Controls Enforced</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              OAuth PKCE verification • Server-side HttpOnly session vault • Zero client token storage • Strict CSP headers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Threat Model Compliant</span>
        </div>
      </div>

      {/* RQS Modal */}
      {selectedRepo && (
        <RqsModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
      )}
    </div>
  )
}
