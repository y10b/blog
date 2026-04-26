export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateAffiliateContentPrompt } from '@/lib/ai-prompts'
import { injectAffiliateLinks } from '@/lib/utils/affiliate-link-injector'
import { generateUniqueSlugWithTimestamp } from '@/lib/utils/slug'

let _turso: ReturnType<typeof createClient> | null = null
function getTurso() {
  if (!_turso) {
    _turso = createClient({
      url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "",
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _turso
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Vercel Cron Job: 매일 자동으로 제휴 콘텐츠 생성 및 발행
 *
 * Vercel 대시보드에서 설정:
 * - Path: /api/cron/daily-affiliate
 * - Schedule: 0 9 * * * (매일 오전 9시 KST)
 *
 * 또는 vercel.json 설정:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-affiliate",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. CRON_SECRET 검증 (보안)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚀 매일 자동 제휴 포스팅 시작...')

    // 2. 랜덤 상품 선택 (아직 콘텐츠 없는 상품 우선)
    const result = await getTurso().execute({
      sql: `
        SELECT ap.*
        FROM "AffiliateProduct" ap
        LEFT JOIN "PostAffiliateProduct" pap ON ap.id = pap."affiliateProductId"
        WHERE pap."affiliateProductId" IS NULL
        ORDER BY RANDOM()
        LIMIT 1
      `
    })

    // 모든 상품에 콘텐츠가 있으면, 랜덤으로 하나 선택
    let product
    if (result.rows.length === 0) {
      const fallbackResult = await getTurso().execute({
        sql: 'SELECT * FROM "AffiliateProduct" ORDER BY RANDOM() LIMIT 1'
      })
      product = fallbackResult.rows[0]
    } else {
      product = result.rows[0]
    }

    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'No products found'
      })
    }

    console.log(`📦 선택된 상품: ${product.name}`)

    // 3. AI 콘텐츠 생성
    const keywords = (product.keywords as string).split(',').map(k => k.trim())
    const prompt = generateAffiliateContentPrompt(
      product.name as string,
      product.coupangUrl as string,
      keywords,
      'review',
      {
        category: product.category as string,
        description: product.description as string
      }
    )

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const geminiResult = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      }
    })

    const responseText = geminiResult.response.text()

    // 4. JSON 파싱
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    let parsedContent
    try {
      parsedContent = JSON.parse(jsonText)
    } catch {
      parsedContent = {
        title: `${product.name} 실사용 후기`,
        content: responseText,
        excerpt: responseText.substring(0, 160),
        tags: keywords,
        seoTitle: `${product.name} 후기`,
        seoDescription: responseText.substring(0, 160)
      }
    }

    // 5. 제휴 링크 삽입
    const contentWithLinks = injectAffiliateLinks(parsedContent.content, [{
      id: product.id as string,
      name: product.name as string,
      coupangUrl: product.coupangUrl as string,
      category: product.category as string,
      keywords: product.keywords as string
    }])

    // 6. DB에 저장 (바로 PUBLISHED 상태)
    const slug = generateUniqueSlugWithTimestamp(parsedContent.title)
    const postId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    await getTurso().execute({
      sql: `INSERT INTO Post (
        id, title, slug, content, excerpt, tags,
        seoTitle, seoDescription, coverImage, status, author, originalLanguage,
        createdAt, updatedAt, views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        postId,
        parsedContent.title,
        slug,
        contentWithLinks,
        parsedContent.excerpt || contentWithLinks.substring(0, 160),
        Array.isArray(parsedContent.tags) ? parsedContent.tags.join(',') : keywords.join(','),
        parsedContent.seoTitle || parsedContent.title,
        parsedContent.seoDescription || parsedContent.excerpt,
        parsedContent.coverImage || null,
        'PUBLISHED', // 자동 발행
        'n잡러 프리랜서',
        'ko',
        now,
        now,
        0
      ]
    })

    // 7. PostAffiliateProduct 관계 추가
    await getTurso().execute({
      sql: `INSERT INTO PostAffiliateProduct (
        id, postId, affiliateProductId, createdAt
      ) VALUES (?, ?, ?, ?)`,
      args: [
        `rel-${Date.now()}`,
        postId,
        product.id,
        now
      ]
    })

    console.log('✅ 포스트 생성 및 발행 완료!')
    console.log(`   - Title: ${parsedContent.title}`)
    console.log(`   - Slug: ${slug}`)

    // 8. Vercel 재배포 트리거 (옵션)
    if (process.env.REDEPLOY_WEBHOOK_URL) {
      await fetch(process.env.REDEPLOY_WEBHOOK_URL, { method: 'POST' })
      console.log('🔄 Vercel 재배포 트리거 완료')
    }

    getTurso().close()

    return NextResponse.json({
      success: true,
      post: {
        id: postId,
        title: parsedContent.title,
        slug,
        product: product.name
      }
    })

  } catch (error) {
    console.error('💥 에러:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
