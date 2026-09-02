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
  const rawBodyText = textSource === 'summary' ? analysis.summary : phase.comment
  const cardHeight = ratio === '1:1' ? 1080 : 1350
  const bench = analysis.players.filter((p) => !phase.positions.some((pos) => pos.playerId === p.id))
  // 코멘트가 감독 프리셋처럼 길면 CSS만으로 자르다가 문장 중간을 그대로
  // 잘라내 버린다(사용자 리포트: "png보니까 짤린다"). 게다가 html-to-image가
  // 노드를 SVG로 복제·직렬화하는 과정에서 `-webkit-line-clamp`의 "…" 표시가
  // 재현되지 않는 걸 실측으로 확인했다 — 그래서 줄 수 대신 글자 수를 JS에서
  // 직접 계산해 자르고 "…"을 문자로 붙인다(항상 완전한 글자 단위로 잘림).
  // CJK 위주 텍스트라 fontSize(32px)를 글자 폭 근사치로 쓴다.
  const maxLines = ratio === '1:1' ? (bench.length > 0 ? 5 : 6) : bench.length > 0 ? 7 : 8
  const charsPerLine = Math.floor((1080 - 128) / 29)
  const maxChars = maxLines * charsPerLine
  const bodyText =
    rawBodyText.length > maxChars ? `${rawBodyText.slice(0, maxChars - 1).trimEnd()}…` : rawBodyText

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

        <div
          style={{
            flex: 1,
            minHeight: ratio === '1:1' ? 380 : 460,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
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
            maxHeight: maxLines * 32 * 1.5,
            overflow: 'hidden',
          }}
        >
          {bodyText}
        </div>

        {bench.length > 0 && (
          <div
            style={{
              fontSize: 22,
              color: SHARE_CARD_COLORS.subtitle,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            벤치 {bench.map((p) => `${p.number} ${p.name}`.trim()).join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
})
