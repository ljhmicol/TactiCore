import { PITCH_LENGTH_M, PITCH_WIDTH_M } from '@/lib/zones'
import type { AnnotationType, Point } from '@/types/analysis'

/**
 * 화살표(전술 그리기) 렌더링 지원.
 *
 * Pitch가 preserveAspectRatio="none"(x/y 축척 다름)이라 그냥 그리면 화살촉이
 * 방향에 따라 일그러진다. 모든 기하를 "균일 축척 공간"(y에 K=105/68를 곱해
 * 실제 화면 비율과 맞춘 좌표계)에서 계산한 뒤 다시 피치 좌표로 되돌린다.
 * circularRadius()가 원을 축별로 보정하는 것과 같은 원리다.
 */
const K = PITCH_LENGTH_M / PITCH_WIDTH_M // y 단위가 화면에서 약 1.54배 길다

export interface ArrowGeometry {
  /** 화살대(선분)의 끝점 — 화살촉에 묻히지 않도록 머리 길이만큼 감소시킨다 */
  shaftEnd: Point
  /** 화살촉 삼각형. [0]이 tip(=to), [1]·[2]이 양 날 */
  head: [Point, Point, Point]
}

/** 균일 축척 공간에서 계산한 화살표 형상을 반환한다. */
export function arrowGeometry(from: Point, to: Point, headLength = 2.4, headWidth = 1.9): ArrowGeometry {
  // 균일 공간으로 올린다 (x는 그대로, y는 K배)
  const fx = from.x
  const fy = from.y * K
  const tx = to.x
  const ty = to.y * K
  const dx = tx - fx
  const dy = ty - fy
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return { shaftEnd: to, head: [to, to, to] }

  const ux = dx / len // 진행 방향 단위 벡터
  const uy = dy / len
  const px = -uy // 수직 방향 단위 벡터
  const py = ux
  const half = headWidth / 2

  // 균일 공간 좌표 → 피치 좌표
  const toPitch = (x: number, y: number): Point => ({ x, y: y / K })
  // tip에서 뒤로 d, 옆으로 w만큼 이동한 점
  const back = (d: number, w: number) => toPitch(tx + ux * d + px * w, ty + uy * d + py * w)

  const shaft = Math.max(0, len - headLength * 0.7)
  return {
    shaftEnd: toPitch(fx + ux * shaft, fy + uy * shaft),
    head: [to, back(-headLength, half), back(-headLength, -half)],
  }
}

/** 화살촉 배지를 피하면서 클릭 지점(선분 중점)을 구한다. */
export function arrowMidpoint(a: { from: Point; to: Point }): Point {
  return { x: (a.from.x + a.to.x) / 2, y: (a.from.y + a.to.y) / 2 }
}

export const ANNOTATION_MIN_LENGTH = 2.5 // 이보다 짧은 드래그는 실수로 간주해 버린다

export const ANNOTATION_STYLES: Record<AnnotationType, { stroke: string; dashed: boolean }> = {
  run: { stroke: '#F8FAFC', dashed: false }, // 실선 = 움직임(침투)
  pass: { stroke: '#FBBF24', dashed: true }, // 점선 = 패스
}
