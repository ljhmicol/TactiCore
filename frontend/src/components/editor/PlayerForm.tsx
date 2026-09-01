import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAnalysisStore } from '@/store/analysisStore'
import type { Player } from '@/types/analysis'

/** FR-06 — 선수 이름·등번호·역할 입력/수정. 등번호는 1~99만 허용한다. */
export function PlayerForm({ player, index }: { player: Player; index: number }) {
  const updatePlayer = useAnalysisStore((s) => s.updatePlayer)

  const handleNumberChange = (raw: string) => {
    const n = Number(raw)
    if (raw === '' || Number.isNaN(n)) return
    const clamped = Math.min(99, Math.max(1, Math.trunc(n)))
    updatePlayer(player.id, { number: clamped })
  }

  return (
    <div className="grid grid-cols-[3rem_1fr_5rem] items-end gap-2">
      <div>
        <Label htmlFor={`number-${player.id}`} className="text-xs text-muted-foreground">
          #{index + 1}
        </Label>
        <Input
          id={`number-${player.id}`}
          type="number"
          min={1}
          max={99}
          value={player.number}
          onChange={(e) => handleNumberChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`name-${player.id}`} className="text-xs text-muted-foreground">
          이름
        </Label>
        <Input
          id={`name-${player.id}`}
          value={player.name}
          onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`role-${player.id}`} className="text-xs text-muted-foreground">
          역할
        </Label>
        <Input
          id={`role-${player.id}`}
          value={player.role ?? ''}
          onChange={(e) => updatePlayer(player.id, { role: e.target.value })}
        />
      </div>
    </div>
  )
}
