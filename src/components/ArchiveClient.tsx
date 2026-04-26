'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Translation {
  title: string
  excerpt: string | null
}

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  publishedAt: string | null
  youtubeVideoId: string | null
  originalLanguage: string
  tags?: string
  translations: Translation[]
}

type Category = 'dev' | 'sidehustle'

interface ArchiveClientProps {
  posts: Post[]
  locale: string
  lang: 'ko' | 'en'
  /** 서버에서 결정된 카테고리 (URL ?category=...) — null이면 전체 */
  activeCategory: Category | null
}

const CATEGORY_LABEL: Record<Category, { ko: string; en: string }> = {
  dev: { ko: '개발/AI', en: 'Dev / AI' },
  sidehustle: { ko: 'N잡/도구', en: 'Side hustle / Tools' },
}

export default function ArchiveClient({ posts, locale, lang, activeCategory }: ArchiveClientProps) {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'youtube'>('all')

  // Source axis (직접 작성 vs YouTube 자동 변환)
  const manualPosts = posts.filter(post => !post.youtubeVideoId)
  const youtubePosts = posts.filter(post => post.youtubeVideoId)

  const filteredPosts =
    sourceFilter === 'all' ? posts : sourceFilter === 'manual' ? manualPosts : youtubePosts

  const archiveBase = `/${locale}/archive`

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lang === 'ko' ? '아카이브' : 'Archive'}
        </h1>

        {/* 카테고리 탭 (서버 사이드, ?category= 쿼리) */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <CategoryTab
            href={archiveBase}
            active={!activeCategory}
            label={lang === 'ko' ? '전체' : 'All'}
          />
          <CategoryTab
            href={`${archiveBase}?category=dev`}
            active={activeCategory === 'dev'}
            label={CATEGORY_LABEL.dev[lang]}
          />
          <CategoryTab
            href={`${archiveBase}?category=sidehustle`}
            active={activeCategory === 'sidehustle'}
            label={CATEGORY_LABEL.sidehustle[lang]}
          />
        </div>

        {/* 출처 필터 (직접/YouTube — 클라이언트 사이드) */}
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">
            {lang === 'ko' ? '출처:' : 'Source:'}
          </span>
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sourceFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {lang === 'ko' ? `전체 (${posts.length})` : `All (${posts.length})`}
          </button>
          <button
            onClick={() => setSourceFilter('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sourceFilter === 'manual'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {lang === 'ko'
              ? `직접 쓴 글 (${manualPosts.length})`
              : `Manual Posts (${manualPosts.length})`}
          </button>
          <button
            onClick={() => setSourceFilter('youtube')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sourceFilter === 'youtube'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {lang === 'ko'
              ? `YouTube 글 (${youtubePosts.length})`
              : `YouTube Posts (${youtubePosts.length})`}
          </button>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {lang === 'ko' ? '게시물이 없습니다.' : 'No posts found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const title =
              lang === 'en' && post.translations?.[0]?.title
                ? post.translations[0].title
                : post.title
            const isYoutube = !!post.youtubeVideoId

            return (
              <article key={post.id} className="border-b border-gray-200 pb-4">
                <Link
                  href={`/${locale}/posts/${post.slug}`}
                  className="block hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                >
                  <div className="flex justify-between items-baseline gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-medium text-gray-900 hover:text-gray-700">
                          {title}
                        </h2>
                        {isYoutube && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            YouTube
                          </span>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {lang === 'en' && post.translations?.[0]?.excerpt
                            ? post.translations[0].excerpt
                            : post.excerpt}
                        </p>
                      )}
                    </div>
                    <time className="text-sm text-gray-500 whitespace-nowrap">
                      {post.publishedAt &&
                        new Date(post.publishedAt).toLocaleDateString(
                          lang === 'ko' ? 'ko-KR' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                    </time>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

function CategoryTab({ href, active, label }: { href: string; active: boolean; label: string }) {
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
