'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import LazyImage from './LazyImage'
import { calculateReadingTime, formatReadingTime } from '@/lib/reading-time'

// Helper function to convert tags string to array
// In SQLite (Turso), tags are stored as comma-separated strings
function tagsToArray(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags
  if (!tags || typeof tags !== 'string') return []
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

interface Translation {
  id: string
  locale: string
  title: string
  excerpt: string | null
  coverImage: string | null
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  tags: string | string[] // SQLite stores as string, but can also be array
  content: string
  publishedAt: Date | null
  author: string | null
  translations?: Translation[]
}

interface InfinitePostsListProps {
  initialPosts: Post[]
  postsPerPage?: number
  locale?: string
}

export default function InfinitePostsList({ 
  initialPosts, 
  postsPerPage = 9,
  locale = 'ko'
}: InfinitePostsListProps) {
  const lang = locale === 'en' ? 'en' : 'ko'
  const [posts, setPosts] = useState(initialPosts.slice(0, postsPerPage))
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPosts.length > postsPerPage)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    const nextPage = page + 1
    const startIndex = page * postsPerPage
    const endIndex = startIndex + postsPerPage
    const newPosts = initialPosts.slice(startIndex, endIndex)

    if (newPosts.length > 0) {
      setPosts(prev => [...prev, ...newPosts])
      setPage(nextPage)
      setHasMore(endIndex < initialPosts.length)
    } else {
      setHasMore(false)
    }

    setIsLoading(false)
  }, [page, postsPerPage, initialPosts, hasMore, isLoading])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, loadMore])

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const readingTime = calculateReadingTime(post.content)
          const title = lang === 'en' && post.translations?.[0]?.title
            ? post.translations[0].title
            : post.title
          const excerpt = lang === 'en' && post.translations?.[0]?.excerpt
            ? post.translations[0].excerpt
            : post.excerpt
          const coverImage = post.translations?.[0]?.coverImage || post.coverImage
          
          return (
            <article 
              key={post.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {coverImage && (
                <Link href={`/${locale}/posts/${post.slug}`}>
                  <div className="relative h-48 w-full">
                    <LazyImage
                      src={coverImage}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </Link>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {post.publishedAt?.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span>{formatReadingTime(readingTime)}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  <Link href={`/${locale}/posts/${post.slug}`} className="hover:text-blue-600">
                    {title}
                  </Link>
                </h2>
                {excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {excerpt}
                  </p>
                )}
                {tagsToArray(post.tags).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagsToArray(post.tags).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Loading indicator */}
      <div ref={loadMoreRef} className="mt-8 text-center">
        {isLoading && (
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading more posts...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-600">No more posts to load.</p>
        )}
      </div>
    </>
  )
}