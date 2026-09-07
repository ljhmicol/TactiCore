import { MoveUpRight, MousePointer2, Route, Spline } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAnalysisStore } from '@/store/analysisStore'
import type { DrawTool } from '@/types/analysis'

const TOOLS: { id: DrawTool; label: string; hint: string; icon: typeof MousePointer2 }[] = [
  { id: 'select', label: '이동', hint: '선수를 드래그해 이동', icon: MousePointer2 },
  { id: 'run', label: '움직임', hint: '피치를 드래그해 실선 화살표 그리기', icon: MoveUpRight },
  { id: 'pass', label: '패스', hint: '피치를 드래그해 점선 화살표 그리기', icon: Route },
]

/**
 * 전술 그리기 도구 팔레트 (TO-DO 1번). 그리기 모드에서는 DrawOverlay가 선수
 * 드래그 대신 입력을 받는다. 화살표 삭제는 이동 모드에서 화살표 클릭 → ✕.
 *
 * "곡선" 토글(2026-09-07)은 별도 도구가 아니라 움직임/패스 도구에 적용되는
 * 보조 스위치다 — 오버래핑 풀백처럼 바깥으로 도는 움직임을 곡선으로 그릴 때
 * 켠다. 이동 도구에서는 의미가 없어 숨긴다.
 */
export function ToolPalette() {
  const drawTool = useAnalysisStore((s) => s.drawTool)
  const setDrawTool = useAnalysisStore((s) => s.setDrawTool)
  const curvedDraw = useAnalysisStore((s) => s.curvedDraw)
  const toggleCurvedDraw = useAnalysisStore((s) => s.toggleCurvedDraw)
  const active = TOOLS.find((t) => t.id === drawTool) ?? TOOLS[0]
  const showCurvedToggle = drawTool === 'run' || drawTool === 'pass'

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={drawTool === id ? 'default' : 'ghost'}
              onClick={() => setDrawTool(id)}
              className="gap-1.5 px-2.5"
              aria-pressed={drawTool === id}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        {showCurvedToggle && (
          <Button
            type="button"
            size="sm"
            variant={curvedDraw ? 'default' : 'outline'}
            onClick={toggleCurvedDraw}
            className="gap-1.5 px-2.5"
            aria-pressed={curvedDraw}
            title="오버래핑처럼 바깥으로 도는 움직임을 곡선으로 그립니다"
          >
            <Spline className="h-4 w-4" />
            곡선
          </Button>
        )}
      </div>
      <p className="truncate text-xs text-muted-foreground">{active.hint}</p>
    </div>
  )
}
