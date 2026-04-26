export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

/**
 * YouTube 자동 동기화 cron 엔드포인트.
 *
 * 현재 비활성 상태입니다 (vercel.json에서 cron 제거, GitHub Actions schedule 주석 처리).
 * 활성화하려면 1) `scripts/auto-youtube-sync.ts` 구현 후 syncNewVideos() import,
 * 2) vercel.json에 cron 등록, 3) YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID env 설정.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      success: false,
      message:
        'YouTube sync not implemented. Re-enable by adding scripts/auto-youtube-sync.ts and wiring it back here.',
    },
    { status: 501 },
  )
}

export async function POST(request: NextRequest) {
  return GET(request)
}
