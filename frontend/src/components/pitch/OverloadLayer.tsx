import { computeOverload } from '@/lib/overload'
import { LAYER_COLORS } from '@/lib/theme'
import { CHANNEL_BOUNDS, THIRD_BOUNDS } from '@/lib/zones'
import type { PhaseData } from '@/types/analysis'

/**
 * 15구역 채색. strong/weak는 같은 색(노랑)의 농도 차이로만 구분하고, 색만으로
 * 구분하지 않도록 +2/+1 숫자 라벨을 함께 표기한다 (2단계 §12.3 — 색각 이상 대응).
 */
export function OverloadLayer({ phase }: { phase: PhaseData }) {
  const zones = computeOverload(phase)

  return (
    <g>
      {zones
        .filter((z) => z.level !== 'none')
        .map((z) => {
          const [x0, x1] = CHANNEL_BOUNDS[z.channel]
          const [y0, y1] = THIRD_BOUNDS[z.third]
          const style = LAYER_COLORS.overload[z.level as 'strong' | 'weak']
          return (
            <g key={`${z.channel}-${z.third}`}>
              <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={style.color} fillOpacity={style.opacity} />
              <text
                x={(x0 + x1) / 2}
                y={(y0 + y1) / 2}
                fill="#78350F"
                fontSize={2.6}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                +{z.diff}
              </text>
            </g>
          )
        })}
    </g>
  )
}
