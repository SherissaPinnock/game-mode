import type { LevelState } from '../../types/game.types'
import { CommitTimeline } from '../CommitTimeline/CommitTimeline'
import { BranchVisualizer } from '../BranchVisualizer/BranchVisualizer'

type BranchEvent =
  | { type: 'create'; from: string; branch: string }
  | { type: 'switch'; from: string; to: string }
  | null

interface WorkbenchProps {
  levelState: LevelState
  animationHint: string | null
  spotlightZone?: string | null
  branchEvent?: BranchEvent
}

function sl(zone: string, active?: string | null) {
  return active === zone ? 'gcc-spotlight' : ''
}

export function Workbench({ levelState, animationHint, spotlightZone, branchEvent }: WorkbenchProps) {
  const { workingDirectory, stagingArea, localRepo, remoteRepo, currentBranch, openPullRequests, availableBranches } = levelState

  return (
    <div className={`gcc-workbench ${animationHint === 'shake' ? 'gcc-shake' : ''}`}>
      <div className="gcc-zones">
        <div className={`gcc-zone gcc-zone-working ${sl('working', spotlightZone)}`}>
          <div className="gcc-zone-header">
            <span className="gcc-zone-icon">📁</span>
            <span className="gcc-zone-label">Working Directory</span>
            <span className="gcc-zone-count">{workingDirectory.length}</span>
          </div>
          <div className="gcc-zone-body">
            {workingDirectory.length === 0 ? (
              <p className="gcc-zone-empty">Clean — nothing modified</p>
            ) : (
              workingDirectory.map(f => (
                <div key={f.id} className="gcc-file-card gcc-file-modified">
                  <span className="gcc-file-status-dot" />
                  <span className="gcc-file-name">{f.name}</span>
                  <span className="gcc-file-badge">modified</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="gcc-zone-arrow" aria-hidden="true">→</div>

        <div className={`gcc-zone gcc-zone-staging ${sl('staging', spotlightZone)}`}>
          <div className="gcc-zone-header">
            <span className="gcc-zone-icon">📋</span>
            <span className="gcc-zone-label">Staging Area</span>
            <span className="gcc-zone-count">{stagingArea.length}</span>
          </div>
          <div className="gcc-zone-body">
            {stagingArea.length === 0 ? (
              <p className="gcc-zone-empty">Nothing staged yet</p>
            ) : (
              stagingArea.map(f => (
                <div key={f.id} className="gcc-file-card gcc-file-staged">
                  <span className="gcc-file-status-dot" />
                  <span className="gcc-file-name">{f.name}</span>
                  <span className="gcc-file-badge">staged</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="gcc-zone-arrow" aria-hidden="true">→</div>

        <div className={`gcc-zone gcc-zone-local ${sl('local', spotlightZone)}`}>
          <CommitTimeline
            commits={localRepo}
            label="Local Repository"
            icon="💻"
            currentBranch={currentBranch}
          />
        </div>

        <div className="gcc-zone-arrow gcc-zone-arrow-vert" aria-hidden="true">⬆</div>

        <div className={`gcc-zone gcc-zone-remote ${sl('remote', spotlightZone)}`}>
          <CommitTimeline
            commits={remoteRepo}
            label="Remote Repository"
            icon="☁️"
          />
          {openPullRequests.length > 0 && (
            <div className="gcc-pr-list">
              {openPullRequests.map(pr => (
                <div key={pr.id} className={`gcc-pr-item gcc-pr-${pr.status}`}>
                  <span className="gcc-pr-icon">📬</span>
                  <div className="gcc-pr-info">
                    <span className="gcc-pr-title">{pr.title}</span>
                    <span className="gcc-pr-meta">{pr.fromBranch} → {pr.toBranch}</span>
                    <span className={`gcc-pr-status gcc-pr-status-${pr.status}`}>{pr.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={sl('branch', spotlightZone)}>
        <BranchVisualizer
          branches={availableBranches}
          currentBranch={currentBranch}
          branchEvent={branchEvent}
        />
      </div>
    </div>
  )
}
