import { z } from 'zod'

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export type Page<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
