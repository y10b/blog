# 일일 콘텐츠 자동화 시스템 설정 가이드

## 🚨 현재 상황
Gemini API 무료 티어는 하루 50개 요청 제한이 있어, 매일 10개 글 + 비디오 스크립트 생성이 어렵습니다.

## 💡 해결 방안

### 옵션 1: Gemini API 유료 전환 (권장)
- **비용**: $0.075 / 1백만 입력 토큰
- **일일 비용**: 약 $0.5-1 (한 달 $15-30)
- **장점**: 안정적, 빠름, 제한 없음

### 옵션 2: 여러 API 키 로테이션
```javascript
// .env 파일에 여러 API 키 추가
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
```

### 옵션 3: 대체 AI 서비스 활용
- Claude API (Anthropic)
- OpenAI GPT-4
- Cohere
- 로컬 LLM (Ollama)

## 🛠 설정 방법

### 1. GitHub Secrets 설정
GitHub 저장소 → Settings → Secrets and variables → Actions

필수 시크릿:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `GEMINI_API_KEY`: Gemini API 키
- `WEBHOOK_URL`: Discord/Slack 알림 (선택사항)
- `REDEPLOY_WEBHOOK_URL`: Vercel 재배포 웹훅 (선택사항)

### 2. 수동 실행 방법

```bash
# 오늘 콘텐츠 생성
node scripts/daily-content-generator.js

# 2일 후 콘텐츠 생성
node scripts/generate-days-ahead.js 2

# 7일치 콘텐츠 한 번에 생성
for i in {0..6}; do
  node scripts/generate-days-ahead.js $i
  sleep 60 # API 제한 회피를 위해 1분 대기
done
```

### 3. GitHub Actions 수동 트리거
1. GitHub → Actions 탭
2. "Daily Content Generation" 워크플로우
3. "Run workflow" 버튼 클릭

## 📊 콘텐츠 관리

### 주제 로테이션
- 100개 주제가 순환하며 사용됨
- `scripts/topic-index.json`에 현재 인덱스 저장
- 주제 추가/수정: `scripts/daily-content-generator.js`의 `topicPool` 배열 편집

### 발행 스케줄
- 기본: 오전 6시부터 2시간 간격
- 수정 방법: `daily-content-generator.js`의 시간 계산 로직 변경

## 🎥 Phase 2: 비디오 콘텐츠 연계

### YouTube 스크립트 생성기 (준비 중)
```javascript
// scripts/youtube-script-generator.js
// 블로그 포스트를 기반으로 YouTube 스크립트 생성
// 롱폼 1-2개 + 쇼츠 10개
```

### 통합 워크플로우
1. 블로그 생성 (10개)
2. 인기 주제 선별 → 롱폼 스크립트
3. 롱폼 핵심 포인트 → 쇼츠 스크립트 10개

## 🔧 트러블슈팅

### API 할당량 초과
- 다음날까지 대기
- 다른 API 키 사용
- 유료 플랜 업그레이드

### 중복 콘텐츠
- `topic-index.json` 리셋
- 새로운 주제 추가

### 발행 실패
- Vercel 재배포 웹훅 확인
- 데이터베이스 연결 확인

## 📈 성과 모니터링
- 일일 생성 리포트 (Discord/Slack)
- 주간 성과 분석 (조회수, 참여도)
- A/B 테스트 결과 추적

---

**문의**: 추가 설정이나 문제 해결이 필요하면 알려주세요!