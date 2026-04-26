# Branding TODO

새 회사 블로그를 런칭하기 전에 아래 항목을 준비해야 합니다.

## 필수 (Must Have)

- [ ] **사이트명** - 블로그 이름 결정
- [ ] **도메인** - 프로덕션 URL 확보 및 DNS 설정
- [ ] **사이트 설명** - 한국어/영어 메타 설명 (160자 이내 권장)
- [ ] **OG 이미지** - 기본 소셜 공유 이미지 (1200x630px)
- [ ] **파비콘** - 브라우저 탭 아이콘 (SVG 또는 ICO)
- [ ] **Apple 터치 아이콘** - iOS 홈 화면 아이콘 (180x180px)
- [ ] **데이터베이스** - Turso 또는 SQLite DB 설정
- [ ] **환경변수** - `.env` 파일 완성

## 권장 (Should Have)

- [ ] **로고 이미지** - 이미지 로고 (텍스트 로고 대체용)
- [ ] **schema.org 로고** - publisher 로고 (`public/logo.png`, 112x112px 이상)
- [ ] **SEO 키워드** - 타겟 키워드 목록 결정
- [ ] **Google Analytics** - GA4 Measurement ID
- [ ] **Google Search Console** - 사이트 인증 코드
- [ ] **Naver Search Advisor** - 사이트 인증 코드 (한국 시장 타겟 시)
- [ ] **소셜 링크** - Twitter, LinkedIn, GitHub 등
- [ ] **연락처 이메일** - contact, privacy, legal 이메일 주소

## 콘텐츠 (Content)

- [ ] **개인정보처리방침** - `src/app/[locale]/privacy/page.tsx` 법적 문구 검토/교체
- [ ] **이용약관** - `src/app/[locale]/terms/page.tsx` 법적 문구 검토/교체
- [ ] **소개 페이지** - `src/app/[locale]/about/page.tsx` 내용 교체
- [ ] **초기 블로그 포스트** - 최소 1개 이상의 콘텐츠

## 선택 (Nice to Have)

- [ ] **OG 캐릭터/마스코트** - OG 이미지에 들어갈 캐릭터 (개인 블로그용)
- [ ] **커스텀 폰트** - 브랜드 전용 폰트 (`src/app/layout.tsx`에서 설정)
- [ ] **브랜드 컬러** - Tailwind 테마 커스터마이징
- [ ] **AI 프롬프트** - AI 콘텐츠 생성 사용 시 `src/lib/ai-prompts.ts` 교체
- [ ] **뉴스레터** - 뉴스레터 서비스 연동 (Mailchimp, ConvertKit 등)
- [ ] **댓글 시스템** - 기본 내장 또는 외부 서비스 (Giscus 등)
