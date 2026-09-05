// apps/web/src/components/PortfolioIntelligenceView.tsx
import React, { useState } from 'react'
import {
  PortfolioStrategy,
  ReferenceProfile,
  StrategyRecommendation,
} from '../types'
import {
  BookOpen,
  Sparkles,
  Check,
  Plus,
  ArrowRight,
  Zap,
  Info,
  Sliders,
} from 'lucide-react'

interface PortfolioIntelligenceViewProps {
  references: ReferenceProfile[]
  categories: string[]
  currentStrategy: PortfolioStrategy | null
  recommendation: StrategyRecommendation | null
  onUpdateStrategy: (selectedIds: string[], weights?: Record<string, number>) => Promise<void>
  onNavigateToStudio: () => void
}

export const PortfolioIntelligenceView: React.FC<PortfolioIntelligenceViewProps> = ({
  references,
  categories,
  currentStrategy,
  recommendation,
  onUpdateStrategy,
  onNavigateToStudio,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [inspectingRef, setInspectingRef] = useState<ReferenceProfile | null>(null)

  const selectedReferenceIds = currentStrategy?.selectedReferenceIds || []

  // Filtered references
  const filteredReferences = selectedCategory === 'All'
    ? references
    : references.filter(r => r.category.toLowerCase() === selectedCategory.toLowerCase())

  // Handle toggling a reference in the strategy
  const handleToggleReference = async (refId: string) => {
    setIsUpdating(true)
    try {
      let newIds: string[]
      if (selectedReferenceIds.includes(refId)) {
        // Remove, but keep at least 1
        if (selectedReferenceIds.length > 1) {
          newIds = selectedReferenceIds.filter(id => id !== refId)
        } else {
          newIds = selectedReferenceIds
        }
      } else {
        // Add
        newIds = [...selectedReferenceIds, refId]
      }
      await onUpdateStrategy(newIds)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle applying the automated recommendation
  const handleApplyRecommendation = async () => {
    if (!recommendation) return
    setIsUpdating(true)
    try {
      const targetIds = recommendation.secondaryReferenceId
        ? [recommendation.primaryReferenceId, recommendation.secondaryReferenceId]
        : [recommendation.primaryReferenceId]
      await onUpdateStrategy(targetIds, recommendation.recommendedWeights)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Top Header Banner ─────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/80 text-purple-400 border border-purple-800/60 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Institutional Reference & Template Intelligence
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Reference Library</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Machine-readable portfolio intelligence derived from major institutions and professional standards.
              The engine extracts <span className="text-cyan-300 font-semibold">structural patterns & content characteristics</span>—never copying proprietary HTML, CSS, or logos.
            </p>
          </div>

          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-400/20 shrink-0"
          >
            <span>Open in Portfolio Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Automated Recommendation Banner ────────────────────────────── */}
      {recommendation && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-800/60 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-cyan-400/20 text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Evidence-Matched Strategy Recommendation ({recommendation.confidenceMatchPercentage}% Match)
                </span>
              </div>
              <p className="text-sm text-slate-200">
                Based on your verified GitHub repositories and skill signals, the intelligence engine recommends blending:
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {Object.entries(recommendation.recommendedWeights).map(([refId, weight]) => {
                  const ref = references.find(r => r.id === refId)
                  return (
                    <span
                      key={refId}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-700/60 text-cyan-300 flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-cyan-400" />
                      {ref ? ref.name : refId} ({Math.round(weight * 100)}%)
                    </span>
                  )
                })}
              </div>
              <ul className="text-xs text-slate-400 space-y-0.5 pt-1">
                {recommendation.matchingSignals.map((sig, sIdx) => (
                  <li key={sIdx} className="flex items-center gap-1.5">
                    <span className="text-cyan-400">✓</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleApplyRecommendation}
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Apply Recommended Strategy</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Active Portfolio Strategy & Explainability Drawer ──────────── */}
      {currentStrategy && (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Active Portfolio Strategy</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current structural profile driving section generation, ordering, and depth.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Density: <strong className="text-cyan-400">{Math.round(currentStrategy.visualDensity * 100)}%</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Depth: <strong className="text-emerald-400">{Math.round(currentStrategy.technicalDepth * 100)}%</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Minimalism: <strong className="text-indigo-400">{Math.round(currentStrategy.minimalismScore * 100)}%</strong>
              </span>
            </div>
          </div>

          {/* Strategy Rationale (Why this structure?) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Strategy Explainability: Why this structure?
            </div>
            <div className="space-y-1 text-xs text-slate-300 font-sans">
              {currentStrategy.explainabilityRationale.map((rationale, rIdx) => (
                <div key={rIdx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">›</span>
                  <span>{rationale}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blended Section Ordering Visualization */}
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">
              Synthesized Section Sequence:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentStrategy.sectionOrdering.map((sec, idx) => (
                <React.Fragment key={sec}>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {sec}
                  </span>
                  {idx < currentStrategy.sectionOrdering.length - 1 && (
                    <span className="text-slate-600 font-bold">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Category Filter Pills ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            selectedCategory === 'All'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All ({references.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Reference Profiles Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReferences.map(ref => {
          const isSelected = selectedReferenceIds.includes(ref.id)
          const weight = currentStrategy?.blendedWeights[ref.id]
          const isRecommended = recommendation?.primaryReferenceId === ref.id ||
            recommendation?.secondaryReferenceId === ref.id

          return (
            <div
              key={ref.id}
              className={`p-6 rounded-2xl flex flex-col justify-between border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {ref.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{ref.name}</h3>
                  </div>

                  {isRecommended && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Institution Archetype */}
                <div className="text-xs text-slate-400 font-mono mb-2.5 flex items-center gap-1.5">
                  <span className="text-slate-500">Archetype:</span>
                  <span className="text-slate-300 truncate">{ref.institutionArchetype}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {ref.description}
                </p>

                {/* Best For Callout */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 mb-4">
                  <strong className="text-slate-200">Best for: </strong>
                  {ref.recommendedFor}
                </div>

                {/* Content Priority Weight Bars */}
                <div className="space-y-2 mb-4 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Content Emphasis:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Projects</span>
                        <span>{Math.round(ref.contentPriorities.projects * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${ref.contentPriorities.projects * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Research</span>
                        <span>{Math.round(ref.contentPriorities.research * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${ref.contentPriorities.research * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Skills</span>
                        <span>{Math.round(ref.contentPriorities.skills * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${ref.contentPriorities.skills * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Publications</span>
                        <span>{Math.round(ref.contentPriorities.publications * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${ref.contentPriorities.publications * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Structure Preview */}
                <div className="mb-4">
                  <div className="text-[11px] font-mono text-slate-500 uppercase mb-1.5">
                    Structure:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ref.sectionStructure.slice(0, 4).map(sec => (
                      <span
                        key={sec}
                        className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800"
                      >
                        {sec}
                      </span>
                    ))}
                    {ref.sectionStructure.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
                        +{ref.sectionStructure.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingRef(ref)}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
                >
                  View Details
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleReference(ref.id)}
                  disabled={isUpdating}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Active {weight ? `(${Math.round(weight * 100)}%)` : ''}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use as Reference</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Inspection Modal ─────────────────────────────────────────── */}
      {inspectingRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <h3 className="text-lg font-bold text-white">{inspectingRef.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{inspectingRef.institutionArchetype}</p>
              </div>
              <button
                onClick={() => setInspectingRef(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-1">Description</div>
                <p className="text-slate-300 text-xs leading-relaxed">{inspectingRef.description}</p>
              </div>

              <div>
                <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Section Structure Sequence</div>
                <ol className="list-decimal list-inside space-y-1 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {inspectingRef.sectionStructure.map((sec, idx) => (
                    <li key={idx}>{sec}</li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Navigation Style</div>
                  <div className="font-bold text-slate-200 mt-0.5">{inspectingRef.designCharacteristics.navigationStyle}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Minimalism Score</div>
                  <div className="font-bold text-cyan-400 mt-0.5">{Math.round(inspectingRef.designCharacteristics.minimalismScore * 100)}%</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-300">
                <strong>Machine-Readable Intelligence: </strong>
                This reference profile provides structural priorities to the Portfolio Strategy Engine to generate original code-grounded layouts.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingRef(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
