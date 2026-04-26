export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  
  const status = {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set',
    hasChannelId: !!channelId,
    channelId: channelId || 'Not set',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'Not on Vercel',
  };
  
  // API 키 검증
  if (!apiKey) {
    return NextResponse.json({
      error: 'YouTube API Key not found',
      status,
      solution: 'Please set YOUTUBE_API_KEY in your environment variables',
    }, { status: 500 });
  }
  
  if (!channelId) {
    return NextResponse.json({
      error: 'YouTube Channel ID not found',
      status,
      solution: 'Please set YOUTUBE_CHANNEL_ID in your environment variables',
    }, { status: 500 });
  }
  
  // 간단한 API 테스트
  try {
    const testUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'YouTube API request failed',
        status,
        apiError: data,
        solution: 'Check if your API key is valid and YouTube Data API v3 is enabled',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      status,
      channelInfo: data.items?.[0]?.snippet || null,
      message: 'YouTube API is properly configured!',
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test YouTube API',
      status,
      details: error.message,
    }, { status: 500 });
  }
}