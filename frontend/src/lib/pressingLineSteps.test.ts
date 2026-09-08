import { describe, expect, it } from 'vitest'

import { pressingLineLevel } from '@/lib/compactness'
import {
  currentBackLineY,
  currentPressingLineLevel,
  findGkPlayerId,
  PRESSING_LINE_LEVELS,
  shiftPositionsToPressingLevel,
} from '@/lib/pressingLineSteps'
import { createEmptyAnalysis } from '@/store/analysisStore'
import type { PlayerPosition } from '@/types/analysis'

const analysis = createEmptyAnalysis('4-3-3', {
  matchName: '테스트',
  homeTeam: '홈',
  awayTeam: '원정',
  matchDate: '2026-09-08',
  analyzedTeam: 'home',
})
const gkId = findGkPlayerId(analysis.players, analysis.formation)!
const basePositions = analysis.phases.base.positions // GK y=92, DF y=74/78, MF y=52/62, FW y=22/30 (formations.ts 4-3-3)

describe('findGkPlayerId', () => {
  it('4-3-3에서 players[0](GK)의 id를 찾는다', () => {
    expect(gkId).toBe(analysis.players[0].id)
  })
})

describe('currentBackLineY', () => {
  it('GK를 뺀 출전 선수 중 y 최댓값을 반환한다', () => {
    // 4-3-3 base: DF(y=74,78,78,74)가 GK(92) 다음으로 가장 깊다
    expect(currentBackLineY(basePositions, gkId)).toBe(78)
  })

  it('GK 없이(id 불일치) 넘기면 전원을 대상으로 계산한다', () => {
    expect(currentBackLineY(basePositions, 'no-such-id')).toBe(92) // GK 포함 최댓값
  })

  it('빈 배열이면 null', () => {
    expect(currentBackLineY([], gkId)).toBeNull()
  })
})

describe('currentPressingLineLevel', () => {
  it('currentBackLineY에 pressingLineLevel을 적용한 것과 같다', () => {
    const y = currentBackLineY(basePositions, gkId)!
    expect(currentPressingLineLevel(basePositions, gkId)).toBe(pressingLineLevel(y))
  })
})

describe('PRESSING_LINE_LEVELS', () => {
  it('5단계가 매우 높음→매우 낮음 순서다', () => {
    expect(PRESSING_LINE_LEVELS).toEqual(['매우 높음', '높음', '보통', '낮음', '매우 낮음'])
  })
})

describe('shiftPositionsToPressingLevel', () => {
  it('GK는 움직이지 않는다', () => {
    const result = shiftPositionsToPressingLevel(basePositions, gkId, '매우 높음')!
    const gkAfter = result.positions.find((p) => p.playerId === gkId)!
    const gkBefore = basePositions.find((p) => p.playerId === gkId)!
    expect(gkAfter).toEqual(gkBefore)
  })

  it('평행이동이라 라인 사이 간격(y차)이 그대로 보존된다', () => {
    const before = basePositions
    const result = shiftPositionsToPressingLevel(before, gkId, '보통')!
    const gapBefore = (a: string, b: string) =>
      before.find((p) => p.playerId === a)!.y - before.find((p) => p.playerId === b)!.y
    const gapAfter = (a: string, b: string) =>
      result.positions.find((p) => p.playerId === a)!.y - result.positions.find((p) => p.playerId === b)!.y
    // DF(players[1])와 FW(players[8]) 사이 간격 — GK 제외 임의의 두 outfield 선수로 검증
    const dfId = analysis.players[1].id
    const fwId = analysis.players[8].id
    expect(gapAfter(dfId, fwId)).toBeCloseTo(gapBefore(dfId, fwId), 5)
  })

  it('결과 pressingLineY가 실제로 이동한 백라인 y와 일치한다', () => {
    const result = shiftPositionsToPressingLevel(basePositions, gkId, '낮음')!
    const newBackY = currentBackLineY(result.positions, gkId)
    expect(result.pressingLineY).toBeCloseTo(newBackY!, 5)
  })

  it('선택한 단계에 맞는 라벨로 판정되는 y를 만든다(대형 내부 폭이 좁아 어느 단계로도 경계에 안 닿는 경우)', () => {
    // 4-3-3 base(DF 74~78 ~ FW 22~30, 56유닛 폭)는 실제로 "매우 높음"(목표 y=40)을
    // 요청하면 FW가 음수로 밀려나 델타가 잘려서 목표를 못 채운다 — 그건 버그가
    // 아니라 피치 밖으로 나갈 수 없다는 물리적 제약이 맞게 동작한 것이다. 여기서는
    // 대형 내부 폭이 좁은(10유닛) 픽스처로 5단계 전부가 경계에 안 닿는 조건을
    // 만들어 "요청한 단계 = 실제 결과 단계"를 검증한다.
    const compact: PlayerPosition[] = basePositions.map((p, i) =>
      p.playerId === gkId ? p : { ...p, y: 50 + (i % 3) * 5 }, // outfield y를 50~60 사이로 압축
    )
    for (const level of PRESSING_LINE_LEVELS) {
      const result = shiftPositionsToPressingLevel(compact, gkId, level)!
      expect(pressingLineLevel(result.pressingLineY)).toBe(level)
    }
  })

  // 회귀 테스트 — 델타를 개별 clamp하면 극단적인 단계 선택 시 어떤 선수만 피치
  // 경계에 눌려 간격 비율이 깨진다. 델타 자체를 줄여야 전원이 함께 멈춘다.
  it('극단적인 이동으로 경계에 닿아도 델타를 줄여서 전원이 함께 멈추고 개별 왜곡이 없다', () => {
    // FW가 이미 y=22까지 올라와 있는 4-3-3에서 "매우 낮음"(목표 y=95)으로
    // 보내면 이동량이 커서 자연스럽게 잘 들어가지만, 반대 극단(이미 매우 얕은
    // 포메이션에서 "매우 높음"으로 더 밀어올리는 경우)을 만들어 검증한다.
    const shallow: PlayerPosition[] = basePositions.map((p) => (p.playerId === gkId ? p : { ...p, y: p.y - 15 }))
    const result = shiftPositionsToPressingLevel(shallow, gkId, '매우 높음')!
    const outfield = result.positions.filter((p) => p.playerId !== gkId)
    // 아무도 0 밑으로 안 내려갔어야 한다
    for (const p of outfield) expect(p.y).toBeGreaterThanOrEqual(0)
    // 그리고 간격은 여전히 원본과 동일해야 한다(개별 왜곡 없음)
    const dfId = analysis.players[1].id
    const fwId = analysis.players[8].id
    const gapBefore = shallow.find((p) => p.playerId === dfId)!.y - shallow.find((p) => p.playerId === fwId)!.y
    const gapAfter =
      result.positions.find((p) => p.playerId === dfId)!.y - result.positions.find((p) => p.playerId === fwId)!.y
    expect(gapAfter).toBeCloseTo(gapBefore, 5)
  })

  it('출전 선수가 없으면(빈 배열) null을 반환한다', () => {
    expect(shiftPositionsToPressingLevel([], gkId, '보통')).toBeNull()
  })
})
