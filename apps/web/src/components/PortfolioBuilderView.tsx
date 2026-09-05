// apps/web/src/components/PortfolioBuilderView.tsx
import React, { useState } from 'react'
import { PortfolioConfig } from '../types'
import { Layout, Globe, Shield, RefreshCw, Send, CheckCircle2 } from 'lucide-react'

interface PortfolioBuilderViewProps {
  config: PortfolioConfig
  onUpdateConfig: (updates: Partial<PortfolioConfig>) => Promise<void>
  onDeploy: () => Promise<{ success: boolean; deployedUrl: string; deployedAt: string }>
  previewUrl: string
  isDemoUser?: boolean
}

export const PortfolioBuilderView: React.FC<PortfolioBuilderViewProps> = ({
  config,
  onUpdateConfig,
  onDeploy,
  previewUrl,
  isDemoUser = true,
}) => {
  const [headline, setHeadline] = useState(config.headline)
  const [summaryBio, setSummaryBio] = useState(config.summaryBio)
  const [templateId, setTemplateId] = useState(config.templateId)
  const [showRqsScores, setShowRqsScores] = useState(config.showRqsScores)
  const [showBadges, setShowBadges] = useState(config.showVerificationBadges)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{ url: string; time: string } | null>(
    config.isPublished && config.deployedUrl ? { url: config.deployedUrl, time: config.lastDeployedAt || '' } : null
  )

  const handleTemplateChange = async (newTemplate: 'minimal-engineer' | 'cybersecurity-systems') => {
    setTemplateId(newTemplate)
    await onUpdateConfig({ templateId: newTemplate })
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onUpdateConfig({
        headline,
        summaryBio,
        templateId,
        showRqsScores,
        showVerificationBadges: showBadges,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTriggerDeploy = async () => {
    setIsDeploying(true)
    try {
      const res = await onDeploy()
      setDeploymentResult({ url: res.deployedUrl, time: res.deployedAt })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                <Layout className="w-3.5 h-3.5" />
                Evidence-Grounded Portfolio Generator
              </div>
              {isDemoUser ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  DATA SOURCE: DEMO SYNTHESIS
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  DATA SOURCE: LIVE GITHUB VERIFIED
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Studio & Live Preview</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Select an engineered template, customize evidence visibility, inspect in the sandboxed preview, and deploy as a 100% static edge bundle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDeploy}
              disabled={isDeploying}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-400/20 disabled:opacity-50"
            >
              {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Deploy to Edge
            </button>
          </div>
        </div>

        {deploymentResult && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>LIVE EDGE DEPLOYMENT ACTIVE:</span>
              <a
                href={deploymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-300 font-bold"
              >
                {deploymentResult.url}
              </a>
            </div>
            <span className="text-slate-500">Static Build deployed</span>
          </div>
        )}
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Template Selector */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Select Signature Template
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleTemplateChange('minimal-engineer')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  templateId === 'minimal-engineer'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Minimal Engineer</span>
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Clean, typography-driven, ultra-fast layout focusing on project impact, architecture, and live links.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('cybersecurity-systems')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  templateId === 'cybersecurity-systems'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Cybersecurity / Systems</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Terminal telemetry aesthetic with verified security badges, audit logs, and code evidence.
                </p>
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Profile Customization
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-mono">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-mono">Summary Bio</label>
              <textarea
                rows={3}
                value={summaryBio}
                onChange={e => setSummaryBio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRqsScores}
                  onChange={e => setShowRqsScores(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-400 focus:ring-0 bg-slate-950"
                />
                <span>Display RQS Quality Badges on Projects</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBadges}
                  onChange={e => setShowBadges(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-400 focus:ring-0 bg-slate-950"
                />
                <span>Display Code-Verification Citations</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Update & Refresh Preview
            </button>
          </form>
        </div>

        {/* Right Column: Sandboxed Live Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sandboxed Iframe Preview (Isolated Origin)
            </span>
            <span>Template: {templateId}</span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl h-[640px]">
            <iframe
              src={previewUrl}
              title="Live Portfolio Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0 bg-[#090d16]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
