import { describe, expect, it } from 'vitest'

import { convertKeys, toCamel, toSnake } from '@/lib/api'

describe('convertKeys', () => {
  it('일반 객체 키를 snake_case로 변환한다', () => {
    const result = convertKeys({ matchName: 'A vs B', homeTeam: 'A' }, toSnake)
    expect(result).toEqual({ match_name: 'A vs B', home_team: 'A' })
  })

  it('phases 맵의 직계 키(base/attack/defense)는 변환하지 않는다', () => {
    const input = {
      matchName: 'A vs B',
      phases: {
        base: { pressingLineY: 68, positions: [] },
        attack: { pressingLineY: 60, positions: [] },
      },
    }
    const result = convertKeys(input, toSnake) as Record<string, unknown>
    expect(Object.keys(result)).toContain('match_name')
    const phases = result.phases as Record<string, unknown>
    // phases의 키 자체는 그대로, 값 내부 필드는 정상 변환
    expect(Object.keys(phases)).toEqual(['base', 'attack'])
    expect((phases.base as Record<string, unknown>).pressing_line_y).toBe(68)
  })

  it('camelCase로 되돌릴 때도 phases 직계 키를 보존한다', () => {
    const input = {
      match_name: 'A vs B',
      phases: { base: { pressing_line_y: 68 }, attack: { pressing_line_y: 60 } },
    }
    const result = convertKeys(input, toCamel) as Record<string, unknown>
    expect(result.matchName).toBe('A vs B')
    const phases = result.phases as Record<string, unknown>
    expect(Object.keys(phases)).toEqual(['base', 'attack'])
    expect((phases.base as Record<string, unknown>).pressingLineY).toBe(68)
  })

  it('배열 안의 객체도 재귀적으로 변환한다', () => {
    const result = convertKeys([{ playerId: 'p1' }], toSnake)
    expect(result).toEqual([{ player_id: 'p1' }])
  })
})
