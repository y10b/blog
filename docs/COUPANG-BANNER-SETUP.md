# 🎨 Coupang Dynamic Banner 설치 가이드

## 📋 개요

Coupang Partners Dynamic Banner는 페이지 내용을 자동으로 분석하여 관련 상품을 추천하는 JavaScript 위젯입니다.

**구현 완료 사항:**
- ✅ `CoupangBanner` 컴포넌트 생성
- ✅ 블로그 포스트에 자동 배너 삽입
- ✅ 3가지 프리셋 배너 (Mid-Content, End-Post, Sidebar)
- ✅ 반응형 디자인 (모바일/데스크톱)
- ✅ 법적 고지문 자동 추가

---

## 🚀 5분 설치 가이드

### 1단계: Coupang Partners 대시보드에서 위젯 생성

1. **로그인**: https://partners.coupang.com/
2. **Tools** → **Dynamic Banner** 메뉴 이동
3. **"Create New Banner"** 클릭
4. **배너 설정**:

#### 위젯 1: Mid-Content (본문 중간)
- **Size**: Responsive
- **Type**: Standard
- **Name**: `Mid-Content Banner`
- **Target**: All Categories (또는 블로그 카테고리에 맞게 선택)

#### 위젯 2: End-Post (포스트 끝)
- **Size**: Responsive
- **Type**: Carousel
- **Product Count**: 4
- **Name**: `End-Post Carousel`

#### 위젯 3: Sidebar (사이드바 - 선택사항)
- **Size**: 300x250
- **Type**: Standard
- **Name**: `Sidebar Banner`

5. **생성 완료 후** 다음 정보 복사:
   - **Partner ID** (예: `AF1234567`)
   - **Widget ID 1** (예: `123456`)
   - **Widget ID 2** (예: `789012`)
   - **Widget ID 3** (예: `345678`)

---

### 2단계: 환경 변수 설정

#### Vercel 대시보드에서 설정

1. Vercel 프로젝트 대시보드로 이동
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```
NEXT_PUBLIC_COUPANG_PARTNER_ID = AF1234567
NEXT_PUBLIC_COUPANG_WIDGET_MID_CONTENT = 123456
NEXT_PUBLIC_COUPANG_WIDGET_END_POST = 789012
NEXT_PUBLIC_COUPANG_WIDGET_SIDEBAR = 345678
```

**Important**:
- `NEXT_PUBLIC_` 접두사 반드시 포함 (클라이언트 사이드에서 접근 가능)
- **Environments**: Production, Preview, Development 모두 체크

#### 로컬 개발 환경 설정

`.env.local` 파일 생성 (이미 있다면 추가):

```bash
# Coupang Partners (Dynamic Banners)
NEXT_PUBLIC_COUPANG_PARTNER_ID="AF1234567"
NEXT_PUBLIC_COUPANG_WIDGET_MID_CONTENT="123456"
NEXT_PUBLIC_COUPANG_WIDGET_END_POST="789012"
NEXT_PUBLIC_COUPANG_WIDGET_SIDEBAR="345678"
```

---

### 3단계: 배포 및 테스트

#### Vercel 재배포

```bash
# 환경 변수 추가 후 재배포
git add .
git commit -m "feat: Add Coupang dynamic banners"
git push

# 또는 Vercel CLI 사용
vercel --prod
```

#### 로컬 테스트

```bash
# 개발 서버 재시작 (환경 변수 로드 위해)
pnpm dev
```

**브라우저에서 확인**:
1. http://localhost:3000/ko/posts/[any-post-slug] 접속
2. **개발자 도구** (F12) → **Console** 탭 열기
3. 에러 확인:
   - ❌ `NEXT_PUBLIC_COUPANG_PARTNER_ID is not set` → 환경 변수 미설정
   - ✅ 에러 없음 → 정상 작동

4. **페이지 스크롤하여 배너 확인**:
   - 본문 중간에 responsive 배너
   - 본문 끝에 carousel 배너 (상품 4개)

---

## 📍 배너 배치 위치

현재 `/src/app/[locale]/posts/[slug]/page.tsx`에 배너가 자동 삽입됩니다:

```
┌─────────────────────────────┐
│  제목 / 메타데이터           │
│  커버 이미지                 │
├─────────────────────────────┤
│  [Google AdSense #1]        │
├─────────────────────────────┤
│  본문 전반부 (50%)           │
├─────────────────────────────┤
│  [Google AdSense #2]        │
│  [Coupang Mid-Content] 🆕   │ ← 여기!
├─────────────────────────────┤
│  본문 후반부 (50%)           │
├─────────────────────────────┤
│  [Google AdSense #3]        │
│  [Coupang End-Post] 🆕      │ ← 여기!
├─────────────────────────────┤
│  댓글 섹션                   │
│  관련 글                     │
└─────────────────────────────┘
```

**배치 원칙**:
- ✅ AdSense와 충분한 간격 (Google 정책 준수)
- ✅ 본문 중간 (독자 몰입 후 노출)
- ✅ 포스트 끝 (행동 유도에 최적)

---

## 🎨 커스터마이징

### 방법 1: 프리셋 배너 사용 (권장)

가장 간단한 방법입니다. 이미 구현되어 있습니다.

```tsx
import { CoupangBannerMidContent, CoupangBannerEndPost } from '@/components/CoupangBanner'

<CoupangBannerMidContent />
<CoupangBannerEndPost />
```

### 방법 2: 커스텀 배너

특정 페이지에 맞춤 배너가 필요한 경우:

```tsx
import CoupangBanner from '@/components/CoupangBanner'

<CoupangBanner
  widgetId="custom-widget-id"
  size="728x90"
  type="standard"
  className="my-6"
  showOnMobile={true}
  showOnDesktop={true}
/>
```

**사용 가능한 Props**:
- `widgetId`: Widget ID (필수)
- `size`: `'300x250' | '320x50' | '728x90' | '160x600' | 'responsive'`
- `type`: `'standard' | 'carousel'`
- `count`: Carousel 상품 개수 (type="carousel"일 때만)
- `showOnMobile`: 모바일 표시 여부 (default: true)
- `showOnDesktop`: 데스크톱 표시 여부 (default: true)

### 방법 3: 다른 페이지에 배너 추가

**홈페이지에 추가**:
```tsx
// src/app/[locale]/page.tsx
import { CoupangBannerEndPost } from '@/components/CoupangBanner'

// ... 페이지 끝에
<CoupangBannerEndPost className="my-16" />
```

**카테고리 페이지에 추가**:
```tsx
// src/app/[locale]/posts/page.tsx
import CoupangBanner from '@/components/CoupangBanner'

// ... 포스트 목록 사이에
<CoupangBanner widgetId={process.env.NEXT_PUBLIC_COUPANG_WIDGET_MID_CONTENT || ''} />
```

---

## 📊 성능 최적화

### 현재 구현된 최적화

1. **Lazy Loading**: `strategy="lazyOnload"` 사용
   - 페이지 초기 로딩에 영향 없음
   - Lighthouse 점수 유지

2. **Script Deduplication**: Next.js `<Script>` 컴포넌트 사용
   - 중복 스크립트 로딩 방지
   - 한 페이지에 여러 배너가 있어도 스크립트는 1번만 로드

3. **Responsive Display**: CSS 클래스로 제어
   - 모바일/데스크톱 선택적 표시
   - 불필요한 렌더링 방지

### Lighthouse 점수 영향

**예상 영향**:
- **Performance**: -5~10점 (외부 JS 로딩)
- **Best Practices**: 영향 없음
- **Accessibility**: 영향 없음
- **SEO**: 영향 없음

**대응책**:
- Lazy loading으로 초기 로딩 영향 최소화
- AdSense와 병행 시 총 점수 380~390점 예상
- 수익 vs 성능 트레이드오프 고려

---

## 🔍 문제 해결

### Q1: 배너가 보이지 않아요

**체크리스트**:
1. ✅ 환경 변수 설정 확인
   ```bash
   # Vercel에서 확인
   vercel env ls

   # 로컬에서 확인
   echo $NEXT_PUBLIC_COUPANG_PARTNER_ID
   ```

2. ✅ Widget ID 정확성 확인
   - Coupang Partners 대시보드에서 Widget ID 재확인
   - 복사 시 공백 포함되지 않았는지 확인

3. ✅ 브라우저 콘솔 에러 확인
   - F12 → Console 탭
   - `Failed to load Coupang banner script` 에러 확인

4. ✅ Ad Blocker 비활성화
   - 광고 차단 확장 프로그램이 Coupang 배너도 차단할 수 있음

### Q2: 배너가 레이아웃을 깨뜨려요

**해결책**:
- `responsive` 크기 사용 권장
- `className`으로 여백 조정:
  ```tsx
  <CoupangBannerMidContent className="my-8 max-w-4xl mx-auto" />
  ```

### Q3: 모바일에서만 배너를 숨기고 싶어요

```tsx
<CoupangBanner
  widgetId="..."
  showOnMobile={false}
  showOnDesktop={true}
/>
```

### Q4: Lighthouse 점수가 많이 떨어졌어요

**원인**: 외부 JavaScript 로딩
**해결책**:
1. 배너 개수 줄이기 (페이지당 1-2개 권장)
2. 특정 카테고리 포스트에만 배너 표시:
   ```tsx
   {post.tags?.includes('리뷰') && <CoupangBannerEndPost />}
   ```
3. AdSense vs Coupang 배너 A/B 테스트

---

## 📈 수익 트래킹

### Coupang Partners 대시보드

1. https://partners.coupang.com/ 로그인
2. **Reports** → **Performance Report**
3. 확인 가능한 지표:
   - 클릭 수 (Clicks)
   - 주문 수 (Orders)
   - 수수료 (Commission)
   - CTR (Click-Through Rate)

### Google Analytics 연동 (선택사항)

배너 클릭 이벤트 추적:

```tsx
// src/components/CoupangBanner.tsx에 추가
useEffect(() => {
  const bannerElement = bannerRef.current
  if (!bannerElement) return

  const handleClick = () => {
    // Google Analytics 이벤트 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'coupang_banner_click', {
        widget_id: widgetId,
        banner_type: type
      })
    }
  }

  bannerElement.addEventListener('click', handleClick)
  return () => bannerElement.removeEventListener('click', handleClick)
}, [widgetId, type])
```

---

## 🎯 A/B 테스트 아이디어

### 1. 배너 위치 테스트
- **Case A**: 본문 중간 + 끝
- **Case B**: 본문 끝만
- **측정**: CTR, 수익

### 2. 배너 타입 테스트
- **Case A**: Standard 배너
- **Case B**: Carousel 배너
- **측정**: 클릭 수, 전환율

### 3. 카테고리별 최적화
- **리뷰 글**: 제품 비교 배너
- **가이드 글**: 추천 상품 배너
- **뉴스 글**: 배너 없음

---

## 📚 추가 자료

- **Coupang Partners Dashboard**: https://partners.coupang.com/
- **Dynamic Banner Guide**: https://partners.coupang.com/#help/tag-usage-guide
- **API 통합 가이드**: `docs/COUPANG-PARTNERS-API.md`
- **전체 제휴 시스템**: `docs/COUPANG-PARTNERS-GUIDE.md`

---

## ✅ 체크리스트

설치 완료 후 확인:

- [ ] Coupang Partners Dashboard에서 3개 위젯 생성
- [ ] Vercel Environment Variables 설정
- [ ] `.env.local` 로컬 환경 변수 설정
- [ ] 개발 서버 재시작 후 배너 표시 확인
- [ ] 모바일 반응형 테스트
- [ ] 프로덕션 배포
- [ ] Lighthouse 점수 확인 (목표: 370+)
- [ ] 실제 클릭 테스트 (Coupang 대시보드에서 확인)
- [ ] 1주일 후 수익 리포트 확인

---

**마지막 업데이트**: 2025-01-04
**작성자**: Claude Code AI
**난이도**: ⭐⭐ (중급)
