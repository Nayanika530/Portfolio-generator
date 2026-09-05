// apps/web/src/components/ResumeVerificationView.tsx
import React, { useState } from 'react'
import { ResumeClaim, HiddenGemSkill } from '../types'
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Plus, FileText, ArrowRight } from 'lucide-react'

interface ResumeVerificationViewProps {
  claims: ResumeClaim[]
  hiddenGems: HiddenGemSkill[]
  onAddClaim: (claimText: string) => Promise<void>
  isDemoUser?: boolean
}

export const ResumeVerificationView: React.FC<ResumeVerificationViewProps> = ({
  claims,
  hiddenGems,
  onAddClaim,
  isDemoUser = true,
}) => {
  const [newClaimInput, setNewClaimInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClaimInput.trim()) return
    setIsSubmitting(true)
    try {
      await onAddClaim(newClaimInput.trim())
      setNewClaimInput('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifiedCount = claims.filter(c => c.verificationStatus === 'VERIFIED').length
  const insufficientCount = claims.filter(c => c.verificationStatus === 'INSUFFICIENT_EVIDENCE').length
  const unverifiedCount = claims.filter(c => c.verificationStatus === 'UNVERIFIED').length

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                <FileText className="w-3.5 h-3.5" />
                Resume Claim Grounding Pipeline
              </div>
              {isDemoUser ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  GROUNDING: DEMO / SYNTHETIC
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  GROUNDING: LIVE GITHUB CODEBASE
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Resume Claims ↔ GitHub Evidence</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Cross-verifies stated resume claims against code artifacts, manifests, and commit history. Identifies verified strengths, unbacked claims, and unlisted hidden gems.
            </p>
          </div>

          <div className="flex gap-3 font-mono text-center">
            <div className="px-3.5 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Verified</div>
              <div className="text-lg font-bold text-emerald-400">{verifiedCount}</div>
            </div>
            <div className="px-3.5 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Insufficient</div>
              <div className="text-lg font-bold text-amber-400">{insufficientCount}</div>
            </div>
            <div className="px-3.5 py-2 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500">Unverified</div>
              <div className="text-lg font-bold text-rose-400">{unverifiedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Test Claim Form */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-mono text-slate-400 shrink-0">Test a resume claim:</span>
        <form onSubmit={handleSubmitClaim} className="flex-grow flex gap-2 w-full">
          <input
            type="text"
            value={newClaimInput}
            onChange={e => setNewClaimInput(e.target.value)}
            placeholder="e.g. 'Kubernetes', 'Redis', 'High-throughput Rust services'..."
            className="flex-grow px-3 py-1.5 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newClaimInput.trim()}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Verify Claim
          </button>
        </form>
      </div>

      {/* Verification Matrix Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          Cross-Verification Matrix
        </h3>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Resume Claim</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Evidence Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {claims.map(claim => (
                  <tr key={claim.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {claim.claimText}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {claim.category}
                    </td>
                    <td className="py-3.5 px-4">
                      {claim.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED ({claim.confidenceScore}%)
                        </span>
                      )}
                      {claim.verificationStatus === 'INSUFFICIENT_EVIDENCE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          INSUFFICIENT EVIDENCE
                        </span>
                      )}
                      {claim.verificationStatus === 'UNVERIFIED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          <XCircle className="w-3 h-3" />
                          UNVERIFIED CLAIM
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-md font-sans text-xs">
                      {claim.evidenceSummary || 'No evidence available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hidden Gems: Skills Found in Code but Missing from Resume */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Hidden Gems Discovered in Code (Missing from Resume)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          The intelligence engine detected these high-impact skills with strong code citations in your GitHub repositories, but they were absent from your resume claim list:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hiddenGems.map((gem, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-cyan-300">+{gem.skillName}</span>
                  <span className="text-[10px] font-mono uppercase text-cyan-500 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {gem.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{gem.reason}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>Citation: {gem.evidenceCitation}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
