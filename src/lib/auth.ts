/**
 * 간단한 Admin 인증 헬퍼
 */

import { NextRequest } from 'next/server';
import { env } from './env';

/**
 * Admin API 요청 인증
 *
 * 사용법:
 * - Authorization: Bearer {ADMIN_PASSWORD}
 * - 또는 ?password={ADMIN_PASSWORD} query parameter
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const adminPassword = env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('⚠️  ADMIN_PASSWORD not configured');
    return false;
  }

  // 1. Authorization header 체크
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token === adminPassword) {
      return true;
    }
  }

  // 2. Query parameter 체크 (브라우저에서 쉽게 테스트용)
  const searchParams = request.nextUrl.searchParams;
  const passwordParam = searchParams.get('password');
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
