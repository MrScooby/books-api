import pg from 'pg'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'

config()

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function dump() {
  await client.connect()

  const tables = [
    'Authors',
    'Genres',
    'Shelves',
    'Books',
    'AuthorsBooks',
    'BooksOnShelves'
  ]

  const data = {}

  for (const table of tables) {
    const result = await client.query(`SELECT * FROM "${table}"`)
    data[table] = result.rows
    console.log(`${table}: ${result.rows.length} rows`)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup/dump-${timestamp}.json`

  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`\nDump saved to ${filename}`)

  await client.end()
}

dump().catch((e) => {
  console.error(e)
  process.exit(1)
})
