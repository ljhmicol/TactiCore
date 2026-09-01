import type { Channel, Third } from '@/types/analysis'

// 2단계 §3.1 — 페널티 지역·골 지역 폭을 연장한 실제 기준선 (균등 20% 분할이 아님)
export const CHANNEL_BOUNDS: Record<Channel, [number, number]> = {
  leftWing: [0, 20],
  leftHalf: [20, 36.5],
  center: [36.5, 63.5],
  rightHalf: [63.5, 80],
  rightWing: [80, 100],
}

export const THIRD_BOUNDS: Record<Third, [number, number]> = {
  attacking: [0, 33.3],
  middle: [33.3, 66.7],
  defensive: [66.7, 100],
}

export const CHANNELS: Channel[] = ['leftWing', 'leftHalf', 'center', 'rightHalf', 'rightWing']
export const THIRDS: Third[] = ['attacking', 'middle', 'defensive']

/** 실측 환산 (105m x 68m) */
export const PITCH_LENGTH_M = 105 // y축 = 길이
export const PITCH_WIDTH_M = 68 // x축 = 폭
