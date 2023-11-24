import { SearchPaginatedData } from "./interfaces/pagination";

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC'
}

export const defaultPaginationOptions: SearchPaginatedData = {
  page: 1,
  perPage: 20,
  orderDirection: Order.DESC
}
