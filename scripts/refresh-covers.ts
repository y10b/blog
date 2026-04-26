/**
 * 모든 PUBLISHED 글의 cover를 Unsplash에서 글 키워드 기반으로 재검색해 갱신.
 *
 * 키워드 추출 전략:
 *   1. tags의 첫 카테고리(`dev`/`sidehustle`) 다음 태그들에서 영문 단어 우선
 *   2. 없으면 title에서 핵심 단어
 *   3. fallback: category 기반 generic 키워드
 *
 * 사용법: corepack pnpm exec tsx scripts/refresh-covers.ts
 */
import 'dotenv/config'
import { createClient } from '@libsql/client'

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY!
if (!unsplashKey) {
  console.error('UNSPLASH_ACCESS_KEY missing')
  process.exit(1)
}

// 카테고리 → 폴백 키워드 (검색 결과 없을 때)
const FALLBACK = {
  dev: 'code laptop dark',
  sidehustle: 'desk workspace minimal',
}

// 카테고리 + tags + title을 보고 검색용 키워드 도출
function buildKeyword(category: string, tags: string, title: string): string {
  // tags에서 영문 단어 또는 잘 알려진 도구명 우선
  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
  const englishTags = tagList.slice(1).filter(t => /^[a-zA-Z][a-zA-Z0-9 .-]*$/.test(t))

  if (englishTags.length > 0) {
    // 가장 구체적인 첫 태그 사용 (예: "FLUX LoRA", "Vercel cron", "fal.ai")
    return englishTags.slice(0, 2).join(' ')
  }

  // 한국어 tags라면 — 카테고리 폴백
  return FALLBACK[category as keyof typeof FALLBACK] || FALLBACK.sidehustle
}

async function searchUnsplash(query: string): Promise<string | null> {
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.append('query', query)
    url.searchParams.append('per_page', '5')
    url.searchParams.append('orientation', 'landscape')

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${unsplashKey}` },
    })
    if (!r.ok) {
      console.warn(`  ! ${query} → HTTP ${r.status}`)
      return null
    }
    const data: any = await r.json()
    if (!data.results || data.results.length === 0) {
      return null
    }
    // 검색 결과 중 첫 번째
    return data.results[0].urls.regular as string
  } catch (e: any) {
    console.warn(`  ! ${query} → ${e.message}`)
    return null
  }
}

async function main() {
  const posts = await turso.execute(`
    SELECT id, slug, title, tags, coverImage
    FROM Post
    WHERE status = 'PUBLISHED'
    ORDER BY publishedAt DESC
  `)

  console.log(`Total posts: ${posts.rows.length}\n`)

  let okCount = 0
  let skipCount = 0
  let failCount = 0

  for (let i = 0; i < posts.rows.length; i++) {
    const row = posts.rows[i] as any
    const tags = String(row.tags || '')
    const category = tags.split(',')[0]?.trim() || 'sidehustle'
    const keyword = buildKeyword(category, tags, String(row.title))

    console.log(`[${i + 1}/${posts.rows.length}] ${row.slug}`)
    console.log(`  keyword: "${keyword}"`)

    const newCover = await searchUnsplash(keyword)
    if (!newCover) {
      // fallback 시도
      const fb = FALLBACK[category as keyof typeof FALLBACK] || FALLBACK.sidehustle
      const fbCover = await searchUnsplash(fb)
      if (!fbCover) {
        console.log(`  ! 검색 실패 — 기존 cover 유지`)
        failCount++
        await new Promise(r => setTimeout(r, 600))
        continue
      }
      await turso.execute({
        sql: 'UPDATE Post SET coverImage = ?, updatedAt = datetime(\'now\') WHERE id = ?',
        args: [fbCover, row.id],
      })
      console.log(`  ✓ FALLBACK cover updated`)
      okCount++
    } else {
      await turso.execute({
        sql: 'UPDATE Post SET coverImage = ?, updatedAt = datetime(\'now\') WHERE id = ?',
        args: [newCover, row.id],
      })
      console.log(`  ✓ cover updated`)
      okCount++
    }

    // Unsplash Demo tier: 시간당 50 요청. 안전하게 600ms sleep
    await new Promise(r => setTimeout(r, 600))
  }

  console.log(`\nDone. updated=${okCount}, skip=${skipCount}, fail=${failCount}`)
  await turso.close()
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
