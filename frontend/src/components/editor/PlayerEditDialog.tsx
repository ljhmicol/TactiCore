import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAnalysisStore } from '@/store/analysisStore'

/**
 * TO-DO 13번 — 피치의 선수 클릭(탭)으로 여는 인라인 편집. 우측 '선수' 목록
 * (PlayerForm)과 같은 updatePlayer 액션을 공유해 어느 쪽에서 고쳐도 동일하다.
 * 등번호 검증 규칙(1~99)도 PlayerForm과 동일하게 유지한다.
 */
export function PlayerEditDialog() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const editingPlayerId = useAnalysisStore((s) => s.editingPlayerId)
  const setEditingPlayer = useAnalysisStore((s) => s.setEditingPlayer)
  const updatePlayer = useAnalysisStore((s) => s.updatePlayer)

  const player = analysis?.players.find((p) => p.id === editingPlayerId) ?? null
  if (!player) return null

  const handleNumberChange = (raw: string) => {
    const n = Number(raw)
    if (raw === '' || Number.isNaN(n)) return
    updatePlayer(player.id, { number: Math.min(99, Math.max(1, Math.trunc(n))) })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setEditingPlayer(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>선수 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[4rem_1fr] gap-3">
            <div>
              <Label htmlFor={`edit-number-${player.id}`} className="text-xs text-muted-foreground">
                등번호
              </Label>
              <Input
                id={`edit-number-${player.id}`}
                type="number"
                min={1}
                max={99}
                value={player.number}
                onChange={(e) => handleNumberChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`edit-name-${player.id}`} className="text-xs text-muted-foreground">
                이름
              </Label>
              <Input
                id={`edit-name-${player.id}`}
                value={player.name}
                onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`edit-role-${player.id}`} className="text-xs text-muted-foreground">
              역할
            </Label>
            <Input
              id={`edit-role-${player.id}`}
              value={player.role ?? ''}
              onChange={(e) => updatePlayer(player.id, { role: e.target.value })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
