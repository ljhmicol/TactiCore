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

export interface CurvedArrowGeometry {
  /** SVG 경로 d 속성(2차 베지어) — from에서 시작해 control을 거쳐 to로 */
  path: string
  control: Point
  /** 화살촉 삼각형. [0]이 tip(=to), [1]·[2]이 양 날. 방향은 to 지점에서의
   * 베지어 접선(제어점→끝점)을 쓴다 — 직선 화살표와 달리 시작→끝 직선
   * 방향을 그대로 쓰면 곡선 끝에서 화살촉이 삐딱하게 보인다. */
  head: [Point, Point, Point]
}

const CURVE_BOW_RATIO = 0.16 // 현(직선 거리) 대비 바깥으로 부풀리는 비율

/**
 * 오버래핑 풀백처럼 바깥으로 도는 움직임을 곡선 화살표로 그린다
 * (2026-09-07 — "풀백들이 바깥으로 해서 오버랩하면 곡선 형태로도 표현").
 * 부풀리는 방향은 항상 피치 중앙(x=50)에서 더 멀어지는 쪽 — 오버랩처럼
 * 터치라인 쪽으로 도는 움직임이 대부분이라 방향을 사용자가 고르게 하는
 * 대신 자동으로 "바깥쪽"을 택한다.
 *
 * 2차 베지어의 중점(t=0.5)은 `0.25*from + 0.5*control + 0.25*to`라서,
 * 현의 중점에서 실제로 bow만큼 부풀리려면 control을 중점에서 `2*bow`만큼
 * 밀어야 한다(대수적으로 유도됨) — arrowGeometry와 같은 균일 축척(K) 공간
 * 에서 계산해야 화면 비율 왜곡 없이 대칭으로 부풀어 보인다.
 */
export function curvedArrowGeometry(from: Point, to: Point, headLength = 2.4, headWidth = 1.9): CurvedArrowGeometry {
  const fx = from.x
  const fy = from.y * K
  const tx = to.x
  const ty = to.y * K
  const dx = tx - fx
  const dy = ty - fy
  const len = Math.hypot(dx, dy)
  const toPitch = (x: number, y: number): Point => ({ x, y: y / K })
  if (len < 1e-6) return { path: `M ${from.x} ${from.y}`, control: from, head: [to, to, to] }

  const ux = dx / len
  const uy = dy / len
  let px = -uy // 수직 방향 후보 (부호는 아래서 "바깥쪽"으로 고른다)
  let py = ux

  const mx = (fx + tx) / 2
  const my = (fy + ty) / 2
  const bow = len * CURVE_BOW_RATIO
  // x는 균일 공간에서도 그대로이므로(K는 y에만 곱함) 중앙(50)에서 더 멀어지는
  // 쪽을 그대로 비교해 고를 수 있다.
  const distIfPositive = Math.abs(mx + px * bow - 50)
  const distIfNegative = Math.abs(mx - px * bow - 50)
  if (distIfNegative > distIfPositive) {
    px = -px
    py = -py
  }
  const cx = mx + px * bow * 2
  const cy = my + py * bow * 2
  const control = toPitch(cx, cy)

  // to 지점에서의 접선(제어점 → 끝점) 방향으로 화살촉을 세운다.
  const tdx = tx - cx
  const tdy = ty - cy
  const tlen = Math.hypot(tdx, tdy) || 1
  const tux = tdx / tlen
  const tuy = tdy / tlen
  const tpx = -tuy
  const tpy = tux
  const half = headWidth / 2
  const back = (d: number, w: number) => toPitch(tx + tux * d + tpx * w, ty + tuy * d + tpy * w)

  return {
    path: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    control,
    head: [to, back(-headLength, half), back(-headLength, -half)],
  }
}

/**
 * 2차 베지어 위의 t(0~1) 지점을 피치 좌표로 구한다. 베지어는 아핀 변환과
 * 교환되므로(curve(affine(P)) = affine(curve(P))) 균일 축척 공간이 아니라
 * curvedArrowGeometry가 이미 피치 좌표로 되돌려놓은 control을 그대로 써도
 * 화면에 그려지는 실제 곡선 위의 점과 일치한다 — PassBall이 곡선 패스를
 * 따라가는 데 쓴다.
 */
export function bezierPoint(from: Point, control: Point, to: Point, t: number): Point {
  const mt = 1 - t
  return {
    x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
    y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y,
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
