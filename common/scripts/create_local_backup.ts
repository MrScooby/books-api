/* One time script to add img url to books (with no regards for rate limits - I would argue that it's their fault for not implementing them : P) */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const backup = {
    books: [],
    genres: [],
    authors: [],
    booksOnShelves: [],
    shelves: [],
    authorsBooks: []
  }

  backup.books = await prisma.books.findMany()
  backup.genres = await prisma.genres.findMany()
  backup.authors = await prisma.authors.findMany()
  backup.booksOnShelves = await prisma.booksOnShelves.findMany()
  backup.shelves = await prisma.shelves.findMany()
  backup.authorsBooks = await prisma.authorsBooks.findMany()

  fs.writeFile('backup.json', JSON.stringify(backup), { flag: 'wx' }, (e) => {
    if (e) {
      console.log('Something went wrong. e: ', e)
    } else {
      console.log('Local backup created')
    }
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
