export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { tagsToArray } from '@/lib/utils/tags'

export async function GET(request: NextRequest) {
  try {
    // Simple auth check - you should implement proper authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days'
    
    // Calculate date range
    let startDate = new Date()
    switch (period) {
      case '24hours':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'all':
        startDate = new Date(0)
        break
    }

    // Get posts with analytics
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        publishedAt: true,
        tags: true,
      },
      orderBy: {
        views: 'desc',
      },
    })

    // Get total stats
    const totalViews = posts.reduce((sum, post) => sum + post.views, 0)
    const totalPosts = posts.length
    const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0

    // Get top performing posts
    const topPosts = posts.slice(0, 10)

    // Get views by tag
    const tagViews = posts.reduce((acc, post) => {
      tagsToArray(post.tags).forEach(tag => {
        if (!acc[tag]) acc[tag] = 0
        acc[tag] += post.views
      })
      return acc
    }, {} as Record<string, number>)

    const topTags = Object.entries(tagViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, views]) => ({ tag, views }))

    // Get posts by month
    const postsByMonth = posts.reduce((acc, post) => {
      if (!post.publishedAt) return acc
      const month = new Date(post.publishedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      if (!acc[month]) acc[month] = { count: 0, views: 0 }
      acc[month].count++
      acc[month].views += post.views
      return acc
    }, {} as Record<string, { count: number; views: number }>)

    const monthlyData = Object.entries(postsByMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 12)
      .reverse()

    return NextResponse.json({
      summary: {
        totalViews,
        totalPosts,
        avgViewsPerPost,
        period,
      },
      topPosts,
      topTags,
      monthlyData,
      allPosts: posts,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics' 
    }, { status: 500 })
  }
}