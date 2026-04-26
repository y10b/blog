export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. Total published posts
    const totalPublished = await prisma.post.count({
      where: { status: 'PUBLISHED' }
    })

    // 2. Non-YouTube published posts (oldest 10)
    const oldestNonYoutube = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        coverImage: true,
        youtubeVideoId: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    })

    // 3. Posts with English translation (oldest 10)
    const oldestWithEnglish = await prisma.post.findMany({
      where: {
        youtubeVideoId: null,
        status: 'PUBLISHED',
        translations: {
          some: { locale: 'en' }
        }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        translations: {
          where: { locale: 'en' },
          select: {
            title: true,
            coverImage: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    })

    // 4. Count by category
    const counts = {
      total_published: totalPublished,
      non_youtube_published: await prisma.post.count({
        where: {
          youtubeVideoId: null,
          status: 'PUBLISHED'
        }
      }),
      has_english_translation: await prisma.post.count({
        where: {
          youtubeVideoId: null,
          status: 'PUBLISHED',
          translations: { some: { locale: 'en' } }
        }
      }),
      needs_korean_thumbnail: await prisma.post.count({
        where: {
          youtubeVideoId: null,
          status: 'PUBLISHED',
          OR: [
            { coverImage: null },
            { coverImage: '' }
          ]
        }
      }),
      needs_english_thumbnail: await prisma.post.count({
        where: {
          youtubeVideoId: null,
          status: 'PUBLISHED',
          translations: {
            some: {
              locale: 'en',
              OR: [
                { coverImage: null },
                { coverImage: '' }
              ]
            }
          }
        }
      })
    }

    return NextResponse.json({
      counts,
      oldest_non_youtube_posts: oldestNonYoutube.map((p, i) => ({
        rank: i + 1,
        title: p.title,
        createdAt: p.createdAt,
        hasKoreanThumbnail: !!p.coverImage
      })),
      oldest_with_english_translation: oldestWithEnglish.map((p, i) => ({
        rank: i + 1,
        title: p.title,
        createdAt: p.createdAt,
        englishTitle: p.translations[0]?.title,
        hasEnglishThumbnail: !!p.translations[0]?.coverImage
      }))
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
