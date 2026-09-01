import { CHANNEL_BOUNDS } from '@/lib/zones'
import { LAYER_COLORS } from '@/lib/theme'

const INNER_BOUNDARIES = [
  CHANNEL_BOUNDS.leftWing[1], // 20
  CHANNEL_BOUNDS.leftHalf[1], // 36.5
  CHANNEL_BOUNDS.center[1], // 63.5
  CHANNEL_BOUNDS.rightHalf[1], // 80
]

/** 5채널 경계선(점선) + 하프스페이스(채널 2·4) 강조 채움 (2단계 §3.1, §12.3). */
export function ChannelGrid({ halfSpaces }: { halfSpaces: boolean }) {
  const [leftHalfX0, leftHalfX1] = CHANNEL_BOUNDS.leftHalf
  const [rightHalfX0, rightHalfX1] = CHANNEL_BOUNDS.rightHalf

  return (
    <g>
      {halfSpaces && (
        <g fill={LAYER_COLORS.halfSpaces.color} fillOpacity={LAYER_COLORS.halfSpaces.opacity}>
          <rect x={leftHalfX0} y={0} width={leftHalfX1 - leftHalfX0} height={100} />
          <rect x={rightHalfX0} y={0} width={rightHalfX1 - rightHalfX0} height={100} />
        </g>
      )}
      <g stroke={LAYER_COLORS.channelGrid.color} strokeOpacity={LAYER_COLORS.channelGrid.opacity} strokeWidth={0.25}>
        {INNER_BOUNDARIES.map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={100} strokeDasharray="0.6 0.8" />
        ))}
      </g>
    </g>
  )
}
