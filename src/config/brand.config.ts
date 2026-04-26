/**
 * Brand Configuration
 *
 * 시각적 브랜딩 자산. 로고, OG 이미지, 저작권 정보 등.
 * site.config.ts가 "무슨 사이트인가"를 정의한다면,
 * brand.config.ts는 "어떻게 보이는가"를 정의한다.
 */
export const brandConfig = {
  /** 로고 설정 */
  logo: {
    /** 텍스트 로고 (이미지가 없을 때 사용) */
    text: 'n잡러 프리랜서',
    /** 이미지 로고 경로 (public/ 기준). null이면 텍스트 로고 사용 */
    image: '/images/logo.png' as string | null,
  },

  /** 기본 OG 이미지 (public/ 기준, 1200x630 권장) */
  ogImage: '/og-image.png',

  /**
   * OG 이미지 내 캐릭터/로고 이미지 (public/ 기준).
   * null이면 OG 이미지에 캐릭터 없이 텍스트만 표시.
   */
  ogCharacterImage: null as string | null,

  /** 저작권 정보 */
  copyright: {
    holder: 'n잡러 프리랜서',
    startYear: new Date().getFullYear(),
  },
} as const
