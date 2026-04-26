export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
    hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID,
  });
}