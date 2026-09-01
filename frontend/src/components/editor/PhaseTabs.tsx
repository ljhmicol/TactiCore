import { cn } from '@/lib/utils'
import { useAnalysisStore } from '@/store/analysisStore'
import type { PhaseType } from '@/types/analysis'

const PHASE_LABELS: Record<PhaseType, string> = {
  base: '기본',
  attack: '공격',
  defense: '수비',
}

const PHASES: PhaseType[] = ['base', 'attack', 'defense']

/** 국면 전환 UI. 피치 바로 위, Ghost View 토글은 우측에 붙인다 (2단계 §11.1). */
export function PhaseTabs() {
  const currentPhase = useAnalysisStore((s) => s.currentPhase)
  const switchPhase = useAnalysisStore((s) => s.switchPhase)
  const ghostView = useAnalysisStore((s) => s.layers.ghostView)
  const toggleLayer = useAnalysisStore((s) => s.toggleLayer)

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="inline-flex rounded-lg border border-border bg-muted p-1">
        {PHASES.map((phase) => (
          <button
            key={phase}
            type="button"
            onClick={() => switchPhase(phase)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              currentPhase === phase
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => toggleLayer('ghostView')}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          ghostView ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        ⟳ Ghost
      </button>
    </div>
  )
}
