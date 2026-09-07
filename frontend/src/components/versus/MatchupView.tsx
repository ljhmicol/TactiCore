import { ChannelGrid } from '@/components/pitch/ChannelGrid'
import { OverloadLayer } from '@/components/pitch/OverloadLayer'
import { Pitch } from '@/components/pitch/Pitch'
import { PressingLine } from '@/components/pitch/PressingLine'
import { StaticPlayerNode } from '@/components/pitch/StaticPlayerNode'
import { mirrorPoint } from '@/lib/coords'
import type { Analysis, PhaseData, PhaseType, PlayerPosition } from '@/types/analysis'

interface MatchupViewProps {
  analysisA: Analysis
  analysisB: Analysis
  /** 어느 쪽이 공격 국면인지 — 나머지 한쪽은 자동으로 수비 국면이 된다 */
  attacker: 'A' | 'B'
  showChannelGrid: boolean
  showOverload: boolean
  showPressingLine: boolean
}

/**
 * 두 분석을 한 피치에 겹친다. A는 저장된 좌표 그대로(자팀 골 y=100), B는
 * 180도 회전(lib/coords.mirrorPoint)해서 B의 골문이 A가 공격하는 방향
 * (y=0)에 오도록 맞춘다 — 그래야 "A 공격이 B 수비를 어떻게 깨는지"가
 * 실제 마주 선 두 팀처럼 겹쳐 보인다. y만 뒤집으면 좌우 플랭크가 실제와
 * 반대로 그려지므로 x도 함께 뒤집는다.
 */
export function MatchupView({
  analysisA,
  analysisB,
  attacker,
  showChannelGrid,
  showOverload,
  showPressingLine,
}: MatchupViewProps) {
  const phaseA: PhaseType = attacker === 'A' ? 'attack' : 'defense'
  const phaseB: PhaseType = attacker === 'B' ? 'attack' : 'defense'
  const dataA = analysisA.phases[phaseA]
  const dataB = analysisB.phases[phaseB]

  const positionsB: PlayerPosition[] = dataB.positions.map((p) => ({ playerId: p.playerId, ...mirrorPoint(p) }))

  // 오버로드는 기존 computeOverload(own vs opponentPositions)를 그대로 재사용한다 —
  // A를 own, 미러링한 B를 opponent로 두면 15구역 우위 계산이 그대로 맞아떨어진다.
  const syntheticPhase: PhaseData = {
    positions: dataA.positions,
    opponentPositions: positionsB.map(({ x, y }) => ({ x, y })),
    comment: '',
    annotations: [],
  }

  // 압박 라인은 "수비하는 쪽"의 것만 보여준다 — 이 뷰의 관심사는 그 블록이
  // 어디서 시작되는지다. 값이 수동 지정돼 있으면 미러링해서 넘기고, 없으면
  // 이미 미러링된 좌표 배열을 그대로 넘겨 PressingLine이 자동 산출하게 둔다.
  const defendingPositions = phaseA === 'defense' ? dataA.positions : positionsB
  const defendingPressingLineY =
    phaseA === 'defense' ? dataA.pressingLineY : dataB.pressingLineY !== undefined ? 100 - dataB.pressingLineY : undefined

  return (
    <Pitch>
      {showChannelGrid && <ChannelGrid halfSpaces />}
      {showPressingLine && <PressingLine positions={defendingPositions} pressingLineY={defendingPressingLineY} />}
      {showOverload && <OverloadLayer phase={syntheticPhase} />}
      {analysisA.players.map((player, index) => {
        const pos = dataA.positions.find((p) => p.playerId === player.id)
        if (!pos) return null
        return (
          <StaticPlayerNode
            key={`a-${player.id}`}
            player={player}
            position={pos}
            formation={analysisA.formation}
            index={index}
            variant="A"
          />
        )
      })}
      {analysisB.players.map((player, index) => {
        const pos = positionsB.find((p) => p.playerId === player.id)
        if (!pos) return null
        return (
          <StaticPlayerNode
            key={`b-${player.id}`}
            player={player}
            position={pos}
            formation={analysisB.formation}
            index={index}
            variant="B"
          />
        )
      })}
    </Pitch>
  )
}
