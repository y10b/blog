# Vercel 환경 변수 설정 가이드

이 사이트의 자동화·외부 API 통신에 필요한 환경 변수를 Vercel에 등록하는 가이드입니다.

## 1. Vercel Dashboard 접속

1. https://vercel.com 로그인
2. 본 블로그 프로젝트 선택

## 2. Settings → Environment Variables

1. 프로젝트 대시보드에서 **Settings** 탭 → **Environment Variables**
2. 각 환경변수를 추가할 때 **Production / Preview / Development** 모두 체크 권장

## 3. 등록할 환경 변수 목록

### 필수

| Key | 용도 | 발급/설정 위치 |
|---|---|---|
| `DATABASE_URL` | Prisma DB 연결 문자열 (SQLite/Turso/Postgres) | Turso/Vercel Postgres 대시보드 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 정규 URL (메타·sitemap·canonical) | 본인 도메인 (예: `https://intalk-blog.vercel.app`) |
| `CRON_SECRET` | Vercel cron 인증용 임의 문자열 | `openssl rand -hex 32` |

### AI 콘텐츠 생성 (어느 하나는 필수)

| Key | 용도 | 발급 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API (콘텐츠 생성, 임베딩) | https://aistudio.google.com/app/apikey |
| `ANTHROPIC_API_KEY` | Claude API (일일 글 생성 cron) | https://console.anthropic.com/ |

### 선택

| Key | 용도 | 비고 |
|---|---|---|
| `YOUTUBE_API_KEY` | YouTube 채널 영상 동기화 | YouTube 채널 운영 시에만. Google Cloud Console > YouTube Data API v3 |
| `YOUTUBE_CHANNEL_ID` | 본인 YouTube 채널 ID | YouTube 채널 운영 시에만 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 이미지 업로드 | 어드민 이미지 업로드 사용 시 |
| `UNSPLASH_ACCESS_KEY` | 자동 글 커버 이미지 검색 | 자동 발행 cron에서 사용 |
| `REDEPLOY_WEBHOOK_URL` | 글 발행 후 Vercel 자동 재배포 | Vercel Project Settings > Git > Deploy Hooks |

## 4. 재배포

환경 변수를 추가/변경한 뒤에는 반드시 재배포 필요:

1. **Deployments** 탭 → 최신 배포의 `…` 메뉴
2. **Redeploy**
3. **Use existing Build Cache** 체크 해제
4. **Redeploy** 클릭

## 5. 확인

```bash
# 배포 완료 후 (약 1-2분)
curl https://<your-domain>/api/health
```

## 트러블슈팅

### 환경 변수가 적용 안 되는 경우
1. Production/Preview/Development 모두 체크되어 있는지
2. 재배포 시 **빌드 캐시 미사용** 했는지
3. Vercel Functions 로그에서 구체적 에러 메시지 확인

### Vercel 로그 보는 법
1. Vercel Dashboard → **Functions** 탭
2. 문제 라우트 (예: `/api/generate-daily-posts`) 클릭
3. 실시간 로그 확인
