# n잡러 프리랜서 — 블로그

개발자 프리랜서가 운영하는 1인 블로그. 풀스택에서 AI 모델 개발로 넘어가며 배운 것들과
워크플로 자동화, 도구 후기, 정책 정보 등을 기록합니다.

블로그: https://blog-y10b.vercel.app *(예시 — 실제 도메인은 배포 후 갱신)*

---

## 카테고리

| | 다루는 글감 |
|---|---|
| **dev** | AI 모델 학습 실전기 (FLUX LoRA, ImpressionMLP), 풀스택→AI 전환기, 초기 스타트업 엔지니어링, 상품 개발기 |
| **sidehustle** | 워크플로 자동화 (n8n, RAG, Notion), AI 도구 후기, 프리랜서 정책·세무, 1인 SaaS 운영기 |

콘텐츠 제너레이터(`src/lib/ai-prompts.ts`)는 카테고리에 따라 톤·소재·예시를 다르게 분기합니다.

---

## 기술 스택

- **Frontend** — Next.js 15 (App Router), React 19, Tailwind CSS 4, Pretendard
- **Database** — Turso (libSQL) + Prisma 6 + `@prisma/adapter-libsql`
- **AI** — Anthropic Claude (Sonnet 4) + Google Gemini, RAG (`text-embedding-004` + pgvector)
- **이미지** — Unsplash API, `next/image`, Vercel Blob
- **배포** — Vercel (서버리스 함수 + SSG 페이지)
- **테스트** — Vitest + MSW (Mock Service Worker)
- **i18n** — 한국어 / English 듀얼 (`/[locale]/...`)

---

## 빠른 시작

```bash
pnpm install
cp .env.example .env       # 키 채우기
pnpm db:generate
pnpm dev                    # http://localhost:3000
```

### 환경 변수 (`.env`)

| 변수 | 용도 |
|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso libSQL 접속 |
| `DATABASE_URL` | Prisma CLI placeholder (`file:./dev.db`) |
| `ANTHROPIC_API_KEY` | Claude — 주력 콘텐츠 생성 |
| `GEMINI_API_KEY` | Gemini — RAG 임베딩, 번역 |
| `UNSPLASH_ACCESS_KEY` | 커버 이미지 자동 검색 |
| `CRON_SECRET` | Vercel Cron 인증 토큰 |
| `ADMIN_PASSWORD` | `/admin/*` Basic Auth (default `admin123`) |
| `NEXT_PUBLIC_SITE_URL` | canonical URL, OG 메타데이터 |

전체 항목은 [`.env.example`](./.env.example) 참고.

---

## 자동화 파이프라인

| 엔드포인트 | 스케줄 | 역할 |
|---|---|---|
| `/api/generate-daily-posts` | 매일 02:00 UTC | RAG + Claude로 일일 글 생성 (DRAFT) |
| `/api/publish-posts` | 매일 03:00 UTC | 예약 시간 도달한 DRAFT → PUBLISHED |
| `/api/translate-daily` | GitHub Actions (09:00 UTC) | 신규 글 → 영문 번역 |
| `/api/cron/youtube-sync` | 비활성 (501 stub) | 채널 운영 시작 시 활성화 |

크론 등록은 [`vercel.json`](./vercel.json) + [`.github/workflows/`](.github/workflows/).

### 수동 실행

```bash
# 예약된 게시물 발행 트리거
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/publish-posts" \
  -H "Authorization: Bearer $CRON_SECRET"

# RAG 지식 베이스 갱신
pnpm tsx scripts/embed-knowledge.ts
```

---

## 디렉토리 구조

```
.
├── src/
│   ├── app/
│   │   ├── [locale]/         # i18n 라우트 (ko / en)
│   │   ├── admin/            # Basic Auth 보호 (포스트 편집, 마크다운 뷰어)
│   │   └── api/              # 콘텐츠 생성, 발행, 번역 엔드포인트
│   ├── components/           # 재사용 UI (PageLayout, InfinitePostsList…)
│   ├── lib/
│   │   ├── ai-prompts.ts     # 페르소나·카테고리 분기 + JSON 추출 파서
│   │   ├── prisma.ts         # libSQL 어댑터 + Prisma 클라이언트
│   │   └── __tests__/        # Vitest unit/integration 테스트
│   └── config/               # site, brand, navigation 설정
├── prisma/
│   └── schema.prisma         # Post, PostTranslation, Knowledge, Comment…
├── scripts/                  # bulk-seed, refresh-covers, push-schema
├── docs/operations/          # 운영 가이드 모음
└── knowledge-base.txt        # RAG 컨텍스트 (텍스트 노트)
```

---

## 어드민 (`/admin`)

Basic Auth (`admin` / `ADMIN_PASSWORD`)로 보호. 주요 페이지:

- `/admin` — 포스트 목록, 발행 토글
- `/admin/edit/[id]` — 마크다운 에디터
- `/admin/markdown/[slug]` — KO/EN 마크다운 복사용 뷰어 (티스토리 등 외부 발행 시 사용)
- `/admin/analytics` — 조회수 통계
- `/admin/affiliate-products` — 제휴 상품 관리

---

## TDD

신규 기능은 `__tests__/`에 unit/integration 테스트 동반.

```bash
pnpm test          # watch
pnpm test:run      # 한 번 실행
pnpm test:coverage # coverage 리포트
```

상세 원칙은 [`CLAUDE.md`](./CLAUDE.md) §9 참고.

---

## 운영 원칙

[`CLAUDE.md`](./CLAUDE.md)가 단일 진실 공급원입니다 — 페르소나, 콘텐츠 톤,
SEO·접근성·성능 기준, AdSense·제휴 정책까지 모두 그곳에 정의되어 있습니다.

핵심 원칙 요약:

- **Lighthouse 400/400 목표** — Performance / Accessibility / Best Practices / SEO 각 100
- **SSG 우선** — 모든 콘텐츠 페이지는 정적 생성
- **E-E-A-T 준수** — 실제 경험·수치·실패 위주, AI 생성 콘텐츠는 인간 검토 필수
- **카테고리 일관성** — 한 운영자, 두 카테고리, 톤은 분기

---

## 라이선스

개인 블로그 프로젝트. 코드 참고는 자유, 콘텐츠는 저작권 보호됨.
