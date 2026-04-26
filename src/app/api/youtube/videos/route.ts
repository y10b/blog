export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server';
import { getChannelVideos } from '@/lib/youtube';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // API 키 확인 및 디버깅 로그
    console.log('YouTube API Debug:', {
      hasApiKey: !!process.env.YOUTUBE_API_KEY,
      apiKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
      hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID,
      channelId: process.env.YOUTUBE_CHANNEL_ID || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    if (!process.env.YOUTUBE_API_KEY || !process.env.YOUTUBE_CHANNEL_ID) {
      return NextResponse.json(
        { 
          error: 'YouTube API not configured',
          message: 'Please set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in Vercel Dashboard',
          instructions: {
            step1: 'Go to https://vercel.com and select your project',
            step2: 'Navigate to Settings → Environment Variables',
            step3: 'Add YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID',
            step4: 'Redeploy the project',
          },
          debug: {
            apiKeyMissing: !process.env.YOUTUBE_API_KEY,
            channelIdMissing: !process.env.YOUTUBE_CHANNEL_ID,
            environment: process.env.NODE_ENV || 'unknown'
          }
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;

    const { videos, nextPageToken } = await getChannelVideos(limit, pageToken);
    
    // Check which videos are already posted
    const videoIds = videos.map(v => v.id);
    console.log('Checking videos:', videoIds.length, 'videos');
    
    const existingPosts = await prisma.post.findMany({
      where: {
        youtubeVideoId: {
          in: videoIds
        }
      },
      select: {
        youtubeVideoId: true,
        id: true,
        slug: true,
        status: true
      }
    });
    
    console.log('Found existing posts:', existingPosts.length);
    
    // Create a map for quick lookup
    const postedVideosMap = new Map(
      existingPosts.map(post => [post.youtubeVideoId, post])
    );
    
    // Add posted status to videos
    const videosWithStatus = videos.map(video => ({
      ...video,
      isPosted: postedVideosMap.has(video.id),
      postDetails: postedVideosMap.get(video.id) || null
    }));
    
    return NextResponse.json({
      videos: videosWithStatus,
      nextPageToken
    });
  } catch (error: any) {
    console.error('Error in YouTube API:', error);
    console.error('Error stack:', error?.stack);
    
    // 더 상세한 에러 정보 반환
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      type: error?.constructor?.name || 'UnknownError',
      // Google API 에러의 경우 추가 정보
      ...(error?.response?.data && { apiError: error.response.data }),
      // 환경변수 상태 확인 (프로덕션에서도 디버깅을 위해 임시로 표시)
      env: {
        hasApiKey: !!process.env.YOUTUBE_API_KEY,
        hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID
      }
    };
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch YouTube videos',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}