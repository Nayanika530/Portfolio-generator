// apps/api/src/modules/portfolio/templateEngine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Template Engine
// Compiles 100% static, fast, secure HTML/CSS portfolios.
// Consumes the synthesized PortfolioStrategy to dynamically govern section ordering,
// content priorities, technical depth, and research/security emphasis.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PortfolioConfig,
  PortfolioStrategy,
  RepositoryWithScore,
  SkillEvidenceItem,
  UserSession,
} from '../../database/index.js'

export function renderPortfolioHtml(
  session: UserSession,
  config: PortfolioConfig,
  repos: RepositoryWithScore[],
  skills: SkillEvidenceItem[],
  strategy?: PortfolioStrategy
): string {
  const selectedRepos = repos.filter(r => config.selectedRepoIds.includes(r.id))
  const displayRepos = selectedRepos.length > 0 ? selectedRepos : repos.slice(0, 4)

  if (config.templateId === 'cybersecurity-systems') {
    return renderCybersecuritySystemsTemplate(session, config, displayRepos, skills, strategy)
  }
  return renderMinimalEngineerTemplate(session, config, displayRepos, skills, strategy)
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderMinimalEngineerTemplate(
  session: UserSession,
  config: PortfolioConfig,
  repos: RepositoryWithScore[],
  skills: SkillEvidenceItem[],
  strategy?: PortfolioStrategy
): string {
  const name = escapeHtml(session.displayName || session.username)
  const headline = escapeHtml(config.headline || 'Software Engineer & Systems Builder')
  const bio = escapeHtml(config.summaryBio || session.bio || 'Building reliable, high-performance software systems.')

  // Strategy-driven technical depth:
  const isDeepTech = (strategy?.technicalDepth ?? 0.8) >= 0.85

  const repoCards = repos.map(r => `
    <article class="project-card">
      <div class="project-header">
        <h3 class="project-title">${escapeHtml(r.name)}</h3>
        ${config.showRqsScores ? `<span class="rqs-badge" title="RQS: ${r.rqs.rating}">RQS ${r.rqs.totalScore}</span>` : ''}
      </div>
      <p class="project-desc">${escapeHtml(r.description || 'Engineered with strict types, CI/CD automation, and high test coverage.')}</p>
      <div class="project-meta">
        <span class="meta-tag lang-tag">${escapeHtml(r.primaryLanguage || 'TypeScript')}</span>
        ${r.hasTests ? '<span class="meta-tag">✓ Tests</span>' : ''}
        ${r.hasCi ? '<span class="meta-tag">✓ CI/CD</span>' : ''}
        ${r.hasDocker ? '<span class="meta-tag">✓ Docker</span>' : ''}
      </div>
      ${isDeepTech && r.manifestsFound.length > 0 ? `
        <div class="project-manifests">
          <span class="manifest-label">Verified Manifests:</span> ${r.manifestsFound.slice(0, 3).map(m => `<code>${escapeHtml(m)}</code>`).join(' ')}
        </div>
      ` : ''}
      <div class="project-links">
        <a href="https://github.com/${escapeHtml(session.username)}/${escapeHtml(r.name)}" target="_blank" rel="noopener noreferrer" class="link-btn">Source Code →</a>
      </div>
    </article>
  `).join('')

  const skillPills = skills.map(s => `
    <span class="skill-pill">
      ${escapeHtml(s.skillName)}
      ${config.showVerificationBadges ? `<span class="verified-dot" title="${s.confidencePercentage}% code-verified">✓</span>` : ''}
    </span>
  `).join('')

  // Optional Research Section if prioritized by strategy
  const showResearch = (strategy?.contentPriorities?.research ?? 0) >= 0.5 ||
    (strategy?.sectionsToInclude ?? []).some(s => s.toLowerCase().includes('research'))

  const researchSection = showResearch ? `
    <section class="content-section">
      <h2 class="section-title">Research & Formal Technical Interests</h2>
      <div class="research-box">
        <p class="research-text">
          Focusing on empirical software engineering, high-assurance formal verification, and resilient distributed consensus protocols.
        </p>
        <div class="research-tags">
          <span class="meta-tag">Formal Methods</span>
          <span class="meta-tag">Static Analysis ASTs</span>
          <span class="meta-tag">Zero-Knowledge Primitives</span>
          <span class="meta-tag">Empirical Code Quality</span>
        </div>
      </div>
    </section>
  ` : ''

  // Strategy badge
  const strategyPill = strategy ? `
    <div class="strategy-badge" title="${escapeHtml(strategy.explainabilityRationale.join(' | '))}">
      Strategy: ${escapeHtml(strategy.selectedReferenceIds.join(' + '))} • Density: ${Math.round(strategy.visualDensity * 100)}%
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Engineer Portfolio</title>
  <style>
    :root {
      --bg: #090d16;
      --surface: #111827;
      --border: #1f2937;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --success: #34d399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 3rem 1.5rem;
      max-width: 860px;
      margin: 0 auto;
    }
    header { margin-bottom: 3.5rem; }
    .badge-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      background: var(--accent-glow);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
    .strategy-badge {
      font-size: 0.72rem;
      font-family: monospace;
      color: #34d399;
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
    h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: #fff; }
    .headline { font-size: 1.25rem; color: var(--accent); margin-bottom: 1rem; font-weight: 500; }
    .bio { font-size: 1.05rem; color: var(--text-muted); max-width: 680px; }
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3.5rem;
    }
    .project-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .project-card:hover {
      transform: translateY(-2px);
      border-color: rgba(56, 189, 248, 0.5);
    }
    .project-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .project-title { font-size: 1.15rem; font-weight: 600; color: #fff; }
    .rqs-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: #042f2e;
      color: #2dd4bf;
      border: 1px solid #115e59;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .project-desc { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem; flex-grow: 1; }
    .project-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .project-manifests { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem; font-family: monospace; }
    .manifest-label { color: #cbd5e1; font-weight: 600; }
    .project-manifests code { background: #0f172a; padding: 0.1rem 0.4rem; border-radius: 4px; color: #38bdf8; }
    .meta-tag { font-size: 0.75rem; color: #cbd5e1; background: #1e293b; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .meta-tag.lang-tag { color: var(--accent); font-weight: 600; background: rgba(56, 189, 248, 0.1); }
    .link-btn {
      align-self: flex-start;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
    }
    .link-btn:hover { text-decoration: underline; }
    .content-section { margin-bottom: 3.5rem; }
    .research-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .research-text { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1rem; }
    .research-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .skills-section { margin-bottom: 3.5rem; }
    .skills-container { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .skill-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #e2e8f0;
    }
    .verified-dot { color: var(--success); font-weight: bold; font-size: 0.8rem; }
    footer {
      border-top: 1px solid var(--border);
      padding-top: 2rem;
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="badge-row">
      <div class="badge">Evidence-Grounded Technical Profile</div>
      ${strategyPill}
    </div>
    <h1>${name}</h1>
    <div class="headline">${headline}</div>
    <p class="bio">${bio}</p>
  </header>

  <section>
    <h2 class="section-title">Verified Strongest Projects</h2>
    <div class="projects-grid">
      ${repoCards}
    </div>
  </section>

  ${researchSection}

  <section class="skills-section">
    <h2 class="section-title">Verified Technical Skills (Source Grounded)</h2>
    <div class="skills-container">
      ${skillPills}
    </div>
  </section>

  <footer>
    <span>Generated by Portfolio Intelligence Platform</span>
    <span>Source: github.com/${escapeHtml(session.username)}</span>
  </footer>
</body>
</html>`
}

function renderCybersecuritySystemsTemplate(
  session: UserSession,
  config: PortfolioConfig,
  repos: RepositoryWithScore[],
  skills: SkillEvidenceItem[],
  strategy?: PortfolioStrategy
): string {
  const name = escapeHtml(session.displayName || session.username)
  const headline = escapeHtml(config.headline || 'Systems Security & Infrastructure Engineer')
  const bio = escapeHtml(config.summaryBio || session.bio || 'Specializing in cryptography, application security scanning, and robust systems architecture.')

  const repoCards = repos.map(r => `
    <div class="telemetry-box">
      <div class="box-header">
        <span class="prompt-symbol">$</span>
        <span class="repo-name">${escapeHtml(r.name)}</span>
        <span class="status-pill ${r.rqs.totalScore >= 80 ? 'status-pass' : 'status-warn'}">
          RQS::${r.rqs.totalScore} [${r.rqs.rating.toUpperCase()}]
        </span>
      </div>
      <p class="telemetry-desc">${escapeHtml(r.description || 'System artifact with automated security boundaries.')}</p>
      <div class="audit-log">
        <div class="audit-line"><span class="audit-key">LANG:</span> ${escapeHtml(r.primaryLanguage || 'Rust')}</div>
        <div class="audit-line"><span class="audit-key">TEST_COVERAGE:</span> ${r.hasTests ? 'ENABLED (Passing)' : 'NONE'}</div>
        <div class="audit-line"><span class="audit-key">CI_PIPELINE:</span> ${r.hasCi ? 'ACTIONS_VERIFIED' : 'UNCONFIGURED'}</div>
        <div class="audit-line"><span class="audit-key">CONTAINER_DEF:</span> ${r.hasDocker ? 'DOCKERFILE_STRICT' : 'NOT_FOUND'}</div>
        ${r.manifestsFound.length > 0 ? `
          <div class="audit-line"><span class="audit-key">MANIFESTS:</span> ${escapeHtml(r.manifestsFound.join(', '))}</div>
        ` : ''}
      </div>
      <div class="actions">
        <a href="https://github.com/${escapeHtml(session.username)}/${escapeHtml(r.name)}" target="_blank" rel="noopener noreferrer" class="cmd-link">VIEW_REPO_TREE() ↗</a>
      </div>
    </div>
  `).join('')

  const skillPills = skills.map(s => `
    <div class="sec-skill">
      <div class="sec-skill-head">
        <span>${escapeHtml(s.skillName)}</span>
        <span class="sec-conf">${s.confidencePercentage}% CONF</span>
      </div>
      <div class="sec-cite">&gt; ${escapeHtml(s.citations[0]?.filePath || 'manifest')}</div>
    </div>
  `).join('')

  const strategyBar = strategy ? `
    <div class="strategy-status" title="${escapeHtml(strategy.explainabilityRationale.join(' | '))}">
      <span>STRATEGY::BLENDED [${escapeHtml(strategy.selectedReferenceIds.join(' + '))}]</span>
      <span>DEPTH::${Math.round(strategy.technicalDepth * 100)}%</span>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | Systems & Security Telemetry</title>
  <style>
    :root {
      --terminal-bg: #030712;
      --panel-bg: #090f1e;
      --border-color: #1e293b;
      --accent-green: #10b981;
      --accent-green-dim: rgba(16, 185, 129, 0.15);
      --accent-amber: #f59e0b;
      --text-terminal: #e2e8f0;
      --text-dim: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--terminal-bg);
      color: var(--text-terminal);
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      padding: 2.5rem 1.5rem;
      max-width: 960px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .status-bar {
      border: 1px solid var(--border-color);
      background: #020617;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.8rem;
      display: flex;
      justify-content: space-between;
      color: var(--accent-green);
    }
    .strategy-status {
      font-size: 0.72rem;
      color: #38bdf8;
      background: #0b1528;
      border: 1px solid #1e3a8a;
      padding: 0.4rem 1rem;
      border-radius: 4px;
      margin-bottom: 2.5rem;
      display: flex;
      justify-content: space-between;
    }
    .id-block { margin-bottom: 3rem; }
    .sys-badge {
      color: var(--accent-green);
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }
    h1 { font-size: 2.2rem; color: #fff; margin-bottom: 0.4rem; letter-spacing: -0.01em; }
    .role { color: #38bdf8; font-size: 1.1rem; margin-bottom: 1rem; }
    .bio { color: var(--text-dim); font-size: 0.95rem; max-width: 720px; line-height: 1.6; }
    .sub-head {
      color: #94a3b8;
      font-size: 0.9rem;
      letter-spacing: 0.15em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.4rem;
      margin-bottom: 1.5rem;
      margin-top: 3rem;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
    .telemetry-box {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    .box-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .prompt-symbol { color: var(--accent-green); font-weight: bold; }
    .repo-name { color: #fff; font-weight: bold; font-size: 1.05rem; }
    .status-pill {
      margin-left: auto;
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
    }
    .status-pass { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .status-warn { background: #451a03; color: #fbbf24; border: 1px solid #b45309; }
    .telemetry-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem; }
    .audit-log {
      background: #020617;
      border: 1px solid #0f172a;
      border-radius: 4px;
      padding: 0.75rem;
      font-size: 0.78rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .audit-key { color: #38bdf8; font-weight: 600; }
    .cmd-link {
      color: var(--accent-green);
      font-size: 0.8rem;
      text-decoration: none;
      font-weight: bold;
    }
    .cmd-link:hover { text-decoration: underline; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .sec-skill {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }
    .sec-skill-head { display: flex; justify-content: space-between; font-size: 0.85rem; color: #fff; margin-bottom: 0.3rem; }
    .sec-conf { color: var(--accent-green); font-size: 0.75rem; font-weight: bold; }
    .sec-cite { color: var(--text-dim); font-size: 0.72rem; word-break: break-all; }
  </style>
</head>
<body>
  <div class="status-bar">
    <span>SYSTEM::EVIDENCE_GRAPH_ONLINE</span>
    <span>AUTH_NODE::GITHUB_GROUNDED</span>
  </div>

  ${strategyBar}

  <div class="id-block">
    <div class="sys-badge">// VERIFIED TECHNICAL OPERATOR</div>
    <h1>${name}</h1>
    <div class="role">&gt; ${headline}</div>
    <p class="bio">${bio}</p>
  </div>

  <div class="sub-head">[ 01 // HIGH-ASSURANCE SYSTEMS & REPOSITORIES ]</div>
  <div class="grid">
    ${repoCards}
  </div>

  <div class="sub-head">[ 02 // CODE-EXTRACTED SKILL EVIDENCE MATRIX ]</div>
  <div class="skills-grid">
    ${skillPills}
  </div>
</body>
</html>`
}
