import { PITCH_LENGTH_M, PITCH_WIDTH_M } from '@/lib/zones'
import type { PlayerPosition } from '@/types/analysis'

/**
 * GK 판별은 role 문자열이 아니라 y가 가장 큰 선수 1명으로 한다 (2단계 §9).
 * role은 자유 입력이라 "골키퍼"/"GK"/빈 값이 섞여 신뢰할 수 없다.
 * 압박 라인과 콤팩트니스가 이 헬퍼를 공유한다 (4단계 §5.4/5.5).
 */
export function outfieldPlayers(positions: PlayerPosition[]): PlayerPosition[] {
  const sorted = [...positions].sort((a, b) => b.y - a.y)
  return sorted.slice(1)
}

/** pressingLineY가 수동 지정되어 있으면 이 함수를 호출하지 않고 그 값을 그대로 쓴다. */
export function autoPressingLine(positions: PlayerPosition[]): number {
  const sorted = [...positions].sort((a, b) => b.y - a.y)
  return sorted[1]?.y ?? sorted[0]?.y ?? 0
}

export type PressingLineLevel = '매우 높음' | '높음' | '보통' | '낮음' | '매우 낮음'

/**
 * "압박 라인 y=82" 같은 숫자 표기는 y=0이 상대 골문이라는 좌표 규약을 모르면
 * 못 읽는다(2026-09-07 사용자 피드백). y가 작을수록(상대 골문에 가까울수록)
 * "높은 라인"이라는 축구 용어에 맞춰 5단계로 바꾼다.
 *
 * 경계값(2026-09-08 재조정, "수비라인이 하프라인 근처면 매우 높음으로"
 * 피드백) — 처음엔 0~100을 20 단위로 균등 5분할해서 하프라인(y=50)이
 * "보통"으로 분류됐는데, 실제 축구에서 수비 라인이 하프라인 근처까지
 * 올라오는 건 이미 극단적으로 높은(오프사이드 트랩을 노리는) 라인이라
 * "보통"은 과소평가였다. 하프라인을 "매우 높음"의 경계로 삼고, 나머지는
 * 자기 진영 안에서 촘촘하게(15/15/10/10 단위) 나눈다.
 */
export function pressingLineLevel(y: number): PressingLineLevel {
  if (y <= 50) return '매우 높음'
  if (y <= 65) return '높음'
  if (y <= 80) return '보통'
  if (y <= 90) return '낮음'
  return '매우 낮음'
}

export interface CompactnessResult {
  box: { x: number; y: number; width: number; height: number }
  verticalM: number
  horizontalM: number
}

export function computeCompactness(positions: PlayerPosition[]): CompactnessResult | null {
  const outfield = outfieldPlayers(positions)
  if (outfield.length === 0) return null

  const minX = Math.min(...outfield.map((p) => p.x))
  const maxX = Math.max(...outfield.map((p) => p.x))
  const minY = Math.min(...outfield.map((p) => p.y))
  const maxY = Math.max(...outfield.map((p) => p.y))

  return {
    box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    verticalM: +(((maxY - minY) * PITCH_LENGTH_M) / 100).toFixed(1), // y축 = 길이 105m
    horizontalM: +(((maxX - minX) * PITCH_WIDTH_M) / 100).toFixed(1), // x축 = 폭 68m
  }
}
