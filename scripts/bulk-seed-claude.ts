/**
 * Anthropic Claude로 누락된 토픽 자동 검출 + 본문/번역 생성.
 * 이미 DB에 있는 토픽은 SKIP. Gemini quota 한도와 무관하게 Claude로.
 *
 * 사용법:
 *   corepack pnpm exec tsx scripts/bulk-seed-claude.ts
 *
 * 비용: Sonnet 4 기준 글당 KO+EN ~$0.13. 17편이면 ~$2.2 (무료 $5 크레딧 안)
 */
import 'dotenv/config'
import { createClient } from '@libsql/client'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildSystemPrompt,
  generateContentPrompt,
  extractFirstJsonObject,
  type ContentCategory,
} from '../src/lib/ai-prompts'

// bulk-seed.ts와 동일한 TOPICS
const TOPICS: Array<{ category: ContentCategory; topic: string; keywords: string[] }> = [
  { category: 'dev', topic: 'ImpressionMLP v1에서 v2로 — F1 0.38이 0.583이 되기까지 6가지 원인을 어떻게 잡았나', keywords: ['MLP', '모델 개선', 'F1 score', '클래스 불균형'] },
  { category: 'dev', topic: 'Ridge Regression으로 라벨 보정 — 감으로 정한 가중치를 데이터로 대체한 후기', keywords: ['라벨 보정', 'Ridge Regression', '데이터 학습', '연예인 데이터'] },
  { category: 'dev', topic: 'AIHub 71415 신청부터 877장 큐레이션까지 — 한국인 얼굴 데이터셋 빌드기', keywords: ['AIHub', '데이터셋 큐레이션', '한국인 얼굴', '데이터 파이프라인'] },
  { category: 'dev', topic: '풀스택 1년차가 LLM을 처음 자사 서비스에 붙였을 때 알았으면 좋았을 5가지', keywords: ['LLM 통합', 'Next.js', '프롬프트 엔지니어링', 'JSON 모드'] },
  { category: 'dev', topic: 'Colab Pro+ A100과 L4 — FLUX LoRA 학습 비용·시간 직접 비교', keywords: ['Colab', 'GPU 비용', 'FLUX', '단위경제'] },
  { category: 'dev', topic: '듀얼헤드 MLP 설계 — 왜 한 갈래가 아니라 두 갈래로 나눴나', keywords: ['MLP 아키텍처', '듀얼헤드', '특징 임베딩', '설계 결정'] },
  { category: 'dev', topic: 'Next.js + Python ML 서빙 통합 — fal.ai vs HuggingFace Inference API vs 자체 GPU', keywords: ['ML 서빙', 'fal.ai', 'HuggingFace', '서비스 통합'] },
  { category: 'dev', topic: '얼굴 인상 라벨 10개를 어떻게 정의했나 — 친근/신뢰/전문… 추상 단어를 데이터로 만들기', keywords: ['라벨 정의', '도메인 디자인', '인상 분석', '제품 결정'] },
  { category: 'dev', topic: 'GPT-4o Vision으로 연예인 367명 인상 평가 $0.15에 끝낸 후기', keywords: ['Vision', '대량 라벨링', 'GPT-4o', '비용 최적화'] },
  { category: 'dev', topic: '초기 스타트업에서 한 사람이 학습·서빙·프론트 다 할 때의 우선순위 결정 프레임', keywords: ['1인 개발', '실험 우선순위', '단위경제', 'MVP'] },
  { category: 'sidehustle', topic: 'Notion으로 1인 운영자 콘텐츠 워크플로 만들기 — Database·Automation·View 활용', keywords: ['Notion', '워크플로 자동화', '1인 운영', '콘텐츠 관리'] },
  { category: 'sidehustle', topic: 'fal.ai 직접 써본 후기 — 장당 $0.05로 FLUX 모델 서빙해본 경험', keywords: ['fal.ai', 'GPU API', '도구 후기', '비용'] },
  { category: 'sidehustle', topic: '청년창업사관학교 신청 가이드 2025 — 대상·금액·신청처·서류 정리', keywords: ['청년창업사관학교', '정부 지원금', '창업 정책', '1인기업'] },
  { category: 'sidehustle', topic: '1인 사업자 종합소득세 처음 신고해본 후기 — 간편장부 vs 복식부기 어떻게 골랐나', keywords: ['종합소득세', '1인 사업자', '간편장부', '세금'] },
  { category: 'sidehustle', topic: '프리랜서 표준계약서 — 어떤 항목이 꼭 들어가야 분쟁 안 나나', keywords: ['프리랜서 계약', '표준계약서', '계약 조항', '분쟁 예방'] },
  { category: 'sidehustle', topic: 'Gemini 2.5 vs ChatGPT-4o 일정 관리 — 1주일 직접 써본 비교', keywords: ['Gemini', 'ChatGPT', '일정 관리', 'AI 도구 비교'] },
  { category: 'sidehustle', topic: 'n8n으로 자동화 워크플로 — Zapier 대비 비용 90% 절감한 후기', keywords: ['n8n', 'Zapier 대안', '자동화', '셀프 호스팅'] },
  { category: 'sidehustle', topic: '블로그 광고 수익 — AdSense vs 쿠팡 파트너스 vs 구독 직접 비교', keywords: ['AdSense', '쿠팡 파트너스', '블로그 수익화', '광고'] },
  { category: 'sidehustle', topic: '1인 SaaS 첫 6개월 — 매출 0에서 첫 결제까지 마케팅 채널별 ROI', keywords: ['1인 SaaS', '인디 메이커', '마케팅 ROI', '수익화'] },
  { category: 'sidehustle', topic: 'AI 글쓰기 자동화 — 블로그 1년 운영해 본 후기와 SEO 영향', keywords: ['AI 글쓰기', '블로그 자동화', 'SEO', '콘텐츠 운영'] },
]

const COVERS = {
  dev: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  ],
  sidehustle: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80',
  ],
}

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY missing')
  process.exit(1)
}
const anthropic = new Anthropic({ apiKey })
const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'

function randomCuid() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
}
function sqliteDate(d: Date) {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

async function callClaude(systemPrompt: string, userPrompt: string, label: string) {
  const t0 = Date.now()
  const result = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const text = result.content[0].type === 'text' ? result.content[0].text : ''
  const usage = result.usage
  console.log(`  [${label}] ${((Date.now() - t0) / 1000).toFixed(1)}s, ${text.length} chars, in=${usage.input_tokens} out=${usage.output_tokens}`)
  return text
}

async function generatePost(topic: string, category: ContentCategory, keywords: string[]) {
  const sys = buildSystemPrompt(category)
  const user = generateContentPrompt(topic, keywords, undefined, category)
  const raw = await callClaude(sys, user, 'KO')
  return extractFirstJsonObject<any>(raw)
}

async function translateToEnglish(koPost: any) {
  const sys = `You are a professional translator. Translate Korean blog posts to natural, fluent English. Keep markdown formatting intact (headings, code blocks, tables, lists). Keep code/library/model names in original form. Output ONLY a single JSON object, no fences.`
  const user = `KOREAN TITLE: ${koPost.title}

KOREAN EXCERPT: ${koPost.excerpt}

KOREAN CONTENT (markdown):
${koPost.content}

Output JSON:
{"title": "English title (max 60 chars)", "excerpt": "English excerpt (max 160 chars)", "content": "English markdown body — same structure", "seoTitle": "English SEO title (max 60 chars)", "seoDescription": "English meta desc (max 160 chars)"}`
  const raw = await callClaude(sys, user, 'EN')
  return extractFirstJsonObject<any>(raw)
}

async function findMissingTopics() {
  const r = await turso.execute("SELECT title FROM Post WHERE status = 'PUBLISHED'")
  const existingTitles = r.rows.map(row => String(row.title))

  const missing = TOPICS.filter(t => {
    const firstKeyword = t.topic.split(/[—\s]/)[0]
    return !existingTitles.some(title => title.includes(firstKeyword))
  })
  return missing
}

async function postsWithoutEn() {
  const r = await turso.execute(`
    SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.coverImage
    FROM Post p
    LEFT JOIN PostTranslation pt ON pt.postId = p.id AND pt.locale = 'en'
    WHERE p.status = 'PUBLISHED' AND pt.id IS NULL
  `)
  return r.rows
}

async function main() {
  console.log(`Model: ${model}`)
  const missingTopics = await findMissingTopics()
  const missingEn = await postsWithoutEn()
  console.log(`Missing topics: ${missingTopics.length}`)
  console.log(`Posts without EN translation: ${missingEn.length}`)
  console.log('')

  let okPosts = 0
  let failPosts = 0
  let okEn = 0
  let failEn = 0
  const baseTime = Date.now()

  // 1) 누락 토픽 → KO + EN 한꺼번에 생성
  for (let i = 0; i < missingTopics.length; i++) {
    const { category, topic, keywords } = missingTopics[i]
    console.log(`\n[POST ${i + 1}/${missingTopics.length}] [${category}] ${topic.slice(0, 60)}...`)

    try {
      const ko = await generatePost(topic, category, keywords)
      const slugBase = ko.slug || `${category}-${i}`
      const exists = await turso.execute({ sql: 'SELECT id FROM Post WHERE slug = ? LIMIT 1', args: [slugBase] })
      const slug = exists.rows[0] ? `${slugBase}-${Date.now()}` : slugBase

      const postId = randomCuid()
      const idxInOriginal = TOPICS.findIndex(t => t.topic === topic)
      const cover = COVERS[category][idxInOriginal % 10]
      const tagsArr = [category, ...(ko.tags || []).filter((t: string) => t && t !== category)]
      const publishedAt = sqliteDate(new Date(baseTime - i * 30 * 60 * 1000))

      await turso.execute({
        sql: `INSERT INTO Post (id, title, slug, content, excerpt, tags, seoTitle, seoDescription, coverImage, status, author, originalLanguage, publishedAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, 'ko', ?, datetime('now'), datetime('now'))`,
        args: [postId, ko.title, slug, ko.content, ko.excerpt || '', tagsArr.join(','),
               ko.seoTitle || ko.title, ko.seoDescription || ko.excerpt || '', cover,
               'n잡러 프리랜서', publishedAt],
      })
      console.log(`  ✓ KO saved: ${slug}`)
      okPosts++

      try {
        const en = await translateToEnglish(ko)
        await turso.execute({
          sql: `INSERT INTO PostTranslation (id, postId, locale, title, content, excerpt, seoTitle, seoDescription, coverImage, createdAt, updatedAt)
                VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [randomCuid(), postId, en.title, en.content, en.excerpt || '',
                 en.seoTitle || en.title, en.seoDescription || en.excerpt || '', cover],
        })
        console.log(`  ✓ EN saved`)
        okEn++
      } catch (e: any) {
        console.warn(`  ! EN failed: ${e.message}`)
        failEn++
      }
    } catch (e: any) {
      console.error(`  ✗ FAILED: ${e.message}`)
      failPosts++
    }

    if (i < missingTopics.length - 1) await new Promise(r => setTimeout(r, 1000))
  }

  // 2) 이미 있는 글 중 EN 번역 누락된 것
  for (let i = 0; i < missingEn.length; i++) {
    const post = missingEn[i] as any
    console.log(`\n[EN-only ${i + 1}/${missingEn.length}] ${post.slug}`)
    try {
      const en = await translateToEnglish({
        title: post.title, excerpt: post.excerpt || '', content: post.content,
      })
      await turso.execute({
        sql: `INSERT INTO PostTranslation (id, postId, locale, title, content, excerpt, seoTitle, seoDescription, coverImage, createdAt, updatedAt)
              VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [randomCuid(), post.id, en.title, en.content, en.excerpt || '',
               en.seoTitle || en.title, en.seoDescription || en.excerpt || '', post.coverImage],
      })
      console.log(`  ✓ EN saved`)
      okEn++
    } catch (e: any) {
      console.error(`  ✗ EN failed: ${e.message}`)
      failEn++
    }
    if (i < missingEn.length - 1) await new Promise(r => setTimeout(r, 1000))
  }

  const total = await turso.execute("SELECT COUNT(*) as c FROM Post WHERE status = 'PUBLISHED'")
  const totalEn = await turso.execute("SELECT COUNT(*) as c FROM PostTranslation WHERE locale = 'en'")
  console.log(`\n=================================`)
  console.log(`KO: ok=${okPosts}, fail=${failPosts}`)
  console.log(`EN: ok=${okEn}, fail=${failEn}`)
  console.log(`Total in Turso: ${total.rows[0].c} posts, ${totalEn.rows[0].c} EN translations`)
  console.log(`Time: ${((Date.now() - baseTime) / 1000 / 60).toFixed(1)} min`)
  await turso.close()
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
