import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { analysisSchema, formatZodError } from '@/lib/schema'

const here = path.dirname(fileURLToPath(import.meta.url))
const samplesDir = path.resolve(here, '../../public/samples')

function collectJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectJsonFiles(full)
    return entry.name.endsWith('.json') ? [full] : []
  })
}

describe('public/samples 하위 JSON은 모두 analysisSchema를 통과한다', () => {
  const files = collectJsonFiles(samplesDir)

  it('샘플 파일이 최소 1개 이상 존재한다', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const file of files) {
    it(`${path.relative(samplesDir, file)} — 검증 통과`, () => {
      const json = JSON.parse(readFileSync(file, 'utf-8'))
      const result = analysisSchema.safeParse(json)
      if (!result.success) {
        throw new Error(formatZodError(result.error).join('\n'))
      }
    })
  }
})
