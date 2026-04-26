/**
 * 간단한 Admin 인증 헬퍼
 */

import { NextRequest } from 'next/server';
import { env } from './env';

/**
 * Admin API 요청 인증
 *
 * 지원하는 형식 (3가지 모두 동일한 ADMIN_PASSWORD와 비교):
 *  1. `Authorization: Basic base64(admin:{ADMIN_PASSWORD})` — admin UI에서 fetch 호출 시 자동 전송
 *  2. `Authorization: Bearer {ADMIN_PASSWORD}` — 외부 스크립트/CLI에서 호출 시
 *  3. `?password={ADMIN_PASSWORD}` query parameter — 브라우저 수동 테스트용
 *
 * Default 비밀번호: 'admin123' (env 미설정 시 미들웨어와 동일하게 fallback)
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const adminPassword = env.ADMIN_PASSWORD || 'admin123';

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Basic Auth (브라우저 admin UI 인증 후 자동 전송)
    if (authHeader.startsWith('Basic ')) {
      const base64 = authHeader.slice(6);
      try {
        const decoded = Buffer.from(base64, 'base64').toString('utf8');
        const colonIdx = decoded.indexOf(':');
        if (colonIdx > 0) {
          const username = decoded.slice(0, colonIdx);
          const password = decoded.slice(colonIdx + 1);
          if (username === 'admin' && password === adminPassword) {
            return true;
          }
        }
      } catch {
        // 디코딩 실패 → 다음 방식으로 fallthrough
      }
    }

    // Bearer token (스크립트/CLI 사용)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token === adminPassword) {
        return true;
      }
    }
  }

  // Query parameter (수동 테스트용)
  const passwordParam = request.nextUrl.searchParams.get('password');
  if (passwordParam === adminPassword) {
    return true;
  }

  return false;
}

/**
 * Cron Job 인증 (기존)
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    console.error('⚠️  CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
