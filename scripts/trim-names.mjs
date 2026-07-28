/*
 * One-off repair: strip surrounding whitespace from Genres.name and Books.title.
 *
 * The scraper used to store the genre exactly as the page rendered it, so rows
 * like " horror " piled up — a distinct value from "horror" under the unique
 * constraint, which silently splits books across two genres. A handful of
 * imported titles carry a trailing space for the same reason.
 *
 * Trimming can collide with an already-correct row, so a collision repoints the
 * affected books at the surviving row and drops the duplicate. Idempotent: a
 * second run finds nothing to do.
 *
 * Dry run by default. Pass --apply to write.
 *   node scripts/trim-names.mjs
 *   node scripts/trim-names.mjs --apply
 */
import pg from 'pg'
import { config } from 'dotenv'

config()

const APPLY = process.argv.includes('--apply')

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function planGenres() {
  const { rows } = await client.query(`
    SELECT g.id, g.name, btrim(g.name) AS trimmed,
           (SELECT count(*) FROM "Books" b WHERE b."genreId" = g.id)::int AS books,
           (SELECT g2.id FROM "Genres" g2 WHERE g2.name = btrim(g.name) AND g2.id <> g.id) AS survivor
    FROM "Genres" g
    WHERE g.name <> btrim(g.name)
    ORDER BY btrim(g.name)
  `)

  return rows
}

async function planTitles() {
  const { rows } = await client.query(`
    SELECT b.id, b.title, btrim(b.title) AS trimmed,
           (SELECT b2.id FROM "Books" b2 WHERE b2.title = btrim(b.title) AND b2.id <> b.id) AS clash
    FROM "Books" b
    WHERE b.title <> btrim(b.title)
    ORDER BY b.title
  `)

  return rows
}

async function run() {
  await client.connect()

  const genres = await planGenres()
  const titles = await planTitles()

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}\n`)

  console.log(`Genres to trim: ${genres.length}`)
  for (const g of genres) {
    console.log(
      `  ${JSON.stringify(g.name)} -> ${JSON.stringify(g.trimmed)}  books=${g.books}` +
        (g.survivor ? `  MERGE into ${g.survivor}` : '')
    )
  }

  console.log(`\nTitles to trim: ${titles.length}`)
  for (const t of titles) {
    if (t.clash) {
      console.log(`  SKIP ${JSON.stringify(t.title)} — "${t.trimmed}" already exists (${t.clash})`)
    } else {
      console.log(`  ${JSON.stringify(t.title)} -> ${JSON.stringify(t.trimmed)}`)
    }
  }

  if (!APPLY) {
    console.log('\nNothing written. Re-run with --apply to write.')
    await client.end()
    return
  }

  let trimmed = 0
  let merged = 0
  let moved = 0

  await client.query('BEGIN')
  try {
    for (const g of genres) {
      if (g.survivor) {
        const res = await client.query(
          `UPDATE "Books" SET "genreId" = $1, "updatedAt" = now() WHERE "genreId" = $2`,
          [g.survivor, g.id]
        )
        moved += res.rowCount
        await client.query(`DELETE FROM "Genres" WHERE id = $1`, [g.id])
        merged++
      } else {
        await client.query(
          `UPDATE "Genres" SET name = btrim(name), "updatedAt" = now() WHERE id = $1`,
          [g.id]
        )
        trimmed++
      }
    }

    for (const t of titles) {
      if (t.clash) continue
      await client.query(
        `UPDATE "Books" SET title = btrim(title), "updatedAt" = now() WHERE id = $1`,
        [t.id]
      )
      trimmed++
    }

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('\nROLLBACK:', e.message)
    process.exitCode = 1
    await client.end()
    return
  }

  console.log(
    `\nTrimmed ${trimmed} rows, merged ${merged} duplicate genres, moved ${moved} books to a surviving genre.`
  )

  const [left] = (
    await client.query(`
      SELECT
        (SELECT count(*)::int FROM "Genres" WHERE name <> btrim(name)) AS genres,
        (SELECT count(*)::int FROM "Books" WHERE title <> btrim(title)) AS titles
    `)
  ).rows
  console.log('Remaining untrimmed — genres:', left.genres, 'titles:', left.titles)

  await client.end()
}

run().catch(async (e) => {
  console.error(e)
  await client.end().catch(() => {})
  process.exit(1)
})
