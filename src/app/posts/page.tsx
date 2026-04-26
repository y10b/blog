import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import InfinitePostsList from '@/components/InfinitePostsList'
import { normalizePostsTags } from '@/lib/utils/tags'
import { siteConfig, brandConfig } from '@/config'

const SITE_DESCRIPTION =
  '풀스택에서 AI 모델 개발자로 넘어가는 과정과, N잡·도구·사이드 프로젝트 운영 기록.'

export const metadata: Metadata = {
  title: `All Posts | ${siteConfig.name}`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `All Posts | ${siteConfig.name}`,
    description: SITE_DESCRIPTION,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

type Category = 'dev' | 'sidehustle'

const CATEGORY_LABEL: Record<Category, string> = {
  dev: '개발/AI',
  sidehustle: 'N잡/도구',
}

function isValidCategory(v: string | undefined): v is Category {
  return v === 'dev' || v === 'sidehustle'
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = isValidCategory(category) ? category : null

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        lte: new Date(),
      },
      // 카테고리 필터: tags 첫 항목이 카테고리 (예: "dev,nextjs,llm")
      ...(activeCategory ? { tags: { startsWith: activeCategory } } : {}),
    },
    orderBy: {
      publishedAt: 'desc',
    },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteConfig.name,
    description: SITE_DESCRIPTION,
    url: `${siteConfig.url}/posts`,
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt?.toISOString(),
      url: `${siteConfig.url}/posts/${post.slug}`,
      author: {
        '@type': 'Person',
        name: post.author || siteConfig.author.name,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-3xl font-bold text-gray-900">
                {brandConfig.logo.text}
              </Link>
              <nav>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 ml-6">소개</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">전체 글</h1>
            <p className="text-lg text-gray-600">{SITE_DESCRIPTION}</p>
          </div>

          {/* 카테고리 필터 탭 */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <CategoryTab active={!activeCategory} href="/posts" label="전체" />
            <CategoryTab active={activeCategory === 'dev'} href="/posts?category=dev" label={CATEGORY_LABEL.dev} />
            <CategoryTab active={activeCategory === 'sidehustle'} href="/posts?category=sidehustle" label={CATEGORY_LABEL.sidehustle} />
          </div>

          {posts.length === 0 ? (
            <p className="text-gray-600">아직 글이 없습니다.</p>
          ) : (
            <InfinitePostsList
              key={activeCategory ?? 'all'}
              initialPosts={normalizePostsTags(posts)}
            />
          )}
        </main>

        <footer className="bg-gray-50 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} {brandConfig.copyright.holder}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
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
