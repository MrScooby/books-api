import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { BooksService } from './books.service'
import { DBService } from '../db/db.service'
import scrapBookData from './utils/scrap_book_data'

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
  owned: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockDBService = {
  books: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn()
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

  describe('create', () => {
    const mockedScrap = scrapBookData as unknown as jest.Mock

    const scrapedData = {
      lcId: 300,
      title: 'Unread Book',
      authors: ['Author A'],
      genre: 'Fantasy',
      pages: 420,
      ISBN: '555',
      imgUrl: 'http://img/unread.jpg'
    }

    const mockTx = () => ({
      authors: {
        findUnique: jest.fn().mockResolvedValue({ id: 'author-1' }),
        create: jest.fn()
      },
      genres: {
        findUnique: jest.fn().mockResolvedValue({ id: 'genre-1' }),
        create: jest.fn()
      },
      shelves: {
        findUnique: jest.fn().mockResolvedValue({ id: 'shelf-1', pages: 1000 }),
        create: jest.fn(),
        update: jest.fn()
      },
      books: {
        create: jest.fn().mockResolvedValue({ id: 'new-book' })
      }
    })

    it('should create an owned book with no shelves and no rating', async () => {
      mockedScrap.mockResolvedValue(scrapedData)
      const tx = mockTx()
      mockDBService.$transaction.mockImplementation((cb: any) => cb(tx))

      const result = await service.create({
        url: 'http://lc.pl/unread',
        owned: true
      })

      expect(result).toBe('new-book')
      expect(tx.shelves.findUnique).not.toHaveBeenCalled()
      expect(tx.shelves.create).not.toHaveBeenCalled()
      expect(tx.shelves.update).not.toHaveBeenCalled()
      expect(tx.books.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            owned: true,
            rating: 0,
            shelves: { create: [] }
          })
        })
      )
    })

    it('should default owned to false and update shelf pages when shelves are given', async () => {
      mockedScrap.mockResolvedValue(scrapedData)
      const tx = mockTx()
      mockDBService.$transaction.mockImplementation((cb: any) => cb(tx))

      await service.create({
        url: 'http://lc.pl/read',
        rating: 8,
        shelves: ['2026']
      })

      expect(tx.shelves.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: '2026' } })
      )
      expect(tx.shelves.update).toHaveBeenCalledWith({
        where: { id: 'shelf-1' },
        data: { pages: 1420 }
      })
      expect(tx.books.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ owned: false, rating: 8 })
        })
      )
    })
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

    it('should filter to owned books on no shelf when toRead is set', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({ toRead: 'true' })

      const expectedWhere = { owned: true, shelves: { none: {} } }
      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      )
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: expectedWhere
      })
    })

    it('should let toRead override a shelfId filter', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({ shelfId: 'shelf-1', toRead: '1' })

      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { owned: true, shelves: { none: {} } }
        })
      )
    })

    it('should ignore toRead when it is not truthy', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.findMany.mockResolvedValue([])

      await service.findAll({ toRead: 'false' })

      expect(mockDBService.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      )
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

    it('should include owned in the update data when provided', async () => {
      mockDBService.books.findUnique
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce({ ...mockBook, owned: true })
      mockDBService.booksOnShelves.findMany.mockResolvedValue([])
      mockDBService.authorsBooks.findMany.mockResolvedValue([])

      const tx = {
        books: { update: jest.fn() },
        authorsBooks: { deleteMany: jest.fn(), createMany: jest.fn() }
      }
      mockDBService.$transaction.mockImplementation(async (cb: any) => cb(tx))

      await service.update('book-1', { owned: true } as any)

      expect(tx.books.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { owned: true }
      })
    })
  })

  describe('getStats', () => {
    it('should aggregate owned, read and to-read counts and pages', async () => {
      mockDBService.books.count
        .mockResolvedValueOnce(3) // owned count
        .mockResolvedValueOnce(10) // total count
        .mockResolvedValueOnce(8) // read count (on any shelf)
        .mockResolvedValueOnce(2) // read and owned
        .mockResolvedValueOnce(1) // owned, on no shelf
      mockDBService.books.aggregate
        .mockResolvedValueOnce({ _sum: { pages: 900 } }) // owned pages
        .mockResolvedValueOnce({ _sum: { pages: 4000 } }) // total pages
        .mockResolvedValueOnce({ _sum: { pages: 320 } }) // to-read pages

      const result = await service.getStats()

      expect(result).toEqual({
        ownedCount: 3,
        ownedPages: 900,
        totalCount: 10,
        totalPages: 4000,
        readCount: 8,
        readOwnedCount: 2,
        toReadCount: 1,
        toReadPages: 320
      })
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: { owned: true }
      })
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: { shelves: { some: {} } }
      })
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: { owned: true, shelves: { some: {} } }
      })
      expect(mockDBService.books.count).toHaveBeenCalledWith({
        where: { owned: true, shelves: { none: {} } }
      })
      expect(mockDBService.books.aggregate).toHaveBeenCalledWith({
        _sum: { pages: true },
        where: { owned: true }
      })
      expect(mockDBService.books.aggregate).toHaveBeenCalledWith({
        _sum: { pages: true },
        where: { owned: true, shelves: { none: {} } }
      })
    })

    it('should default null page sums to 0', async () => {
      mockDBService.books.count.mockResolvedValue(0)
      mockDBService.books.aggregate.mockResolvedValue({ _sum: { pages: null } })

      const result = await service.getStats()

      expect(result).toEqual({
        ownedCount: 0,
        ownedPages: 0,
        totalCount: 0,
        totalPages: 0,
        readCount: 0,
        readOwnedCount: 0,
        toReadCount: 0,
        toReadPages: 0
      })
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

  describe('replaceEdition', () => {
    const mockedScrap = scrapBookData as unknown as jest.Mock

    it('should throw NotFoundException when book not found', async () => {
      mockDBService.books.findUnique.mockResolvedValue(null)

      await expect(
        service.replaceEdition('nonexistent', { url: 'http://lc.pl/x' })
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when the scrape yields invalid data', async () => {
      mockDBService.books.findUnique.mockResolvedValue(mockBook)
      mockedScrap.mockResolvedValue({
        lcId: NaN,
        title: '',
        authors: [],
        genre: '',
        pages: NaN,
        ISBN: null,
        imgUrl: ''
      })

      await expect(
        service.replaceEdition('book-1', { url: 'http://bad' })
      ).rejects.toThrow(BadRequestException)
    })

    it('should scrape and run the transaction when the book exists', async () => {
      mockDBService.books.findUnique.mockResolvedValue(mockBook)
      mockedScrap.mockResolvedValue({
        lcId: 200,
        title: 'New Edition',
        authors: ['Author A'],
        genre: 'Fantasy',
        pages: 500,
        ISBN: '999',
        imgUrl: 'http://img/new.jpg'
      })
      mockDBService.$transaction.mockResolvedValue(undefined)
      mockDBService.booksOnShelves.findMany.mockResolvedValue([])
      mockDBService.authorsBooks.findMany.mockResolvedValue([])

      const result = await service.replaceEdition('book-1', {
        url: 'http://lc.pl/new'
      })

      expect(mockedScrap).toHaveBeenCalledWith('http://lc.pl/new')
      expect(mockDBService.$transaction).toHaveBeenCalled()
      expect(result.id).toBe('book-1')
    })
  })
})
