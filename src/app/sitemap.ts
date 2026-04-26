import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/config'

/**
 * 동적 sitemap.xml 생성.
 *
 * App Router의 native MetadataRoute API 사용. 빌드 타임이 아닌 요청 타임에
 * 실행되어 Turso DB에서 published post를 직접 조회하므로 신규 글이 발행되면
 * 즉시 sitemap에 반영된다.
 *
 * 포함:
 *  - 정적 페이지 (홈, /posts, /archive, /about, privacy, terms) × ko/en
 *  - 모든 PUBLISHED 글 × ko/en (번역본 있을 때만 en)
 *
 * 제외:
 *  - /admin/*, /api/*, /offline (robots.ts에서도 차단)
 *  - 카테고리 필터 URL (?category=dev) — 동일 콘텐츠 중복
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url
  const now = new Date()

  const staticPaths: Array<{ path: string; changefreq: 'daily' | 'weekly' | 'monthly'; priority: number }> = [
    { path: '', changefreq: 'daily', priority: 1.0 },
    { path: '/posts', changefreq: 'daily', priority: 0.9 },
    { path: '/archive', changefreq: 'weekly', priority: 0.8 },
    { path: '/about', changefreq: 'monthly', priority: 0.7 },
    { path: '/privacy', changefreq: 'monthly', priority: 0.3 },
    { path: '/terms', changefreq: 'monthly', priority: 0.3 },
  ]

  const staticEntries: MetadataRoute.Sitemap = siteConfig.locales.flatMap(locale =>
    staticPaths.map(({ path, changefreq, priority }) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: changefreq,
      priority,
      alternates: {
        languages: Object.fromEntries(
          siteConfig.locales.map(l => [l, `${baseUrl}/${l}${path}`]),
        ),
      },
    })),
  )

  let postEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null, lte: now },
      },
      select: {
        slug: true,
        publishedAt: true,
        updatedAt: true,
        translations: { select: { locale: true } },
      },
      orderBy: { publishedAt: 'desc' },
    })

    postEntries = posts.flatMap(post => {
      const localesWithContent = ['ko', ...post.translations.map(t => t.locale).filter(l => l === 'en')]
      const lastMod = post.updatedAt ?? post.publishedAt ?? now

      return localesWithContent.map(locale => ({
        url: `${baseUrl}/${locale}/posts/${post.slug}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            localesWithContent.map(l => [l, `${baseUrl}/${l}/posts/${post.slug}`]),
          ),
        },
      }))
    })
  } catch (error) {
    console.error('[sitemap] failed to load posts:', error)
  }

  return [...staticEntries, ...postEntries]
}
