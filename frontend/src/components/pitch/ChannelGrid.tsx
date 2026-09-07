import { transposeRect } from '@/lib/coords'
import { CHANNEL_BOUNDS } from '@/lib/zones'
import { LAYER_COLORS } from '@/lib/theme'

const INNER_BOUNDARIES = [
  CHANNEL_BOUNDS.leftWing[1], // 20
  CHANNEL_BOUNDS.leftHalf[1], // 36.5
  CHANNEL_BOUNDS.center[1], // 63.5
  CHANNEL_BOUNDS.rightHalf[1], // 80
]

interface ChannelGridProps {
  halfSpaces: boolean
  /** landscape는 전술 대결 뷰(TO-DO 21) 전용 — 채널 경계가 세로 띠 대신 가로 띠로 바뀐다. */
  orientation?: 'portrait' | 'landscape'
}

/** 5채널 경계선(점선) + 하프스페이스(채널 2·4) 강조 채움 (2단계 §3.1, §12.3). */
export function ChannelGrid({ halfSpaces, orientation = 'portrait' }: ChannelGridProps) {
  const landscape = orientation === 'landscape'
  const [leftHalfX0, leftHalfX1] = CHANNEL_BOUNDS.leftHalf
  const [rightHalfX0, rightHalfX1] = CHANNEL_BOUNDS.rightHalf

  const halfSpaceRects = landscape
    ? [transposeRect(leftHalfX0, leftHalfX1, 0, 100), transposeRect(rightHalfX0, rightHalfX1, 0, 100)]
    : [
        { x: leftHalfX0, y: 0, width: leftHalfX1 - leftHalfX0, height: 100 },
        { x: rightHalfX0, y: 0, width: rightHalfX1 - rightHalfX0, height: 100 },
      ]

  return (
    <g>
      {halfSpaces && (
        <g fill={LAYER_COLORS.halfSpaces.color} fillOpacity={LAYER_COLORS.halfSpaces.opacity}>
          {halfSpaceRects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} />
          ))}
        </g>
      )}
      <g stroke={LAYER_COLORS.channelGrid.color} strokeOpacity={LAYER_COLORS.channelGrid.opacity} strokeWidth={0.25}>
        {INNER_BOUNDARIES.map((x) =>
          landscape ? (
            <line key={x} x1={0} y1={x} x2={100} y2={x} strokeDasharray="0.6 0.8" />
          ) : (
            <line key={x} x1={x} y1={0} x2={x} y2={100} strokeDasharray="0.6 0.8" />
          ),
        )}
      </g>
    </g>
  )
}
