import { useRef, useState } from 'react'

import { ANNOTATION_MIN_LENGTH, ANNOTATION_STYLES, arrowGeometry, curvedArrowGeometry } from '@/lib/annotations'
import { clampCoord, clientToPitch } from '@/lib/coords'
import { useAnalysisStore } from '@/store/analysisStore'
import type { DrawTool } from '@/types/analysis'

import { usePitchSvg } from './PitchContext'

/**
 * 그리기 모드(DrawTool !== 'select')일 때 피치 전체를 덮는 입력 레이어.
 * Pitch children 중 가장 마지막(최상단)에 렌더링해야 선수 드래그보다 우선한다.
 * 이동 모드에서는 pointer-events를 꺼 완전히 투명해진다.
 *
 * 그리는 중의 임시 화살표(draft)도 여기에 그린다 — 확정 전에는 스토어에 안 넣는다.
 * curvedDraw(2026-09-07)가 켜져 있으면 draft부터 곡선으로 미리 보여준다 —
 * 확정된 뒤(AnnotationLayer)와 그리는 중 모양이 달라지면 헷갈린다.
 */
export function DrawOverlay({ tool }: { tool: DrawTool }) {
  const svgRef = usePitchSvg()
  const addAnnotation = useAnalysisStore((s) => s.addAnnotation)
  const curvedDraw = useAnalysisStore((s) => s.curvedDraw)
  const [draft, setDraft] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const active = useRef(false)

  if (tool === 'select') return null

  const toPitchPoint = (clientX: number, clientY: number) => {
    const p = clientToPitch(svgRef.current!, clientX, clientY)
    return { x: clampCoord(p.x), y: clampCoord(p.y) }
  }

  const handleDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    active.current = true
    setDraft({ from: toPitchPoint(e.clientX, e.clientY), to: toPitchPoint(e.clientX, e.clientY) })
  }

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!active.current || !draft) return
    setDraft({ ...draft, to: toPitchPoint(e.clientX, e.clientY) })
  }

  const handleUp = () => {
    active.current = false
    if (draft) {
      const dx = draft.to.x - draft.from.x
      const dy = draft.to.y - draft.from.y
      if (Math.hypot(dx, dy) >= ANNOTATION_MIN_LENGTH) {
        addAnnotation(tool, draft.from, draft.to, curvedDraw)
      }
    }
    setDraft(null)
  }

  const style = ANNOTATION_STYLES[tool]
  const straightGeo = draft && !curvedDraw ? arrowGeometry(draft.from, draft.to) : null
  const curvedGeo = draft && curvedDraw ? curvedArrowGeometry(draft.from, draft.to) : null

  return (
    <g>
      {straightGeo && draft && (
        <g pointerEvents="none" opacity={0.7}>
          <line
            x1={draft.from.x}
            y1={draft.from.y}
            x2={straightGeo.shaftEnd.x}
            y2={straightGeo.shaftEnd.y}
            stroke={style.stroke}
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeDasharray={style.dashed ? '1.6 1.2' : undefined}
          />
          <polygon points={straightGeo.head.map((p) => `${p.x},${p.y}`).join(' ')} fill={style.stroke} />
        </g>
      )}
      {curvedGeo && (
        <g pointerEvents="none" opacity={0.7}>
          <path
            d={curvedGeo.path}
            fill="none"
            stroke={style.stroke}
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeDasharray={style.dashed ? '1.6 1.2' : undefined}
          />
          <polygon points={curvedGeo.head.map((p) => `${p.x},${p.y}`).join(' ')} fill={style.stroke} />
        </g>
      )}
      <rect
        x={0}
        y={0}
        width={100}
        height={100}
        fill="transparent"
        style={{ cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
    </g>
  )
}
