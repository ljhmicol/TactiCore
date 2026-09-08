import { motion } from 'framer-motion'
import { useMemo } from 'react'

import {
  ANNOTATION_STYLES,
  arrowGeometry,
  arrowMidpoint,
  buildPassChains,
  chainSamplePoints,
  curvedArrowGeometry,
  travelTimes,
} from '@/lib/annotations'
import { PLAYER_COLORS } from '@/lib/theme'
import { circularRadius } from '@/lib/pitchMarkings'
import type { Annotation } from '@/types/analysis'

interface AnnotationLayerProps {
  annotations: Annotation[]
  /** 편집기에서만 전달 — 클릭 선택/삭제. ShareCard 등 정적 렌더링은 생략한다 */
  interactive?: {
    selectedId: string | null
    onSelect: (id: string) => void
    onRemove: (id: string) => void
  }
}

const BADGE_RADIUS = circularRadius(1.7)
const DELETE_OFFSET = 2.2 // 선분 중점에서 화살표 진행 방향의 수직으로 치울 거리
const BALL_RADIUS = circularRadius(1.1)
// 구간(하나의 패스)당 소요 시간(초) — "패스 되는 공 속도가 너무 느려" 피드백(2026-09-08)으로
// 기존 1.1초에서 0.45초로 단축(약 2.4배 빠름).
const BALL_SEGMENT_DURATION = 0.45

/**
 * 국면의 화살표(움직임/패스)를 그린다. 편집 화면과 PNG 카드(ShareCard)가 같은
 * 컴포넌트를 쓴다 — 데이터 기반 재렌더링이라 export에 자동으로 포함된다.
 *
 * 선분·화살촉은 preserveAspectRatio="none" 왜곡을 피하기 위해 lib/annotations의
 * 균일 축척 기하를 쓴다. 굵기는 기존 레이어(압박라인 0.5)와 같은 user-unit 관례를
 * 따른다 — 화면·카드 크기에 비례해 보인다.
 *
 * pass 화살표는 끝점이 이어지면(수비수→미드필더→공격수처럼) 하나의 공이
 * 전체 경로를 순서대로 흐르게 한다(buildPassChains, 2026-09-07 — "패스가
 * 수비수에서 미드필더로 가고, 공격수로 이어지게").
 *
 * run 화살표는 여기서 별도 유령을 그리지 않는다(2026-09-07, 2차 — "투명한
 * 원 말고 선수 노드 자체가 움직이게") — 실제 선수 노드(PlayerNode)가 자기
 * 시작점 근처에서 시작하는 run 화살표를 찾아 스스로 그 방향으로 왕복한다.
 * 화살표는 여기서 모양·클릭 판정만 그린다.
 */
export function AnnotationLayer({ annotations, interactive }: AnnotationLayerProps) {
  const passChains = useMemo(
    () => buildPassChains(annotations.filter((a) => a.type === 'pass')),
    [annotations],
  )

  return (
    <g>
      {annotations.map((ann) => {
        const style = ANNOTATION_STYLES[ann.type]
        const curvedGeo = ann.curved ? curvedArrowGeometry(ann.from, ann.to) : null
        const straightGeo = curvedGeo ? null : arrowGeometry(ann.from, ann.to)
        const head = curvedGeo ? curvedGeo.head : straightGeo!.head
        const selected = interactive?.selectedId === ann.id
        return (
          <g key={ann.id} className={interactive ? 'cursor-pointer' : undefined}>
            {/* 클릭 판정용 투명 굵은 선 — 곡선도 대충 직선으로 잡아도 클릭 판정엔 충분하다 */}
            {interactive && (
              <line
                x1={ann.from.x}
                y1={ann.from.y}
                x2={ann.to.x}
                y2={ann.to.y}
                stroke="transparent"
                strokeWidth={3.5}
                pointerEvents="stroke"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  interactive.onSelect(ann.id)
                }}
              />
            )}
            {curvedGeo ? (
              <path
                d={curvedGeo.path}
                fill="none"
                stroke={style.stroke}
                strokeWidth={selected ? 0.7 : 0.5}
                strokeLinecap="round"
                strokeDasharray={style.dashed ? '1.6 1.2' : undefined}
                opacity={0.95}
                pointerEvents="none"
              />
            ) : (
              <line
                x1={ann.from.x}
                y1={ann.from.y}
                x2={straightGeo!.shaftEnd.x}
                y2={straightGeo!.shaftEnd.y}
                stroke={style.stroke}
                strokeWidth={selected ? 0.7 : 0.5}
                strokeLinecap="round"
                strokeDasharray={style.dashed ? '1.6 1.2' : undefined}
                opacity={0.95}
                pointerEvents="none"
              />
            )}
            <polygon
              points={head.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={style.stroke}
              opacity={0.95}
              pointerEvents="none"
            />
            {selected && interactive && <DeleteBadge annotation={ann} onRemove={interactive.onRemove} />}
          </g>
        );
      })}
      {passChains.map((chain) => (
        <PassChainBall key={chain.map((a) => a.id).join('-')} chain={chain} />
      ))}
    </g>
  )
}

/**
 * 연결된 패스 체인을 따라 흐르는 공 — "패스가 실제로 연결되는 걸 보여지게".
 * cx/cy를 직접 animate하는 방식은 PlayerNode와 같다 — preserveAspectRatio=
 * "none" 환경에서 g의 transform 대신 도형 고유 속성을 animate해야 어긋나지
 * 않는다. 구간마다 소요 시간을 실제 거리 비례로 배분한다(`travelTimes`) —
 * 안 그러면 짧은 구간과 긴 구간을 같은 시간에 지나가버려 부자연스럽다.
 * 구간이 2개 이상(체인)이면 각 꼭짓점에서 갑자기 느려지지 않도록 linear로,
 * 단일 구간이면 easeInOut으로 부드럽게 시작·끝난다.
 *
 * PNG 캡처(ShareCard)는 애니메이션 완료를 기다리지 않고 그 순간 상태를
 * 그대로 찍는다(lib/exportImage.ts) — 무한 반복이라 매번 다른 위치에서
 * 캡처되지만, "경로 위 어딘가"는 정적 이미지로도 자연스러워 별도 처리하지
 * 않는다.
 */
function PassChainBall({ chain }: { chain: Annotation[] }) {
  const points = chainSamplePoints(chain)
  if (points.length < 2) return null
  const segments = points.length - 1

  return (
    <motion.ellipse
      rx={BALL_RADIUS.rx}
      ry={BALL_RADIUS.ry}
      fill="#F8FAFC"
      stroke="#0F172A"
      strokeWidth={0.25}
      strokeOpacity={0.6}
      pointerEvents="none"
      initial={{ cx: points[0].x, cy: points[0].y }}
      animate={{ cx: points.map((p) => p.x), cy: points.map((p) => p.y) }}
      transition={{
        duration: BALL_SEGMENT_DURATION * segments,
        times: travelTimes(points),
        ease: segments > 1 ? 'linear' : 'easeInOut',
        repeat: Infinity,
        repeatDelay: 0.6,
      }}
    />
  )
}

/** 선택된 화살표 중점 옆의 ✕ 배지 — 누르면 삭제한다. */
function DeleteBadge({ annotation, onRemove }: { annotation: Annotation; onRemove: (id: string) => void }) {
  const mid = arrowMidpoint(annotation)
  // 진행 방향의 수직 방향으로 치워 화살대를 가리지 않는다
  const dx = annotation.to.x - annotation.from.x
  const dy = annotation.to.y - annotation.from.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const cx = mid.x + nx * DELETE_OFFSET
  const cy = mid.y + ny * DELETE_OFFSET

  return (
    <g
      onPointerDown={(e) => {
        e.stopPropagation()
        onRemove(annotation.id)
      }}
      style={{ cursor: 'pointer' }}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={BADGE_RADIUS.rx}
        ry={BADGE_RADIUS.ry}
        fill={PLAYER_COLORS.ghost.pathStroke}
        fillOpacity={0.9}
      />
      <text
        x={cx}
        y={cy}
        fontSize={2.4}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0F172A"
        style={{ userSelect: 'none' }}
      >
        ✕
      </text>
    </g>
  )
}
