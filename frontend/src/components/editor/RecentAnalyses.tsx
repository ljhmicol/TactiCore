import { Link } from 'react-router-dom'

import { useAnalyses } from '@/hooks/useAnalyses'
import { useServerHealth } from '@/hooks/useServerHealth'

const RECENT_COUNT = 5

/**
 * 홈("/") 빈 화면에 최근 저장한 분석을 보여준다. 서버가 꺼져 있거나 저장된
 * 분석이 없으면 아무것도 렌더링하지 않는다 — 빈 화면 안내문만 남는다.
 * 목록은 백엔드가 이미 updated_at desc로 정렬해 준다(crud.py list_analyses).
 */
export function RecentAnalyses() {
  const { isServerUp } = useServerHealth()
  const { data } = useAnalyses()

  if (!isServerUp || !data || data.length === 0) return null

  const recent = data.slice(0, RECENT_COUNT)

  return (
    <div className="w-full text-left">
      <p className="mb-2 text-xs font-medium text-muted-foreground">최근 작업</p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {recent.map((a) => (
          <li key={a.id}>
            <Link
              to={`/analyses/${a.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="truncate font-medium text-foreground">
                {a.matchName || `${a.homeTeam} vs ${a.awayTeam}`}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.matchDate}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
