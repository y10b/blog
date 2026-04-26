export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

/**
 * YouTube 동기화 테스트 API (개발용).
 * 현재 비활성 — scripts/auto-youtube-sync.ts 미구현.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'YouTube sync test endpoint not implemented.',
    },
    { status: 501 },
  )
}
