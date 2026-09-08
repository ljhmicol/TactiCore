/**
 * gifenc는 타입 선언을 제공하지 않는다(순수 JS 패키지) — lib/exportGif.ts가
 * 쓰는 함수만 최소한으로 선언한다. 실제 시그니처는
 * node_modules/gifenc/src/index.js·palettize.js·pnnquant2.js 참조.
 */
declare module 'gifenc' {
  export interface GIFEncoderWriteFrameOptions {
    transparent?: boolean
    transparentIndex?: number
    delay?: number // 밀리초
    palette?: number[][] | null
    repeat?: number // -1=한 번, 0=무한 반복, 양수=반복 횟수
    colorDepth?: number
    dispose?: number
  }

  export interface GIFEncoderInstance {
    reset(): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GIFEncoderWriteFrameOptions): void
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GIFEncoderInstance

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: 'rgb565' | 'rgb444' | 'rgba4444' },
  ): number[][]

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb565' | 'rgb444' | 'rgba4444',
  ): Uint8Array
}
