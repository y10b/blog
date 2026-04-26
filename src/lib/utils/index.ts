/**
 * 유틸리티 함수 통합 export
 */

export * from './date'
export * from './string'
export * from './prisma'

// YouTube 관련 유틸리티
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // 다양한 YouTube URL 형식 지원
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  // URL이 아니라 ID 자체인 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }
  
  return null
}

export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string {
  const qualityMap = {
    'default': 'default',
    'hq': 'hqdefault',
    'mq': 'mqdefault',
    'sd': 'sddefault',
    'maxres': 'maxresdefault',
  }
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

// 환경 변수 유틸리티
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  
  return value || defaultValue || ''
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// 숫자 포맷팅
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num)
}

// 배열 유틸리티
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

// 딜레이 유틸리티
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 재시도 유틸리티
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number
    delay?: number
    onError?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000, onError } = options
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }
      
      if (onError) {
        onError(error as Error, attempt)
      }
      
      await sleep(delay * attempt)
    }
  }
  
  throw new Error('Retry failed')
}