export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // YouTube 자동 포스팅 API 호출 (AI 버전)
    const response = await fetch(
      `${request.nextUrl.origin}/api/youtube-to-posts-ai`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
        }
      }
    )
    
    const data = await response.json()
    
    return NextResponse.json({
      message: 'YouTube sync test completed',
      result: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test YouTube sync error:', error)
    return NextResponse.json({ 
      error: 'Failed to test YouTube sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}