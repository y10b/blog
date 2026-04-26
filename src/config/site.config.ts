/**
 * Site Configuration
 *
 * 사이트 전역 설정. 모든 SEO 메타데이터, schema.org, canonical URL, sitemap 등이
 * 이 설정을 참조한다. 값을 바꾸면 사이트 전체에 즉시 반영된다.
 */
export const siteConfig = {
  /** 사이트 전체 이름 (schema.org, OG siteName) */
  name: 'n잡러 프리랜서',

  /** 짧은 이름 (헤더 로고, 푸터 저작권, title template suffix) */
  shortName: 'n잡러 프리랜서',

  /** 프로덕션 URL (trailing slash 없이). canonical, sitemap, robots 등에 사용 */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://intalk-blog.vercel.app').trim(),

  /** 기본 로케일 */
  defaultLocale: 'ko' as const,

  /** 지원 로케일 */
  locales: ['ko', 'en'] as const,

  /** 로케일별 사이트 제목 (홈페이지 title, OG title) */
  title: {
    ko: 'n잡러 프리랜서 — 개발자 프리랜서의 다양한 콘텐츠 블로그',
    en: 'n잡러 프리랜서 — A Developer Freelancer Writing About Many Things',
  },

  /** 로케일별 사이트 설명 (meta description, OG description) */
  description: {
    ko: '개발자 프리랜서가 운영하는 블로그. AI 모델 개발 실전기, 풀스택→AI 전환, N잡·사이드 프로젝트, AI 도구 후기까지 다양한 콘텐츠를 다룹니다.',
    en: 'A developer freelancer\'s blog covering diverse topics — AI model development, fullstack-to-AI transition, side hustles, indie projects, and AI tool reviews.',
  },

  /** SEO 키워드 */
  keywords: [
    'AI 모델 개발',
    '이미지 생성 모델',
    'FLUX LoRA',
    '파인튜닝',
    '풀스택 개발자',
    '초기 스타트업',
    'N잡',
    '사이드 프로젝트',
    'Next.js',
    'Python',
  ],

  /** 저자/발행자 정보 (schema.org author, publisher) */
  author: {
    name: 'n잡러 프리랜서',
    /** 'Person' = 개인 블로그, 'Organization' = 기업 블로그 */
    type: 'Person' as 'Person' | 'Organization',
    /** 저자 소개 페이지 경로 (schema.org author.url에 사용) */
    aboutPath: '/about',
  },

  /** 소셜 링크 (빈 문자열이면 렌더링 안 함) */
  social: {
    twitter: '',
    github: '',
    linkedin: '',
    youtube: '',
  },

  /** 연락처 이메일 */
  emails: {
    contact: '',
    privacy: '',
    legal: '',
  },

  /** 검색엔진 사이트 인증 코드 (빈 문자열이면 meta 태그 렌더링 안 함) */
  verification: {
    google: '',
    naver: '',
  },

  /** 분석 도구 ID (빈 문자열이면 스크립트 로딩 안 함) */
  analytics: {
    gaId: '',
    /**
     * Google AdSense Publisher ID. `ca-pub-XXXXXXXXXXXXXXXX` 형식.
     * AdSense 승인을 받은 뒤 https://www.google.com/adsense → 계정 → 정보에서 확인.
     * 빈 문자열이면 광고 스크립트 로딩 안 함.
     */
    adsenseClientId: 'ca-pub-1379539108387521',
  },
} as const

/** siteConfig의 locale 타입 */
export type SiteLocale = (typeof siteConfig.locales)[number]
