export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { GoogleGenerativeAI } from '@google/generative-ai'

const youtube = google.youtube('v3')

// YouTube 영상 정보로 AI 콘텐츠 생성
async function generateAIContent(video: any) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
당신은 YouTube 영상을 블로그 포스트로 변환하는 전문 콘텐츠 크리에이터입니다.

다음 YouTube 영상 정보를 바탕으로 매력적인 블로그 포스트를 작성해주세요:

제목: ${video.snippet.title}
설명: ${video.snippet.description || '설명 없음'}
게시일: ${video.snippet.publishedAt}
채널: ${video.snippet.channelTitle}

요구사항:
1. SEO에 최적화된 블로그 포스트 작성
2. 영상의 핵심 내용을 요약하고 확장
3. 독자가 영상을 보고 싶게 만드는 티저 포함
4. 마크다운 형식으로 작성
5. 한국어로 작성
6. 최소 500자 이상의 풍부한 콘텐츠
7. 핵심 포인트를 불릿 포인트로 정리
8. 영상을 보지 않아도 유용한 정보 제공

포스트 구조:
- 흥미로운 도입부
- 핵심 내용 요약
- 주요 인사이트 또는 팁
- 영상 시청 유도 문구
- 관련 주제 확장
`

  try {
    const result = await model.generateContent(prompt)
    const content = result.response.text()
    return content
  } catch (error) {
    console.error('AI content generation failed:', error)
    // 폴백: 기본 콘텐츠 반환
    return null
  }
}

// YouTube 영상을 포스트로 변환하는 함수 (AI 버전)
async function createAIPostFromVideo(video: any) {
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
  
  // AI로 콘텐츠 생성
  let content = await generateAIContent(video)
  
  // AI 생성 실패 시 기본 콘텐츠 사용
  if (!content) {
    content = `
## YouTube 영상

### ${snippet.title}

**게시일**: ${new Date(snippet.publishedAt).toLocaleDateString('ko-KR')}

### 영상 소개
${snippet.description || '이 영상에서는 흥미로운 내용을 다룹니다.'}

### 주요 내용
이 영상에서 다루는 핵심 주제들:
- 실용적인 팁과 인사이트
- 전문가의 조언
- 실제 사례와 경험 공유

### 왜 이 영상을 봐야 할까요?
이 영상은 여러분에게 새로운 관점과 유용한 정보를 제공합니다. 
${snippet.channelTitle} 채널의 최신 콘텐츠로, 깊이 있는 내용을 담고 있습니다.
`
  }
  
  // YouTube 영상 임베드 추가
  content += `

## 🎬 영상 보기

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe 
    src="https://www.youtube.com/embed/${videoId}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0" 
    allowfullscreen>
  </iframe>
</div>

---

📌 **전체 영상 보기**: [YouTube에서 시청하기](https://www.youtube.com/watch?v=${videoId})

💬 영상이 도움이 되셨다면 YouTube에서 좋아요와 구독 부탁드립니다!

---

*이 포스트는 YouTube 영상을 기반으로 AI가 작성한 콘텐츠입니다.*
`
  
  // slug 생성 (영문 제목 기반)
  const slug = snippet.title
    .toLowerCase()
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50) + '-yt-' + Date.now()
  
  // SEO 최적화된 excerpt 생성
  const excerpt = snippet.description ? 
    snippet.description.substring(0, 150).replace(/\n/g, ' ') + '... YouTube 영상에서 더 자세한 내용을 확인하세요.' : 
    `${snippet.title} - ${snippet.channelTitle} 채널의 최신 영상을 블로그 포스트로 만나보세요.`
  
  // 태그 생성
  const tags = ['YouTube', snippet.channelTitle]
  if (snippet.tags && snippet.tags.length > 0) {
    tags.push(...snippet.tags.slice(0, 3))
  }
  
  // 포스트 생성
  const post = await prisma.post.create({
    data: {
      title: `[영상] ${snippet.title}`,
      slug: slug,
      content: content,
      excerpt: excerpt,
      coverImage: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      status: 'PUBLISHED',
      publishedAt: new Date(),
      youtubeVideoId: videoId,
      originalLanguage: 'ko',
      author: 'YouTube + AI',
      seoTitle: `${snippet.title} - YouTube 영상 요약 및 인사이트`,
      seoDescription: excerpt
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
    
    // API 키 확인
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || !channelId) {
      return NextResponse.json({ 
        error: 'YouTube API key or channel ID not configured' 
      }, { status: 500 })
    }
    
    if (!geminiKey) {
      console.warn('Gemini API key not configured, will use basic content')
    }
    
    // 최근 24시간 내의 영상 가져오기
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const response = await youtube.search.list({
      key: apiKey,
      channelId: channelId,
      part: ['snippet'],
      order: 'date',
      type: ['video'],
      publishedAfter: yesterday.toISOString(),
      maxResults: 5 // AI 처리 시간 고려하여 제한
    })
    
    const videos = response.data.items || []
    console.log(`Found ${videos.length} new videos`)
    
    // 각 영상에 대해 포스트 생성
    const results = []
    for (const video of videos) {
      try {
        const post = await createAIPostFromVideo(video)
        if (post) {
          results.push({
            status: 'success',
            videoId: video.id?.videoId || '',
            postId: post.id,
            title: post.title,
            slug: post.slug
          })
          console.log(`Created post for video: ${video.snippet?.title || 'Unknown'}`)
        } else {
          results.push({
            status: 'skipped',
            videoId: video.id?.videoId || '',
            title: video.snippet?.title || 'Unknown',
            reason: 'Already posted'
          })
        }
      } catch (error) {
        console.error('Error creating post from video:', error)
        results.push({
          status: 'error',
          videoId: video.id?.videoId || '',
          title: video.snippet?.title || 'Unknown',
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
      },
      timestamp: new Date().toISOString()
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