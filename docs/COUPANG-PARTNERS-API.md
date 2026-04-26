# 🔌 Coupang Partners API Integration Guide

## 📋 Overview

This document covers the integration of **Coupang Partners Open API** and **Dynamic Banners** for the Colemearchy blog.

**Two Integration Methods:**
1. **Direct Links** (Currently Implemented) - Manual affiliate link insertion
2. **Open API** (Advanced) - Programmatic product search and link generation
3. **Dynamic Banners** (New) - Automated product recommendation widgets

---

## 🎯 Method 1: Direct Links (Current Implementation)

### How It Works

The current system uses manually generated affiliate links from the Coupang Partners dashboard.

**Link Format:**
```
https://link.coupang.com/a/[UNIQUE_ID]
```

**Legal Requirement:**
```markdown
*이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.*
```

### Implementation Files

- **Database**: `prisma/schema.prisma` - `AffiliateProduct` model
- **Link Injection**: `src/lib/utils/affiliate-link-injector.ts`
- **Admin UI**: `src/app/admin/affiliate-products/page.tsx`
- **API Routes**: `src/app/api/admin/affiliate-products/route.ts`

### Advantages ✅
- ✅ Simple implementation
- ✅ No API quota limits
- ✅ Fast response time
- ✅ Full control over product selection

### Limitations ❌
- ❌ Manual product entry required
- ❌ Cannot access real-time product data (price, stock, ratings)
- ❌ No automated product discovery

---

## 🚀 Method 2: Coupang Open API (Advanced)

### Overview

The **Coupang Open API** allows programmatic access to:
- Product search and recommendations
- Real-time pricing and availability
- Automated deep link generation
- Product reviews and ratings

### API Documentation

**Official Portal**: https://developers.coupangcorp.com/hc/en-us

**Key Endpoints:**
- Product Search API
- Product Details API
- Deep Link Generator API
- Best Deal API

### Authentication

Coupang Open API uses **HMAC (RFC2014)** authentication.

**Required Headers:**
```typescript
{
  'Authorization': 'HMAC signature',
  'X-Requested-By': 'VendorId',
  'X-MARKET': 'KR'  // Korea market
}
```

**API Key Structure:**
- **Access Key**: Public identifier
- **Secret Key**: Used for HMAC signature generation

### Getting API Keys

1. Sign up as a **Coupang Seller** at https://wing.coupang.com/
2. Navigate to **WING Seller Portal**
3. Request **Open API Access**
4. Obtain Access Key and Secret Key

⚠️ **Note**: API access requires seller account status. Not available for Partners-only accounts.

### HMAC Signature Generation

```typescript
import crypto from 'crypto'

function generateHMACSignature(
  method: string,
  path: string,
  secretKey: string,
  timestamp: string
): string {
  const message = `${method} ${path} ${timestamp}`
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex')

  return signature
}

// Usage Example
const signature = generateHMACSignature(
  'GET',
  '/v2/providers/affiliate_open_api/apis/openapi/products/search',
  process.env.COUPANG_SECRET_KEY!,
  Date.now().toString()
)
```

### Example API Call

```typescript
async function searchProducts(keyword: string) {
  const timestamp = Date.now().toString()
  const path = '/v2/providers/affiliate_open_api/apis/openapi/products/search'
  const signature = generateHMACSignature('GET', path, secretKey, timestamp)

  const response = await fetch(
    `https://api-gateway.coupang.com${path}?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: {
        'Authorization': `Bearer ${signature}`,
        'X-Requested-By': vendorId,
        'X-MARKET': 'KR',
        'Content-Type': 'application/json'
      }
    }
  )

  const data = await response.json()
  return data
}
```

### Implementation Plan (Future)

**Phase 1: API Setup**
```typescript
// src/lib/coupang-api.ts
export async function searchCoupangProducts(query: string) {
  // Implement HMAC auth + API call
}

export async function generateDeepLink(productId: string) {
  // Generate affiliate link programmatically
}
```

**Phase 2: Automated Product Discovery**
```typescript
// scripts/discover-trending-products.ts
// Daily cron job to find trending products based on:
// - Search trends
// - Best seller rankings
// - Category performance
```

**Phase 3: Real-time Data Sync**
```typescript
// Update product prices and availability daily
// Remove out-of-stock products
// Highlight price drops
```

### API Quotas & Rate Limits

⚠️ **Important**: Coupang Open API has rate limits (exact limits not publicly documented).

**Best Practices:**
- Cache API responses (Redis/Vercel KV)
- Implement exponential backoff for retries
- Use batch endpoints when available
- Monitor API usage via logs

---

## 🎨 Method 3: Dynamic Banners (NEW)

### Overview

**Coupang Dynamic Banners** are JavaScript widgets that automatically display relevant products based on:
- Page content analysis
- User browsing history
- Coupang's recommendation algorithm

**Official Guide**: https://partners.coupang.com/#help/tag-usage-guide

### How Dynamic Banners Work

1. **Script Injection**: Add Coupang's JavaScript to your page
2. **Automatic Analysis**: Coupang analyzes page content and user context
3. **Product Recommendation**: Banner displays 1-4 products dynamically
4. **Click Tracking**: Commissions tracked automatically

### Banner Types

#### 1. Standard Banner (Rectangle)
```html
<!-- 300x250 -->
<ins class="coupang-banner-tag"
     data-client-id="YOUR_PARTNER_ID"
     data-widget-id="YOUR_WIDGET_ID"
     data-size="300x250">
</ins>
<script src="https://ads-partners.coupang.com/g.js"></script>
```

#### 2. Responsive Banner (Mobile-Optimized)
```html
<!-- Auto-resizing -->
<ins class="coupang-banner-tag"
     data-client-id="YOUR_PARTNER_ID"
     data-widget-id="YOUR_WIDGET_ID"
     data-responsive="true">
</ins>
<script src="https://ads-partners.coupang.com/g.js"></script>
```

#### 3. Carousel Banner
```html
<!-- Product carousel -->
<ins class="coupang-banner-tag"
     data-client-id="YOUR_PARTNER_ID"
     data-widget-id="YOUR_WIDGET_ID"
     data-type="carousel"
     data-count="4">
</ins>
<script src="https://ads-partners.coupang.com/g.js"></script>
```

### Getting Widget Credentials

1. Log in to **Coupang Partners Dashboard**: https://partners.coupang.com/
2. Navigate to **Tools** → **Dynamic Banner**
3. Click **Create New Banner**
4. Select:
   - Banner size (300x250, 320x50, responsive)
   - Banner type (standard, carousel, text)
   - Target categories (optional)
5. Copy generated HTML code

### Implementation for Colemearchy Blog

#### Step 1: Create Banner Component

```typescript
// src/components/CoupangBanner.tsx
'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface CoupangBannerProps {
  widgetId: string
  size?: '300x250' | '320x50' | '728x90' | 'responsive'
  type?: 'standard' | 'carousel'
  className?: string
}

export default function CoupangBanner({
  widgetId,
  size = 'responsive',
  type = 'standard',
  className = ''
}: CoupangBannerProps) {
  const bannerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Reinitialize banner on mount
    if (typeof window !== 'undefined' && (window as any).coupang) {
      (window as any).coupang.init()
    }
  }, [])

  const partnerId = process.env.NEXT_PUBLIC_COUPANG_PARTNER_ID

  return (
    <div className={`coupang-banner-wrapper ${className}`}>
      <ins
        ref={bannerRef}
        className="coupang-banner-tag"
        data-client-id={partnerId}
        data-widget-id={widgetId}
        data-size={size === 'responsive' ? undefined : size}
        data-responsive={size === 'responsive'}
        data-type={type}
      />
      <Script
        src="https://ads-partners.coupang.com/g.js"
        strategy="lazyOnload"
      />
    </div>
  )
}
```

#### Step 2: Add Banner to Blog Post Layout

```typescript
// src/app/[locale]/posts/[slug]/page.tsx
import CoupangBanner from '@/components/CoupangBanner'

export default function PostPage({ params }) {
  return (
    <article>
      <h1>{post.title}</h1>

      {/* Content */}
      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Dynamic Banner - Mid Content */}
      <CoupangBanner
        widgetId="WIDGET_ID_1"
        size="responsive"
        className="my-8"
      />

      {/* More content... */}

      {/* Dynamic Banner - End of Post */}
      <CoupangBanner
        widgetId="WIDGET_ID_2"
        type="carousel"
        className="my-12"
      />
    </article>
  )
}
```

#### Step 3: Add Environment Variables

```env
# .env.local
NEXT_PUBLIC_COUPANG_PARTNER_ID=your_partner_id_here
```

```bash
# Vercel Environment Variables
vercel env add NEXT_PUBLIC_COUPANG_PARTNER_ID
```

#### Step 4: Legal Compliance

**Important**: Dynamic banners automatically include disclosure, but you should add a general notice:

```typescript
// src/components/AffiliateDisclosure.tsx
export default function AffiliateDisclosure() {
  return (
    <div className="affiliate-disclosure bg-gray-50 p-4 rounded-md text-sm text-gray-600 my-6">
      <p className="font-semibold">📢 파트너스 활동 고지</p>
      <p className="mt-1">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  )
}
```

### Banner Placement Best Practices

**✅ Recommended Placements:**
1. **Mid-content** (after 2-3 paragraphs) - Highest engagement
2. **End of post** (after conclusion) - Secondary conversion
3. **Sidebar** (desktop only) - Persistent visibility

**❌ Avoid:**
- Above the fold (negative UX, SEO penalty)
- Multiple banners in same viewport
- Inside paragraphs (breaks reading flow)

### Performance Optimization

**Issue**: External JavaScript can slow down page load.

**Solutions:**
1. **Lazy Loading** (Already implemented via `strategy="lazyOnload"`)
2. **Intersection Observer**: Only load banner when scrolled into view
3. **CSP (Content Security Policy)**: Whitelist Coupang domains

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ads-partners.coupang.com;
              frame-src https://ads-partners.coupang.com;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  }
}
```

### Tracking & Analytics

**Built-in Tracking:**
- Coupang automatically tracks clicks and conversions
- View reports in Partners Dashboard

**Custom Tracking (Optional):**
```typescript
// Track banner impressions
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Log banner view
        fetch('/api/analytics', {
          method: 'POST',
          body: JSON.stringify({
            event: 'banner_view',
            widgetId: widgetId,
            postId: postId
          })
        })
      }
    })
  })

  if (bannerRef.current) {
    observer.observe(bannerRef.current)
  }

  return () => observer.disconnect()
}, [])
```

---

## 📊 Comparison: Direct Links vs API vs Banners

| Feature | Direct Links | Open API | Dynamic Banners |
|---------|-------------|----------|----------------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐⭐ Complex | ⭐⭐ Medium |
| **Product Control** | ✅ Full | ✅ Full | ❌ Automatic |
| **Real-time Data** | ❌ No | ✅ Yes | ✅ Yes |
| **Maintenance** | Manual | Automated | Zero |
| **SEO Impact** | ✅ Positive | ✅ Positive | ⚠️ Neutral |
| **Page Speed** | ✅ Fast | ✅ Fast | ⚠️ Slower (JS) |
| **Conversion Rate** | Medium | High | Highest |
| **Revenue Potential** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚦 Recommended Integration Strategy

### Phase 1: Foundation (Current) ✅
- Direct affiliate links with manual curation
- Custom product database
- AI-generated review content
- SEO-optimized placement

### Phase 2: Hybrid Approach (Recommended Next Step) 🎯
- **Keep direct links** for strategic products (high-margin, evergreen)
- **Add dynamic banners** for supplementary revenue (low maintenance)
- Place banners in:
  - Blog post mid-content
  - End of post
  - Category pages

### Phase 3: Full Automation (Future) 🚀
- Integrate Coupang Open API for real-time data
- Automated trending product discovery
- A/B testing for link placement
- Revenue analytics dashboard

---

## 🛠 Implementation Checklist

### Dynamic Banner Setup

- [ ] Log in to Coupang Partners Dashboard
- [ ] Create 3 banner widgets:
  - [ ] Widget 1: Responsive (mid-content)
  - [ ] Widget 2: Carousel (end-of-post)
  - [ ] Widget 3: 300x250 (sidebar - optional)
- [ ] Copy Partner ID and Widget IDs
- [ ] Add `NEXT_PUBLIC_COUPANG_PARTNER_ID` to Vercel
- [ ] Create `CoupangBanner.tsx` component
- [ ] Add banners to post layout
- [ ] Test on development server
- [ ] Deploy to production
- [ ] Monitor performance (Lighthouse score)
- [ ] Track revenue in Partners Dashboard

### Open API Setup (Future)

- [ ] Apply for Coupang Seller account
- [ ] Request Open API access
- [ ] Obtain Access Key + Secret Key
- [ ] Implement HMAC authentication
- [ ] Create product search functions
- [ ] Set up caching layer (Redis/KV)
- [ ] Build automated discovery pipeline
- [ ] Integrate with existing affiliate system

---

## 📚 Additional Resources

### Official Documentation
- **Coupang Partners**: https://partners.coupang.com/
- **Coupang Open API**: https://developers.coupangcorp.com/
- **Dynamic Banner Guide**: https://partners.coupang.com/#help/tag-usage-guide
- **Legal Guidelines**: https://partners.coupang.com/#help/faq

### Technical References
- **HMAC Authentication (RFC 2014)**: https://www.rfc-editor.org/rfc/rfc2014
- **Next.js Script Component**: https://nextjs.org/docs/app/api-reference/components/script
- **CSP Headers**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

### Community Resources
- **GitHub**: Search for "coupang api" examples
- **Korean Dev Communities**: Naver Cafe, Okky.kr

---

## 🔐 Security Considerations

### API Keys
- ⚠️ **Never commit API keys** to Git
- ✅ Store in Vercel Environment Variables
- ✅ Use `.env.local` for development (add to `.gitignore`)

### Rate Limiting
- Implement exponential backoff for API calls
- Cache responses to reduce API usage
- Monitor quota usage

### Data Privacy
- Dynamic banners may use cookies for tracking
- Ensure compliance with GDPR/CCPA if applicable
- Add cookie consent banner if needed

---

## 📞 Support

**Coupang Partners Support:**
- Email: partners@coupang.com
- Dashboard: https://partners.coupang.com/#help

**Technical Issues:**
- Open API: developers@coupang.com
- Banner Integration: Check Partners Dashboard → Help Center

---

**Last Updated**: 2025-01-04
**Maintained By**: Colemearchy Team
**Version**: 1.0.0
