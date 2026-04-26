import 'dotenv/config'
import { createClient } from '@libsql/client'
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const r = await c.execute("SELECT id, slug, title, tags, status, originalLanguage FROM Post ORDER BY publishedAt DESC")
for (const row of r.rows) console.log(`[${row.tags.split(',')[0]}] ${row.slug}\n   title: ${row.title}\n   tags: ${row.tags}\n`)
await c.close()
