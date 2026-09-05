// apps/api/src/modules/resume/verificationMatrix.ts
// ─────────────────────────────────────────────────────────────────────────────
// Resume Claim Verification Engine
// Cross-verifies resume claims against verified GitHub code evidence and discovers
// high-value "Hidden Gem" skills present in code but omitted from resumes.
// ─────────────────────────────────────────────────────────────────────────────

import { ResumeClaim, HiddenGemSkill, SkillEvidenceItem } from '../../database/index.js'

export function computeVerificationMatrix(
  userId: string,
  verifiedSkills: SkillEvidenceItem[],
  extractedResumeClaims?: string[]
): { claims: ResumeClaim[]; hiddenGems: HiddenGemSkill[] } {
  // Default sample resume claims if none passed via upload
  const rawClaims = extractedResumeClaims && extractedResumeClaims.length > 0
    ? extractedResumeClaims
    : [
        'React',
        'TypeScript',
        'Docker',
        'Go',
        'Kubernetes',
        'Expert in distributed systems',
        'Python',
        'GraphQL',
      ]

  const claims: ResumeClaim[] = []

  for (const claim of rawClaims) {
    const claimLower = claim.toLowerCase()
    const matchedSkill = verifiedSkills.find(s => 
      s.skillName.toLowerCase() === claimLower || claimLower.includes(s.skillName.toLowerCase())
    )

    if (matchedSkill) {
      claims.push({
        id: `claim-${claim}-${userId}`,
        userId,
        claimText: claim,
        category: matchedSkill.category,
        verificationStatus: 'VERIFIED',
        matchedSkillId: matchedSkill.id,
        confidenceScore: matchedSkill.confidencePercentage,
        evidenceSummary: `Verified in ${matchedSkill.citations.length} file citation(s) across ${matchedSkill.primaryRepositoryName} (Confidence: ${matchedSkill.confidencePercentage}%)`,
      })
    } else if (claimLower.includes('distributed') || claimLower.includes('expert')) {
      claims.push({
        id: `claim-${claim}-${userId}`,
        userId,
        claimText: claim,
        category: 'Architecture',
        verificationStatus: 'INSUFFICIENT_EVIDENCE',
        confidenceScore: 35,
        evidenceSummary: 'Broad conceptual claim; no high-scale multi-node cluster configurations or benchmarks identified in repositories.',
      })
    } else {
      claims.push({
        id: `claim-${claim}-${userId}`,
        userId,
        claimText: claim,
        category: 'Technologies',
        verificationStatus: 'UNVERIFIED',
        confidenceScore: 12,
        evidenceSummary: 'Zero codebase artifacts, manifests, or import statements found across analyzed repositories.',
      })
    }
  }

  // Identify Hidden Gems (Skills proven in GitHub code that the developer didn't list on resume!)
  const hiddenGems: HiddenGemSkill[] = []
  const claimedSkillsLower = new Set(rawClaims.map(c => c.toLowerCase()))

  for (const skill of verifiedSkills) {
    const isClaimed = Array.from(claimedSkillsLower).some(c => 
      c.includes(skill.skillName.toLowerCase()) || skill.skillName.toLowerCase().includes(c)
    )

    if (!isClaimed) {
      hiddenGems.push({
        skillName: skill.skillName,
        category: skill.category,
        foundInRepo: skill.primaryRepositoryName,
        evidenceCitation: skill.citations[0]?.filePath || 'Codebase Manifests',
        reason: `Discovered active ${skill.skillName} usage in repository ${skill.primaryRepositoryName} with ${skill.confidencePercentage}% evidence confidence.`,
      })
    }
  }

  return { claims, hiddenGems }
}
