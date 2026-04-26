# 🛒 쿠팡 파트너스 SEO 프로젝트 가이드

## 📋 개요

쿠팡 파트너스 제휴 링크를 활용한 SEO 최적화 블로그 콘텐츠 자동 생성 시스템입니다.

**구현 완료 사항 (Phase 1 + Phase 2):**
- ✅ DB 스키마 (AffiliateProduct, PostAffiliateProduct)
- ✅ Admin UI (상품 등록/수정/삭제 페이지)
- ✅ API Routes (CRUD 완비)
- ✅ AI 프롬프트 (review, comparison, guide 템플릿)
- ✅ 자동 링크 삽입 유틸리티

---

## 🚀 빠른 시작

### 1. 쿠팡 파트너스 상품 등록

1. Admin 대시보드로 이동: `https://colemearchy.com/admin`
2. **"쿠팡 파트너스"** 버튼 클릭
3. **"+ 새 상품 등록"** 클릭
4. 폼 작성:
   ```
   상품명: 예) LG 그램 17인치 노트북
   쿠팡 파트너스 링크: https://link.coupang.com/...
   카테고리: 전자기기
   가격: 1490000 (옵션)
   이미지 URL: https://... (옵션)
   SEO 키워드: 노트북, 경량, 17인치, PM
   상품 설명: PM 업무용으로 최적화된 경량 노트북
   ```
5. **"등록"** 버튼 클릭

### 2. AI 콘텐츠 생성 (수동)

#### 방법 A: API 직접 호출

```bash
curl -X POST https://colemearchy.com/api/generate-affiliate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  -d '{
    "productId": "clxxx...",
    "contentType": "review",
    "keywords": ["노트북", "PM", "경량"]
  }'
```

#### 방법 B: 스크립트 사용 (준비 중)

```bash
pnpm tsx scripts/generate-affiliate-post.ts \
  --product-id="clxxx..." \
  --type="review"
```

---

## 📁 프로젝트 구조

```
/Users/anhyunjun/colemearchy-blog/
├── prisma/
│   └── schema.prisma                     # AffiliateProduct, PostAffiliateProduct 모델
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── affiliate-products/
│   │   │   │   └── page.tsx              # 상품 관리 UI (등록/수정/삭제)
│   │   │   └── page.tsx                  # Admin 대시보드 (쿠팡 파트너스 링크 추가됨)
│   │   └── api/
│   │       └── admin/
│   │           └── affiliate-products/
│   │               ├── route.ts          # GET (목록), POST (생성)
│   │               └── [id]/
│   │                   └── route.ts      # PUT (수정), DELETE (삭제)
│   └── lib/
│       ├── ai-prompts.ts                 # generateAffiliateContentPrompt() 추가
│       └── utils/
│           └── affiliate-link-injector.ts # 링크 자동 삽입 유틸리티
└── docs/
    └── COUPANG-PARTNERS-GUIDE.md         # 이 파일
```

---

## 🎨 Admin UI 사용법

### 상품 목록 화면

![image](https://via.placeholder.com/800x400?text=Product+List+Table)

- **상품명**: 클릭하면 쿠팡 링크로 이동
- **카테고리**: 필터링 기능 (TODO)
- **가격**: 자동 포맷팅 (₩1,490,000)
- **키워드**: SEO 키워드 미리보기
- **액션**:
  - **수정**: 상품 정보 수정
  - **삭제**: 확인 후 삭제 (연관된 PostAffiliateProduct도 CASCADE 삭제)
  - **링크**: 새 탭에서 쿠팡 페이지 열기

### 상품 등록/수정 폼

**필수 필드:**
- 상품명
- 쿠팡 파트너스 링크
- 카테고리

**선택 필드:**
- 가격 (원 단위)
- 이미지 URL
- SEO 키워드 (쉼표로 구분)
- 상품 설명

---

## 🤖 AI 콘텐츠 생성 프롬프트

### 콘텐츠 유형 (Content Type)

#### 1. Review (실사용 후기)
```typescript
{
  "productId": "clxxx...",
  "contentType": "review",
  "keywords": ["노트북", "경량", "PM"]
}
```

**생성되는 글 구조:**
1. 도입부: 왜 이 제품을 샀는가? (개인적 문제/니즈)
2. 본문: 3개월 실사용 후기 (장단점 3개, 단점 2개)
3. 결론: 누구에게 추천하는가

#### 2. Comparison (상품 비교)
```typescript
{
  "productId": "clxxx...",
  "contentType": "comparison",
  "keywords": ["노트북 비교", "LG vs 삼성"],
  "competitorProducts": ["clyyy..."]
}
```

**생성되는 글 구조:**
1. 도입부: 왜 이 비교가 필요한가?
2. 본문: 항목별 비교표 + 분석
3. 결론: 상황별 추천

#### 3. Guide (선택 가이드)
```typescript
{
  "productId": "clxxx...",
  "contentType": "guide",
  "keywords": ["노트북 추천", "구매 가이드"]
}
```

**생성되는 글 구조:**
1. 도입부: 왜 이 가이드가 필요한가
2. 본문: 단계별 선택 기준 (예산, 기능, 브랜드)
3. 결론: 최종 추천 3가지

---

## 🔗 링크 자동 삽입 로직

### 1. AFFILIATE_LINK_PLACEHOLDER 교체

AI가 생성한 콘텐츠에서 `[상품명](AFFILIATE_LINK_PLACEHOLDER)`를 찾아 실제 쿠팡 링크로 교체합니다.

```markdown
**Before:**
이 [LG 그램](AFFILIATE_LINK_PLACEHOLDER)은 정말 가볍습니다.

**After:**
이 [LG 그램](https://link.coupang.com/...)은 정말 가볍습니다.
```

### 2. 상품명 자동 링크

본문에서 상품명이 언급된 **첫 번째 위치**에 자동으로 링크를 추가합니다.

```typescript
import { injectAffiliateLinks } from '@/lib/utils/affiliate-link-injector'

const content = "LG 그램은 정말 가볍습니다. LG 그램을 사용한 지 3개월..."
const products = [{ name: "LG 그램", coupangUrl: "https://..." }]

const result = injectAffiliateLinks(content, products)
// "[LG 그램](https://...)은 정말 가볍습니다. LG 그램을 사용한 지 3개월..."
```

### 3. 법적 고지문 자동 추가

```markdown
---

**파트너스 활동 고지**

*이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.*
```

---

## 📊 SEO 최적화 기능

### 키워드 밀도 계산

```typescript
import { calculateKeywordDensity } from '@/lib/utils/affiliate-link-injector'

const content = "노트북은... 노트북을... 노트북이..."
const result = calculateKeywordDensity(content, "노트북")
// { count: 3, density: 2.5 } (전체 단어 대비 2.5%)
```

**권장 키워드 밀도:**
- 메인 키워드: 1-2%
- 서브 키워드: 0.5-1%

### 제휴 링크 검증

```typescript
import { hasAffiliateLinks, countAffiliateLinks } from '@/lib/utils/affiliate-link-injector'

const content = "..."
console.log(hasAffiliateLinks(content)) // true/false
console.log(countAffiliateLinks(content)) // 3 (링크 개수)
```

---

## 🔒 보안 & 인증

### Admin API 보호

모든 Admin API는 `verifyAdminAuth()`로 보호됩니다:

```typescript
// Query Parameter 방식
GET /api/admin/affiliate-products?password=YOUR_PASSWORD

// Authorization Header 방식
GET /api/admin/affiliate-products
Authorization: Bearer YOUR_PASSWORD
```

### 환경 변수

```.env
ADMIN_PASSWORD=your-secure-password-here
```

---

## 📌 다음 단계 (Phase 3 - 향후 구현 예정)

### 1. 키워드 자동 발굴 시스템
- [ ] 네이버 데이터랩 API 연동
- [ ] 구글 트렌드 API (serpapi.com)
- [ ] 경쟁 강도 분석 (DA 체크)

### 2. Analytics 대시보드
- [ ] 포스트별 CTR 추적
- [ ] 쿠팡 파트너스 수익 연동
- [ ] 유입 키워드 분석

### 3. A/B 테스트 자동화
- [ ] 제목 A/B 테스트
- [ ] 링크 배치 최적화

---

## 🛠 문제 해결 (Troubleshooting)

### Q1: "Product not found" 에러
**원인:** 잘못된 productId
**해결:** Admin UI에서 정확한 ID 확인

### Q2: 쿠팡 링크가 삽입되지 않음
**원인:** 상품명이 본문에 정확히 매칭되지 않음
**해결:**
1. AI 프롬프트에서 `[상품명](AFFILIATE_LINK_PLACEHOLDER)` 형식 사용
2. `injectAffiliateLinks()` 호출 확인

### Q3: TypeScript 에러
**원인:** Prisma Client 재생성 필요
**해결:**
```bash
pnpm prisma generate
pnpm type-check
```

---

## 📞 연락처

프로젝트 관련 문의: `colemearchy@gmail.com`

---

**마지막 업데이트:** 2025-11-03
**담당자:** Claude Code AI
