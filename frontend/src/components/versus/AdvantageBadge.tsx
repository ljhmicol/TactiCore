import { CHANNEL_KOREAN, computeMatchupAdvantage, THIRD_KOREAN } from '@/lib/versusAdvantage'
import type { ZoneOverload } from '@/types/analysis'

const COLOR_A = '#38BDF8'
const COLOR_B = '#A78BFA'

interface AdvantageBadgeProps {
  zones: ZoneOverload[]
  labelA: string
  labelB: string
}

/**
 * 오버로드 15구역을 A/B 우세 구역 수로 요약한다. 확률(%)처럼 보이는 숫자는
 * 일부러 안 만든다 — 실제 경기 시뮬레이션이 아니라 지금 배치된 좌표의 구역별
 * 수적 우위일 뿐이다(TO-DO 22, 16번 "범위 밖" 메모 참조).
 */
export function AdvantageBadge({ zones, labelA, labelB }: AdvantageBadgeProps) {
  const { aZoneCount, bZoneCount, neutralZoneCount, totalZones, aTopZone, bTopZone } = computeMatchupAdvantage(zones)
  const third = THIRD_KOREAN(labelA, labelB)

  if (totalZones === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        두 전술 다 상대팀 좌표가 있어야 구역 우위를 계산할 수 있어요.
      </p>
    )
  }

  const aPct = (aZoneCount / totalZones) * 100
  const bPct = (bZoneCount / totalZones) * 100

  const zoneSentence = (label: string, color: string, z: ZoneOverload) => (
    <p className="text-sm" style={{ color }}>
      <strong>{label}</strong>: {CHANNEL_KOREAN[z.channel]} · {third[z.third]}에서 {z.own}:{z.opp}로 수적 우위
    </p>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span style={{ color: COLOR_A }}>
          {labelA} {aZoneCount}구역 우세
        </span>
        <span className="text-xs text-muted-foreground">전체 {totalZones}구역 중</span>
        <span style={{ color: COLOR_B }}>
          {labelB} {bZoneCount}구역 우세
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div style={{ width: `${aPct}%`, background: COLOR_A }} />
        <div style={{ width: `${neutralZoneCount === totalZones ? 100 : 100 - aPct - bPct}%` }} />
        <div style={{ width: `${bPct}%`, background: COLOR_B }} />
      </div>
      <div className="space-y-0.5">
        {aTopZone && zoneSentence(labelA, COLOR_A, aTopZone)}
        {bTopZone && zoneSentence(labelB, COLOR_B, bTopZone)}
        {!aTopZone && !bTopZone && <p className="text-sm text-muted-foreground">모든 구역이 동률입니다.</p>}
      </div>
    </div>
  )
}
