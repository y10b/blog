import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import InfinitePostsList from '@/components/InfinitePostsList'
import PageLayout from '@/components/PageLayout'
import { normalizePostsTags } from '@/lib/utils/tags'
import { siteConfig } from '@/config'

type Category = 'dev' | 'sidehustle'

const CATEGORY_LABEL: Record<Category, { ko: string; en: string }> = {
  dev: { ko: '개발/AI', en: 'Dev / AI' },
  sidehustle: { ko: 'N잡/도구', en: 'Side hustle / Tools' },
}

const ALL_LABEL = { ko: '전체', en: 'All' }
const HEADING = { ko: '모든 글', en: 'All Posts' }
const NO_POSTS = { ko: '아직 글이 없습니다.', en: 'No posts yet.' }

function isValidCategory(v: string | undefined): v is Category {
  return v === 'dev' || v === 'sidehustle'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isKorean = locale === 'ko'
  const title = isKorean ? `모든 글 | ${siteConfig.shortName}` : `All Posts | ${siteConfig.shortName}`
  const description = siteConfig.description[isKorean ? 'ko' : 'en']

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export const dynamic = 'force-dynamic'

export default async function PostsPage({
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

    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null, lte: new Date() },
        // 카테고리 필터: tags 첫 항목이 카테고리 ("dev,nextjs,..." or "sidehustle,...")
        ...(activeCategory ? { tags: { startsWith: activeCategory } } : {}),
        // 언어별 필터링
        ...(lang === 'ko'
          ? { originalLanguage: 'ko' }
          : {
              OR: [
                { originalLanguage: 'en' },
                {
                  AND: [
                    { originalLanguage: 'ko' },
                    { translations: { some: { locale: 'en' } } },
                  ],
                },
              ],
            }),
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        translations: { where: { locale: lang } },
      },
    })

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: siteConfig.name,
      description:
        siteConfig.description[lang as keyof typeof siteConfig.description] ??
        siteConfig.description[siteConfig.defaultLocale],
      url: `${siteConfig.url}/${locale}/posts${activeCategory ? `?category=${activeCategory}` : ''}`,
      blogPost: posts.map(post => {
        const title =
          lang === 'en' && post.translations?.[0]?.title ? post.translations[0].title : post.title
        const excerpt =
          lang === 'en' && post.translations?.[0]?.excerpt ? post.translations[0].excerpt : post.excerpt

        return {
          '@type': 'BlogPosting',
          headline: title,
          description: excerpt,
          datePublished: post.publishedAt?.toISOString(),
          url: `${siteConfig.url}/${locale}/posts/${post.slug}`,
          author: {
            '@type': siteConfig.author.type,
            name: siteConfig.author.name,
          },
        }
      }),
    }

    return (
      <PageLayout locale={locale} currentPath="/posts">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{HEADING[lang]}</h1>
          <p className="text-lg text-gray-600">{siteConfig.description[lang]}</p>
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <CategoryTab active={!activeCategory} href={`/${locale}/posts`} label={ALL_LABEL[lang]} />
          <CategoryTab
            active={activeCategory === 'dev'}
            href={`/${locale}/posts?category=dev`}
            label={CATEGORY_LABEL.dev[lang]}
          />
          <CategoryTab
            active={activeCategory === 'sidehustle'}
            href={`/${locale}/posts?category=sidehustle`}
            label={CATEGORY_LABEL.sidehustle[lang]}
          />
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-600">{NO_POSTS[lang]}</p>
        ) : (
          <InfinitePostsList
            key={activeCategory ?? 'all'}
            initialPosts={normalizePostsTags(posts)}
            locale={locale}
          />
        )}
      </PageLayout>
    )
  } catch (error) {
    console.error('Error loading posts page:', error)

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
      <PageLayout locale={locale} currentPath="/posts">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{HEADING[lang]}</h1>
        </div>
        <p className="text-gray-600">
          {lang === 'ko'
            ? '게시물을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'
            : 'Unable to load posts. Please try again later.'}
        </p>
      </PageLayout>
    )
  }
}

function CategoryTab({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${
        active
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </Link>
  )
}
