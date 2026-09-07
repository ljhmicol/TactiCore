import type { Channel, Third, ZoneOverload } from '@/types/analysis'

/**
 * 전술 대결 뷰의 "우위" 표시(TO-DO 22) — 실제 경기 결과 예측이 아니라 오버로드
 * 15구역 계산을 A/B 양쪽 기준으로 다시 센 것뿐이다. 확률(%)처럼 보이는 숫자는
 * 일부러 만들지 않는다(TO-DO-LIST.md 16번 "범위 밖" 참조) — 실제 시뮬레이션
 * 없이 승률을 보여주면 진짜 예측처럼 오해되기 쉽다.
 *
 * computeOverload는 "own(A) 기준으로 own이 앞선 구역"만 strong/weak로
 * 표시하도록 만들어져 있다(단일 팀 에디터 뷰용) — 여기서는 그 결과의
 * diff 부호를 그대로 이용해 B가 앞선 구역도 대칭적으로 센다.
 */
export interface MatchupAdvantage {
  aZoneCount: number
  bZoneCount: number
  neutralZoneCount: number
  totalZones: number
  aTopZone: ZoneOverload | null
  bTopZone: ZoneOverload | null
}

export const CHANNEL_KOREAN: Record<Channel, string> = {
  leftWing: '왼쪽 측면',
  leftHalf: '왼쪽 하프스페이스',
  center: '중앙',
  rightHalf: '오른쪽 하프스페이스',
  rightWing: '오른쪽 측면',
}

/** third는 own(A) 기준 y좌표라 A/B 공수와 무관하게 "누구 골문 근처인지"로 표기한다. */
export const THIRD_KOREAN: (labelA: string, labelB: string) => Record<Third, string> = (labelA, labelB) => ({
  attacking: `${labelB} 골문 근처`,
  middle: '중원',
  defensive: `${labelA} 골문 근처`,
})

export function computeMatchupAdvantage(zones: ZoneOverload[]): MatchupAdvantage {
  let aTopZone: ZoneOverload | null = null
  let bTopZone: ZoneOverload | null = null
  let aZoneCount = 0
  let bZoneCount = 0
  let neutralZoneCount = 0

  for (const z of zones) {
    if (z.diff > 0) {
      aZoneCount += 1
      if (!aTopZone || z.diff > aTopZone.diff) aTopZone = z
    } else if (z.diff < 0) {
      bZoneCount += 1
      if (!bTopZone || z.diff < bTopZone.diff) bTopZone = z
    } else {
      neutralZoneCount += 1
    }
  }

  return { aZoneCount, bZoneCount, neutralZoneCount, totalZones: zones.length, aTopZone, bTopZone }
}
