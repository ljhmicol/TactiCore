import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BottomActionBar } from '@/components/editor/BottomActionBar'
import { RecentAnalyses } from '@/components/editor/RecentAnalyses'
import { CommentPanel } from '@/components/editor/CommentPanel'
import { JsonIO } from '@/components/editor/JsonIO'
import { LayerToggleChips } from '@/components/editor/LayerToggleChips'
import { MatchInfoForm } from '@/components/editor/MatchInfoForm'
import { PhaseTabs } from '@/components/editor/PhaseTabs'
import { PlayerEditDialog } from '@/components/editor/PlayerEditDialog'
import { PlayerForm } from '@/components/editor/PlayerForm'
import { SaveButton } from '@/components/editor/SaveButton'
import { ToolPalette } from '@/components/editor/ToolPalette'
import { ExportControls } from '@/components/export/ExportControls'
import { AnnotationLayer } from '@/components/pitch/AnnotationLayer'
import { ChannelGrid } from '@/components/pitch/ChannelGrid'
import { CompactnessBox } from '@/components/pitch/CompactnessBox'
import { DrawOverlay } from '@/components/pitch/DrawOverlay'
import { GhostLayer } from '@/components/pitch/GhostLayer'
import { OpponentNode } from '@/components/pitch/OpponentNode'
import { OverloadLayer } from '@/components/pitch/OverloadLayer'
import { Pitch } from '@/components/pitch/Pitch'
import { PlayerNode } from '@/components/pitch/PlayerNode'
import { PressingLine } from '@/components/pitch/PressingLine'
import { Button } from '@/components/ui/button'
import { useAnalysisStore } from '@/store/analysisStore'

/**
 * / — 편집기. 분석이 없으면 빈 안내, 있으면 피치 + 경기정보/선수 패널을 보여준다.
 * 레이어 z-순서(2단계 §9): 채널 그리드 → 콤팩트니스 → 압박 라인 → 오버로드 → Ghost → 선수 노드(최상단).
 *
 * 모바일(§11.2): 국면 탭 sticky, 레이어 칩 가로 스크롤(LayerToggleChips 자체 구현),
 * 선수 목록 기본 접힘, 하단 고정 액션 바. 데스크톱(§11.1)에서는 2단 그리드로 배치된다.
 */
export function EditorPage() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const currentPhase = useAnalysisStore((s) => s.currentPhase)
  const previousPhase = useAnalysisStore((s) => s.previousPhase)
  const ghostAutoVisible = useAnalysisStore((s) => s.ghostAutoVisible)
  const layers = useAnalysisStore((s) => s.layers)
  const drawTool = useAnalysisStore((s) => s.drawTool)
  const addOpponents = useAnalysisStore((s) => s.addOpponents)
  const removeOpponents = useAnalysisStore((s) => s.removeOpponents)
  const removeAnnotation = useAnalysisStore((s) => s.removeAnnotation)
  const addPlayer = useAnalysisStore((s) => s.addPlayer)
  // 화살표 선택 상태. 피치 어디를 눌러도(pointerdown 버블링) 해제된다 —
  // 화살표 자체는 stopPropagation으로 해제를 막는다.
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)

  if (!analysis) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">아직 분석이 없습니다.</p>
          <Button asChild>
            <Link to="/new">새 분석 시작</Link>
          </Button>
        </div>
        <RecentAnalyses />
      </div>
    )
  }

  const phase = analysis.phases[currentPhase]
  const showGhost = Boolean(previousPhase) && previousPhase !== currentPhase && (layers.ghostView || ghostAutoVisible)
  const hasOpponent = Boolean(phase.opponentPositions && phase.opponentPositions.length > 0)

  return (
    <div className="flex flex-col gap-4 p-6 pb-24 lg:pb-6">
      <div
        id="export-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
      >
        <div>
          <p className="font-semibold text-foreground">
            {analysis.match.matchName || `${analysis.match.homeTeam} vs ${analysis.match.awayTeam}` || '새 분석'}
          </p>
          <p className="text-xs text-muted-foreground">{analysis.match.matchDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton analysis={analysis} />
          <ExportControls analysis={analysis} phase={currentPhase} />
          <JsonIO analysis={analysis} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(480px,1fr)_400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="sticky top-0 z-10 w-full max-w-md bg-background py-2">
            <PhaseTabs />
          </div>
          <ToolPalette />
          <div className="h-[65vh]" data-testid="editor-pitch" onPointerDown={() => setSelectedAnnotationId(null)}>
            <Pitch>
              {layers.channelGrid && <ChannelGrid halfSpaces={layers.halfSpaces} />}
              {layers.compactness && <CompactnessBox positions={phase.positions} />}
              {layers.pressingLine && (
                <PressingLine positions={phase.positions} pressingLineY={phase.pressingLineY} />
              )}
              {layers.overload && hasOpponent && <OverloadLayer phase={phase} />}
              {showGhost && previousPhase && (
                <GhostLayer
                  previousPositions={analysis.phases[previousPhase].positions}
                  currentPositions={phase.positions}
                />
              )}
              <AnnotationLayer
                annotations={phase.annotations}
                interactive={{
                  selectedId: selectedAnnotationId,
                  onSelect: setSelectedAnnotationId,
                  onRemove: (id) => {
                    removeAnnotation(id)
                    setSelectedAnnotationId(null)
                  },
                }}
              />
              {phase.opponentPositions?.map((pos, i) => (
                <OpponentNode key={i} slot={i} position={pos} />
              ))}
              {analysis.players.map((player) => {
                const pos = phase.positions.find((p) => p.playerId === player.id)
                if (!pos) return null
                return <PlayerNode key={player.id} player={player} position={pos} />
              })}
              <DrawOverlay tool={drawTool} />
            </Pitch>
          </div>
          <div className="flex w-full max-w-md items-center justify-between gap-3">
            <LayerToggleChips hasOpponent={hasOpponent} />
            <Button variant="outline" size="sm" onClick={hasOpponent ? removeOpponents : addOpponents}>
              {hasOpponent ? '상대팀 제거' : '상대팀 추가'}
            </Button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">경기 정보</h2>
            <MatchInfoForm match={analysis.match} />
          </section>

          <section>
            <CommentPanel phase={currentPhase} comment={phase.comment} summary={analysis.summary} />
          </section>

          <details className="group">
            <summary className="mb-2 cursor-pointer text-sm font-semibold text-foreground">
              선수 (선발 11 + 벤치 {Math.max(0, analysis.players.length - 11)})
            </summary>
            <div className="space-y-2">
              {analysis.players.map((player, i) => (
                <PlayerForm key={player.id} player={player} index={i} />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={analysis.players.length >= 23}
              onClick={addPlayer}
            >
              선수 추가
            </Button>
          </details>
        </div>
      </div>

      <BottomActionBar analysis={analysis} />
      <PlayerEditDialog />
    </div>
  )
}
