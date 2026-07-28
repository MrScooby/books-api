/*
 * Fold every genre onto its canonical name.
 *
 * Runs each existing Genres.name through the same normalizeGenre() the scraper
 * uses, so the database and anything added later agree on one name per genre.
 * Where the canonical name already exists, the books move over and the
 * duplicate row is dropped; otherwise the row is renamed in place.
 *
 * Idempotent — a second run finds nothing to do. Re-run it after adding an entry
 * to GENRE_ALIASES to fold the affected rows together.
 *
 * Dry run by default. Pass --apply to write.
 *   npx ts-node scripts/merge-genres.ts
 *   npx ts-node scripts/merge-genres.ts --apply
 */
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { normalizeGenre } from '../src/books/utils/genre_aliases'

const APPLY = process.argv.includes('--apply')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function run() {
  const genres = await prisma.genres.findMany({
    select: { id: true, name: true, _count: { select: { books: true } } },
    orderBy: { name: 'asc' }
  })

  const byName = new Map(genres.map((g) => [g.name, g]))

  const renames: typeof genres = []
  const merges: { from: (typeof genres)[number]; into: (typeof genres)[number] }[] = []

  for (const genre of genres) {
    const canonical = normalizeGenre(genre.name)

    if (canonical === genre.name) continue

    const target = byName.get(canonical)

    if (target && target.id !== genre.id) {
      merges.push({ from: genre, into: target })
    } else {
      renames.push(genre)
    }
  }

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${genres.length} genres\n`)

  console.log(`Merge into an existing genre: ${merges.length}`)
  for (const m of merges) {
    console.log(
      `  "${m.from.name}" (${m.from._count.books} books) -> "${m.into.name}" (${m.into._count.books} books)`
    )
  }

  console.log(`\nRename in place: ${renames.length}`)
  for (const r of renames) {
    console.log(`  "${r.name}" -> "${normalizeGenre(r.name)}" (${r._count.books} books)`)
  }

  if (!APPLY) {
    console.log('\nNothing written. Re-run with --apply to write.')
    return
  }

  let moved = 0

  await prisma.$transaction(async (tx) => {
    for (const m of merges) {
      const res = await tx.books.updateMany({
        where: { genreId: m.from.id },
        data: { genreId: m.into.id }
      })
      moved += res.count

      await tx.genres.delete({ where: { id: m.from.id } })
    }

    for (const r of renames) {
      await tx.genres.update({
        where: { id: r.id },
        data: { name: normalizeGenre(r.name) }
      })
    }
  })

  console.log(
    `\nMerged ${merges.length} duplicates (${moved} books moved), renamed ${renames.length}.`
  )

  const after = await prisma.genres.findMany({
    select: { name: true, _count: { select: { books: true } } },
    orderBy: { name: 'asc' }
  })
  console.log(`Genres now: ${after.length}`)

  const clashes = after.filter(
    (g, _, all) => all.filter((o) => o.name.toLowerCase() === g.name.toLowerCase()).length > 1
  )
  console.log('Names differing only by case:', clashes.length === 0 ? 'none' : clashes)
  console.log(
    'Books without a genre:',
    await prisma.books.count({ where: { genreId: null } })
  )
}

run()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
