/**
 * 환경 변수 타입 안전성 및 검증
 * 모든 환경 변수는 이 파일을 통해 접근해야 합니다.
 */

class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

/**
 * 필수 환경 변수 검증
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new EnvError(
      `Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
}

/**
 * 선택적 환경 변수 가져오기
 */
function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * 환경 변수 객체
 * 앱 시작 시 한 번만 검증되며, 이후 타입 안전하게 사용 가능
 */
export const env = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: getOptionalEnv('DATABASE_URL'), // Vercel에서 자동 주입
  POSTGRES_URL: getOptionalEnv('POSTGRES_URL'),

  // AI Services
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY'),

  // YouTube API
  YOUTUBE_API_KEY: getOptionalEnv('YOUTUBE_API_KEY'),
  YOUTUBE_CHANNEL_ID: getOptionalEnv('YOUTUBE_CHANNEL_ID'),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: getOptionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),

  // Cron & Webhooks
  CRON_SECRET: getOptionalEnv('CRON_SECRET'),
  REDEPLOY_WEBHOOK_URL: getOptionalEnv('REDEPLOY_WEBHOOK_URL'),

  // Admin
  ADMIN_PASSWORD: getOptionalEnv('ADMIN_PASSWORD'),
} as const;

/**
 * 환경 변수 타입
 */
export type Env = typeof env;

/**
 * 개발 환경 체크
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * 환경 변수 검증 (앱 초기화 시 호출)
 */
export function validateEnv(): void {
  const requiredVars = [
    'GEMINI_API_KEY',
    'YOUTUBE_API_KEY',
    'YOUTUBE_CHANNEL_ID',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missing.map(v => `   - ${v}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    console.error(errorMessage);

    // 프로덕션에서는 앱 시작을 막음
    if (isProduction) {
      throw new EnvError(errorMessage);
    }
  }

  if (isDevelopment) {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * 특정 API 키가 설정되었는지 확인
 */
export function hasApiKey(service: 'gemini' | 'youtube'): boolean {
  switch (service) {
    case 'gemini':
      return !!env.GEMINI_API_KEY;
    case 'youtube':
      return !!env.YOUTUBE_API_KEY;
    default:
      return false;
  }
}
