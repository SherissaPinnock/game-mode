type BranchEvent =
  | { type: 'create'; from: string; branch: string }
  | { type: 'switch'; from: string; to: string }
  | null

interface BranchVisualizerProps {
  branches: string[]
  currentBranch: string
  branchEvent?: BranchEvent
}

function branchColor(name: string) {
  if (name === 'main') return '#0A7C6E'
  if (name.startsWith('hotfix') || name.startsWith('fix')) return '#c0392b'
  if (name.startsWith('release')) return '#1a6fb5'
  return '#7c3aed'
}

// ── Inline create animation ──────────────────────────────────
function CreateEvent({ fromBranch, newBranch }: { fromBranch: string; newBranch: string }) {
  const parentColor = branchColor(fromBranch)
  const childColor = branchColor(newBranch)
  const FORK_X = 80
  return (
    <div className="gcc-bviz-event gcc-bviz-event-create">
      <div className="gcc-bviz-event-badge" style={{ color: childColor, borderColor: childColor }}>
        🌿 Branch created
      </div>
      <svg className="gcc-bviz-event-svg" viewBox="0 0 300 120" aria-hidden="true">
        {/* Parent label */}
        <text x="10" y="22" fontSize="9" fontFamily="monospace" fill={parentColor} opacity="0.75">
          {fromBranch.length > 16 ? '…' + fromBranch.slice(-14) : fromBranch}
        </text>
        {/* Parent lane */}
        <line x1="10" y1="34" x2={FORK_X} y2="34"
          stroke={parentColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1={FORK_X} y1="34" x2="282" y2="34"
          stroke={parentColor} strokeWidth="1.8" strokeOpacity="0.38" strokeLinecap="round" />
        <circle cx={FORK_X} cy="34" r="5" fill={parentColor} />
        {/* Fork curve — draws in */}
        <path
          d={`M ${FORK_X} 34 C ${FORK_X} 62 ${FORK_X + 24} 80 ${FORK_X + 28} 80`}
          fill="none" stroke={childColor} strokeWidth="2.5" strokeLinecap="round"
          className="gcc-banim-fork-path"
        />
        {/* New branch line — draws in after fork */}
        <line x1={FORK_X + 28} y1="80" x2="274" y2="80"
          stroke={childColor} strokeWidth="2.5" strokeLinecap="round"
          className="gcc-banim-new-line"
        />
        {/* Tip dot */}
        <circle cx="274" cy="80" r="5" fill={childColor} className="gcc-banim-tip-dot" />
        {/* HEAD label */}
        <text x="280" y="75" fontSize="8" fontFamily="monospace" fontWeight="700"
          fill={childColor} className="gcc-banim-head-label">HEAD</text>
        {/* New branch label */}
        <text x={FORK_X + 28} y="98" fontSize="9" fontFamily="monospace"
          fontWeight="700" fill={childColor} className="gcc-banim-new-label">
          {newBranch.length > 22 ? '…' + newBranch.slice(-20) : newBranch}
        </text>
      </svg>
    </div>
  )
}

// ── Inline switch animation ──────────────────────────────────
function SwitchEvent({ fromBranch, toBranch }: { fromBranch: string; toBranch: string }) {
  const fromColor = branchColor(fromBranch)
  const toColor = branchColor(toBranch)
  return (
    <div className="gcc-bviz-event gcc-bviz-event-switch">
      <div className="gcc-bviz-event-badge" style={{ color: toColor, borderColor: toColor }}>
        🔀 Switched to {toBranch}
      </div>
      <svg className="gcc-bviz-event-svg" viewBox="0 0 300 120" aria-hidden="true">
        {/* FROM label + lane */}
        <text x="14" y="22" fontSize="9" fontFamily="monospace" fill={fromColor} opacity="0.65">
          {fromBranch.length > 16 ? '…' + fromBranch.slice(-14) : fromBranch}
        </text>
        <line x1="14" y1="34" x2="282" y2="34"
          stroke={fromColor} strokeWidth="1.8" strokeOpacity="0.35" strokeLinecap="round" />
        {/* TO lane + label */}
        <line x1="14" y1="84" x2="282" y2="84"
          stroke={toColor} strokeWidth="2.5" strokeLinecap="round" />
        <text x="14" y="102" fontSize="9" fontFamily="monospace" fontWeight="700" fill={toColor}>
          {toBranch.length > 16 ? '…' + toBranch.slice(-14) : toBranch}
        </text>
        {/* Travel path */}
        <path d="M 148 34 C 148 34 148 84 148 84"
          fill="none" stroke="rgba(27,33,26,0.14)" strokeWidth="1" strokeDasharray="3,3" />
        {/* HEAD dot travels from FROM to TO and stays */}
        <circle cx="148" cy="34" r="8" fill={fromColor} fillOpacity="0.2" stroke={fromColor} strokeWidth="1.5">
          <animate attributeName="cy" from="34" to="84" dur="0.55s" begin="0.15s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
          <animate attributeName="fill" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
          <animate attributeName="stroke" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
          <animate attributeName="r" values="8;11;8" dur="0.3s" begin="0.65s" fill="freeze" />
        </circle>
        {/* HEAD label travels too */}
        <text x="162" y="39" fontSize="9" fontFamily="monospace" fontWeight="700" fill={fromColor}>
          HEAD
          <animate attributeName="y" from="39" to="89" dur="0.55s" begin="0.15s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
          <animate attributeName="fill" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
        </text>
        {/* Landing glow */}
        <circle cx="148" cy="84" r="8" fill={toColor} fillOpacity="0">
          <animate attributeName="r" values="8;20;14" dur="0.45s" begin="0.72s" fill="freeze" />
          <animate attributeName="fill-opacity" values="0;0.22;0.10" dur="0.45s" begin="0.72s" fill="freeze" />
        </circle>
      </svg>
    </div>
  )
}

// ── Main visualizer ──────────────────────────────────────────
export function BranchVisualizer({ currentBranch, branchEvent }: BranchVisualizerProps) {
  return (
    <div className="gcc-branch-viz">
      {/* Header */}
      <div className="gcc-branch-viz-label">
        <span className="gcc-branch-viz-icon">⎇</span>
        Branch Map
        <span className="gcc-branch-viz-cur">{currentBranch}</span>
      </div>

      {/* Event animation — stays until next event replaces it */}
      {branchEvent?.type === 'create' && (
        <CreateEvent
          key={`create-${branchEvent.branch}`}
          fromBranch={branchEvent.from}
          newBranch={branchEvent.branch}
        />
      )}
      {branchEvent?.type === 'switch' && (
        <SwitchEvent
          key={`switch-${branchEvent.to}`}
          fromBranch={branchEvent.from}
          toBranch={branchEvent.to}
        />
      )}

      {/* Placeholder when no event has fired yet */}
      {!branchEvent && (
        <div className="gcc-bviz-empty">
          No branch activity yet
        </div>
      )}
    </div>
  )
}
