import { z } from 'zod'

/**
 * 3단계 §2.7 검증 규칙을 zod로 그대로 옮긴다. 서버(Pydantic)와 동일한 규칙을
 * 클라이언트에서도 적용해 JSON 가져오기(FR-07) 시점에 조기 실패시킨다.
 */
const pointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

const playerPositionSchema = pointSchema.extend({ playerId: z.string() })

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int().min(1).max(99),
  role: z.string().optional(),
})

const matchInfoSchema = z.object({
  matchName: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  competition: z.string().optional(),
  analyzedTeam: z.enum(['home', 'away']),
})

const phaseDataSchema = z.object({
  positions: z.array(playerPositionSchema).length(11, '선수 위치는 정확히 11개여야 합니다'),
  opponentPositions: z.array(pointSchema).length(11, '상대팀 위치는 정확히 11개여야 합니다').optional(),
  pressingLineY: z.number().min(0).max(100).optional(),
  comment: z.string(),
})

export const analysisSchema = z
  .object({
    id: z.number().optional(),
    schemaVersion: z.literal(1),
    match: matchInfoSchema,
    formation: z.string(),
    players: z.array(playerSchema).length(11, '선수는 정확히 11명이어야 합니다'),
    phases: z.object({
      base: phaseDataSchema,
      attack: phaseDataSchema,
      defense: phaseDataSchema,
    }),
    summary: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const ids = data.players.map((p) => p.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['players'], message: '선수 id가 중복되었습니다' })
    }
    const idSet = new Set(ids)
    for (const phaseType of ['base', 'attack', 'defense'] as const) {
      data.phases[phaseType].positions.forEach((pos, i) => {
        if (!idSet.has(pos.playerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phases', phaseType, 'positions', i, 'playerId'],
            message: `players에 존재하지 않는 선수 id입니다: ${pos.playerId}`,
          })
        }
      })
    }
  })

/** zod 이슈 경로를 사람이 읽을 문구로 바꾼다 (FR-07의 "오류 위치 안내"). */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(' > ') || '(root)'}: ${issue.message}`)
}
