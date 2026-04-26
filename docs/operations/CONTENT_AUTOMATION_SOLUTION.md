# 콘텐츠 자동화 완벽 솔루션

## 🚨 현재 상황
- 무료 Gemini API: 일일 50개 요청 제한
- 필요량: 일일 20-30개 요청 (블로그 10개 + 비디오 스크립트)
- 현재 사용 가능한 API 키: 2개

## ✅ 즉시 실행 가능한 솔루션

### 방법 1: 시간차 생성 전략
```bash
# 오늘 밤 12시 이후에 실행 (할당량 리셋)
# cron으로 자동화 또는 수동 실행

# 내일 콘텐츠 (자정 이후)
node scripts/generate-days-ahead-multi.js 1

# 다음날 새벽 3시에 다시 실행
node scripts/generate-days-ahead-multi.js 2
```

### 방법 2: API 키 추가 확보
1. 새 Google 계정 생성 → 새 Gemini API 키 발급
2. 가족/친구 계정으로 추가 API 키 확보
3. `.env`에 GEMINI_API_KEY_3, 4, 5... 추가

### 방법 3: 대체 AI 서비스 통합
```javascript
// OpenAI GPT-3.5 (저렴한 옵션)
// 비용: $0.002/1K 토큰 (하루 약 $1-2)

// Claude Haiku (빠르고 저렴)
// 비용: $0.25/1M 토큰
```

## 🎯 권장 솔루션: 하이브리드 접근

### 1단계: 즉시 실행 (무료)
```bash
# 매일 자정에 5개 생성
# 다음날 정오에 5개 추가 생성
# = 하루 10개 달성
```

### 2단계: 점진적 확장
- 주중: Gemini 무료 API (10개/일)
- 주말: 유료 API로 일주일치 대량 생성

### 3단계: 수익화 후 전환
- 블로그 수익 발생 시 → Gemini 유료 전환
- 예상 비용: 월 $15-30 (하루 1000개 요청 기준)

## 📝 당장 실행할 수 있는 스크립트

### 일일 분할 생성기
```javascript
// scripts/daily-split-generator.js
// 하루를 2-3회로 나눠서 생성
// 오전 5개, 오후 5개
```

### 주간 대량 생성기
```javascript
// scripts/weekly-batch-generator.js
// 주말에 다음 주 콘텐츠 70개 한번에 생성
// 여러 API 키 순환 사용
```

## 🚀 자동화 설정

### GitHub Actions (수정본)
```yaml
name: Split Daily Content

on:
  schedule:
    # 첫 번째 실행: 자정 (KST)
    - cron: '0 15 * * *'
    # 두 번째 실행: 정오 (KST)  
    - cron: '0 3 * * *'
```

### 로컬 크론 (Mac/Linux)
```bash
# crontab -e
0 0 * * * cd /path/to/blog && node scripts/generate-5-posts.js
0 12 * * * cd /path/to/blog && node scripts/generate-5-posts.js
```

## 💰 비용 대비 효과

### 무료 플랜 유지
- 일일 10개 포스트 = 월 300개
- 예상 트래픽: 월 10만 방문
- 예상 수익: $500-1000/월

### 유료 전환 시점
- 월 수익 $100 돌파 시
- 일일 20개 이상 콘텐츠 필요 시

## 🎬 Phase 2: 비디오 통합 (준비됨)

### YouTube 스크립트 생성
- 인기 블로그 → 롱폼 스크립트
- 핵심 포인트 → 쇼츠 10개
- 자동 썸네일 텍스트 생성

### 실행 명령
```bash
# 비디오 스크립트 생성 (준비 중)
node scripts/youtube-script-generator.js

# 쇼츠 아이디어 생성
node scripts/shorts-idea-generator.js
```

---

**다음 단계**: 오늘 밤 12시 이후에 `node scripts/generate-days-ahead-multi.js 1` 실행하여 내일 콘텐츠 생성!