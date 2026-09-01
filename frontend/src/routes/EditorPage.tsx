import { Link } from 'react-router-dom'

import { MatchInfoForm } from '@/components/editor/MatchInfoForm'
import { PlayerForm } from '@/components/editor/PlayerForm'
import { PlayerNode } from '@/components/pitch/PlayerNode'
import { Pitch } from '@/components/pitch/Pitch'
import { Button } from '@/components/ui/button'
import { useAnalysisStore } from '@/store/analysisStore'

/**
 * / — 편집기. 분석이 없으면 빈 안내, 있으면 피치 + 경기정보/선수 패널을 보여준다.
 * 국면 탭·레이어 토글·코멘트 패널은 Phase 3/4에서 추가된다.
 */
export function EditorPage() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const currentPhase = useAnalysisStore((s) => s.currentPhase)

  if (!analysis) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">아직 분석이 없습니다.</p>
        <Button asChild>
          <Link to="/new">새 분석 시작</Link>
        </Button>
      </div>
    )
  }

  const phase = analysis.phases[currentPhase]

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(480px,1fr)_400px]">
      <div className="flex justify-center">
        <div className="h-[70vh]">
          <Pitch>
            {analysis.players.map((player) => {
              const pos = phase.positions.find((p) => p.playerId === player.id)
              if (!pos) return null
              return <PlayerNode key={player.id} player={player} position={pos} />
            })}
          </Pitch>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">경기 정보</h2>
          <MatchInfoForm match={analysis.match} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">선수 ({analysis.players.length})</h2>
          <div className="space-y-2">
            {analysis.players.map((player, i) => (
              <PlayerForm key={player.id} player={player} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
