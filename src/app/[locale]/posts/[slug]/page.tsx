import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'
import YouTubeThumbnail from '@/components/YouTubeThumbnail'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPostBySlug, getPostComments } from '@/lib/optimized-queries'
import LazyBlogPostAnalytics from '@/components/LazyBlogPostAnalytics'
import MarkdownContent from '@/components/MarkdownContent'
import RelatedPosts from '@/components/RelatedPosts'
import TableOfContents from '@/components/TableOfContents'
import Breadcrumb from '@/components/Breadcrumb'
import YouTubeEmbed from '@/components/YouTubeEmbed'
import LazyCommentSection from '@/components/LazyCommentSection'
import { calculateReadingTime, formatReadingTime } from '@/lib/reading-time'
import ViewCounter from '@/components/ViewCounter'
import { siteConfig, brandConfig, navigationConfig, featuresConfig } from '@/config'
import { shouldUseNextImage } from '@/lib/image-utils'
import { optimizeUnsplashUrl } from '@/lib/unsplash'
import { tagsToArray } from '@/lib/utils/tags'

interface PostPageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Temporarily use dynamic rendering to avoid DB quota issues during build
export const dynamic = 'force-dynamic'
// Will revert to static generation once DB quota is resolved:
// export const dynamic = 'force-static'
// export const dynamicParams = true
// export const revalidate = 3600 // 1 hour ISR

// Temporarily disabled to avoid DB quota issues during build
/*
export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null
          // 🔧 HOTFIX: Remove lte condition to include all published posts
          // lte: new Date()
        }
      },
      select: {
        slug: true
      }
    })

    if (posts.length === 0) {
      console.warn('⚠️ [generateStaticParams] No posts found for static generation!')
      return []
    }

    const locales = ['ko', 'en']
    const params = posts.flatMap((post) =>
      locales.map((locale) => ({
        slug: post.slug,
        locale,
      }))
    )

    return params
  } catch (error) {
    console.error('❌ [generateStaticParams] Error:', error)
    return []
  }
}
*/

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  try {
    const { slug: rawSlug, locale } = await params
    // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
    const slug = decodeURIComponent(rawSlug)
    const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      translations: {
        where: {
          locale: locale === 'en' ? 'en' : 'ko'
        }
      }
    }
  })

  if (!post || !post.publishedAt) {
    return {
      title: 'Post Not Found',
    }
  }

  // Parse content if it's in JSON format (used for metadata extraction only)
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
  
  // Use translated content if available
  const translation = post.translations?.[0]
  const displayTitle = locale === 'en' && translation?.title ? translation.title : post.title
  const displayExcerpt = locale === 'en' && translation?.excerpt ? translation.excerpt : post.excerpt
  const displayCoverImage = translation?.coverImage || post.coverImage
  
  const ogImageUrl = displayCoverImage ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(displayTitle)}&author=${encodeURIComponent(post.author || siteConfig.author.name)}&date=${encodeURIComponent(new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`

  return {
    title: post.seoTitle || displayTitle,
    description: post.seoDescription || displayExcerpt || undefined,
    alternates: {
      languages: {
        'ko': `/ko/posts/${post.slug}`,
        'en': `/en/posts/${post.slug}`,
      }
    },
    openGraph: {
      title: post.seoTitle || displayTitle,
      description: post.seoDescription || displayExcerpt || undefined,
      type: 'article',
      publishedTime: new Date(post.publishedAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      tags: post.tags,
      images: [{ url: ogImageUrl }],
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || displayTitle,
      description: post.seoDescription || displayExcerpt || undefined,
      images: [ogImageUrl],
    },
  }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: `Post - ${siteConfig.shortName}`,
      description: 'Blog post content unavailable'
    }
  }
}

export default async function PostPage({
  params
}: PostPageProps) {
  try {
    const { slug: rawSlug, locale } = await params
    const lang = locale === 'en' ? 'en' : 'ko'

    // 🔧 HOTFIX: Decode URL parameter to handle Korean characters
    const slug = decodeURIComponent(rawSlug)

    const post = await getPostBySlug(slug)

  if (!post || !post.publishedAt || post.status !== 'PUBLISHED') {
    console.warn('⚠️ [PostPage] Post not found or not published, returning 404')
    notFound()
  }
  
  // Check if post is scheduled for future
  if (post.publishedAt > new Date()) {
    notFound()
  }

  // View count is now tracked client-side via ViewCounter component
  
  // Use translated content if available
  const translation = post.translations?.find(t => t.locale === lang)
  const displayTitle = lang === 'en' && translation?.title ? translation.title : post.title
  const displayContent = lang === 'en' && translation?.content ? translation.content : post.content
  const displayExcerpt = lang === 'en' && translation?.excerpt ? translation.excerpt : post.excerpt
  
  // Parse content if it's in JSON format
  let content = displayContent

  // Remove YouTube boilerplate from existing posts
  content = content.replace(/\n*---\n+### Watch the Video\n+This post is based on our YouTube video\. Watch it for more details!\n+---\n+\*Originally published on YouTube:[^*]*\*/g, '')
  content = content.replace(/### Watch the Video[\s\S]*?Watch it for more details!/g, '')
  content = content.replace(/\*Originally published on YouTube:[^*]*\*/g, '')

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
  
  // Fetch comments separately (no caching for dynamic data)
  const comments = await getPostComments(post.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&author=${encodeURIComponent(post.author || siteConfig.author.name)}&date=${encodeURIComponent(new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}&readTime=${encodeURIComponent(formatReadingTime(readingTime))}&tags=${encodeURIComponent(tagsToArray(post.tags).join(','))}`,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      '@type': siteConfig.author.type,
      name: post.author || siteConfig.author.name,
      url: `${siteConfig.url}${siteConfig.author.aboutPath}`,
    },
    publisher: {
      '@type': siteConfig.author.type,
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/posts/${post.slug}`,
    },
    keywords: tagsToArray(post.tags).join(', '),
    articleSection: tagsToArray(post.tags)[0] || 'Blog',
    wordCount: content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
    inLanguage: lang === 'en' ? 'en-US' : 'ko-KR',
  }
  
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Posts',
        item: `${siteConfig.url}/posts`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteConfig.url}/posts/${post.slug}`,
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
      
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/85" role="banner">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center py-5">
              <Link href={`/${locale}`} className="flex items-center" aria-label={brandConfig.logo.text}>
                {brandConfig.logo.image ? (
                  <Image
                    src={brandConfig.logo.image}
                    alt={brandConfig.logo.text}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                ) : (
                  <span className="flex items-center gap-2.5">
                    <span className="inline-block w-7 h-7 rounded-md bg-stone-900" aria-hidden />
                    <span className="text-base font-semibold tracking-tight">
                      {brandConfig.logo.text}
                    </span>
                  </span>
                )}
              </Link>
              <div className="flex gap-1">
                <Link
                  href={`/ko/posts/${post.slug}`}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'ko' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  KOR
                </Link>
                <Link
                  href={`/en/posts/${post.slug}`}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'en' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  ENG
                </Link>
              </div>
            </div>
            <nav className="flex items-center gap-5 pb-3 text-sm" aria-label="Main navigation">
              {(navigationConfig[lang as keyof typeof navigationConfig] ?? navigationConfig[siteConfig.defaultLocale]).map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href === '/' ? '' : item.href}`}
                  className={`pb-1.5 border-b-2 transition-colors ${
                    item.href === '/posts'
                      ? 'text-stone-900 border-stone-900 font-medium'
                      : 'text-stone-500 border-transparent hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14 w-full overflow-x-hidden">
          <div className="xl:flex xl:gap-10">
            <article className="xl:flex-1 min-w-0">
              <Breadcrumb postTitle={displayTitle} postSlug={post.slug} />
              <header className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-4 leading-tight tracking-tight">{displayTitle}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                  <time dateTime={new Date(post.publishedAt).toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>·</span>
                  <span>{formatReadingTime(readingTime)}</span>
                  <span>·</span>
                  <ViewCounter postId={post.id} initialViews={post.views} />
                  {post.author && (
                    <>
                      <span>·</span>
                      <span>{lang === 'ko' ? `글쓴이 ${post.author}` : `By ${post.author}`}</span>
                    </>
                  )}
                </div>
            {tagsToArray(post.tags).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tagsToArray(post.tags).map((tag: string, idx: number) => {
                  const isCategory = idx === 0 && (tag === 'dev' || tag === 'sidehustle')
                  return (
                    <span
                      key={tag}
                      className={
                        isCategory
                          ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'
                          : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600'
                      }
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="relative w-full mb-8 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              <div className="relative aspect-[16/9] w-full">
                {(() => {
                  const isYouTubeThumbnail = post.coverImage.includes('ytimg.com') || post.coverImage.includes('img.youtube.com')
                  const youtubeVideoIdMatch = post.coverImage.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
                  const youtubeVideoId = youtubeVideoIdMatch ? youtubeVideoIdMatch[1] : null

                  if (isYouTubeThumbnail && youtubeVideoId) {
                    return (
                      <YouTubeThumbnail
                        videoId={youtubeVideoId}
                        alt={displayTitle}
                        fill
                        className="object-contain bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }

                  // Unsplash: optimize URL for auto-format (AVIF/WebP) + smaller size
                  if (post.coverImage.includes('images.unsplash.com')) {
                    const optimizedSrc = optimizeUnsplashUrl(post.coverImage)
                    return (
                      <Image
                        src={optimizedSrc}
                        alt={displayTitle}
                        fill
                        className="object-cover bg-gray-100"
                        priority
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }

                  // Use conditional rendering based on image source to avoid 402 Payment Required errors
                  if (shouldUseNextImage(post.coverImage)) {
                    return (
                      <Image
                        src={post.coverImage}
                        alt={displayTitle}
                        fill
                        className="object-cover bg-gray-100"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      />
                    )
                  }

                  // Use regular img tag for Vercel Blob Storage and other problematic images
                  return (
                    <img
                      src={post.coverImage}
                      alt={displayTitle}
                      className="absolute inset-0 w-full h-full object-cover bg-gray-100"
                      loading="eager"
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

              <Suspense fallback={<div className="h-20 animate-pulse bg-stone-100 rounded mt-10" />}>
                <LazyCommentSection postSlug={post.slug} locale={locale} />
              </Suspense>

              <Suspense fallback={<div className="h-32 animate-pulse bg-stone-100 rounded mt-10" />}>
                <RelatedPosts postId={post.id} />
              </Suspense>

              <Suspense fallback={null}>
                <LazyBlogPostAnalytics
                  title={post.title}
                  slug={post.slug}
                  author={post.author || undefined}
                  tags={tagsToArray(post.tags)}
                />
              </Suspense>
            </article>

            <aside className="hidden xl:block xl:w-64 xl:flex-shrink-0">
              <div className="sticky top-28">
                <TableOfContents content={content} />
              </div>
            </aside>
          </div>
        </main>

        <footer className="bg-white border-t border-stone-200" role="contentinfo">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                {brandConfig.logo.image ? (
                  <Image
                    src={brandConfig.logo.image}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                ) : (
                  <span className="inline-block w-5 h-5 rounded bg-stone-900" aria-hidden />
                )}
                <span>&copy; {brandConfig.copyright.startYear} {brandConfig.copyright.holder}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <Link href={`/${locale}/privacy`} className="text-stone-500 hover:text-stone-900">
                  {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
                </Link>
                <Link href={`/${locale}/terms`} className="text-stone-500 hover:text-stone-900">
                  {lang === 'ko' ? '이용약관' : 'Terms of Service'}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
  } catch (error) {
    console.error('Error loading post page:', error)

    // Emergency fallback during DB quota or connection issues
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('connection') ||
      error.message.includes('database') ||
      error.name === 'PrismaClientInitializationError'
    )) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Temporarily Unavailable</h1>
            <p className="text-gray-600 mb-4">We're experiencing high traffic. Please try again in a few minutes.</p>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Return to Home</a>
          </div>
        </div>
      )
    }

    // For other errors, show 404
    notFound()
  }
}