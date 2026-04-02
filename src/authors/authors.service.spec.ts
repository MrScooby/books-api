import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { AuthorsService } from './authors.service'
import { DBService } from '../db/db.service'

const mockAuthor = {
  id: 'author-1',
  name: 'Stephen King',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockDBService = {
  authors: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  authorsBooks: {
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  $transaction: jest.fn((fn) => fn({
    authorsBooks: { deleteMany: jest.fn() },
    authors: { delete: jest.fn() }
  }))
}

describe('AuthorsService', () => {
  let service: AuthorsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: DBService, useValue: mockDBService }
      ]
    }).compile()

    service = module.get<AuthorsService>(AuthorsService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return paginated authors', async () => {
      mockDBService.authors.count.mockResolvedValue(1)
      mockDBService.authors.findMany.mockResolvedValue([mockAuthor])

      const result = await service.findAll({})

      expect(result.data).toEqual([mockAuthor])
      expect(result.meta.total).toBe(1)
      expect(result.meta.page).toBe(1)
    })

    it('should apply pagination correctly', async () => {
      mockDBService.authors.count.mockResolvedValue(30)
      mockDBService.authors.findMany.mockResolvedValue([])

      const result = await service.findAll({ page: 3, perPage: 5 })

      expect(result.meta.page).toBe(3)
      expect(result.meta.perPage).toBe(5)
      expect(result.meta.totalPages).toBe(6)
      expect(mockDBService.authors.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      )
    })
  })

  describe('findOne', () => {
    it('should return an author with book ids', async () => {
      mockDBService.authors.findUnique.mockResolvedValue(mockAuthor)
      mockDBService.authorsBooks.findMany.mockResolvedValue([
        { bookId: 'book-1', authorId: 'author-1' },
        { bookId: 'book-2', authorId: 'author-1' }
      ])

      const result = await service.findOne('author-1')

      expect(result.id).toBe('author-1')
      expect(result.name).toBe('Stephen King')
      expect(result.bookIds).toEqual(['book-1', 'book-2'])
    })

    it('should throw NotFoundException when author not found', async () => {
      mockDBService.authors.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('create', () => {
    it('should create an author and return its id', async () => {
      mockDBService.authors.create.mockResolvedValue(mockAuthor)

      const result = await service.create({ name: 'Stephen King' })

      expect(result).toBe('author-1')
    })

    it('should throw ConflictException on duplicate name', async () => {
      mockDBService.authors.create.mockRejectedValue({ code: 'P2002' })

      await expect(
        service.create({ name: 'Stephen King' })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('update', () => {
    it('should update an author', async () => {
      const updatedAuthor = { ...mockAuthor, name: 'S. King' }
      mockDBService.authors.findUnique
        .mockResolvedValueOnce(mockAuthor)
        .mockResolvedValueOnce(updatedAuthor)
      mockDBService.authorsBooks.findMany.mockResolvedValue([])
      mockDBService.authors.update.mockResolvedValue(updatedAuthor)

      const result = await service.update('author-1', { name: 'S. King' })

      expect(result.name).toBe('S. King')
    })

    it('should throw NotFoundException if author does not exist', async () => {
      mockDBService.authors.findUnique.mockResolvedValue(null)

      await expect(
        service.update('nonexistent', { name: 'S. King' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete an author and return confirmation', async () => {
      mockDBService.authors.findUnique.mockResolvedValue(mockAuthor)
      mockDBService.authorsBooks.findMany.mockResolvedValue([])

      const result = await service.remove('author-1')

      expect(result).toBe('Author was deleted.')
      expect(mockDBService.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException if author does not exist', async () => {
      mockDBService.authors.findUnique.mockResolvedValue(null)

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
