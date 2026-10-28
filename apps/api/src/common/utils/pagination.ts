import { z } from 'zod';
import type { Paginated } from '@roy/types';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function skipTake(p: Pagination) {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}

export function paginated<T>(items: T[], total: number, p: Pagination): Paginated<T> {
  return { items, total, page: p.page, pageSize: p.pageSize };
}
