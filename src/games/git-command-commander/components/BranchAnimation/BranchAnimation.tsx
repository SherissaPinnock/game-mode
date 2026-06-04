import { useEffect, useState } from 'react'

interface BranchAnimationProps {
  type: 'create' | 'switch'
  fromBranch: string
  toBranch?: string        // for switch
  newBranchName?: string  // for create
  onDone: () => void
}

function branchColor(name: string) {
  if (name === 'main') return '#0A7C6E'
  if (name.startsWith('hotfix') || name.startsWith('fix')) return '#c0392b'
  if (name.startsWith('release')) return '#1a6fb5'
  return '#7c3aed'
}

// ── Branch-creation animation ────────────────────────────────────
function CreateAnimation({ fromBranch, newBranchName }: { fromBranch: string; newBranchName: string }) {
  const parentColor = branchColor(fromBranch)
  const childColor  = branchColor(newBranchName)
  const FORK_X = 80

  return (
    <div className="gcc-banim-card gcc-banim-create">
      <div className="gcc-banim-badge" style={{ color: childColor, borderColor: childColor }}>
        🌿 Branch Created
      </div>

      <svg className="gcc-banim-svg" viewBox="0 0 300 90" aria-hidden="true">
        {/* Main lane line (left portion) */}
        <line x1="10" y1="30" x2={FORK_X} y2="30"
          stroke={parentColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Main lane continues past fork */}
        <line x1={FORK_X} y1="30" x2="280" y2="30"
          stroke={parentColor} strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />

        {/* Fork commit dot */}
        <circle cx={FORK_X} cy="30" r="5" fill={parentColor} />

        {/* Fork connector — draws in */}
        <path
          d={`M ${FORK_X} 30 C ${FORK_X} 52 ${FORK_X + 24} 62 ${FORK_X + 28} 62`}
          fill="none" stroke={childColor} strokeWidth="2.5" strokeLinecap="round"
          className="gcc-banim-fork-path"
        />

        {/* New branch line — draws in after fork */}
        <line
          x1={FORK_X + 28} y1="62" x2="276" y2="62"
          stroke={childColor} strokeWidth="2.5" strokeLinecap="round"
          className="gcc-banim-new-line"
        />

        {/* New branch tip dot */}
        <circle cx="276" cy="62" r="5" fill={childColor} className="gcc-banim-tip-dot" />

        {/* HEAD label on new branch */}
        <text x="282" y="57" fontSize="9" fontFamily="monospace" fontWeight="700"
          fill={childColor} className="gcc-banim-head-label">
          HEAD
        </text>

        {/* Parent branch label */}
        <text x="10" y="20" fontSize="10" fontFamily="monospace" fill={parentColor} opacity="0.7">
          {fromBranch.length > 16 ? '…' + fromBranch.slice(-14) : fromBranch}
        </text>

        {/* New branch label */}
        <text x={FORK_X + 28} y="78" fontSize="10" fontFamily="monospace"
          fontWeight="700" fill={childColor} className="gcc-banim-new-label">
          {newBranchName.length > 22 ? '…' + newBranchName.slice(-20) : newBranchName}
        </text>
      </svg>
    </div>
  )
}

// ── Branch-switch animation ──────────────────────────────────────
function SwitchAnimation({ fromBranch, toBranch }: { fromBranch: string; toBranch: string }) {
  const fromColor = branchColor(fromBranch)
  const toColor   = branchColor(toBranch)

  return (
    <div className="gcc-banim-card gcc-banim-switch">
      <div className="gcc-banim-badge" style={{ color: toColor, borderColor: toColor }}>
        🔀 Switched Branch
      </div>

      <svg className="gcc-banim-svg" viewBox="0 0 300 90" aria-hidden="true">
        {/* FROM lane */}
        <line x1="14" y1="30" x2="280" y2="30"
          stroke={fromColor} strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
        <text x="14" y="20" fontSize="10" fontFamily="monospace" fill={fromColor} opacity="0.6">
          {fromBranch.length > 16 ? '…' + fromBranch.slice(-14) : fromBranch}
        </text>

        {/* TO lane */}
        <line x1="14" y1="62" x2="280" y2="62"
          stroke={toColor} strokeWidth="2.5" strokeLinecap="round" />
        <text x="14" y="78" fontSize="10" fontFamily="monospace" fontWeight="700" fill={toColor}>
          {toBranch.length > 16 ? '…' + toBranch.slice(-14) : toBranch}
        </text>

        {/* Travel path from top lane to bottom lane */}
        <path
          d="M 148 30 C 148 30 148 62 148 62"
          fill="none" stroke="rgba(27,33,26,0.12)" strokeWidth="1" strokeDasharray="3,3"
        />

        {/* HEAD dot — travels from FROM lane to TO lane */}
        <circle cx="148" cy="30" r="7" fill={fromColor} fillOpacity="0.2" stroke={fromColor} strokeWidth="1.5">
          <animate attributeName="cy" from="30" to="62" dur="0.55s" begin="0.15s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
          <animate attributeName="fill" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
          <animate attributeName="stroke" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
          <animate attributeName="r" values="7;9;7" dur="0.3s" begin="0.6s" fill="freeze" />
        </circle>

        {/* HEAD label that moves with the dot */}
        <text x="160" y="35" fontSize="9" fontFamily="monospace" fontWeight="700" fill={fromColor}>
          HEAD
          <animate attributeName="y" from="35" to="67" dur="0.55s" begin="0.15s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
          <animate attributeName="fill" from={fromColor} to={toColor} dur="0.25s" begin="0.42s" fill="freeze" />
        </text>

        {/* Glow ring that appears on landing */}
        <circle cx="148" cy="62" r="12" fill={toColor} fillOpacity="0" stroke="none">
          <animate attributeName="r" values="7;16;12" dur="0.45s" begin="0.7s" fill="freeze" />
          <animate attributeName="fill-opacity" values="0;0.2;0" dur="0.45s" begin="0.7s" fill="freeze" />
        </circle>
      </svg>
    </div>
  )
}

// ── Outer wrapper — handles mount/dismiss lifecycle ──────────────
export function BranchAnimation({ type, fromBranch, toBranch = '', newBranchName = '', onDone }: BranchAnimationProps) {
  const [visible, setVisible] = useState(true)
  const DURATION = type === 'create' ? 2400 : 1900

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 350) // let the fade-out finish
    }, DURATION)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`gcc-banim-wrapper ${visible ? 'gcc-banim-in' : 'gcc-banim-out'}`}>
      {type === 'create'
        ? <CreateAnimation fromBranch={fromBranch} newBranchName={newBranchName} />
        : <SwitchAnimation fromBranch={fromBranch} toBranch={toBranch} />
      }
    </div>
  )
}
