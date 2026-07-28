import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { GenresService } from './genres.service'
import { DBService } from '../db/db.service'

const mockGenre = {
  id: 'genre-1',
  name: 'Horror',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockDBService = {
  genres: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  books: {
    updateMany: jest.fn()
  },
  $transaction: jest.fn((fn) => fn({
    books: { updateMany: jest.fn() },
    genres: { delete: jest.fn() }
  }))
}

describe('GenresService', () => {
  let service: GenresService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        { provide: DBService, useValue: mockDBService }
      ]
    }).compile()

    service = module.get<GenresService>(GenresService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return paginated genres', async () => {
      mockDBService.genres.count.mockResolvedValue(1)
      mockDBService.genres.findMany.mockResolvedValue([{ ...mockGenre, _count: { books: 5 } }])

      const result = await service.findAll({})

      expect(result.data[0].name).toBe('Horror')
      expect((result.data[0] as any).bookCount).toBe(5)
      expect(result.meta.total).toBe(1)
      expect(result.meta.page).toBe(1)
      expect(result.meta.perPage).toBe(20)
    })

    it('should use custom pagination params', async () => {
      mockDBService.genres.count.mockResolvedValue(50)
      mockDBService.genres.findMany.mockResolvedValue([])

      const result = await service.findAll({ page: 2, perPage: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.perPage).toBe(10)
      expect(mockDBService.genres.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      )
    })

    // Same contract as AuthorsService.findAll. Genres currently fit on one page so
    // an unstable tie order would not be visible, but there are real ties (two
    // genres on 24 books), so paging would break the moment the list grows.
    it('should order by book count desc, broken by a unique column', async () => {
      mockDBService.genres.count.mockResolvedValue(0)
      mockDBService.genres.findMany.mockResolvedValue([])

      await service.findAll({})

      const { orderBy } = mockDBService.genres.findMany.mock.calls[0][0]

      expect(Array.isArray(orderBy)).toBe(true)
      expect(orderBy[0]).toEqual({ books: { _count: 'desc' } })
      // `name` is @unique in the schema, so it cannot leave ties behind
      expect(orderBy[orderBy.length - 1]).toEqual({ name: 'asc' })
      expect(orderBy).toHaveLength(2)
    })

    it('should keep the book-count ordering regardless of orderDirection', async () => {
      mockDBService.genres.count.mockResolvedValue(0)
      mockDBService.genres.findMany.mockResolvedValue([])

      await service.findAll({ orderDirection: 'ASC' as any })

      const { orderBy } = mockDBService.genres.findMany.mock.calls[0][0]

      expect(orderBy).not.toHaveProperty('createdAt')
      expect(orderBy[0]).toEqual({ books: { _count: 'desc' } })
    })
  })

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      mockDBService.genres.findUnique.mockResolvedValue(mockGenre)

      const result = await service.findOne('genre-1')

      expect(result).toEqual({ id: 'genre-1', name: 'Horror' })
    })

    it('should throw NotFoundException when genre not found', async () => {
      mockDBService.genres.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('create', () => {
    it('should create a genre and return its id', async () => {
      mockDBService.genres.create.mockResolvedValue(mockGenre)

      const result = await service.create({ name: 'Horror' })

      expect(result).toBe('genre-1')
      expect(mockDBService.genres.create).toHaveBeenCalledWith({
        data: { name: 'Horror' }
      })
    })

    it('should throw ConflictException on duplicate name', async () => {
      mockDBService.genres.create.mockRejectedValue({ code: 'P2002' })

      await expect(service.create({ name: 'Horror' })).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe('update', () => {
    it('should update a genre', async () => {
      const updated = { ...mockGenre, name: 'Sci-Fi' }
      mockDBService.genres.findUnique.mockResolvedValue(mockGenre)
      mockDBService.genres.update.mockResolvedValue(updated)

      const result = await service.update('genre-1', { name: 'Sci-Fi' })

      expect(result).toEqual({ id: 'genre-1', name: 'Sci-Fi' })
    })

    it('should throw NotFoundException if genre does not exist', async () => {
      mockDBService.genres.findUnique.mockResolvedValue(null)

      await expect(
        service.update('nonexistent', { name: 'Sci-Fi' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete a genre and return confirmation', async () => {
      mockDBService.genres.findUnique.mockResolvedValue(mockGenre)

      const result = await service.remove('genre-1')

      expect(result).toBe('Genre was deleted.')
      expect(mockDBService.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException if genre does not exist', async () => {
      mockDBService.genres.findUnique.mockResolvedValue(null)

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
