export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

const youtube = google.youtube('v3')

// YouTube 영상을 포스트로 변환하는 함수
async function createPostFromVideo(video: any) {
  if (!video || !video.snippet) {
    console.error('Invalid video data')
    return null
  }
  const videoId = video.id.videoId || video.id
  const snippet = video.snippet
  
  // 이미 포스팅된 영상인지 확인
  const existingPost = await prisma.post.findFirst({
    where: {
      youtubeVideoId: videoId
    }
  })
  
  if (existingPost) {
    console.log(`Video ${videoId} already posted`)
    return null
  }
  
  // 영상 설명을 마크다운으로 변환
  const content = `
## YouTube 영상

이 포스트는 YouTube 영상에서 자동으로 생성되었습니다.

### 영상 정보
- **제목**: ${snippet.title}
- **게시일**: ${new Date(snippet.publishedAt).toLocaleDateString('ko-KR')}
- **채널**: ${snippet.channelTitle}

### 설명
${snippet.description || '설명이 없습니다.'}

### 영상 보기
YouTube에서 전체 영상을 시청하려면 아래 링크를 클릭하세요:
[YouTube에서 보기](https://www.youtube.com/watch?v=${videoId})

---

*이 포스트는 YouTube 영상에서 자동으로 생성되었습니다.*
`
  
  // slug 생성 (영문 제목 기반)
  const slug = snippet.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now()
  
  // 포스트 생성
  const post = await prisma.post.create({
    data: {
      title: snippet.title,
      slug: slug,
      content: content,
      excerpt: snippet.description ? 
        snippet.description.substring(0, 200) + '...' : 
        '이 포스트는 YouTube 영상에서 자동으로 생성되었습니다.',
      coverImage: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      tags: snippet.tags || ['YouTube', '영상'],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      youtubeVideoId: videoId,
      originalLanguage: 'ko',
      author: 'YouTube Auto-Post'
    }
  })
  
  return post
}

export async function GET(request: NextRequest) {
  try {
    // Cron job 인증 확인
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // YouTube API 키 확인
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID
    
    if (!apiKey || !channelId) {
      return NextResponse.json({ 
        error: 'YouTube API key or channel ID not configured' 
      }, { status: 500 })
    }
    
    // 어제부터 오늘까지의 영상 가져오기
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const response = await youtube.search.list({
      key: apiKey,
      channelId: channelId,
      part: ['snippet'],
      order: 'date',
      type: ['video'],
      publishedAfter: yesterday.toISOString(),
      maxResults: 10
    })
    
    const videos = response.data.items || []
    console.log(`Found ${videos.length} new videos`)
    
    // 각 영상에 대해 포스트 생성
    const results = []
    for (const video of videos) {
      try {
        const post = await createPostFromVideo(video)
        if (post) {
          results.push({
            status: 'success',
            videoId: video.id?.videoId || video.id || '',
            postId: post.id,
            title: post.title
          })
        } else {
          results.push({
            status: 'skipped',
            videoId: video.id?.videoId || video.id || '',
            reason: 'Already posted'
          })
        }
      } catch (error) {
        console.error('Error creating post from video:', error)
        results.push({
          status: 'error',
          videoId: video.id?.videoId || video.id || '',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Vercel 재배포 트리거 (새 포스트가 있을 때만)
    const successCount = results.filter(r => r.status === 'success').length
    if (successCount > 0 && process.env.REDEPLOY_WEBHOOK_URL) {
      try {
        await fetch(process.env.REDEPLOY_WEBHOOK_URL, { method: 'POST' })
        console.log('Triggered Vercel redeploy')
      } catch (error) {
        console.error('Failed to trigger redeploy:', error)
      }
    }
    
    return NextResponse.json({
      message: `Processed ${videos.length} videos`,
      results: results,
      summary: {
        total: videos.length,
        success: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        error: results.filter(r => r.status === 'error').length
      }
    })
    
  } catch (error) {
    console.error('YouTube to posts error:', error)
    return NextResponse.json({ 
      error: 'Failed to process YouTube videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST 메서드로도 동작하도록 (Vercel Cron은 POST 사용)
export async function POST(request: NextRequest) {
  return GET(request)
}