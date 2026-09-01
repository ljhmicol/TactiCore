import { useRef, type ReactNode } from 'react'

import { CENTER_CIRCLE, GOAL_AREA, PENALTY_AREA, PENALTY_SPOT_Y } from '@/lib/pitchMarkings'
import { PITCH_COLORS } from '@/lib/theme'

import { PitchSvgProvider } from './PitchContext'

interface PitchProps {
  children?: ReactNode
}

/**
 * SVG 루트. viewBox="0 0 100 100"에 좌표를 그대로 사용한다.
 *
 * preserveAspectRatio="none"을 쓴다: 컨테이너는 실제 피치 비율(68:105)로
 * 고정되어 있고, viewBox는 정사각형(100x100)이라 "meet"을 쓰면 상하에
 * 레터박스 여백이 생겨 피치가 카드 프레임을 꽉 채우지 못한다. "none"으로
 * x/y를 독립적으로 늘리면 여백 없이 채워지는 대신 x/y 축척이 달라지므로,
 * 원형이어야 하는 요소(선수 노드, 센터서클)는 축별 m 환산값으로 rx/ry를
 * 따로 계산해 시각적으로 다시 원으로 보이게 한다 (lib/pitchMarkings.ts).
 */
export function Pitch({ children }: PitchProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <div className="mx-auto aspect-[68/105] h-full max-h-full w-full max-w-full">
      <PitchSvgProvider value={svgRef}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          style={{ background: PITCH_COLORS.background }}
        >
          <g
            fill="none"
            stroke={PITCH_COLORS.line}
            strokeOpacity={PITCH_COLORS.lineOpacity}
            strokeWidth={PITCH_COLORS.lineWidth}
          >
            <rect x={0.5} y={0.5} width={99} height={99} />
            <line x1={0} y1={50} x2={100} y2={50} />
            <ellipse cx={50} cy={50} rx={CENTER_CIRCLE.rx} ry={CENTER_CIRCLE.ry} />

            {/* 상대 골문 (y=0) 페널티/골 지역 */}
            <rect
              x={50 - PENALTY_AREA.halfWidth}
              y={0}
              width={PENALTY_AREA.halfWidth * 2}
              height={PENALTY_AREA.depth}
            />
            <rect x={50 - GOAL_AREA.halfWidth} y={0} width={GOAL_AREA.halfWidth * 2} height={GOAL_AREA.depth} />

            {/* 자팀 골문 (y=100) 페널티/골 지역 */}
            <rect
              x={50 - PENALTY_AREA.halfWidth}
              y={100 - PENALTY_AREA.depth}
              width={PENALTY_AREA.halfWidth * 2}
              height={PENALTY_AREA.depth}
            />
            <rect
              x={50 - GOAL_AREA.halfWidth}
              y={100 - GOAL_AREA.depth}
              width={GOAL_AREA.halfWidth * 2}
              height={GOAL_AREA.depth}
            />
          </g>
          <g fill={PITCH_COLORS.line} fillOpacity={PITCH_COLORS.lineOpacity}>
            <ellipse cx={50} cy={50} rx={0.35} ry={0.35 * (68 / 105)} />
            <ellipse cx={50} cy={PENALTY_SPOT_Y} rx={0.35} ry={0.35 * (68 / 105)} />
            <ellipse cx={50} cy={100 - PENALTY_SPOT_Y} rx={0.35} ry={0.35 * (68 / 105)} />
          </g>

          {children}
        </svg>
      </PitchSvgProvider>
    </div>
  )
}
