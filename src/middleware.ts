import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n'

export async function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl.clone()
    let pathname = url.pathname
    const hostname = request.headers.get('host') || ''
    const isConsultingSubdomain = hostname.startsWith('consulting.')


    // Handle www redirect + other redirects in a single hop
    const isWww = hostname.startsWith('www.')
    const hasTrailingSlash = pathname !== '/' && pathname.endsWith('/')

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // Subdomain Handling (consulting feature toggle)
    // 이 기능은 featuresConfig.consulting이 true일 때만 활성화된다.
    // Edge Runtime에서는 config를 직접 import할 수 없으므로 환경변수로 제어한다.
    const consultingEnabled = process.env.NEXT_PUBLIC_FEATURE_CONSULTING === 'true'
    const consultingDomain = process.env.NEXT_PUBLIC_CONSULTING_DOMAIN || ''

    if (consultingEnabled && isConsultingSubdomain) {
      if (!pathname.includes('/consulting')) {
        const locale = (pathname === '/en' || pathname.startsWith('/en/')) ? 'en' : 'ko'
        return NextResponse.redirect(new URL(`/${locale}/consulting`, request.url))
      }
    }

    if (consultingEnabled && !isConsultingSubdomain && pathname.includes('/consulting') && consultingDomain) {
      const locale = pathname.startsWith('/en') ? 'en' : 'ko'
      return NextResponse.redirect(new URL(`https://${consultingDomain}/${locale}/consulting`, request.url))
    }

    // Skip locale redirect for special routes
    const skipLocaleRedirect = [
      '/api',
      '/admin',
      '/_next',
      '/icon',
      '/apple-icon',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/ads.txt'
    ].some(path => pathname.startsWith(path))

    // If we need multiple redirects, combine them into one
    let needsRedirect = false
    let newUrl = url.clone()

    // NOTE: Vercel redirects non-www to www, so we don't handle www removal here
    // This prevents redirect loops

    // Remove trailing slash
    if (hasTrailingSlash) {
      newUrl.pathname = pathname.slice(0, -1)
      pathname = newUrl.pathname // Update pathname for subsequent checks
      needsRedirect = true
    }

    // Add locale (always default to Korean)
    if (!pathnameHasLocale && !skipLocaleRedirect) {
      // Always use Korean as default locale
      const locale = 'ko'
      newUrl.pathname = `/${locale}${pathname}`
      needsRedirect = true
    }

    // If any redirect is needed, do it in one hop
    if (needsRedirect) {
      return NextResponse.redirect(newUrl, { status: 307 })
    }
    
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"'
          }
        })
      }
      
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
      const [username, password] = credentials.split(':')
      
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
      
      if (username !== 'admin' || password !== adminPassword) {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"'
          }
        })
      }
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all pathnames except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|ads.txt|fonts|images).*)',
  ]
}