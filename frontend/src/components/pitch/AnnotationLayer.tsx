import { motion } from 'framer-motion'

import { ANNOTATION_STYLES, arrowGeometry, arrowMidpoint, bezierPoint, curvedArrowGeometry } from '@/lib/annotations'
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
const BALL_SAMPLE_TS = [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1] // 곡선 패스 애니메이션용 베지어 샘플

/**
 * 국면의 화살표(움직임/패스)를 그린다. 편집 화면과 PNG 카드(ShareCard)가 같은
 * 컴포넌트를 쓴다 — 데이터 기반 재렌더링이라 export에 자동으로 포함된다.
 *
 * 선분·화살촉은 preserveAspectRatio="none" 왜곡을 피하기 위해 lib/annotations의
 * 균일 축척 기하를 쓴다. 굵기는 기존 레이어(압박라인 0.5)와 같은 user-unit 관례를
 * 따른다 — 화면·카드 크기에 비례해 보인다.
 *
 * pass 타입 화살표에는 시작→끝을 반복 왕복하는 작은 공(PassBall)을 얹는다
 * (2026-09-07 — "패스가 연결되는 걸 시각적으로 보여지게").
 */
export function AnnotationLayer({ annotations, interactive }: AnnotationLayerProps) {
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
            {ann.type === 'pass' && <PassBall annotation={ann} control={curvedGeo?.control} />}
            {selected && interactive && <DeleteBadge annotation={ann} onRemove={interactive.onRemove} />}
          </g>
        );
      })}
    </g>
  )
}

/**
 * 패스 화살표를 따라 시작점→끝점으로 반복 이동하는 작은 공 — "패스가
 * 실제로 연결되는 걸 시각적으로 보여지게" (2026-09-07 요청). 화살표는
 * 방향만 알려줄 뿐 "볼이 거기로 간다"는 느낌은 약해서, 실제로 움직이는
 * 공을 얹었다. cx/cy를 직접 animate하는 방식은 PlayerNode와 같다 —
 * preserveAspectRatio="none" 환경에서 g의 transform 대신 도형 고유
 * 속성을 animate해야 어긋나지 않는다.
 *
 * PNG 캡처(ShareCard)는 애니메이션 완료를 기다리지 않고 그 순간 상태를
 * 그대로 찍는다(lib/exportImage.ts) — 무한 반복 애니메이션이라 매번 다른
 * 위치에서 캡처되지만, "패스 경로 위 어딘가의 공"은 정적 이미지로도
 * 자연스러워 별도 처리를 하지 않는다.
 *
 * curved 패스(곡선 토글은 원래 움직임용이지만 패스에도 걸 수 있다)는 직선
 * 보간이 아니라 bezierPoint로 곡선 위 점 8개를 샘플링해 그 경로를 따라가게
 * 한다 — 직선 보간을 쓰면 공이 곡선을 가로질러 뚫고 지나가 버린다.
 */
function PassBall({ annotation, control }: { annotation: Annotation; control?: Point }) {
  const cxKeyframes = control
    ? BALL_SAMPLE_TS.map((t) => bezierPoint(annotation.from, control, annotation.to, t).x)
    : [annotation.from.x, annotation.to.x]
  const cyKeyframes = control
    ? BALL_SAMPLE_TS.map((t) => bezierPoint(annotation.from, control, annotation.to, t).y)
    : [annotation.from.y, annotation.to.y]

  return (
    <motion.ellipse
      rx={BALL_RADIUS.rx}
      ry={BALL_RADIUS.ry}
      fill="#F8FAFC"
      stroke="#0F172A"
      strokeWidth={0.25}
      strokeOpacity={0.6}
      pointerEvents="none"
      initial={{ cx: annotation.from.x, cy: annotation.from.y }}
      animate={{ cx: cxKeyframes, cy: cyKeyframes }}
      transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
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
