/**
 * 새 페르소나 + 카테고리 분기 글 생성 테스트.
 * 사용법: corepack pnpm exec tsx scripts/test-generate.ts [dev|sidehustle]
 *
 * 새 카테고리 포지셔닝:
 *   dev = AI 모델 개발 + **상품/서비스 개발기** + 풀스택→AI + 초기 스타트업 엔지니어링
 *   sidehustle = **워크플로 자동화** + **프리랜서 정책 정보** + 도구 후기 + 사이드 수익화
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'node:fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  buildSystemPrompt,
  generateContentPrompt,
  extractFirstJsonObject,
  type ContentCategory,
} from '../src/lib/ai-prompts'

const SAMPLE_TOPICS: Record<ContentCategory, { topic: string; keywords: string[] }> = {
  // dev: 상품 개발기 결을 강조한 토픽 — Muse 광고 합성 4-Pass 파이프라인을 어떻게 빌드했나
  dev: {
    topic: 'Muse 광고 자동 생성 4-Pass 파이프라인을 어떻게 빌드했나 — FLUX + 자체 LoRA + GPT-image 조합 결정과 장당 $0.14~0.22 단위경제',
    keywords: ['상품 개발기', '광고 자동화', 'FLUX LoRA', 'GPT-image', '단위경제', '아키텍처'],
  },
  // sidehustle: 워크플로 자동화 결을 강조한 토픽 — 블로그 RAG 자동 발행 파이프라인 만들기
  sidehustle: {
    topic: '1인 운영자의 블로그 RAG 자동 발행 파이프라인 만들기 — Vercel cron + Gemini + pgvector로 매주 글쓰기 시간을 3시간에서 30분으로',
    keywords: ['워크플로 자동화', 'RAG', '블로그 자동화', '1인 운영', 'Vercel cron'],
  },
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY missing in .env')
    process.exit(1)
  }

  const arg = process.argv[2]
  const category: ContentCategory = arg === 'sidehustle' ? 'sidehustle' : 'dev'
  const { topic, keywords } = SAMPLE_TOPICS[category]

  const fullPrompt = `${buildSystemPrompt(category)}

---

**EXECUTE TASK:**

${generateContentPrompt(topic, keywords, undefined, category)}`

  console.log(`🚀 Category: ${category}`)
  console.log(`📝 Topic: ${topic}`)
  console.log(`🔑 Keywords: ${keywords.join(', ')}`)
  console.log('\n--- Calling Gemini 2.5 Flash Lite... ---\n')

  const genAI = new GoogleGenerativeAI(apiKey)
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const model = genAI.getGenerativeModel({ model: modelName })
  console.log(`(model: ${modelName})\n`)

  const t0 = Date.now()
  const result = await model.generateContent(fullPrompt)
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const text = result.response.text()

  console.log(`✅ Done in ${elapsed}s. ${text.length} chars.\n`)
  console.log('=== RAW OUTPUT ===\n')
  console.log(text)
  console.log('\n=== END ===')

  // JSON 파싱 (공용 추출기 사용 — 코드블록 펜스/중복 출력 모두 견딤)
  try {
    interface Parsed {
      title?: string
      slug?: string
      excerpt?: string
      content?: string
      tags?: string[]
      seoTitle?: string
      seoDescription?: string
    }
    const parsed = extractFirstJsonObject<Parsed>(text)
    console.log('\n--- PARSED ---')
    console.log(`Title:     ${parsed.title}`)
    console.log(`Slug:      ${parsed.slug}`)
    console.log(`Excerpt:   ${parsed.excerpt}`)
    console.log(`Tags:      ${(parsed.tags || []).join(', ')}`)
    console.log(`Body len:  ${(parsed.content || '').length} chars`)
    console.log(`SEO Title: ${parsed.seoTitle}`)
    console.log(`SEO Desc:  ${parsed.seoDescription}`)

    // 페르소나 위반 검사
    const banned = ['Wegovy', 'ADHD', '케토', '바이오해킹', 'Colemearchy', 'PM 출신', '디자이너 출신']
    const body = (parsed.content || '') + (parsed.title || '') + (parsed.excerpt || '')
    const violations = banned.filter(w => body.includes(w))
    console.log(`\n금지 표현 위반: ${violations.length === 0 ? '✅ 없음' : '❌ ' + violations.join(', ')}`)
    console.log(`첫 태그 = 카테고리 (${category})?: ${parsed.tags?.[0] === category ? '✅' : '❌ ' + parsed.tags?.[0]}`)

    // 도입부 자기소개 검사 (첫 200자 기준)
    const opening = (parsed.content || '').slice(0, 200)
    const selfIntroPattern = /안녕하세요|저는\s+\S+(?:입니다|이에요|예요)|n잡러 프리랜서입니다/
    console.log(`도입부 자기소개 회피?: ${!selfIntroPattern.test(opening) ? 'OK' : '경고: 첫 단락에 자기소개 감지'}`)

    // 결과 저장 (운영자가 직접 열어볼 수 있게)
    try {
      mkdirSync('scripts/sample-output', { recursive: true })
      const outPath = `scripts/sample-output/${category}-${Date.now()}.md`
      const md = `# ${parsed.title}\n\n${parsed.excerpt}\n\n---\n\n${parsed.content}\n\n---\n\n## Meta\n\n- **Slug:** ${parsed.slug}\n- **Tags:** ${(parsed.tags || []).join(', ')}\n- **SEO Title:** ${parsed.seoTitle}\n- **SEO Desc:** ${parsed.seoDescription}\n`
      writeFileSync(outPath, md, 'utf8')
      console.log(`\n파일 저장: ${outPath}`)
    } catch (e) {
      console.log(`파일 저장 실패: ${(e as Error).message}`)
    }
  } catch (e) {
    console.log(`\n경고: JSON 파싱 실패: ${(e as Error).message}. 위 RAW 출력 확인.`)
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message || err)
  process.exit(1)
})
