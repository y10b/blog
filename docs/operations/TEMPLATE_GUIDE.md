# Blog Template Guide

이 저장소는 화이트라벨 블로그 템플릿입니다.
새 회사 블로그를 만들 때 아래 파일들의 값만 교체하면 ��니다.

## Quick Start

```bash
# 1. 저장소 클론
git clone <this-repo> my-company-blog
cd my-company-blog

# 2. 의존성 설치
pnpm install

# 3. 환경변�� 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL, NEXT_PUBLIC_SITE_URL 등 설��

# 4. 설정 파일 수정 (아래 섹션 참고)

# 5. DB 초기화
pnpm prisma generate
pnpm prisma db push

# 6. 개발 서버 실행
pnpm dev
```

## 설정 파일 구조

모든 브랜드/사이트 설정은 `src/config/` 디렉터리에 있습니다.

### 1. `src/config/site.config.ts` (필수)

사이트 전역 설정. SEO 메타데이터, schema.org, canonical URL 등이 이 값을 참조합니다.

| 항목 | 설명 | 예시 |
|---|---|---|
| `name` | 사이트 전체 이름 | `'Intalk Partners Blog'` |
| `shortName` | 짧은 이름 (헤더, title suffix) | `'Intalk'` |
| `url` | 프로덕션 URL (trailing slash 없이) | `'https://blog.intalk.com'` |
| `defaultLocale` | 기본 언어 | `'ko'` |
| `locales` | 지원 언어 목록 | `['ko', 'en']` |
| `title` | 로케일별 사이트 제목 | `{ ko: '...', en: '...' }` |
| `description` | 로케일별 설명 | `{ ko: '...', en: '...' }` |
| `keywords` | SEO 키워드 배열 | `['B2B', '마케팅']` |
| `author.name` | 저자/발행자 이름 | `'Intalk Partners'` |
| `author.type` | `'Person'` 또는 `'Organization'` | `'Organization'` |
| `social.*` | 소셜 링크 (빈 값이면 비표시) | `{ twitter: '@intalk' }` |
| `emails.*` | contact/privacy/legal 이메일 | |
| `verification.*` | Google/Naver 인증 코드 | |
| `analytics.gaId` | GA Measurement ID | `'G-XXXXXXXXXX'` |

### 2. `src/config/brand.config.ts` (필수)

시각적 브랜딩 자산.

| ��목 | 설명 |
|---|---|
| `logo.text` | 텍스트 로고 |
| `logo.image` | 이미지 로고 경로 (`null`이면 텍스트 사용) |
| `ogImage` | 기본 OG 이미지 경로 (1200x630) |
| `ogCharacterImage` | OG 이미지 내 캐릭터 (`null`이면 미사용) |
| `copyright.holder` | 저작권 표시 이름 |
| `copyright.startYear` | 저작권 시작 연도 |

### 3. `src/config/features.config.ts` (선택)

기능 on/off 토글. 기업 블로그에서 불필요한 개인 블로그 기능을 끌 수 있습니다.

| 기능 | 기본값 | ���명 |
|---|---|---|
| `comments` | `true` | 댓글 시스템 |
| `adsense` | `false` | Google AdSense |
| `affiliateProducts` | `false` | 쿠팡 제휴 상품 |
| `youtubeSync` | `false` | YouTube 자동 동기화 |
| `aiContentGeneration` | `false` | AI 콘텐츠 생성 |
| `newsletter` | `false` | 뉴스레터 |
| `consulting` | `false` | 컨설팅 서브도메인 |
| `adBlockerNotice` | `false` | 광고 차단기 알림 |
| `serviceWorker` | `false` | 오프라인 지원 |
| `viewCounter` | `true` | 조회수 카운터 |
| `i18n` | `true` | 다국어 지원 |
| `relatedPosts` | `true` | 관련 포스트 |
| `tableOfContents` | `true` | 목차 |

### 4. `src/config/navigation.config.ts` (선택)

헤더 네비게이션 아이템. 로케일별 라벨 지정.

### 5. 환경변수 (`.env`)

```env
# 필수
DATABASE_URL=           # SQLite 또는 Turso LibSQL URL
NEXT_PUBLIC_SITE_URL=   # 프로덕션 도메인 (https://...)

# 선택 (기능별)
DATABASE_AUTH_TOKEN=     # Turso 인증 토큰
ADMIN_PASSWORD=          # 어드민 비밀번호
ANTHROPIC_API_KEY=       # AI 콘텐츠 생성용
UNSPLASH_ACCESS_KEY=     # Unsplash 이미지
CRON_SECRET=             # 크론 작업 인증

# OG 이미지 (Edge Runtime용)
NEXT_PUBLIC_SITE_NAME=   # site.config.ts의 name과 동일하게
NEXT_PUBLIC_OG_CHARACTER_IMAGE=  # 캐릭터 이미지 경로 (없으면 빈 값)

# 컨설팅 서브도메인 (사용 시)
NEXT_PUBLIC_FEATURE_CONSULTING=false
NEXT_PUBLIC_CONSULTING_DOMAIN=
```

## 교체해야 하는 정적 파일

| 파일 | 설명 |
|---|---|
| `public/og-image.png` | 기본 OG 이미지 (1200x630px) |
| `public/images/character.png` | OG 이미지 캐릭터 (사용 시) |
| `src/app/icon.tsx` 또는 `public/favicon.ico` | 파비콘 |
| `src/app/apple-icon.tsx` | Apple 터치 아이콘 |
| `public/logo.png` | schema.org publisher 로고 |

## AI 콘텐츠 생성 커스터마이징

`featuresConfig.aiContentGeneration`을 `true`로 설정한 경우:
- `src/lib/ai-prompts.ts`의 프롬프트를 회사 맞춤형으로 교체
- 페르소나, 키워드 전략, 콘텐츠 필러를 회사에 맞게 수정

## 배포 (Vercel)

1. Vercel에 프로젝트 생성
2. 환경변수 설정 (위 `.env` 항목 참고)
3. Build Command: `prisma generate && next build && next-sitemap`
4. `vercel.json`의 cron 설정에서 불필요한 작업 제거

## 법적 페이지

`src/app/[locale]/privacy/page.tsx`와 `src/app/[locale]/terms/page.tsx`는
`siteConfig`의 값을 자동 참조하지만, **법적 문구 자체는 회사별로 검토/교체 필요**.
