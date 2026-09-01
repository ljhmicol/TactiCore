import { forwardRef } from 'react'

import { AnnotationLayer } from '@/components/pitch/AnnotationLayer'
import { ChannelGrid } from '@/components/pitch/ChannelGrid'
import { CompactnessBox } from '@/components/pitch/CompactnessBox'
import { OpponentNode } from '@/components/pitch/OpponentNode'
import { OverloadLayer } from '@/components/pitch/OverloadLayer'
import { Pitch } from '@/components/pitch/Pitch'
import { PlayerNode } from '@/components/pitch/PlayerNode'
import { PressingLine } from '@/components/pitch/PressingLine'
import { SHARE_CARD_COLORS } from '@/lib/theme'
import { useAnalysisStore } from '@/store/analysisStore'
import type { Analysis, PhaseType } from '@/types/analysis'

const PHASE_LABELS: Record<PhaseType, string> = { base: '기본', attack: '공격', defense: '수비' }

interface ShareCardProps {
  analysis: Analysis
  phase: PhaseType
  ratio: '1:1' | '4:5'
  textSource: 'comment' | 'summary'
}

/**
 * 고정 1080px 카드 노드 (2단계 §10, §12.5). 화면을 그대로 캡처하지 않고
 * 반응형 뷰포트와 분리된 이 노드를 별도로 캡처한다.
 *
 * 화면 밖 배치(`left:-9999px`)는 이 컴포넌트가 반환하는 바깥쪽 래퍼에만 둔다.
 * html-to-image에 넘기는 ref는 안쪽(카드 자체) 노드를 가리켜야 한다 — 캡처
 * 대상 노드 자신에 `position:absolute;left:-9999px`가 걸려 있으면, 노드를
 * 복제해 SVG로 직렬화하는 과정에서 그 오프셋이 그대로 다시 적용되어 콘텐츠가
 * 캡처 영역 밖으로 밀려나 빈 이미지가 나온다.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { analysis, phase: phaseType, ratio, textSource },
  ref,
) {
  const layers = useAnalysisStore((s) => s.layers)
  const phase = analysis.phases[phaseType]
  const hasOpponent = Boolean(phase.opponentPositions && phase.opponentPositions.length > 0)
  const bodyText = textSource === 'summary' ? analysis.summary : phase.comment
  const cardHeight = ratio === '1:1' ? 1080 : 1350

  return (
    <div style={{ position: 'absolute', left: -9999, top: 0 }}>
      <div
        ref={ref}
        style={{
          width: 1080,
          height: cardHeight,
          background: SHARE_CARD_COLORS.background,
          padding: 64,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          fontFamily: 'system-ui, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, color: SHARE_CARD_COLORS.title }}>
            {analysis.match.matchName || `${analysis.match.homeTeam} vs ${analysis.match.awayTeam}`}
          </div>
          <div style={{ fontSize: 28, color: SHARE_CARD_COLORS.subtitle, marginTop: 8 }}>
            {analysis.match.matchDate}
            {analysis.match.competition ? ` · ${analysis.match.competition}` : ''}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: SHARE_CARD_COLORS.phaseLabel, marginTop: 12 }}>
            {PHASE_LABELS[phaseType]} 국면
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ height: '100%' }}>
            <Pitch>
              {layers.channelGrid && <ChannelGrid halfSpaces={layers.halfSpaces} />}
              {layers.compactness && <CompactnessBox positions={phase.positions} />}
              {layers.pressingLine && (
                <PressingLine positions={phase.positions} pressingLineY={phase.pressingLineY} />
              )}
              {layers.overload && hasOpponent && <OverloadLayer phase={phase} />}
              <AnnotationLayer annotations={phase.annotations} />
              {phase.opponentPositions?.map((pos, i) => (
                <OpponentNode key={i} slot={i} position={pos} />
              ))}
              {analysis.players.map((player) => {
                const pos = phase.positions.find((p) => p.playerId === player.id)
                if (!pos) return null
                return <PlayerNode key={player.id} player={player} position={pos} />
              })}
            </Pitch>
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            color: SHARE_CARD_COLORS.body,
            lineHeight: 1.5,
            maxHeight: 220,
            overflow: 'hidden',
          }}
        >
          {bodyText}
        </div>
      </div>
    </div>
  )
})
