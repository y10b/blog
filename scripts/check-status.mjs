import 'dotenv/config'
import { createClient } from '@libsql/client'
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const posts = await c.execute("SELECT slug, title, tags FROM Post WHERE status = 'PUBLISHED' ORDER BY publishedAt DESC")
console.log(`Posts (${posts.rows.length}):`)
for (const r of posts.rows) console.log(`  [${String(r.tags).split(',')[0]}] ${r.slug}\n     ${r.title}`)
const trs = await c.execute("SELECT p.slug FROM PostTranslation pt JOIN Post p ON p.id = pt.postId WHERE pt.locale = 'en' ORDER BY pt.createdAt DESC")
console.log(`\nEN translations (${trs.rows.length}):`)
for (const r of trs.rows) console.log(`  ${r.slug}`)
await c.close()
