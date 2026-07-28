/*
 * One-off repair: fill in Books.genreId where it is null.
 *
 * The bulk import of 2023-11-22 left 16 of its 613 books without a genre.
 * Nothing added since then is missing one, so this is a gap in that import
 * rather than a live bug.
 *
 * Re-scrapes the category from each book's URL and resolves it through
 * normalizeGenre, so the result lands on the same canonical genre a freshly
 * added book would get. Requests are sequential with a delay — there is no
 * hurry and no reason to hammer the site.
 *
 * Dry run by default. Pass --apply to write.
 *   npx ts-node scripts/backfill-genres.ts
 *   npx ts-node scripts/backfill-genres.ts --apply
 */
import 'dotenv/config'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { normalizeGenre } from '../src/books/utils/genre_aliases'

const APPLY = process.argv.includes('--apply')
const DELAY_MS = 2000

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function scrapeGenre(url: string): Promise<string> {
  const res = await axios.get(url, { responseType: 'document' })
  const $ = cheerio.load(res.data)

  return normalizeGenre($('a.book__category').text())
}

async function run() {
  const books = await prisma.books.findMany({
    where: { genreId: null },
    select: { id: true, title: true, url: true },
    orderBy: { createdAt: 'asc' }
  })

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — books without a genre: ${books.length}\n`)

  const plan: { id: string; title: string; genre: string }[] = []

  for (const [i, book] of books.entries()) {
    if (i > 0) await sleep(DELAY_MS)

    let genre: string
    try {
      genre = await scrapeGenre(book.url)
    } catch (e: any) {
      const status = e.response?.status
      console.log(`SKIP  ${book.title} — ${status ? `HTTP ${status}` : e.message}`)

      if (status === 429 || status === 503) {
        console.log(`\nStopped: rate limited after ${i} of ${books.length}.`)
        break
      }
      continue
    }

    if (!genre) {
      console.log(`SKIP  ${book.title} — the page lists no category`)
      continue
    }

    const existing = await prisma.genres.findUnique({ where: { name: genre } })
    plan.push({ id: book.id, title: book.title, genre })
    console.log(
      `${book.title.slice(0, 50).padEnd(50)} -> ${genre} ${existing ? '(existing)' : '(NEW genre)'}`
    )
  }

  if (!APPLY) {
    console.log(`\nNothing written. ${plan.length} books would get a genre.`)
    return
  }

  let updated = 0
  let created = 0

  await prisma.$transaction(async (tx) => {
    for (const entry of plan) {
      let genre = await tx.genres.findUnique({ where: { name: entry.genre } })

      if (!genre) {
        genre = await tx.genres.create({ data: { name: entry.genre } })
        created++
      }

      await tx.books.update({
        where: { id: entry.id },
        data: { genreId: genre.id }
      })
      updated++
    }
  })

  console.log(`\nUpdated ${updated} books, created ${created} genres.`)
  console.log(
    'Books still without a genre:',
    await prisma.books.count({ where: { genreId: null } })
  )
}

run()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
