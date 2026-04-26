/**
 * Prisma schema에서 생성된 DDL(scripts/turso-schema.sql)을 Turso에 적용한다.
 * Prisma CLI가 libsql:// 프로토콜을 직접 지원하지 않아 우회용 스크립트.
 *
 * 사용법:
 *   corepack pnpm exec node scripts/push-schema-to-turso.mjs
 */
import 'dotenv/config'
import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'

const url = (process.env.TURSO_DATABASE_URL || '').trim()
const authToken = (process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || '').trim()

if (!url || !authToken) {
  console.error('TURSO_DATABASE_URL 또는 TURSO_AUTH_TOKEN(DATABASE_AUTH_TOKEN)이 .env에 없습니다.')
  process.exit(1)
}

const sql = readFileSync('scripts/turso-schema.sql', 'utf8')

// 각 statement에서 선행 주석 라인(-- ...)을 제거한 뒤, 세미콜론으로 분리
const statements = sql
  .split(';')
  .map(chunk => chunk
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim()
  )
  .filter(s => s.length > 0)

console.log(`Turso URL: ${url}`)
console.log(`Statements to execute: ${statements.length}`)

const client = createClient({ url, authToken })

let okCount = 0
let skipCount = 0
let failCount = 0

for (const stmt of statements) {
  try {
    await client.execute(stmt)
    const summary = stmt.split('\n')[0].slice(0, 80)
    console.log(`OK  ${summary}`)
    okCount++
  } catch (err) {
    const msg = err.message || String(err)
    const summary = stmt.split('\n')[0].slice(0, 80)
    if (msg.includes('already exists')) {
      console.log(`SKIP  ${summary} (already exists)`)
      skipCount++
    } else {
      console.error(`FAIL  ${summary}\n  -> ${msg}`)
      failCount++
    }
  }
}

console.log(`\nDone. ok=${okCount}, skip=${skipCount}, fail=${failCount}`)

// 테이블 존재 확인
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
)
console.log('\nTables in Turso:')
for (const row of tables.rows) console.log(`  - ${row.name}`)

await client.close()
process.exit(failCount > 0 ? 1 : 0)
