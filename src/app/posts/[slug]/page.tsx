import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'
import YouTubeThumbnail from '@/components/YouTubeThumbnail'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BlogPostAnalytics } from '@/components/BlogPostAnalytics'
import MarkdownContent from '@/components/MarkdownContent'
import RelatedPosts from '@/components/RelatedPosts'
import TableOfContents from '@/components/TableOfContents'
import Breadcrumb from '@/components/Breadcrumb'
import YouTubeEmbed from '@/components/YouTubeEmbed'
import CommentSection from '@/components/comments/CommentSection'
import { calculateReadingTime, formatReadingTime } from '@/lib/reading-time'
import ViewCounter from '@/components/ViewCounter'
import { tagsToArray } from '@/lib/utils/tags'
import { siteConfig, brandConfig } from '@/config'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

// Static generation for better performance
export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
          lte: new Date()
        }
      },
      select: {
        slug: true
      }
    })
    
    return posts.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params
  // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
  const slug = decodeURIComponent(rawSlug)
  const post = await prisma.post.findUnique({
    where: { slug },
  })

  if (!post || !post.publishedAt) {
    return {
      title: 'Post Not Found',
    }
  }

  // Parse content if it's in JSON format
  let content = post.content
  
  // Check if content starts with ```json block
  if (content.startsWith('```json')) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.content) {
          content = parsed.content
        }
      } catch (e) {
        console.error('Failed to parse JSON block:', e)
      }
    }
  } else {
    // Try direct JSON parse
    try {
      const parsed = JSON.parse(post.content)
      if (parsed.content) {
        content = parsed.content
      }
    } catch (e) {
      // Content is already in markdown format
    }
  }

  const readingTime = calculateReadingTime(content)
  
  const ogImageUrl = post.coverImage ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || siteConfig.author.name)}&date=${encodeURIComponent(post.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: [ogImageUrl],
    },
  }
}

export default async function PostPage({
  params,
  searchParams
}: PostPageProps & { searchParams: Promise<{ lang?: string }> }) {
  const { slug: rawSlug } = await params
  const sp = await searchParams
  const lang = sp.lang === 'en' ? 'en' : 'ko'

  // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
  const slug = decodeURIComponent(rawSlug)

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      translations: {
        where: {
          locale: lang
        }
      }
    }
  })

  if (!post || !post.publishedAt || post.status !== 'PUBLISHED') {
    notFound()
  }
  
  // Check if post is scheduled for future
  if (post.publishedAt > new Date()) {
    notFound()
  }

  // View count is now tracked client-side via ViewCounter component
  
  // Use translated content if available
  const translation = post.translations?.[0]
  const displayTitle = lang === 'en' && translation?.title ? translation.title : post.title
  const displayContent = lang === 'en' && translation?.content ? translation.content : post.content
  const displayExcerpt = lang === 'en' && translation?.excerpt ? translation.excerpt : post.excerpt
  
  // Parse content if it's in JSON format
  let content = displayContent
  
  // Check if content starts with ```json block
  if (content.startsWith('```json')) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.content) {
          content = parsed.content
        }
      } catch (e) {
        console.error('Failed to parse JSON block:', e)
      }
    }
  } else {
    // Try direct JSON parse
    try {
      const parsed = JSON.parse(post.content)
      if (parsed.content) {
        content = parsed.content
      }
    } catch (e) {
      // Content is already in markdown format
    }
  }
  
  // Calculate reading time
  const readingTime = calculateReadingTime(content)
  const youtubeVideoId = extractYouTubeVideoId(post.youtubeVideoId || '')
  
  // Fetch comments separately
  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      isApproved: true,
      isDeleted: false,
      parentId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      replies: {
        where: {
          isApproved: true,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || siteConfig.author.name)}&date=${encodeURIComponent(post.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || siteConfig.author.name,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.shortName,
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${post.slug}`,
    },
    keywords: tagsToArray(post.tags).join(', '),
    articleSection: tagsToArray(post.tags)[0] || 'Blog',
    wordCount: content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
    inLanguage: 'ko-KR',
  }
  
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Posts',
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/posts`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/posts/${post.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <div className="min-h-screen bg-white w-full overflow-x-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-3xl font-bold text-gray-900">
                {brandConfig.logo.text}
              </Link>
              <nav className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Link
                    href={`?lang=ko`}
                    className={`px-3 py-1 rounded text-sm ${lang === 'ko' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    한국어
                  </Link>
                  <Link
                    href={`?lang=en`}
                    className={`px-3 py-1 rounded text-sm ${lang === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    English
                  </Link>
                </div>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full overflow-x-hidden">
          <div className="flex gap-8">
            <article className="flex-1 max-w-4xl">
              <Breadcrumb postTitle={displayTitle} postSlug={post.slug} />
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayTitle}</h1>
                <div className="flex items-center text-gray-600 space-x-4">
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span>{formatReadingTime(readingTime)}</span>
                  <span>•</span>
                  <ViewCounter postId={post.id} initialViews={post.views} />
                  {post.author && (
                    <>
                      <span>•</span>
                      <span>By {post.author}</span>
                    </>
                  )}
                </div>
            {tagsToArray(post.tags).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tagsToArray(post.tags).map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="relative w-full max-w-4xl mb-8 rounded-lg overflow-hidden">
              <div className="relative aspect-[16/9] w-full">
                {(() => {
                  const isYouTubeThumbnail = post.coverImage.includes('ytimg.com') || post.coverImage.includes('img.youtube.com')
                  const youtubeVideoIdMatch = post.coverImage.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
                  const youtubeVideoId = youtubeVideoIdMatch ? youtubeVideoIdMatch[1] : null
                  
                  if (isYouTubeThumbnail && youtubeVideoId) {
                    return (
                      <YouTubeThumbnail
                        videoId={youtubeVideoId}
                        alt={post.title}
                        fill
                        className="object-contain bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }
                  
                  return (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-contain bg-gray-100"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                  )
                })()}
              </div>
            </div>
          )}
          
          {post.youtubeVideoId && (
            <YouTubeEmbed 
              videoId={post.youtubeVideoId} 
              title={post.title}
            />
          )}

              <MarkdownContent content={content} />
              
              <CommentSection postSlug={post.slug} />
              
              <RelatedPosts postId={post.id} />

              <BlogPostAnalytics 
                title={post.title} 
                slug={post.slug} 
                author={post.author || undefined}
                tags={tagsToArray(post.tags)}
              />
            </article>
            
            <aside className="hidden xl:block">
              <TableOfContents content={content} />
            </aside>
          </div>
        </div>

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