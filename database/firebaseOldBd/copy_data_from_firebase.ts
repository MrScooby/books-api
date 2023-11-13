/* One time use script to migrate data previously kept in firebase */

import { PrismaClient } from '@prisma/client'
import firebase_data from './firebase_data'

const prisma = new PrismaClient()

async function main() {
  const { book: firebaseBooks, shelves } = firebase_data

  // extract authors and genres from firebase books data
  const authors: string[] = []
  const genres: string[] = []

  for (let i = 0; i < firebaseBooks.length; i++) {
    const book = firebaseBooks[i]

    if (typeof book.author === 'string') {
      if (!authors.includes(book.author)) {
        authors.push(book.author)
      }
    } else {
      book.author.forEach((author) => {
        if (!authors.includes(author)) {
          authors.push(author)
        }
      })
    }

    if (!genres.includes(book.genre) && book.genre !== '') {
      genres.push(book.genre)
    }
  }

  // create authors in db
  // create map from results for easier access later on
  await prisma.author.createMany({
    data: authors.map((auth) => ({ name: auth }))
  })
  const dbAuthorsNameToId = new Map()
  const dbAuthors = await prisma.author.findMany()
  dbAuthors.forEach((el) => {
    dbAuthorsNameToId.set(el.name, el.id)
  })

  // create genres in db
  // create map from results for easier access later on
  await prisma.genre.createMany({
    data: genres.map((genre) => ({ name: genre }))
  })
  const dbGenresNameToId = new Map()
  const dbGenres = await prisma.genre.findMany()
  dbGenres.forEach((el) => {
    dbGenresNameToId.set(el.name, el.id)
  })

  // create shelves in db
  await prisma.shelf.createMany({
    data: shelves.map((shelf) => ({
      name: shelf.shelf,
      pages: shelf.numberOfPages
    }))
  })
  const dbShelves = await prisma.shelf.findMany()

  // create books in db
  // create map from results for easier access later on
  await prisma.book.createMany({
    data: firebaseBooks.map((book) => ({
      ISBN: book.ISBN && String(book.ISBN),
      lcId: Number(book.id),
      pages: book.pages,
      rating: book.rating,
      title: book.title,
      url: book.url,
      genreId: dbGenresNameToId[book.genre]
    }))
  })

  const dbBooks = await prisma.book.findMany()
  const dbBooksLcIdToId = new Map()
  dbBooks.forEach((el) => {
    dbBooksLcIdToId.set(el.lcId, el.id)
  })

  // combine data from books and authors and insert it to db
  const bookAuthor = []
  for (let i = 0; i < 1; i++) {
    const book = firebaseBooks[i]
    const authors =
      typeof book.author === 'string' ? [book.author] : book.author

    authors.forEach((author) => {
      bookAuthor.push({
        authorId: dbAuthorsNameToId.get(author),
        bookId: dbBooksLcIdToId.get(book.id)
      })
    })
  }

  await prisma.booksAuthors.createMany({
    data: bookAuthor
  })

  // combine data from books and shelves and insert it to db
  const bookShelf = []
  for (let i = 0; i < shelves.length; i++) {
    const shelf = shelves[i]
    const dbShelf = dbShelves.find((el) => el.name === shelf.shelf)

    for (let ii = 0; ii < shelf.books.length; ii++) {
      bookShelf.push({
        bookId: dbBooksLcIdToId.get(shelf.books[ii]),
        shelfId: dbShelf.id
      })
    }
  }

  await prisma.booksOnShelves.createMany({
    data: bookShelf
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
