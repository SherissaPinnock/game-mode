import type { Commit } from '../../types/game.types'

interface CommitTimelineProps {
  commits: Commit[]
  label: string
  icon: string
  currentBranch?: string
}

export function CommitTimeline({ commits, label, icon, currentBranch }: CommitTimelineProps) {
  return (
    <div className="gcc-timeline">
      <div className="gcc-zone-header">
        <span className="gcc-zone-icon">{icon}</span>
        <span className="gcc-zone-label">{label}</span>
        <span className="gcc-zone-count">{commits.length}</span>
      </div>
      <div className="gcc-timeline-body">
        {commits.length === 0 ? (
          <p className="gcc-timeline-empty">No commits yet</p>
        ) : (
          [...commits].reverse().map((commit) => (
            <div
              key={commit.id}
              className={`gcc-commit-node ${commit.isMerge ? 'gcc-commit-merge' : ''} ${commit.branch === currentBranch ? 'gcc-commit-active' : ''}`}
            >
              <div className="gcc-commit-dot" aria-hidden="true" />
              <div className="gcc-commit-info">
                <span className="gcc-commit-msg">{commit.message}</span>
                <span className="gcc-commit-branch">⎇ {commit.branch}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
