import { Order } from 'src/common/constants'

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
}
