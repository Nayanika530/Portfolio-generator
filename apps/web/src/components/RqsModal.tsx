// apps/web/src/components/RqsModal.tsx
import React from 'react'
import { RepositoryWithScore } from '../types'
import { X, ShieldCheck, FileText, CheckCircle2, GitBranch, Cpu, Clock, PackageCheck } from 'lucide-react'

interface RqsModalProps {
  repo: RepositoryWithScore
  onClose: () => void
}

export const RqsModal: React.FC<RqsModalProps> = ({ repo, onClose }) => {
  const { rqs } = repo

  const categories = [
    {
      title: 'Documentation',
      score: rqs.documentationScore,
      max: 20,
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      evidence: rqs.documentationEvidence,
    },
    {
      title: 'Testing & QA',
      score: rqs.testingScore,
      max: 20,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      evidence: rqs.testingEvidence,
    },
    {
      title: 'Code Structure',
      score: rqs.codeStructureScore,
      max: 15,
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      evidence: rqs.codeStructureEvidence,
    },
    {
      title: 'CI/CD Automation',
      score: rqs.ciCdScore,
      max: 15,
      icon: <GitBranch className="w-4 h-4 text-sky-400" />,
      evidence: rqs.ciCdEvidence,
    },
    {
      title: 'Activity & Cadence',
      score: rqs.activityScore,
      max: 10,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      evidence: rqs.activityEvidence,
    },
    {
      title: 'Dependency Hygiene',
      score: rqs.dependencyHygieneScore,
      max: 10,
      icon: <PackageCheck className="w-4 h-4 text-purple-400" />,
      evidence: rqs.dependencyEvidence,
    },
    {
      title: 'Security & Best Practices',
      score: rqs.securityScore,
      max: 10,
      icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
      evidence: rqs.securityEvidence,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{repo.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                RQS {rqs.totalScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">{repo.fullName} • Evaluated deterministically</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Rating</div>
              <div className="text-base font-bold text-emerald-400">{rqs.rating}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Primary Lang</div>
              <div className="text-base font-bold text-white">{repo.primaryLanguage}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Commits</div>
              <div className="text-base font-bold text-white">{repo.commitCount}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Manifests</div>
              <div className="text-base font-bold text-white">{repo.manifestsFound.length}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase font-mono">
              Deterministic Scoring Breakdown (7 Pillars)
            </h3>
            
            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span className="text-sm font-medium text-slate-200">{cat.title}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {cat.score} / {cat.max} pts
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all"
                      style={{ width: `${(cat.score / cat.max) * 100}%` }}
                    />
                  </div>

                  {/* Evidence Items */}
                  <div className="space-y-1">
                    {cat.evidence.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        className={`text-xs font-mono ${
                          ev.startsWith('✓')
                            ? 'text-emerald-400'
                            : ev.startsWith('⚠')
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {ev}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Zero LLM Hallucination • Static Code AST Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
