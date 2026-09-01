import { Link } from 'react-router-dom'

import { CommentPanel } from '@/components/editor/CommentPanel'
import { MatchInfoForm } from '@/components/editor/MatchInfoForm'
import { PhaseTabs } from '@/components/editor/PhaseTabs'
import { PlayerForm } from '@/components/editor/PlayerForm'
import { GhostLayer } from '@/components/pitch/GhostLayer'
import { Pitch } from '@/components/pitch/Pitch'
import { PlayerNode } from '@/components/pitch/PlayerNode'
import { Button } from '@/components/ui/button'
import { useAnalysisStore } from '@/store/analysisStore'

/**
 * / — 편집기. 분석이 없으면 빈 안내, 있으면 피치 + 경기정보/선수 패널을 보여준다.
 * 레이어 토글 칩(5채널/압박라인/오버로드 등)은 Phase 4에서 추가된다.
 */
export function EditorPage() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const currentPhase = useAnalysisStore((s) => s.currentPhase)
  const previousPhase = useAnalysisStore((s) => s.previousPhase)
  const ghostAutoVisible = useAnalysisStore((s) => s.ghostAutoVisible)
  const ghostViewPinned = useAnalysisStore((s) => s.layers.ghostView)

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
  const showGhost = Boolean(previousPhase) && previousPhase !== currentPhase && (ghostViewPinned || ghostAutoVisible)

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(480px,1fr)_400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-md">
          <PhaseTabs />
        </div>
        <div className="h-[65vh]">
          <Pitch>
            {showGhost && previousPhase && (
              <GhostLayer
                previousPositions={analysis.phases[previousPhase].positions}
                currentPositions={phase.positions}
              />
            )}
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

        <section>
          <CommentPanel phase={currentPhase} comment={phase.comment} summary={analysis.summary} />
        </section>
      </div>
    </div>
  )
}
