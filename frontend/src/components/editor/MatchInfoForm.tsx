import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAnalysisStore } from '@/store/analysisStore'
import type { MatchInfo, TeamSide } from '@/types/analysis'

/** 경기 기본 정보(매치명·홈/원정팀·일자·대회명·분석 대상 팀) 입력 폼. */
export function MatchInfoForm({ match }: { match: MatchInfo }) {
  const setMatchInfo = useAnalysisStore((s) => s.setMatchInfo)

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="matchName">매치명</Label>
        <Input
          id="matchName"
          value={match.matchName}
          onChange={(e) => setMatchInfo({ matchName: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="homeTeam">홈팀</Label>
          <Input id="homeTeam" value={match.homeTeam} onChange={(e) => setMatchInfo({ homeTeam: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="awayTeam">원정팀</Label>
          <Input id="awayTeam" value={match.awayTeam} onChange={(e) => setMatchInfo({ awayTeam: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="matchDate">일자</Label>
          <Input
            id="matchDate"
            type="date"
            value={match.matchDate}
            onChange={(e) => setMatchInfo({ matchDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="competition">대회명</Label>
          <Input
            id="competition"
            value={match.competition ?? ''}
            onChange={(e) => setMatchInfo({ competition: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="analyzedTeam">분석 대상 팀</Label>
        <Select value={match.analyzedTeam} onValueChange={(v) => setMatchInfo({ analyzedTeam: v as TeamSide })}>
          <SelectTrigger id="analyzedTeam">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home">홈팀</SelectItem>
            <SelectItem value="away">원정팀</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
