import { motion, type PanInfo } from 'framer-motion'
import { useState } from 'react'

import { clampCoord, clientToPitch } from '@/lib/coords'
import { circularRadius } from '@/lib/pitchMarkings'
import { PLAYER_COLORS } from '@/lib/theme'
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
 */
export function PlayerNode({ player, position }: PlayerNodeProps) {
  const svgRef = usePitchSvg()
  const movePlayer = useAnalysisStore((s) => s.movePlayer)
  const [dragging, setDragging] = useState(false)
  const transition = dragging ? { duration: 0 } : { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }

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
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      <motion.ellipse
        initial={{ cx: position.x, cy: position.y }}
        animate={{ cx: position.x, cy: position.y }}
        transition={transition}
        rx={OWN_RADIUS.rx}
        ry={OWN_RADIUS.ry}
        fill={PLAYER_COLORS.own.fill}
        stroke={PLAYER_COLORS.own.stroke}
        strokeOpacity={PLAYER_COLORS.own.strokeOpacity}
        strokeWidth={0.3}
      />
      <motion.text
        initial={{ x: position.x, y: position.y }}
        animate={{ x: position.x, y: position.y }}
        transition={transition}
        fill={PLAYER_COLORS.own.text}
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
        fill={PLAYER_COLORS.own.text}
        fontSize={2}
        textAnchor="middle"
        style={{ userSelect: 'none' }}
      >
        {player.name}
      </motion.text>
    </motion.g>
  )
}
