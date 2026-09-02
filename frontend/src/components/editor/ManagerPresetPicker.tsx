import { useState } from 'react'

import { cn } from '@/lib/utils'

interface ManagerPreset {
  url: string
  manager: string
  club: string
  blurb: string
}

/**
 * 스타일이 뚜렷한 감독들의 실제 전술(2026-09-01 기준 조사)을 국면별로 재현한
 * 프리셋. 클롭은 2025년부터 현장을 떠나 리버풀 시절 스타일로, 이정효는 광주·
 * 수원 두 시절 모두 넣었다. 좌표는 실제 선수 트래킹 데이터가 아니라 공개된
 * 전술 분석을 바탕으로 재구성한 예시다.
 */
const MANAGER_PRESETS: ManagerPreset[] = [
  {
    url: '/samples/managers/guardiola.json',
    manager: '펩 과르디올라',
    club: '맨체스터 시티',
    blurb: '인버티드 풀백으로 중원 수적 우위, 비보유 시 4-1-4-1',
  },
  {
    url: '/samples/managers/arteta.json',
    manager: '미켈 아르테타',
    club: '아스널',
    blurb: '빌드업 시 백3 전환, 볼 소실 즉시 재압박',
  },
  {
    url: '/samples/managers/klopp.json',
    manager: '위르겐 클롭',
    club: '리버풀 (레전드 스타일)',
    blurb: '게겐프레싱과 헤비메탈 축구, 극단적으로 높은 라인',
  },
  {
    url: '/samples/managers/xabi_alonso.json',
    manager: '사비 알론소',
    club: '바이어 레버쿠젠 (무패 우승 시절)',
    blurb: '백3+윙백, 공격 시 3-2-5·수비 시 백5',
  },
  {
    url: '/samples/managers/luis_enrique.json',
    manager: '루이스 엔리케',
    club: '파리 생제르맹',
    blurb: '양쪽 풀백이 윙어처럼 전진하는 3-2-5 공격진',
  },
  {
    url: '/samples/managers/lee_jeonghyo_gwangju.json',
    manager: '이정효',
    club: '광주FC 시절',
    blurb: '하프스페이스 침투 + 측면 유도 압박 (K리그1 승격·3위)',
  },
  {
    url: '/samples/managers/lee_jeonghyo_suwon.json',
    manager: '이정효',
    club: '수원삼성 2026, K리그2',
    blurb: '4-4-2 기반, 중앙 미드필더가 내려와 3백 빌드업',
  },
]

interface ManagerPresetPickerProps {
  onSelect: (url: string) => void
}

export function ManagerPresetPicker({ onSelect }: ManagerPresetPickerProps) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async (preset: ManagerPreset) => {
    setError(null)
    setLoadingUrl(preset.url)
    try {
      await onSelect(preset.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '프리셋을 불러오지 못했습니다.')
    } finally {
      setLoadingUrl(null)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MANAGER_PRESETS.map((preset) => (
          <button
            key={preset.url}
            type="button"
            disabled={loadingUrl !== null}
            onClick={() => handleClick(preset)}
            className={cn(
              'rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent',
              loadingUrl === preset.url && 'opacity-60',
            )}
          >
            <p className="font-semibold text-foreground">
              {preset.manager} <span className="font-normal text-muted-foreground">· {preset.club}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{preset.blurb}</p>
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}
