import { describe, expect, it } from 'vitest'

import { FORMATIONS, FORMATION_NAMES } from '@/lib/formations'
import { POSITION_LINE_KOREAN, positionInfoAt } from '@/lib/positions'

/** 전 포메이션 라벨 검증 — labels는 formation 인덱스 순서(GK→DF→MF→FW)와 대응 */
const EXPECTED: Record<string, string[]> = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'ST'],
  '3-5-2': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
  '3-4-3': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'CM', 'CM', 'RWB', 'LW', 'ST', 'RW'],
  '3-4-2-1': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'DM', 'DM', 'RWB', 'AM', 'AM', 'ST'],
  '3-5-1-1': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'AM', 'ST'],
  '3-6-1': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'CM', 'CM', 'CM', 'CM', 'RWB', 'ST'],
  '4-1-2-1-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'],
  '4-3-1-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'ST', 'ST'],
  '4-3-2-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'AM', 'ST'],
  '4-2-2-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'AM', 'ST', 'ST'],
  '4-4-1-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'AM', 'ST'],
  '4-1-4-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'LW', 'AM', 'AM', 'RW', 'ST'],
  '4-5-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST'],
  '4-2-4': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
  '5-3-2': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
  '5-4-1': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'LM', 'CM', 'CM', 'RM', 'ST'],
}

describe('positionInfoAt', () => {
  it('전 포메이션(18종)의 슬롯별 라벨이 규약 표와 일치한다', () => {
    for (const name of FORMATION_NAMES) {
      const expected = EXPECTED[name]
      expect(expected, `${name} 검증 테이블 누락`).toBeDefined()
      expect(FORMATIONS[name], `${name} 좌표는 11개`).toHaveLength(expected.length)
      expected.forEach((label, i) => {
        expect(positionInfoAt(name, i)?.label, `${name} idx${i}`).toBe(label)
      })
    }
  })

  it('라인 구분은 GK 1명, DF 첫 라인, FW 마지막 라인 규약을 따른다', () => {
    expect(positionInfoAt('4-2-3-1', 0)?.line).toBe('GK')
    for (let i = 1; i <= 4; i++) expect(positionInfoAt('4-2-3-1', i)?.line).toBe('DF')
    for (let i = 5; i <= 9; i++) expect(positionInfoAt('4-2-3-1', i)?.line).toBe('MF')
    expect(positionInfoAt('4-2-3-1', 10)?.line).toBe('FW')
  })

  it('3백에서만 첫 MF 라인 바깥이 윙백(LWB/RWB)이다 — 4백은 LM/RM', () => {
    expect(positionInfoAt('3-4-3', 4)?.label).toBe('LWB')
    expect(positionInfoAt('3-5-2', 4)?.label).toBe('LWB')
    expect(positionInfoAt('4-4-2', 5)?.label).toBe('LM')
    expect(positionInfoAt('5-4-1', 6)?.label).toBe('LM') // 5백의 윙백은 DF 라인 안
  })

  it('여러 MF 라인은 깊이 순으로 DM → CM → AM 라벨을 가진다 (4-1-2-1-2 마름모)', () => {
    expect(positionInfoAt('4-1-2-1-2', 5)?.label).toBe('DM')
    expect(positionInfoAt('4-1-2-1-2', 7)?.label).toBe('CM')
    expect(positionInfoAt('4-1-2-1-2', 8)?.label).toBe('AM')
  })

  it('파싱 불가능한 포메이션 이름은 null을 돌려준다 (단색 노드 폴백)', () => {
    expect(positionInfoAt('커스텀', 3)).toBeNull()
    expect(positionInfoAt('4-4', 3)).toBeNull() // 라인 합계 8
    expect(positionInfoAt('4-x-2', 3)).toBeNull()
    expect(positionInfoAt('4-4-2', 99)).toBeNull()
  })

  it('라인 한국어 이름이 4종 모두 정의돼 있다', () => {
    expect(Object.values(POSITION_LINE_KOREAN)).toEqual(['골키퍼', '수비', '미드필더', '공격'])
  })
})
