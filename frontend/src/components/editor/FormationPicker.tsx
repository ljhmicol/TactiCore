import { FORMATION_NAMES } from '@/lib/formations'
import { cn } from '@/lib/utils'

interface FormationPickerProps {
  onSelect: (formation: string) => void
}

/** FR-06 — 포메이션 프리셋 4종 선택 카드. */
export function FormationPicker({ onSelect }: FormationPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {FORMATION_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6',
            'text-lg font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent',
          )}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
