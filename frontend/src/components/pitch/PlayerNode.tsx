import { motion, type PanInfo } from 'framer-motion'
import { useState } from 'react'

import { clampCoord, clientToPitch } from '@/lib/coords'
import { circularRadius } from '@/lib/pitchMarkings'
import { positionInfoAt } from '@/lib/positions'
import { findTacticalRole } from '@/lib/tacticalRoles'
import { PLAYER_COLORS, POSITION_LINE_COLORS } from '@/lib/theme'
import { useAnalysisStore } from '@/store/analysisStore'
import type { Player, Point } from '@/types/analysis'

import { usePitchSvg } from './PitchContext'

interface PlayerNodeProps {
  player: Player
  position: Point
}

const OWN_RADIUS = circularRadius(PLAYER_COLORS.own.radius)

/**
 * key는 항상 player.id여야 한다 (배열 인덱스 금지) — 2단계 §8, 4단계 §5.1.
 * 국면 전환 시 이 규칙이 깨지면 선수들이 서로 자리를 바꾸는 애니메이션이 나온다.
 *
 * 위치는 <motion.g>의 transform(x/y)이 아니라 각 도형의 네이티브 SVG 속성
 * (ellipse의 cx/cy, text의 x/y)을 직접 animate한다. g의 transform은 SVG
 * 좌표계가 아니라 렌더링된 CSS 픽셀 기준으로 적용되어(이 프로젝트처럼
 * viewBox와 실제 렌더 크기가 다른 경우) 화면 밖으로 어긋난다.
 *
 * onTap은 드래그(pan) 없이 짧게 누른 경우에만 발생한다 — 선수 클릭 편집
 * 다이얼로그(TO-DO 13번)의 입력점. 그리기 모드에서는 DrawOverlay가 입력을
 * 가로채 여기까지 오지 않는다.
 *
 * 노드 색은 포지션 라인별로 칠한다(2026-09-01 사용자 요청 — GK 노랑/DF 파랑/
 * MF 초록/FW 빨강). 라인·포지션 코드는 포메이션 이름과 players 순서에서
 * 자동 도출하며(lib/positions.ts), 도출 불가 시 기존 단색으로 폴백한다.
 *
 * 원 위 라벨은 전술 역할이 지정돼 있으면 역할 이름, 없으면 포지션 코드를
 * 보여준다(2026-09-07 — "필드에서도 역할이 한눈에 보이게"). 역할이 포지션도
 * 함축하므로 둘 다 표시하지 않는다.
 */
export function PlayerNode({ player, position }: PlayerNodeProps) {
  const svgRef = usePitchSvg()
  const movePlayer = useAnalysisStore((s) => s.movePlayer)
  const setEditingPlayer = useAnalysisStore((s) => s.setEditingPlayer)
  const index = useAnalysisStore((s) => s.analysis?.players.findIndex((p) => p.id === player.id) ?? -1)
  const formation = useAnalysisStore((s) => s.analysis?.formation)
  const [dragging, setDragging] = useState(false)
  const transition = dragging ? { duration: 0 } : { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }
  const info = formation ? positionInfoAt(formation, index) : null
  const lineColor = info ? POSITION_LINE_COLORS[info.line] : null
  // 전술 역할이 지정돼 있으면 포지션 코드(LB, CB…) 대신 역할 이름을 원 위에
  // 보여준다 — "필드에서도 역할이 한눈에 보이게" 피드백(2026-09-07). 역할이
  // 포지션 정보를 이미 함축하므로(예: 타겟 포워드=ST) 코드와 나란히 두지
  // 않고 대체한다. 역할 라벨이 코드보다 길어서 폰트를 한 단계 줄인다.
  const role = findTacticalRole(player.tacticalRole)
  const topLabel = role?.label ?? info?.label
  const topLabelFontSize = role ? 1.4 : 1.7

  const handlePan = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (!svgRef.current) return
    const next = clientToPitch(svgRef.current, info.point.x, info.point.y)
    movePlayer(player.id, clampCoord(next.x), clampCoord(next.y))
  }

  return (
    <motion.g
      onPanStart={() => setDragging(true)}
      onPan={handlePan}
      onPanEnd={() => setDragging(false)}
      onTap={() => setEditingPlayer(player.id)}
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      <motion.ellipse
        initial={{ cx: position.x, cy: position.y }}
        animate={{ cx: position.x, cy: position.y }}
        transition={transition}
        rx={OWN_RADIUS.rx}
        ry={OWN_RADIUS.ry}
        fill={lineColor?.fill ?? PLAYER_COLORS.own.fill}
        stroke={PLAYER_COLORS.own.stroke}
        strokeOpacity={PLAYER_COLORS.own.strokeOpacity}
        strokeWidth={0.3}
      />
      {topLabel && (
        <motion.text
          initial={{ x: position.x, y: position.y - OWN_RADIUS.ry - 1.4 }}
          animate={{ x: position.x, y: position.y - OWN_RADIUS.ry - 1.4 }}
          transition={transition}
          fill={PLAYER_COLORS.own.fill}
          fillOpacity={0.9}
          fontSize={topLabelFontSize}
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >
          {topLabel}
        </motion.text>
      )}
      <motion.text
        initial={{ x: position.x, y: position.y }}
        animate={{ x: position.x, y: position.y }}
        transition={transition}
        fill={lineColor?.text ?? PLAYER_COLORS.own.text}
        fontSize={2.4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ userSelect: 'none' }}
      >
        {player.number}
      </motion.text>
      <motion.text
        initial={{ x: position.x, y: position.y + OWN_RADIUS.ry + 3 }}
        animate={{ x: position.x, y: position.y + OWN_RADIUS.ry + 3 }}
        transition={transition}
        fill="#F8FAFC"
        fontSize={2}
        fontWeight={700}
        textAnchor="middle"
        style={{ userSelect: 'none', paintOrder: 'stroke' }}
        stroke="#0F172A"
        strokeWidth={0.35}
        strokeOpacity={0.55}
      >
        {player.name}
      </motion.text>
    </motion.g>
  )
}
