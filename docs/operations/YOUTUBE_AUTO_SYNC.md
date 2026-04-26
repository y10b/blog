# 🎥 YouTube 자동 동기화 시스템

## 개요

**더 이상 수동으로 영상을 선택할 필요 없습니다!** 유튜브 채널에 새로운 영상이 업로드되면 자동으로 감지해서 블로그 포스트로 변환하는 완전 자동화 시스템입니다.

## ✨ 주요 기능

### 1. 자동 영상 감지
- **매일 오전 10시**: 유튜브 채널의 최신 영상 20개 확인
- **중복 방지**: 이미 처리된 영상은 자동으로 제외
- **스마트 필터링**: 새로운 영상만 블로그 포스트로 변환

### 2. 자동 블로그 변환
- **기존 시스템 활용**: 검증된 YouTube-to-blog API 사용
- **DRAFT 상태 생성**: 자동 변환 후 수동 검토 가능
- **자동 백업**: 생성된 포스트는 즉시 로컬 백업

### 3. 완전 자동화
- **Vercel Cron**: 클라우드에서 자동 실행
- **에러 처리**: 실패 시에도 시스템 안정성 유지
- **상세 로깅**: 모든 과정이 로그로 기록됨

## 🕐 실행 스케줄

```
매일 오전 10시 (한국 시간)
0 10 * * * → /api/cron/youtube-sync
```

**왜 오전 10시?**
- 대부분의 유튜브 영상이 전날 업로드됨
- AI 일일 포스트 생성(오전 8시) 이후 실행
- 충분한 시간 간격으로 시스템 부하 분산

## 🔄 동작 과정

### 1단계: 영상 감지
```
1. YouTube Data API v3로 채널 정보 조회
2. uploads 플레이리스트에서 최신 20개 영상 가져오기
3. 영상 세부 정보 (제목, 설명, 통계) 수집
```

### 2단계: 중복 확인
```
1. 데이터베이스에서 youtubeVideoId 검색
2. 이미 처리된 영상 필터링
3. 새로운 영상만 변환 대상으로 선정
```

### 3단계: 블로그 변환
```
1. 각 새로운 영상에 대해 YouTube-to-blog API 호출
2. AI가 트랜스크립트 분석하여 블로그 포스트 생성
3. DRAFT 상태로 저장 (수동 검토 후 발행 가능)
4. 자동 백업 실행
```

## 📊 처리 결과 예시

```json
{
  "success": true,
  "message": "YouTube sync completed successfully",
  "result": {
    "totalVideos": 20,
    "newVideos": 2,
    "successfulConversions": 2,
    "failedConversions": 0,
    "processedVideos": [
      "✅ AI 도구로 부업 시작하는 방법 (실전편)",
      "✅ 노코드로 SaaS 만들기 - 3일 만에 완성"
    ]
  }
}
```

## 🛠️ 수동 테스트 방법

### 1. 로컬 테스트
```bash
# 새로운 영상 확인만 (변환 X)
curl http://localhost:3000/api/test-youtube-check

# 전체 동기화 실행
pnpm youtube:sync

# 또는 API 직접 호출
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/youtube-sync
```

### 2. 프로덕션 테스트
```bash
# 새로운 영상 확인
curl https://your-domain.com/api/test-youtube-check

# 수동 동기화 트리거 (크론 시크릿 필요)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/youtube-sync
```

## ⚙️ 설정 및 환경 변수

### 필수 환경 변수
```bash
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_CHANNEL_ID=UC_YOUR_CHANNEL_ID
NEXT_PUBLIC_SITE_URL=https://your-domain.com
CRON_SECRET=your-secure-secret
```

### Vercel Cron 설정 (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/youtube-sync",
      "schedule": "0 10 * * *"
    }
  ]
}
```

## 🔍 모니터링 및 디버깅

### 로그 확인
```bash
# Vercel 함수 로그에서 확인 가능한 정보:
🚀 YouTube 채널 자동 동기화 시작...
🔍 채널 UC_YOUR_CHANNEL_ID의 최신 영상 20개 조회 중...
✅ 20개 영상 정보 가져오기 완료
📊 총 20개 영상 확인
🆕 새로운 영상: 2개
📝 영상을 블로그 포스트로 변환 중: "제목"
✅ 블로그 포스트 생성 완료: "생성된 제목"
💾 자동 백업 실행 중...
🎉 YouTube 자동 동기화 완료!
```

### 일반적인 문제들

**1. "No videos found"**
- YouTube API 키 확인
- 채널 ID 확인
- API 할당량 확인

**2. "API 호출 실패"**
- NEXT_PUBLIC_SITE_URL 환경 변수 확인
- 사이트가 접근 가능한지 확인
- Rate limiting 확인

**3. "모든 영상이 이미 처리되었습니다"**
- 정상 작동 (새로운 영상이 없음)
- 새 영상 업로드 후 다시 확인

## 📈 성능 최적화

### API 호출 최적화
- **배치 처리**: 영상 정보를 한 번에 20개씩 조회
- **Rate Limiting**: API 호출 간 2초 대기
- **중복 방지**: 이미 처리된 영상 스킵

### 시스템 부하 분산
- **시간대 분산**: 오전 10시 (다른 크론 작업과 시간차)
- **비동기 처리**: 각 영상 변환이 독립적으로 실행
- **실패 격리**: 하나의 영상 실패가 전체에 영향 주지 않음

## 🔮 향후 개선 계획

### 1. 실시간 알림
- **Webhook 연동**: YouTube에서 직접 알림 받기
- **Slack/Discord 알림**: 새 영상 감지 시 알림

### 2. 스마트 필터링
- **조회수 기반**: 일정 조회수 이상만 변환
- **키워드 필터**: 특정 키워드 포함 영상만 처리
- **Shorts 분리**: 일반 영상과 Shorts 구분 처리

### 3. 콘텐츠 최적화
- **A/B 테스트**: 다양한 블로그 스타일 테스트
- **SEO 최적화**: 영상별 맞춤 SEO 전략
- **소셜 미디어**: 자동 소셜 미디어 포스팅

## 🚀 사용법 요약

### 기본 사용 (자동)
1. **설치 완료**: 시스템이 이미 설정되어 자동 실행됨
2. **영상 업로드**: YouTube에 새 영상 업로드
3. **자동 처리**: 다음 날 오전 10시에 자동으로 블로그 포스트 생성
4. **검토 및 발행**: 관리자 페이지에서 DRAFT 상태 포스트 검토 후 발행

### 수동 실행 (필요시)
```bash
# 새 영상이 있는지 확인만
curl https://your-domain.com/api/test-youtube-check

# 즉시 동기화 실행
pnpm youtube:sync
```

### 관리자 워크플로우
1. **매일 오전 확인**: Vercel 함수 로그에서 동기화 결과 확인
2. **DRAFT 검토**: 새로 생성된 블로그 포스트 내용 검토
3. **수동 편집**: 필요시 제목, 내용, 태그 등 수정
4. **발행**: 검토 완료 후 PUBLISHED 상태로 변경

---

**설치일**: 2025년 10월 27일
**상태**: ✅ 활성화됨 (매일 오전 10시 자동 실행)
**다음 실행**: 내일 오전 10시

> **"이제 유튜브 영상이 올라오면 알아서 블로그 글이 써집니다!"** 🎬➡️📝✨