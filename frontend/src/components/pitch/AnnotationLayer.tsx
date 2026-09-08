import { motion } from 'framer-motion'
import { useMemo } from 'react'

import {
  ANNOTATION_STYLES,
  annotationSamplePoints,
  arrowGeometry,
  arrowMidpoint,
  buildPassChains,
  chainSamplePoints,
  curvedArrowGeometry,
} from '@/lib/annotations'
import { PLAYER_COLORS } from '@/lib/theme'
import { circularRadius } from '@/lib/pitchMarkings'
import type { Annotation, Point } from '@/types/analysis'

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
const RUN_GHOST_RADIUS = circularRadius(PLAYER_COLORS.own.radius) // 선수 노드와 같은 크기

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
 * 수비수에서 미드필더로 가고, 공격수로 이어지게"). run 화살표는 선수 색
 * 반투명 원(RunGhost)이 화살표 방향으로 왕복한다 — "선수가 화살표로
 * 이동하는 방향으로 이동하는 모션" 요청. 둘 다 화살표 자체(모양·클릭
 * 판정)는 원래 개별 annotation 단위 그대로다 — 공/유령 애니메이션만
 * 체인 또는 개별 단위로 얹힌다.
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
            {ann.type === 'run' && <RunGhost annotation={ann} />}
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
 * 점 목록(2개 이상)을 따라 반복 왕복하는 원 — 공(PassChainBall)과 선수
 * 유령(RunGhost)이 공유하는 애니메이션 엔진. cx/cy를 직접 animate하는
 * 방식은 PlayerNode와 같다 — preserveAspectRatio="none" 환경에서 g의
 * transform 대신 도형 고유 속성을 animate해야 어긋나지 않는다.
 *
 * 구간마다 소요 시간을 실제 거리 비례로 배분한다(`times`) — 안 그러면
 * 짧은 구간과 긴 구간을 같은 시간에 지나가버려 부자연스럽다. 구간이 2개
 * 이상(체인)이면 각 꼭짓점에서 갑자기 느려지지 않도록 linear로, 단일
 * 구간이면 기존처럼 easeInOut으로 부드럽게 시작·끝난다.
 *
 * PNG 캡처(ShareCard)는 애니메이션 완료를 기다리지 않고 그 순간 상태를
 * 그대로 찍는다(lib/exportImage.ts) — 무한 반복이라 매번 다른 위치에서
 * 캡처되지만, "경로 위 어딘가"는 정적 이미지로도 자연스러워 별도 처리하지
 * 않는다.
 */
function TravelingMarker({
  points,
  radius,
  fill,
  fillOpacity = 1,
  stroke,
  strokeWidth = 0.25,
  strokeOpacity = 1,
  segmentDuration,
  repeatDelay,
}: {
  points: Point[]
  radius: { rx: number; ry: number }
  fill: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  strokeOpacity?: number
  segmentDuration: number
  repeatDelay: number
}) {
  if (points.length < 2) return null

  const distances = [0]
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  }
  const total = distances[distances.length - 1]
  const times = total > 1e-6 ? distances.map((d) => d / total) : points.map((_, i) => i / (points.length - 1))
  const segments = points.length - 1

  return (
    <motion.ellipse
      rx={radius.rx}
      ry={radius.ry}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
      pointerEvents="none"
      initial={{ cx: points[0].x, cy: points[0].y }}
      animate={{ cx: points.map((p) => p.x), cy: points.map((p) => p.y) }}
      transition={{
        duration: segmentDuration * segments,
        times,
        ease: segments > 1 ? 'linear' : 'easeInOut',
        repeat: Infinity,
        repeatDelay,
      }}
    />
  )
}

/** 연결된 패스 체인을 따라 흐르는 공 — "패스가 실제로 연결되는 걸 보여지게". */
function PassChainBall({ chain }: { chain: Annotation[] }) {
  const points = chainSamplePoints(chain)
  return (
    <TravelingMarker
      points={points}
      radius={BALL_RADIUS}
      fill="#F8FAFC"
      stroke="#0F172A"
      strokeWidth={0.25}
      strokeOpacity={0.6}
      segmentDuration={1.1}
      repeatDelay={0.6}
    />
  )
}

/**
 * 움직임 화살표를 따라 왕복하는 반투명 선수 색 원 — "선수가 이미 이동돼
 * 있어서 화살표 끝부분이 안 보인다"는 문제를 화살표 자체를 고치는 대신,
 * 실제로 그 방향으로 움직이는 걸 보여줘서 보완한다(2026-09-07 요청).
 * GhostLayer의 잔상과 같은 톤(PLAYER_COLORS.ghost.fillOpacity)을 쓴다.
 */
function RunGhost({ annotation }: { annotation: Annotation }) {
  const points = annotationSamplePoints(annotation)
  return (
    <TravelingMarker
      points={points}
      radius={RUN_GHOST_RADIUS}
      fill={PLAYER_COLORS.own.fill}
      fillOpacity={PLAYER_COLORS.ghost.fillOpacity}
      segmentDuration={1.4}
      repeatDelay={0.8}
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
