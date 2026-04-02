import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ShelvesService } from './shelves.service'
import { DBService } from '../db/db.service'

const mockShelf = {
  id: 'shelf-1',
  name: 'Read',
  pages: 500,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockBook = {
  id: 'book-1',
  ISBN: '123',
  lcId: 1,
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
  shelves: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  booksOnShelves: {
    findMany: jest.fn()
  },
  books: {
    findMany: jest.fn()
  }
}

describe('ShelvesService', () => {
  let service: ShelvesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShelvesService,
        { provide: DBService, useValue: mockDBService }
      ]
    }).compile()

    service = module.get<ShelvesService>(ShelvesService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return paginated shelves', async () => {
      mockDBService.shelves.count.mockResolvedValue(2)
      mockDBService.shelves.findMany.mockResolvedValue([{ ...mockShelf, _count: { books: 4 } }])

      const result = await service.findAll({})

      expect(result.data[0].name).toBe('Read')
      expect((result.data[0] as any).bookCount).toBe(4)
      expect(result.meta.total).toBe(2)
    })

    it('should respect orderDirection ASC', async () => {
      mockDBService.shelves.count.mockResolvedValue(0)
      mockDBService.shelves.findMany.mockResolvedValue([])

      await service.findAll({ orderDirection: 'ASC' as any })

      expect(mockDBService.shelves.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } })
      )
    })
  })

  describe('findOne', () => {
    it('should return a shelf with books', async () => {
      mockDBService.shelves.findUnique.mockResolvedValue(mockShelf)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([
        { bookId: 'book-1', shelfId: 'shelf-1' }
      ])
      mockDBService.books.findMany.mockResolvedValue([mockBook])

      const result = await service.findOne('shelf-1')

      expect(result.id).toBe('shelf-1')
      expect(result.name).toBe('Read')
      expect(result.pages).toBe(500)
      expect(result.books).toHaveLength(1)
    })

    it('should throw NotFoundException when shelf not found', async () => {
      mockDBService.shelves.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updatePageCount', () => {
    it('should return up-to-date message when count matches', async () => {
      mockDBService.shelves.findUnique.mockResolvedValue(mockShelf)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([
        { bookId: 'book-1', shelfId: 'shelf-1' }
      ])
      mockDBService.books.findMany.mockResolvedValue([
        { ...mockBook, pages: 500 }
      ])

      const result = await service.updatePageCount('shelf-1')

      expect(result).toContain('up to date')
      expect(mockDBService.shelves.update).not.toHaveBeenCalled()
    })

    it('should update and return change message when count differs', async () => {
      mockDBService.shelves.findUnique.mockResolvedValue(mockShelf)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([
        { bookId: 'book-1', shelfId: 'shelf-1' }
      ])
      mockDBService.books.findMany.mockResolvedValue([
        { ...mockBook, pages: 600 }
      ])

      const result = await service.updatePageCount('shelf-1')

      expect(result).toContain('changed from 500 to 600')
      expect(mockDBService.shelves.update).toHaveBeenCalled()
    })

    it('should throw NotFoundException when shelf not found', async () => {
      mockDBService.shelves.findUnique.mockResolvedValue(null)

      await expect(service.updatePageCount('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updatePageCountAll', () => {
    it('should update all shelves and return combined results', async () => {
      mockDBService.shelves.findMany.mockResolvedValue([mockShelf])
      mockDBService.shelves.findUnique.mockResolvedValue(mockShelf)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([])
      mockDBService.books.findMany.mockResolvedValue([])

      const result = await service.updatePageCountAll()

      expect(result).toContain('changed from 500 to 0')
    })
  })
})
