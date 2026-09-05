// apps/api/src/jobs/syncCoordinator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Background Synchronization Coordinator
// Simulates periodic repository re-analysis and webhook event handling.
// Recalculates RQS scores and updates portfolio state.
// ─────────────────────────────────────────────────────────────────────────────

import { GitHubService } from '../modules/github/githubService.js'

export class SyncCoordinator {
  private static activeJobs: Map<string, { status: 'RUNNING' | 'COMPLETED' | 'FAILED'; startedAt: string }> = new Map()

  static async triggerUserSync(userId: string): Promise<{ jobId: string; status: string }> {
    const jobId = `job_${Date.now()}`
    this.activeJobs.set(jobId, { status: 'RUNNING', startedAt: new Date().toISOString() })

    // Execute async sync
    try {
      await GitHubService.syncUserRepositories(userId)
      this.activeJobs.set(jobId, { status: 'COMPLETED', startedAt: new Date().toISOString() })
    } catch (err) {
      console.error(`Sync job ${jobId} failed:`, err)
      this.activeJobs.set(jobId, { status: 'FAILED', startedAt: new Date().toISOString() })
    }

    return { jobId, status: 'COMPLETED' }
  }

  static getJobStatus(jobId: string) {
    return this.activeJobs.get(jobId) || { status: 'UNKNOWN' }
  }
}
