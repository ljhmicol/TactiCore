import { toPng } from 'html-to-image'

import { useAnalysisStore } from '@/store/analysisStore'

/** isMorphing이 false가 될 때까지 대기한다 (4단계 §5.3) — 전환 중간 프레임이 찍히는 것을 막는다. */
function waitForMorphing(): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (!useAnalysisStore.getState().isMorphing) resolve()
      else setTimeout(tick, 50)
    }
    tick()
  })
}

export async function exportCard(node: HTMLElement, ratio: '1:1' | '4:5'): Promise<void> {
  await waitForMorphing()
  await document.fonts.ready // 웹폰트 로드 전에 캡처하면 폴백 폰트로 찍힌다

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    width: 1080,
    height: ratio === '1:1' ? 1080 : 1350,
  })

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `tacticore_${Date.now()}.png`
  a.click()
}
