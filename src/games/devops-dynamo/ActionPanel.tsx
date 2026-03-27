import { useState } from 'react'
import type { Action } from './types'

interface ActionPanelProps {
  actions: Action[]
  onAct: (action: Action) => void
}

export function ActionPanel({ actions, onAct }: ActionPanelProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
        Choose Your Fix
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Pick the best action based on the clues you gathered. Wrong calls cost time and may make things worse.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => setSelected(action.id)}
            className={`flex flex-col text-left rounded-lg px-4 py-3 border-2 transition-all ${
              selected === action.id
                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <span className="text-sm font-semibold text-slate-800">{action.label}</span>
            <span className="text-xs text-slate-500 mt-0.5">{action.description}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          const action = actions.find(a => a.id === selected)
          if (action) onAct(action)
        }}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-sm ${
          selected
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Execute Fix
      </button>
    </div>
  )
}
