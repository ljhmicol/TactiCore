import { forwardRef, useLayoutEffect, useRef, useState } from 'react'

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

/**
 * 텍스트가 boxHeight를 넘으면 "…"으로 자르는 대신 폰트 크기를 줄여서 전체가
 * 보이게 한다 — 사용자 리포트: "...으로 끝나면 차라리 없는 게 낫다". 실제
 * DOM 높이(scrollHeight)를 재는 방식이라 html-to-image가 캡처하는 시점에는
 * 이미 알맞은 크기로 그려진 상태다(레이아웃 이펙트 → 페인트 → 캡처 순서).
 */
function useFitFontSize(text: string, boxHeight: number, maxSize: number, minSize: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(maxSize)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let size = maxSize
    el.style.fontSize = `${size}px`
    while (el.scrollHeight > boxHeight && size > minSize) {
      size -= 1
      el.style.fontSize = `${size}px`
    }
    setFontSize(size)
  }, [text, boxHeight, maxSize, minSize])

  return { ref, fontSize }
}

interface ShareCardProps {
  analysis: Analysis
  phase: PhaseType
  ratio: '1:1' | '4:5'
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
  { analysis, phase: phaseType, ratio },
  ref,
) {
  const layers = useAnalysisStore((s) => s.layers)
  const phase = analysis.phases[phaseType]
  const hasOpponent = Boolean(phase.opponentPositions && phase.opponentPositions.length > 0)
  // 국면 코멘트는 감독 프리셋 기준 200자를 훌쩍 넘겨 카드에 넣기엔 항상 너무
  // 길었다(사용자 리포트: "png보니까 짤린다"). 코멘트 대신 '종합 평가'(짧은
  // 요약 문구, 2단계 §10)만 쓰기로 함 — 2026-09-02 사용자 결정.
  const cardHeight = ratio === '1:1' ? 1080 : 1350
  const bench = analysis.players.filter((p) => !phase.positions.some((pos) => pos.playerId === p.id))
  // "…"으로 잘라내는 방식은 여전히 안 좋아 보인다는 피드백 — 글자 수로 잘라
  // 말줄임표를 붙이는 대신 박스 높이에 맞을 때까지 폰트 크기를 줄인다. 그래도
  // 극단적으로 긴 입력(요약이 아니라 사실상 문단)에 대비해 400자에서 한 번은
  // 잘라낸다 — 이 한도는 정상적인 '짧은 요약' 사용에서는 걸릴 일이 없다.
  const bodyText = analysis.summary.length > 400 ? `${analysis.summary.slice(0, 399).trimEnd()}…` : analysis.summary
  const bodyBoxHeight = ratio === '1:1' ? (bench.length > 0 ? 150 : 190) : bench.length > 0 ? 190 : 240
  const { ref: bodyRef, fontSize: bodyFontSize } = useFitFontSize(bodyText, bodyBoxHeight, 32, 16)

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
          ref={bodyRef}
          style={{
            fontSize: bodyFontSize,
            color: SHARE_CARD_COLORS.body,
            lineHeight: 1.5,
            height: bodyBoxHeight,
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
