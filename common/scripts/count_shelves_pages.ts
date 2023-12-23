/* ####################
    OLD _ DO NOT USE
   #################### */

/* One time script to update shelves table and backup with counted pages */

import { PrismaClient } from '@prisma/client'
import * as backup from '../../database/backup.json'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const _backup = {
    ...backup,
    shelves: []
  }

  const shelves = await prisma.shelves.findMany()
  const books = await prisma.books.findMany()
  const booksOnShelves = await prisma.booksOnShelves.findMany()
  const booksMap = new Map(books.map((book) => [book.id, book]))

  const shelvesBooksMap = {}
  booksOnShelves.forEach((bos) => {
    if (shelvesBooksMap[bos.shelfId] === undefined) {
      shelvesBooksMap[bos.shelfId] = []
    }

    shelvesBooksMap[bos.shelfId].push(bos.bookId)
  })

  const promises = []

  for (let i = 0; i < shelves.length; i++) {
    let pages = 0

    shelvesBooksMap[shelves[i].id].map((bookId) => {
      pages += booksMap.get(bookId).pages
    })

    promises.push(
      new Promise<void>(async (resolved) => {
        await prisma.shelves.update({
          where: {
            id: shelves[i].id
          },
          data: {
            pages: pages
          }
        })

        resolved()
      })
    )

    _backup.shelves.push({
      ...shelves[i],
      pages: pages
    })
  }

  await Promise.all(promises)

  fs.writeFile(
    './database/backup.json',
    JSON.stringify(_backup),
    { flag: 'w' },
    (e) => {
      if (e) {
        console.log('Something went wrong. e: ', e)
      } else {
        console.log('Local backup created')
      }
    }
  )
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
