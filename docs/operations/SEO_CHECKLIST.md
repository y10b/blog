# SEO Checklist

템플릿화 후 반드시 유지/확인해야 하는 SEO 항목입니다.

## Meta Tags

- [ ] `<title>` - 각 페이지별 고유 타이틀 (70자 이내)
- [ ] `<meta name="description">` - 각 페이지별 고유 설명 (160자 이내)
- [ ] `<meta name="keywords">` - 사이트 키워드 설정
- [ ] `<meta name="author">` - 저자 정보
- [ ] `<link rel="canonical">` - 모든 페이지에 정규 URL 설정
- [ ] `hreflang` 태그 - 다국어 페이지 간 연결

## Open Graph

- [ ] `og:title` - 소셜 공유 제목
- [ ] `og:description` - 소셜 공유 설명
- [ ] `og:image` - OG 이미지 (1200x630px)
- [ ] `og:url` - 정규 URL
- [ ] `og:type` - `website` (홈) / `article` (포스트)
- [ ] `og:locale` - 언어 설정

## Twitter Card

- [ ] `twitter:card` - `summary_large_image`
- [ ] `twitter:title` - 트위터 제목
- [ ] `twitter:description` - 트위터 설명
- [ ] `twitter:image` - 트위터 이미지

## Schema.org (JSON-LD)

- [ ] **WebSite** - 홈페이지에 WebSite schema (`src/app/layout.tsx`)
- [ ] **Blog** - 포스트 목록에 Blog schema (`src/app/[locale]/posts/page.tsx`)
- [ ] **BlogPosting** - 각 포스트에 BlogPosting schema (`src/app/[locale]/posts/[slug]/page.tsx`)
- [ ] **BreadcrumbList** - 포스트 페이지 breadcrumb schema
- [ ] **SearchAction** - 사이트 검색 schema
- [ ] `publisher.name` - 회사/저자 이름이 `siteConfig.author.name`과 일치
- [ ] `publisher.@type` - `'Person'` 또는 `'Organization'` 올바르게 ���정
- [ ] `author.@type` - 저자 타입 올바르게 설정

## Sitemap & Robots

- [ ] `sitemap.xml` - `next-sitemap`으로 자동 생성 확인
- [ ] `server-sitemap.xml` - 동적 포스트 sitemap 확인 (`src/app/server-sitemap.xml/route.ts`)
- [ ] `robots.ts` - `src/app/robots.ts`에서 동적 생성 확인
- [ ] `robots.txt`의 Host URL이 `siteConfig.url`과 일치
- [ ] `robots.txt`의 Sitemap URL이 올바른 도메인 사용
- [ ] Google Search Console에 sitemap 제출
- [ ] Naver Search Advisor에 sitemap 제출 (한국 시장)

## URL 구조

- [ ] `/{locale}/posts/{slug}` 패턴 유지
- [ ] 슬러그에 의미 있는 단어 포함 (Google 권장)
- [ ] trailing slash 없음 (middleware에서 제거)
- [ ] 깨진 링크 없음 (내부 + 외부)

## 성능 (Core Web Vitals)

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] INP (Interaction to Next Paint) < 200ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] `next/image` 사용 (모든 이미지)
- [ ] `next/font` 사용 (모든 웹 폰트)
- [ ] GA 스크립트 5초 지연 로딩 유지
- [ ] AdSense lazy loading 유지 (사용 시)

## 접근성

- [ ] 모든 이미지에 의미 있는 `alt` 텍스트
- [ ] heading hierarchy (h1 > h2 > h3) 올바른 순서
- [ ] `<nav>` 요소에 `aria-label`
- [ ] `<footer>` 요소에 `role="contentinfo"`
- [ ] 키보드 네비게이션 가능
- [ ] 충분한 색상 대비

## 배포 후 확인

- [ ] Lighthouse 점수 확인 (Performance, A11y, Best Practices, SEO 각 90+)
- [ ] Google Search Console에서 색인 상태 확인
- [ ] Google Rich Results Test 통과
- [ ] 모바일 친화성 테스트
- [ ] 소셜 공유 미리보기 테스트 (Facebook Debugger, Twitter Card Validator)
- [ ] `canonical` URL이 올바른 도메인을 가리키는지 확인
- [ ] `hreflang`이 올바른 locale로 연결되는지 확인
