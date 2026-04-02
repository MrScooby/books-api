import { Order, defaultPaginationOptions } from '../constants'

export interface PaginatedResults<T> {
  data: T[]
  meta: {
    total: number
    totalPages: number
    perPage: number
    page: number
  }
}

export interface SearchPaginatedData {
  orderDirection?: Order
  page?: number
  perPage?: number
  shelfId?: string
  authorId?: string
  genreId?: string
}

export interface PaginationParams {
  skip: number
  take: number
  orderBy: { createdAt: 'asc' | 'desc' }
}

export function parsePagination(query: SearchPaginatedData): {
  params: PaginationParams
  page: number
  perPage: number
} {
  const perPage = Number(query.perPage) || defaultPaginationOptions.perPage!
  const page = Number(query.page) || defaultPaginationOptions.page!
  const skip = page > 1 ? (page - 1) * perPage : 0
  const orderDirection = query.orderDirection?.toLowerCase() === 'asc' ? 'asc' as const : 'desc' as const

  return {
    params: { skip, take: perPage, orderBy: { createdAt: orderDirection } },
    page,
    perPage
  }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number
): PaginatedResults<T> {
  return {
    data,
    meta: {
      total,
      totalPages: Math.ceil(total / perPage),
      perPage,
      page
    }
  }
}
