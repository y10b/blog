import PageLayout from '@/components/PageLayout'
import ArchiveClient from '@/components/ArchiveClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Category = 'dev' | 'sidehustle'

function isValidCategory(v: string | undefined): v is Category {
  return v === 'dev' || v === 'sidehustle'
}

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}) {
  try {
    const { locale } = await params
    const { category } = await searchParams
    const lang = locale === 'en' ? 'en' : 'ko'
    const activeCategory = isValidCategory(category) ? category : null

    // 언어별 + 카테고리별 포스트 가져오기
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        coverImage: { not: null },
        // 카테고리 필터: tags 첫 항목이 카테고리
        ...(activeCategory ? { tags: { startsWith: activeCategory } } : {}),
        OR: [
          { originalLanguage: lang },
          { translations: { some: { locale: lang } } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        youtubeVideoId: true,
        originalLanguage: true,
        tags: true,
        translations: {
          where: { locale: lang },
          select: { title: true, excerpt: true },
        },
      },
    })

    const serializedPosts = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt?.toISOString() || null,
      youtubeVideoId: post.youtubeVideoId,
      originalLanguage: post.originalLanguage,
      tags: post.tags,
      translations: post.translations,
    }))

    return (
      <PageLayout locale={locale} currentPath="/archive">
        <ArchiveClient
          posts={serializedPosts}
          locale={locale}
          lang={lang}
          activeCategory={activeCategory}
        />
      </PageLayout>
    )
  } catch (error) {
    console.error('Error loading archive page:', error)

    if (
      error instanceof Error &&
      (error.message.includes('quota') ||
        error.message.includes('connection') ||
        error.message.includes('database') ||
        error.name === 'PrismaClientInitializationError')
    ) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Temporarily Unavailable</h1>
            <p className="text-gray-600 mb-4">
              We're experiencing high traffic. Please try again in a few minutes.
            </p>
            <a href="/" className="text-blue-600 hover:text-blue-800">
              ← Return to Home
            </a>
          </div>
        </div>
      )
    }

    const { locale } = await params
    const lang = locale === 'en' ? 'en' : 'ko'

    return (
      <PageLayout locale={locale} currentPath="/archive">
        <ArchiveClient posts={[]} locale={locale} lang={lang} activeCategory={null} />
      </PageLayout>
    )
  }
}
