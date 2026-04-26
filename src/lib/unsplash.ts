/**
 * Unsplash API 유틸리티
 *
 * 블로그 포스트용 고품질 이미지를 자동으로 가져옵니다.
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  description: string | null
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}

interface UnsplashSearchResponse {
  results: UnsplashImage[]
  total: number
  total_pages: number
}

/**
 * Unsplash에서 키워드로 이미지 검색
 */
export async function searchUnsplashImage(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
): Promise<UnsplashImage | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY가 설정되지 않았습니다.')
    return null
  }

  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.append('query', query)
    url.searchParams.append('per_page', '1')
    url.searchParams.append('orientation', orientation)

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data: UnsplashSearchResponse = await response.json()

    if (data.results.length === 0) {
      console.warn(`⚠️ "${query}"에 대한 이미지를 찾을 수 없습니다.`)
      return null
    }

    // 첫 번째 결과 반환
    return data.results[0]
  } catch (error) {
    console.error('❌ Unsplash 이미지 검색 실패:', error)
    return null
  }
}

/**
 * 블로그 포스트 제목에서 적절한 검색 키워드 추출
 */
export function extractImageKeywords(title: string): string {
  // 한글 제목 처리
  const koreanKeywords: Record<string, string> = {
    '수학': 'mathematics study',
    '영어': 'english learning',
    '과학': 'science education',
    '수능': 'exam preparation',
    '내신': 'school study',
    '공부': 'studying',
    '시험': 'test exam',
    '대학': 'university college',
    '입시': 'college admission',
    '독해': 'reading comprehension',
    '문법': 'grammar',
    '듣기': 'listening',
  }

  // 영어 제목 처리
  const englishKeywords: Record<string, string> = {
    'IIT': 'engineering students india',
    'JEE': 'exam preparation india',
    'SAT': 'standardized test',
    'ACT': 'college test',
    'CMA': 'ai technology education',
    'study': 'students studying',
    'exam': 'exam preparation',
    'college': 'university campus',
    'preparation': 'study preparation',
  }

  // 제목에서 키워드 찾기
  const titleLower = title.toLowerCase()

  // 한글 키워드 확인
  for (const [korean, english] of Object.entries(koreanKeywords)) {
    if (title.includes(korean)) {
      return english
    }
  }

  // 영어 키워드 확인
  for (const [keyword, search] of Object.entries(englishKeywords)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return search
    }
  }

  // 기본값: 일반적인 학습 이미지
  return 'students studying'
}

/**
 * 블로그 포스트에 최적화된 이미지 URL 생성
 */
export function getOptimizedImageUrl(
  image: UnsplashImage,
  width: number = 1080,
  quality: number = 75
): string {
  const url = new URL(image.urls.raw)
  url.searchParams.append('w', width.toString())
  url.searchParams.append('q', quality.toString())
  url.searchParams.append('auto', 'format')
  url.searchParams.append('fit', 'crop')
  return url.toString()
}

/**
 * 기존 Unsplash URL을 최적화된 형태로 변환
 * fm=jpg → auto=format (AVIF/WebP 자동 전환)
 * w=1200 → w=1080 (적정 크기)
 * q=80 → q=75 (파일 크기 절감)
 */
export function optimizeUnsplashUrl(url: string): string {
  if (!url.includes('images.unsplash.com')) return url
  try {
    const parsed = new URL(url)
    // Switch from fixed format to auto-format (browser-negotiated AVIF/WebP)
    if (parsed.searchParams.has('fm')) {
      parsed.searchParams.delete('fm')
      parsed.searchParams.set('auto', 'format')
    }
    // Reduce width if over 1080
    const w = parseInt(parsed.searchParams.get('w') || '0')
    if (w > 1080) {
      parsed.searchParams.set('w', '1080')
    }
    // Reduce quality if over 75
    const q = parseInt(parsed.searchParams.get('q') || '0')
    if (q > 75) {
      parsed.searchParams.set('q', '75')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

/**
 * 이미지 attribution (저작권 표시)
 */
export function getImageAttribution(image: UnsplashImage): string {
  return `Photo by <a href="${image.links.html}?utm_source=intalk_blog&utm_medium=referral">${image.user.name}</a> on <a href="https://unsplash.com?utm_source=intalk_blog&utm_medium=referral">Unsplash</a>`
}

/**
 * Alt text 생성
 */
export function generateAltText(image: UnsplashImage, fallback: string): string {
  return image.alt_description || image.description || fallback
}
