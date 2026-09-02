import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAnalysisStore } from '@/store/analysisStore'
import type { Player } from '@/types/analysis'

/**
 * FR-06 — 선수 이름·등번호·역할 입력/수정. 등번호는 1~99만 허용한다.
 * 선발/벤치 구분은 저장된 필드가 아니라 base 국면 positions에 이 선수가
 * 있는지로 판단한다(TO-DO 14) — 벤치만 삭제 버튼을 보여준다.
 */
export function PlayerForm({ player, index }: { player: Player; index: number }) {
  const updatePlayer = useAnalysisStore((s) => s.updatePlayer)
  const removePlayer = useAnalysisStore((s) => s.removePlayer)
  const isStarter = useAnalysisStore((s) =>
    Boolean(s.analysis?.phases.base.positions.some((p) => p.playerId === player.id)),
  )

  const handleNumberChange = (raw: string) => {
    const n = Number(raw)
    if (raw === '' || Number.isNaN(n)) return
    const clamped = Math.min(99, Math.max(1, Math.trunc(n)))
    updatePlayer(player.id, { number: clamped })
  }

  return (
    <div className="grid grid-cols-[3rem_1fr_5rem_auto] items-end gap-2">
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
      <div className="flex items-center gap-1">
        <span
          className={
            isStarter
              ? 'whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-muted-foreground'
              : 'whitespace-nowrap rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground'
          }
        >
          {isStarter ? '선발' : '벤치'}
        </span>
        {!isStarter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => removePlayer(player.id)}
          >
            삭제
          </Button>
        )}
      </div>
    </div>
  )
}
