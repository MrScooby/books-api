/* ####################
    OLD _ DO NOT USE
   #################### */

/* One time script to add img url to books (with no regards for rate limits - I would argue that it's their fault for not implementing them : P) */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

async function main() {
  const books = await prisma.books.findMany()

  const promises = []
  let booksEdited = 0

  for (let i = 0; i < books.length; i++) {
    if (books[i].imgUrl !== 'placeholder') {
      continue
    }

    promises.push(
      new Promise<void>(async (resolved) => {
        const book = books[i]

        const pageHtml = await axios
          .get(book.url, { responseType: 'document' })
          .then((res) => {
            return res.data
          })
          .catch((e) => {
            console.log(
              `axios request failed. book: ${JSON.stringify(book)} errors: ${e}`
            )
          })

        if (pageHtml) {
          const $ = cheerio.load(pageHtml)

          const bookImgUrl = $('#js-lightboxCover').attr('href')

          console.log(`id: ${book.id} bookImgUrl ${bookImgUrl}`)

          await prisma.books.update({
            where: {
              id: book.id
            },
            data: {
              imgUrl: bookImgUrl
            }
          })
        }

        booksEdited++

        resolved()
      })
    )
  }

  await Promise.all(promises)

  console.log('books edited: ', booksEdited)
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
