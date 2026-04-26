# YouTube API 설정 가이드

## 1. 환경 변수 설정

`.env` 파일에 다음 추가:

```bash
# YouTube API
YOUTUBE_API_KEY=여기에_API_키_입력
YOUTUBE_CHANNEL_ID=여기에_채널_ID_입력
```

## 2. Vercel 환경 변수 설정

1. https://vercel.com 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:
   - `YOUTUBE_API_KEY`
   - `YOUTUBE_CHANNEL_ID`

## 3. API 키 얻는 방법

### Google Cloud Console
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리"
4. "YouTube Data API v3" 검색 → 활성화
5. "사용자 인증 정보" → "API 키 만들기"

### YouTube 채널 ID 찾기
- 방법 1: YouTube Studio → 설정 → 채널 → 고급 설정
- 방법 2: 채널 URL에서 확인 (UC로 시작하는 부분)

## 4. 사용량 제한

- 무료 할당량: 10,000 units/day
- 동영상 목록 조회: 1 unit
- 충분히 개인 블로그 운영 가능

## 보안 주의사항

- API 키를 GitHub에 커밋하지 마세요!
- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- Vercel 환경 변수에만 실제 키 저장