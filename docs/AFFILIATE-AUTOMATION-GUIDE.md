# 쿠팡 파트너스 자동화 완벽 가이드

## 🎯 시스템 개요

3가지 자동화 시스템으로 쿠팡 제휴 수익을 극대화합니다:

1. **매일 자동 포스팅** - 매일 오전 9시, 랜덤 상품 리뷰 자동 생성 및 발행
2. **쿠팡 핫딜 포스팅** - 매일 자정, AI가 선정한 "오늘의 추천템" 자동 생성
3. **비교 리스트 생성** - 수동 실행, 카테고리별 TOP 5/10 비교 콘텐츠 대량 생성

---

## 📋 1단계: 상품 등록 (50개 권장)

### 방법 1: Admin UI로 수동 등록
1. https://colemearchy.com/admin/affiliate-products 접속
2. "+ 새 상품 등록" 클릭
3. 쿠팡 파트너스에서 링크 생성 → 폼에 입력
4. 반복 (50개 목표)

### 방법 2: 템플릿으로 대량 등록
1. `docs/COUPANG-PRODUCT-LIST.md` 파일 열기
2. 각 상품의 `[링크 필요]`를 실제 쿠팡 파트너스 링크로 교체
3. 스크립트 실행:
   ```bash
   pnpm tsx scripts/bulk-insert-products.ts
   ```

**추천 카테고리별 배분**:
- 바이오해킹/건강: 10개
- 생산성/업무 도구: 15개
- 스타트업/자기계발: 10개
- 디지털 노마드/여행: 10개
- 가구/인테리어: 5개

---

## 🤖 2단계: 자동화 시스템 설정

### A. Vercel Cron Jobs (자동 실행)

**이미 설정 완료됨** (`vercel.json`):
- `/api/cron/daily-affiliate` - 매일 오전 9시 (KST)
- `/api/cron/coupang-hotdeal` - 매일 자정 (KST)

**환경 변수 설정** (Vercel 대시보드):
```bash
CRON_SECRET=your-super-secure-random-string-12345
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=your-turso-url
DATABASE_AUTH_TOKEN=your-turso-token
REDEPLOY_WEBHOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

**CRON_SECRET 생성**:
```bash
openssl rand -base64 32
```

**Vercel Webhook URL 생성**:
1. Vercel 프로젝트 → Settings → Git → Deploy Hooks
2. "Create Hook" 클릭
3. Name: "Affiliate Auto Redeploy", Branch: "main"
4. 생성된 URL을 `REDEPLOY_WEBHOOK_URL`에 입력

### B. 수동 테스트

**매일 자동 포스팅 테스트**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://colemearchy.com/api/cron/daily-affiliate
```

**쿠팡 핫딜 포스팅 테스트**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://colemearchy.com/api/cron/coupang-hotdeal
```

---

## 📊 3단계: 비교 리스트 콘텐츠 생성

### 사용법

**생산성 도구 TOP 5 생성**:
```bash
pnpm tsx scripts/generate-comparison-post.ts "생산성" 5
```

**바이오해킹 제품 TOP 10 생성**:
```bash
pnpm tsx scripts/generate-comparison-post.ts "바이오해킹" 10
```

**ADHD 필수템 TOP 7 생성**:
```bash
pnpm tsx scripts/generate-comparison-post.ts "ADHD" 7
```

### 출력 예시

생성되는 콘텐츠 구조:
```markdown
# 2025년 PM을 위한 생산성 도구 TOP 5

PM으로 3년 일하면서 생산성 도구 100개를 써봤다...

## 5위: 아이패드 에어 - 회의록 최강자
- 장점: Apple Pencil 필기감, Notability 연동
- 단점: 가격이 비싸다
- 추천: 회의 많은 PM
- [쿠팡 링크]

## 4위: 모션데스크 - 목통증 구원자
...

## 비교 테이블
| 순위 | 상품명 | 가격대 | 추천 대상 | 핵심 장점 |
|------|--------|--------|-----------|-----------|
| 1위  | ...    | ...    | ...       | ...       |

## 결론
결국 내가 선택한 건 1위 제품이다. 하지만...

**파트너스 활동 고지**
*이 포스팅은 쿠팡 파트너스 활동의 일환으로...*
```

---

## 📈 4단계: 운영 전략

### 일일 운영

**자동**:
- 매일 오전 9시: 제휴 포스트 1개 자동 발행
- 매일 자정: 핫딜 포스트 1개 DRAFT 생성

**수동** (주 1회):
- 핫딜 포스트 검토 → 쿠팡 링크 추가 → 발행
- 비교 리스트 1개 생성 (주말)

### 월간 목표

**콘텐츠 생산량**:
- 자동 리뷰 포스트: 30개/월
- 핫딜 포스트: 4개/월 (주 1회 발행)
- 비교 리스트: 4개/월 (주말마다)
- **총 38개/월**

**6개월 후**:
- 총 콘텐츠: 228개
- SEO 트래픽: 월 1만 PV 예상
- 예상 수익: 월 10~30만원

### 최적화 팁

**SEO 최적화**:
- 제목에 년도 포함 ("2025년")
- 롱테일 키워드 공략 ("ADHD PM 생산성 도구")
- 비교 키워드 활용 ("vs", "추천", "순위")

**전환율 향상**:
- 개인적 경험 강조 (Colemearchy 페르소나)
- 솔직한 단점 언급 (신뢰도 향상)
- 명확한 CTA ("지금 확인하기")

**A/B 테스팅**:
- 리뷰 스타일 vs 리스트 스타일
- 짧은 글(1500자) vs 긴 글(3000자)
- 이미지 많음 vs 텍스트 위주

---

## 🔧 트러블슈팅

### Q1. Cron Job이 실행되지 않아요
- Vercel 대시보드 → Deployments → Functions 탭 확인
- Logs에서 에러 메시지 확인
- `CRON_SECRET` 환경 변수 확인

### Q2. AI 콘텐츠 품질이 낮아요
- `src/lib/ai-prompts.ts`의 `generateAffiliateContentPrompt` 수정
- `temperature` 값 조정 (0.7 ~ 0.9)
- 프롬프트에 구체적인 예시 추가

### Q3. 상품 링크가 [링크 필요]로 나와요
- 핫딜 시스템은 DRAFT로 생성됨
- Admin에서 수동으로 쿠팡 링크 추가 필요
- 추가 후 "발행" 버튼 클릭

### Q4. 같은 상품이 반복 생성돼요
- `/api/cron/daily-affiliate` 로직 확인
- DB에서 PostAffiliateProduct 관계 확인
- 상품이 부족하면 더 추가 등록

---

## 📞 수동 실행 명령어 모음

```bash
# 1. 단일 상품 리뷰 생성
pnpm tsx scripts/generate-affiliate-content.ts affiliate-motion-desk-1

# 2. 비교 리스트 생성
pnpm tsx scripts/generate-comparison-post.ts "생산성" 5

# 3. 매일 자동 포스팅 수동 실행
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/daily-affiliate

# 4. 핫딜 포스팅 수동 실행
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/coupang-hotdeal

# 5. 모든 DRAFT 포스트 발행
pnpm tsx scripts/publish-all-drafts.ts

# 6. 특정 카테고리 상품 확인
pnpm tsx -e "
import { createClient } from '@libsql/client';
const turso = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
turso.execute('SELECT id, name, category FROM AffiliateProduct WHERE category LIKE \"%생산성%\"')
  .then(r => console.log(r.rows));
"
```

---

## 🎯 예상 수익 시뮬레이션

### 보수적 시나리오 (6개월 후)

**콘텐츠**:
- 제휴 포스트: 200개
- 월 평균 PV: 5,000

**전환**:
- 클릭률(CTR): 2%
- 전환율: 3%
- 평균 주문금액: 50,000원
- 쿠팡 수수료: 5%

**계산**:
- 월 클릭 수: 5,000 × 2% = 100건
- 월 구매 전환: 100 × 3% = 3건
- 월 수익: 3건 × 50,000원 × 5% = **7,500원/월**

### 낙관적 시나리오 (1년 후)

**콘텐츠**:
- 제휴 포스트: 400개
- 월 평균 PV: 20,000 (SEO 최적화)

**전환**:
- 클릭률(CTR): 3%
- 전환율: 5%
- 평균 주문금액: 70,000원
- 쿠팡 수수료: 5%

**계산**:
- 월 클릭 수: 20,000 × 3% = 600건
- 월 구매 전환: 600 × 5% = 30건
- 월 수익: 30건 × 70,000원 × 5% = **105,000원/월**

### 현실적 목표 (1년 후)

**월 30,000 ~ 50,000원** 달성 가능
- 지속적인 콘텐츠 생산
- SEO 최적화
- 고가 상품 위주 추천
- 계절 상품 타이밍 활용

---

## ✅ 체크리스트

**초기 설정** (1회):
- [ ] 쿠팡 파트너스 가입
- [ ] Vercel 환경 변수 설정 (`CRON_SECRET` 등)
- [ ] 상품 50개 등록
- [ ] Cron Job 테스트 실행

**주간 루틴**:
- [ ] 핫딜 DRAFT 포스트 검토 및 발행 (월요일)
- [ ] 비교 리스트 1개 생성 (주말)
- [ ] 상품 5~10개 추가 등록 (목요일)

**월간 점검**:
- [ ] Google Search Console에서 CTR 확인
- [ ] 쿠팡 파트너스 대시보드에서 수익 확인
- [ ] 저성과 콘텐츠 수정 또는 삭제
- [ ] 신규 카테고리 확장 검토

---

**마지막 업데이트**: 2025-01-04
**문의**: Admin 페이지에서 상품 관리
