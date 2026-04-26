export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tagsToArray } from '@/lib/utils/tags'
import { verifyAdminAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // 🔒 인증 체크
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }
  try {
    // 1. Get posts without Korean thumbnails (coverImage)
    // Separated into manual posts and YouTube posts
    const koreanManualPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: null, // Manual posts only
        status: { in: ['PUBLISHED', 'DRAFT'] },
        originalLanguage: 'ko',
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        status: true,
        originalLanguage: true,
        views: true,
        globalRank: true,
        youtubeVideoId: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const koreanYoutubePosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: { not: null }, // YouTube posts only
        status: { in: ['PUBLISHED', 'DRAFT'] },
        originalLanguage: 'ko',
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
        status: true,
        originalLanguage: true,
        views: true,
        globalRank: true,
        youtubeVideoId: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 2. Get English translations that need thumbnails
    // Find all PostTranslations with locale='en' that don't have coverImage
    const englishTranslationsNeedingThumbnails = await prisma.postTranslation.findMany({
      where: {
        locale: 'en',
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ],
      },
      select: {
        id: true,
        postId: true,
        locale: true,
        title: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        post: {
          select: {
            slug: true,
            status: true,
            tags: true,
            youtubeVideoId: true,
            originalLanguage: true,
            views: true,
            globalRank: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Separate English translations into manual and YouTube
    const englishManualPosts = englishTranslationsNeedingThumbnails
      .filter(t => t.post.youtubeVideoId === null)
      .map(translation => ({
        id: translation.postId,
        translationId: translation.id,
        title: translation.title,
        slug: translation.post.slug,
        excerpt: translation.excerpt,
        createdAt: translation.createdAt,
        updatedAt: translation.updatedAt,
        tags: translation.post.tags,
        status: translation.post.status,
        originalLanguage: translation.post.originalLanguage,
        views: translation.post.views,
        globalRank: translation.post.globalRank,
        youtubeVideoId: translation.post.youtubeVideoId,
      }))

    const englishYoutubePosts = englishTranslationsNeedingThumbnails
      .filter(t => t.post.youtubeVideoId !== null)
      .map(translation => ({
        id: translation.postId,
        translationId: translation.id,
        title: translation.title,
        slug: translation.post.slug,
        excerpt: translation.excerpt,
        createdAt: translation.createdAt,
        updatedAt: translation.updatedAt,
        tags: translation.post.tags,
        status: translation.post.status,
        originalLanguage: translation.post.originalLanguage,
        views: translation.post.views,
        globalRank: translation.post.globalRank,
        youtubeVideoId: translation.post.youtubeVideoId,
      }))

    // 3. Format response with sequential numbering
    const koreanManualPostsWithNumbers = koreanManualPosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags),
      postNumber: index + 1,
      isYoutube: false
    }))

    const koreanYoutubePostsWithNumbers = koreanYoutubePosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags),
      postNumber: index + 1,
      isYoutube: true
    }))

    const englishManualPostsWithNumbers = englishManualPosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags),
      postNumber: index + 1,
      isYoutube: false
    }))

    const englishYoutubePostsWithNumbers = englishYoutubePosts.map((post, index) => ({
      ...post,
      tags: tagsToArray(post.tags),
      postNumber: index + 1,
      isYoutube: true
    }))

    // Get total counts for statistics
    const totalManualPosts = await prisma.post.count({
      where: {
        youtubeVideoId: null,
        status: { in: ['PUBLISHED', 'DRAFT'] }
      }
    })

    const totalYoutubePosts = await prisma.post.count({
      where: {
        youtubeVideoId: { not: null },
        status: { in: ['PUBLISHED', 'DRAFT'] }
      }
    })

    const koreanStats = {
      manual: {
        total: koreanManualPostsWithNumbers.length,
        byStatus: {
          DRAFT: koreanManualPostsWithNumbers.filter(p => p.status === 'DRAFT').length,
          PUBLISHED: koreanManualPostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
        }
      },
      youtube: {
        total: koreanYoutubePostsWithNumbers.length,
        byStatus: {
          DRAFT: koreanYoutubePostsWithNumbers.filter(p => p.status === 'DRAFT').length,
          PUBLISHED: koreanYoutubePostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
        }
      },
      totalAvailable: totalManualPosts + totalYoutubePosts
    }

    const englishStats = {
      manual: {
        total: englishManualPostsWithNumbers.length,
        byStatus: {
          DRAFT: englishManualPostsWithNumbers.filter(p => p.status === 'DRAFT').length,
          PUBLISHED: englishManualPostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
        }
      },
      youtube: {
        total: englishYoutubePostsWithNumbers.length,
        byStatus: {
          DRAFT: englishYoutubePostsWithNumbers.filter(p => p.status === 'DRAFT').length,
          PUBLISHED: englishYoutubePostsWithNumbers.filter(p => p.status === 'PUBLISHED').length,
        }
      },
      totalAvailable: totalManualPosts + totalYoutubePosts
    }

    return NextResponse.json({
      korean: {
        manual: koreanManualPostsWithNumbers,
        youtube: koreanYoutubePostsWithNumbers,
        stats: koreanStats
      },
      english: {
        manual: englishManualPostsWithNumbers,
        youtube: englishYoutubePostsWithNumbers,
        stats: englishStats
      }
    })
  } catch (error) {
    console.error('Failed to fetch posts needing thumbnail:', error)

    // Emergency fallback during DB quota or connection issues
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('connection') ||
      error.message.includes('database') ||
      error.name === 'PrismaClientInitializationError'
    )) {
      return NextResponse.json({
        korean: {
          manual: [],
          youtube: [],
          stats: {
            manual: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0 } },
            youtube: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0 } },
            totalAvailable: 0
          }
        },
        english: {
          manual: [],
          youtube: [],
          stats: {
            manual: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0 } },
            youtube: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0 } },
            totalAvailable: 0
          }
        },
        message: 'Database quota exceeded. Please check back later.'
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}