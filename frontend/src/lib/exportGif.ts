import { GIFEncoder, quantize, applyPalette } from 'gifenc'

import { PHASE_TRANSITION_MS } from '@/store/analysisStore'
import type { Analysis, PhaseType, PlayerPosition } from '@/types/analysis'

const PHASE_ORDER: PhaseType[] = ['base', 'attack', 'defense']
const TRANSITION_STEPS = 12 // 국면 사이 보간 샘플 수
const HOLD_MS = 1100 // 정지 국면을 보여주는 시간

export interface GifFrameSpec {
  phase: PhaseType
  positions: PlayerPosition[]
  delayMs: number
}

/** 표준 easeInOutCubic — 편집 화면의 cubic-bezier([0.4,0,0.2,1]) 전환과 체감이 비슷하다. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * from→to를 playerId 기준으로 선형 보간한다. t에는 이미 이징이 적용돼
 * 있다고 가정한다(호출부에서 easeInOutCubic을 먼저 씌운다).
 */
export function interpolatePositions(from: PlayerPosition[], to: PlayerPosition[], t: number): PlayerPosition[] {
  const toById = new Map(to.map((p) => [p.playerId, p]))
  return from.map((f) => {
    const target = toById.get(f.playerId)
    if (!target) return f
    return { playerId: f.playerId, x: f.x + (target.x - f.x) * t, y: f.y + (target.y - f.y) * t }
  })
}

/**
 * 기본→공격→수비→(기본으로 순환)으로 이어지는 프레임 시퀀스를 만든다
 * (TO-DO 6번). 각 국면은 정지 프레임 하나로 표현하고 — 같은 정지 프레임을
 * 여러 장 찍는 대신 delay 값 하나로 "머무는 시간"을 표현해 인코딩할 프레임
 * 수를 크게 줄인다 — 국면 사이는 TRANSITION_STEPS 단계로 보간해 편집
 * 화면의 모프 애니메이션(PHASE_TRANSITION_MS, easeInOut)과 체감 속도를
 * 맞춘다. 화살표·상대팀처럼 위치 보간이 필요 없는 요소는 국면이 바뀌는
 * "시작" 시점에 곧바로 도착 국면 것으로 전환한다 — 편집 화면에서 국면
 * 탭을 누르면 코멘트 패널이 즉시 바뀌고 선수 위치만 뒤따라 움직이는
 * 것과 같은 규칙이다. AnimatedShareCard가 frame.phase로 그 국면의
 * 코멘트·상대팀·화살표를 그대로 조회해서 이 규칙을 구현한다.
 */
export function buildGifFrameSpecs(analysis: Analysis): GifFrameSpec[] {
  const frames: GifFrameSpec[] = []
  for (let i = 0; i < PHASE_ORDER.length; i++) {
    const current = PHASE_ORDER[i]
    const next = PHASE_ORDER[(i + 1) % PHASE_ORDER.length]
    frames.push({ phase: current, positions: analysis.phases[current].positions, delayMs: HOLD_MS })

    const fromPositions = analysis.phases[current].positions
    const toPositions = analysis.phases[next].positions
    for (let step = 1; step <= TRANSITION_STEPS; step++) {
      const t = easeInOutCubic(step / TRANSITION_STEPS)
      frames.push({
        phase: next,
        positions: interpolatePositions(fromPositions, toPositions, t),
        delayMs: Math.round(PHASE_TRANSITION_MS / TRANSITION_STEPS),
      })
    }
  }
  return frames
}

export interface CapturedFrame {
  canvas: HTMLCanvasElement
  delayMs: number
}

/**
 * 캡처된 프레임(canvas + delay)들을 GIF89a 바이너리로 인코딩한다.
 * 프레임마다 개별 팔레트를 256색으로 양자화한다(gifenc는 프레임별 로컬
 * 팔레트를 지원 — 전체 시퀀스에 팔레트 하나를 억지로 맞추는 것보다
 * 화질이 낫다). 이 앱의 색은 사진이 아니라 평면색 위주라 256색 제한이
 * 거의 티 나지 않는다. repeat: 0으로 무한 반복 재생되게 한다.
 */
export function encodeGif(frames: CapturedFrame[]): Blob {
  const gif = GIFEncoder()
  for (const { canvas, delayMs } of frames) {
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    const { width, height } = canvas
    const data = ctx.getImageData(0, 0, width, height).data
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    // repeat 기본값(0=무한 반복)은 첫 프레임에서만 실제로 쓰이지만, 매
    // 프레임에 같은 값을 넘겨도 무해하다 — 명시적으로 남겨 의도를 드러낸다.
    gif.writeFrame(index, width, height, { palette, delay: delayMs, repeat: 0 })
  }
  gif.finish()
  // gif.bytes()의 반환 타입(Uint8Array<ArrayBufferLike>)이 BlobPart가 요구하는
  // Uint8Array<ArrayBuffer>보다 넓어서(SharedArrayBuffer 가능성 포함) 그대로
  // 넘기면 타입 에러가 난다 — 복사 생성자로 진짜 ArrayBuffer 기반 배열을 만든다.
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}
