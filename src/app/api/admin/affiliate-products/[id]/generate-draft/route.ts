export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { extractFirstJsonObject } from '@/lib/ai-prompts'

interface DraftJson {
  blogCategory: 'dev' | 'sidehustle'
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  blogReason?: string
}

/**
 * 클릭 가능한 쿠팡 파트너스 배너 HTML.
 *
 * MarkdownContent 컴포넌트가 rehype-raw를 켜둔 덕에 본문에 raw HTML을 그대로 넣으면 렌더링됨.
 * Tailwind 클래스는 prose 안에서 일관되게 적용되지 않을 수 있어 inline style 사용.
 */
function buildAffiliateBanner(opts: {
  name: string
  imageUrl: string | null
  coupangUrl: string
  price?: number | null
}): string {
  const { name, imageUrl, coupangUrl, price } = opts
  const safeName = name.replace(/"/g, '&quot;')
  const priceLine =
    typeof price === 'number' && price > 0
      ? `<div style="font-size:0.875rem;color:#57534e;margin-top:0.25rem;">₩${price.toLocaleString()}</div>`
      : ''
  const img = imageUrl
    ? `<img src="${imageUrl}" alt="${safeName}" style="width:120px;height:120px;object-fit:cover;border-radius:0.5rem;flex-shrink:0;" loading="lazy" />`
    : ''
  return `<a href="${coupangUrl}" target="_blank" rel="noopener noreferrer sponsored" style="display:flex;align-items:center;gap:1rem;padding:1rem;margin:1.5rem 0;border:1px solid #e7e5e4;border-radius:0.75rem;background:#fafaf9;text-decoration:none;color:inherit;line-height:1.4;">
  ${img}
  <div style="flex:1;min-width:0;">
    <div style="font-size:0.7rem;font-weight:600;color:#b45309;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:0.25rem;">쿠팡 파트너스</div>
    <div style="font-weight:600;color:#1c1917;font-size:1rem;">${safeName}</div>
    ${priceLine}
  </div>
  <span style="flex-shrink:0;padding:0.5rem 0.875rem;background:#1c1917;color:white;font-size:0.875rem;font-weight:500;border-radius:0.375rem;white-space:nowrap;">쿠팡에서 보기 →</span>
</a>`
}

/**
 * 본문의 첫 H2 직전에 배너를 삽입. H2가 없으면 첫 빈 줄 뒤(도입부 끝)에 삽입.
 * 이미 본문에 배너 HTML이 있으면(미래 확장 대비) 중복 삽입 안 함.
 */
function insertBannerAfterIntro(content: string, bannerHtml: string): string {
  if (content.includes(bannerHtml)) return content

  // 첫 ## 헤더 찾기
  const h2Match = content.match(/^##\s/m)
  if (h2Match && h2Match.index !== undefined) {
    return content.slice(0, h2Match.index) + bannerHtml + '\n\n' + content.slice(h2Match.index)
  }

  // 첫 빈 줄 뒤에 삽입
  const blankLineIdx = content.indexOf('\n\n')
  if (blankLineIdx !== -1) {
    return (
      content.slice(0, blankLineIdx + 2) + bannerHtml + '\n\n' + content.slice(blankLineIdx + 2)
    )
  }

  // fallback: 맨 앞
  return bannerHtml + '\n\n' + content
}

/**
 * POST /api/admin/affiliate-products/[id]/generate-draft
 *
 * 등록된 쿠팡 상품을 받아 Claude로 블로그 카테고리 판단 + 초안 글 작성을 한 번에 진행.
 * 결과는 DRAFT 상태의 Post 레코드로 저장되어 /admin posts 테이블에서 검토 가능.
 *
 * 정책:
 *  - 거짓 사용 경험 작성 금지 (쿠팡 약관 + CLAUDE.md 정책)
 *  - 객관적 스펙 분석 + "어떤 사람에게 도움될 수 있는지" 추론 톤
 *  - 항상 DRAFT 상태로 저장 → 운영자가 자기 경험 추가하고 검토 후 발행
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { id } = await params

  const product = await prisma.affiliateProduct.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const anthropic = new Anthropic({ apiKey })

  const userPrompt = `당신은 개발자 프리랜서가 운영하는 블로그의 콘텐츠 작가입니다.
이 블로그는 두 카테고리로 운영됩니다:

- **dev** (개발막차 블로그): AI 모델 개발, 풀스택 기술, 초기 스타트업 엔지니어링, 개발 장비/도구 (외장 SSD, GPU, 개발자 키보드, 모니터, 모니터암 등)
- **sidehustle** (n잡러 블로그): 워크플로 자동화, 프리랜서·1인 사업자 정책, AI 도구, 사이드 프로젝트, 생산성 도구 (의자, 책상, 노이즈 캔슬링 헤드폰, Notion 등)

# 작업

다음 쿠팡 상품에 대한 블로그 글 초안을 작성하세요.

## 상품 정보
- 상품명: ${product.name}
- 카테고리: ${product.category}
${product.price ? `- 가격: ₩${product.price.toLocaleString()}` : ''}
${product.description ? `- 설명: ${product.description}` : ''}
- 키워드: ${product.keywords || '(없음)'}

## 1단계: 블로그 카테고리 판단

이 상품이 dev / sidehustle 중 어느 블로그에 더 어울리는지 결정.
짧은 이유와 함께 명시.

## 2단계: 본문 작성

한국어, 일인칭, 2000자 이상. 마크다운 H2/H3 위계.

**🚨 절대 금지 (쿠팡 파트너스 약관 + 정책):**
- "써봤다", "사용한 지 한 달", "내 책상 위에 두고", "결제하고 후회 없다" 같은 실제 사용 경험 가정
- 별점, 만족도 점수, 구체적 사용 시간 명시
- 거짓 후기 인상을 줄 수 있는 모든 표현

**✅ 허용 (정직한 도구 소개 톤):**
- 공식 스펙 분석 (제조사가 공개한 정보 기반)
- 같은 가격대/카테고리 시장 비교
- "이런 작업/상황의 사람에게 도움될 수 있는 이유" 추론
- 객관적 장단점 (스펙 기준)
- 글 마지막에 작성자 노트 섹션: "## 작성자 노트 (직접 보강 예정)" — 본인이 실사용 후기 추가하라는 placeholder

## 링크 삽입

본문 중간에 한 번, 자연스럽게:
\`[${product.name}](AFFILIATE_LINK_PLACEHOLDER)\`

(실제 링크는 시스템이 자동으로 ${product.coupangUrl}로 치환합니다.)

## 응답 형식

다른 설명 없이 JSON만:

\`\`\`json
{
  "blogCategory": "dev",
  "blogReason": "한 줄로 카테고리 선택 이유",
  "title": "SEO 제목 (60자 이내)",
  "slug": "url-friendly-english-or-romanized-slug",
  "excerpt": "150자 이내 요약",
  "content": "마크다운 본문 (2000자 이상). 마지막에 ## 작성자 노트 (직접 보강 예정) 섹션 포함. 본문에 [${product.name}](AFFILIATE_LINK_PLACEHOLDER)를 1회 자연스럽게 언급.",
  "tags": ["dev", "키워드1", "키워드2", "키워드3"]
}
\`\`\`

**중요:** tags 배열의 첫 항목은 반드시 blogCategory와 동일 ("dev" 또는 "sidehustle"). 시스템이 라우팅에 사용함.`

  let parsed: DraftJson
  try {
    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const text = result.content[0]?.type === 'text' ? result.content[0].text : ''
    parsed = extractFirstJsonObject<DraftJson>(text)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[generate-draft] Claude error:', e)
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 502 })
  }

  // 카테고리 검증 — Claude가 잘못 응답해도 허용 가능 값 강제
  const blogCategory: 'dev' | 'sidehustle' =
    parsed.blogCategory === 'sidehustle' ? 'sidehustle' : 'dev'

  // tags 첫 항목이 카테고리가 아니면 강제 prepend (라우팅 의존성)
  const rawTags = Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : []
  const tagsArr =
    rawTags[0] === blogCategory ? rawTags : [blogCategory, ...rawTags.filter(t => t !== blogCategory)]
  const tagsStr = tagsArr.join(',')

  // 본문에 affiliate placeholder를 실제 쿠팡 URL로 치환 (텍스트 멘션도 클릭 가능하게)
  const contentWithLink = parsed.content.replace(/AFFILIATE_LINK_PLACEHOLDER/g, product.coupangUrl)

  // 클릭 가능한 이미지 배너를 도입부 뒤에 삽입 (이미지 + 상품명 + CTA)
  const bannerHtml = buildAffiliateBanner({
    name: product.name,
    imageUrl: product.imageUrl,
    coupangUrl: product.coupangUrl,
    price: product.price,
  })
  const contentWithBanner = insertBannerAfterIntro(contentWithLink, bannerHtml)

  // 법적 고지 footer (쿠팡 파트너스 + 공정거래위 추천·보증 심사지침)
  const disclaimer = '\n\n---\n\n*이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.*'
  const finalContent = contentWithBanner + disclaimer

  // slug 충돌 방지 — timestamp suffix
  const baseSlug = (parsed.slug || product.name)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const uniqueSlug = `${baseSlug || 'post'}-${Date.now()}`

  const post = await prisma.post.create({
    data: {
      title: parsed.title,
      slug: uniqueSlug,
      content: finalContent,
      excerpt: parsed.excerpt || null,
      coverImage: product.imageUrl || null,
      tags: tagsStr,
      status: 'DRAFT',
      author: 'n잡러 프리랜서',
      originalLanguage: 'ko',
      affiliateProducts: {
        create: {
          affiliateProductId: product.id,
        },
      },
    },
    select: { id: true, slug: true, title: true },
  })

  return NextResponse.json({
    success: true,
    blogCategory,
    blogReason: parsed.blogReason || '',
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
    },
  })
}
