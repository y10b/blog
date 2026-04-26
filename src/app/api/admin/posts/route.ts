export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const searchParams = request.nextUrl.searchParams
    const orderByParam = searchParams.get('orderBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    // 🔒 orderBy 화이트리스트 검증 (SQL Injection 방지)
    const allowedOrderBy = ['createdAt', 'updatedAt', 'publishedAt', 'title', 'views']
    const orderBy = allowedOrderBy.includes(orderByParam) ? orderByParam : 'createdAt'

    const posts = await prisma.post.findMany({
      orderBy: { [orderBy]: order as 'asc' | 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        coverImage: true,
        views: true,
        youtubeVideoId: true,
        originalLanguage: true,
        translations: {
          select: {
            locale: true,
            title: true,
            coverImage: true,
          }
        }
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// Trigger redeploy at Wed Sep 3 14:39:25 KST 2025
