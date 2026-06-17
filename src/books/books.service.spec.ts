import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { BooksService } from './books.service'
import { DBService } from '../db/db.service'

jest.mock('./utils/scrap_book_data', () => ({
  __esModule: true,
  default: jest.fn()
}))

const mockBook = {
  id: 'book-1',
  ISBN: '123456',
  lcId: 100,
  pages: 300,
  rating: 8,
  title: 'Test Book',
  url: 'http://test.com',
  genreId: 'genre-1',
  imgUrl: 'http://img.com',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockDBService = {
  books: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  booksOnShelves: {
    findMany: jest.fn()
  },
  authorsBooks: {
    findMany: jest.fn()
  },
  shelves: {
    findUniqueOrThrow: jest.fn()
  },
  $transaction: jest.fn()
}

describe('BooksService', () => {
  let service: BooksService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: DBService, useValue: mockDBService }
      ]
    }).compile()

    service = module.get<BooksService>(BooksService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return paginated books with defaults', async () => {
      mockDBService.books.count.mockResolvedValue(5)
      mockDBService.books.findMany.mockResolvedValue([mockBook])

      const result = await service.findAll({})

      expect(result.data).toEqual([mockBook])
      expect(result.meta).toEqual({
        total: 5,
        totalPages: 1,
        perPage: 20,
        page: 1
      })
    })

    it('should calculate pagination correctly', async () => {
      mockDBService.books.count.mockResolvedValue(100)
      mockDBService.books.findMany.mockResolvedValue([])

      const result = await service.findAll({ page: 3, perPage: 10 })

      expect(result.meta.page).toBe(3)
      expect(result.meta.perPage).toBe(10)
      expect(result.meta.totalPages).toBe(10)
      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      )
    })

    it('should default to DESC order', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({})

      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      )
    })

    it('should apply ASC order when specified', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({ orderDirection: 'ASC' as any })

      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } })
      )
    })

    it('should filter by title (case-insensitive) when search is provided', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({ search: 'hobbit' })

      const expectedWhere = {
        title: { contains: 'hobbit', mode: 'insensitive' }
      }
      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      )
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: expectedWhere
      })
    })

    it('should not set a title filter when search is absent', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({})

      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      )
    })
  })

  describe('findOne', () => {
    it('should return a book with shelves and authors ids', async () => {
      mockDBService.books.findUnique.mockResolvedValue(mockBook)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([
        { bookId: 'book-1', shelfId: 'shelf-1' }
      ])
      mockDBService.authorsBooks.findMany.mockResolvedValue([
        { bookId: 'book-1', authorId: 'author-1' }
      ])

      const result = await service.findOne('book-1')

      expect(result.id).toBe('book-1')
      expect(result.title).toBe('Test Book')
      expect(result.shelvesIds).toEqual(['shelf-1'])
      expect(result.authorsIds).toEqual(['author-1'])
    })

    it('should omit createdAt, updatedAt, and lcId', async () => {
      mockDBService.books.findUnique.mockResolvedValue(mockBook)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([])
      mockDBService.authorsBooks.findMany.mockResolvedValue([])

      const result = await service.findOne('book-1')

      expect(result).not.toHaveProperty('createdAt')
      expect(result).not.toHaveProperty('updatedAt')
      expect(result).not.toHaveProperty('lcId')
    })

    it('should throw NotFoundException when book not found', async () => {
      mockDBService.books.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    it('should throw NotFoundException when book not found', async () => {
      mockDBService.books.findUnique.mockResolvedValue(null)

      await expect(
        service.update('nonexistent', {
          url: '',
          rating: 5,
          shelves: [],
          pages: 100,
          lcId: 1,
          title: 'x',
          imgUrl: 'x'
        } as any)
      ).rejects.toThrow(NotFoundException)
    })

    it('should call transaction when book exists', async () => {
      mockDBService.books.findUnique
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce(mockBook)
      mockDBService.$transaction.mockResolvedValue(undefined)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([])
      mockDBService.authorsBooks.findMany.mockResolvedValue([])

      await service.update('book-1', {
        url: 'http://test.com',
        rating: 9,
        shelves: [],
        pages: 300,
        lcId: 100,
        title: 'Updated',
        imgUrl: 'http://img.com'
      } as any)

      expect(mockDBService.$transaction).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should throw NotFoundException when book not found', async () => {
      mockDBService.books.findUnique.mockResolvedValue(null)

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should call transaction and return confirmation', async () => {
      mockDBService.books.findUnique.mockResolvedValue(mockBook)
      mockDBService.$transaction.mockResolvedValue(undefined)

      const result = await service.remove('book-1')

      expect(result).toBe('Book was deleted.')
      expect(mockDBService.$transaction).toHaveBeenCalled()
    })
  })

  describe('addOnShelf', () => {
    it('should throw NotFoundException when book not found', async () => {
      mockDBService.books.findUnique.mockResolvedValue(null)

      await expect(
        service.addOnShelf('nonexistent', { shelfName: 'Read' })
      ).rejects.toThrow(NotFoundException)
    })
  })
})
