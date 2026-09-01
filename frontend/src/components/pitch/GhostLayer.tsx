import { circularRadius } from '@/lib/pitchMarkings'
import { PLAYER_COLORS } from '@/lib/theme'
import type { PlayerPosition } from '@/types/analysis'

interface GhostLayerProps {
  previousPositions: PlayerPosition[]
  currentPositions: PlayerPosition[]
}

const GHOST_RADIUS = circularRadius(PLAYER_COLORS.own.radius)

/**
 * 전환 직전 국면의 잔상(opacity 0.25) + 이전→현재 위치를 잇는 점선 경로 (2단계 §8).
 * 정적 스냅샷이므로 애니메이션하지 않는다 — 매 프레임 재계산할 이유가 없다.
 */
export function GhostLayer({ previousPositions, currentPositions }: GhostLayerProps) {
  return (
    <g>
      {previousPositions.map((prev) => {
        const curr = currentPositions.find((p) => p.playerId === prev.playerId)
        return (
          <line
            key={`path-${prev.playerId}`}
            x1={prev.x}
            y1={prev.y}
            x2={curr?.x ?? prev.x}
            y2={curr?.y ?? prev.y}
            stroke={PLAYER_COLORS.ghost.pathStroke}
            strokeOpacity={PLAYER_COLORS.ghost.pathStrokeOpacity}
            strokeDasharray={PLAYER_COLORS.ghost.pathDasharray}
            strokeWidth={0.3}
          />
        )
      })}
      {previousPositions.map((prev) => (
        <ellipse
          key={`ghost-${prev.playerId}`}
          cx={prev.x}
          cy={prev.y}
          rx={GHOST_RADIUS.rx}
          ry={GHOST_RADIUS.ry}
          fill={PLAYER_COLORS.own.fill}
          fillOpacity={PLAYER_COLORS.ghost.fillOpacity}
        />
      ))}
    </g>
  )
}
