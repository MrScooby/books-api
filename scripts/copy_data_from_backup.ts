/* Copy data from local backup to postgres - for data security till I will create proper, remote db */

import { PrismaClient } from '@prisma/client'
import * as firebase_data from '../database/backup.json'

const prisma = new PrismaClient()

async function main() {
  const { books, shelves, genres, authors, booksOnShelves, authorsBooks } =
    firebase_data

  await prisma.authors.createMany({
    data: authors
  })

  await prisma.genres.createMany({
    data: genres
  })

  await prisma.shelves.createMany({
    data: shelves
  })

  await prisma.books.createMany({
    data: books
  })

  await prisma.booksOnShelves.createMany({
    data: booksOnShelves
  })

  await prisma.authorsBooks.createMany({
    data: authorsBooks
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
