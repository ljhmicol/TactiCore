import { ANNOTATION_STYLES, arrowGeometry, arrowMidpoint } from '@/lib/annotations'
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

/**
 * 국면의 화살표(움직임/패스)를 그린다. 편집 화면과 PNG 카드(ShareCard)가 같은
 * 컴포넌트를 쓴다 — 데이터 기반 재렌더링이라 export에 자동으로 포함된다.
 *
 * 선분·화살촉은 preserveAspectRatio="none" 왜곡을 피하기 위해 lib/annotations의
 * 균일 축척 기하를 쓴다. 굵기는 기존 레이어(압박라인 0.5)와 같은 user-unit 관례를
 * 따른다 — 화면·카드 크기에 비례해 보인다.
 */
export function AnnotationLayer({ annotations, interactive }: AnnotationLayerProps) {
  return (
    <g>
      {annotations.map((ann) => {
        const style = ANNOTATION_STYLES[ann.type]
        const geo = arrowGeometry(ann.from, ann.to)
        const selected = interactive?.selectedId === ann.id
        return (
          <g key={ann.id} className={interactive ? 'cursor-pointer' : undefined}>
            {/* 클릭 판정용 투명 굵은 선 */}
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
            <line
              x1={ann.from.x}
              y1={ann.from.y}
              x2={geo.shaftEnd.x}
              y2={geo.shaftEnd.y}
              stroke={style.stroke}
              strokeWidth={selected ? 0.7 : 0.5}
              strokeLinecap="round"
              strokeDasharray={style.dashed ? '1.6 1.2' : undefined}
              opacity={0.95}
              pointerEvents="none"
            />
            <polygon
              points={geo.head.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={style.stroke}
              opacity={0.95}
              pointerEvents="none"
            />
            {selected && interactive && <DeleteBadge annotation={ann} onRemove={interactive.onRemove} />}
          </g>
        );
      })}
    </g>
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
