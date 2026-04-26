import 'dotenv/config'
import { createClient } from '@libsql/client'
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const posts = await c.execute("SELECT tags FROM Post WHERE status = 'PUBLISHED'")
const counts = { dev: 0, sidehustle: 0, other: 0 }
for (const r of posts.rows) {
  const cat = String(r.tags).split(',')[0].trim()
  counts[cat in counts ? cat : 'other']++
}
console.log('카테고리별:', counts)
await c.close()
