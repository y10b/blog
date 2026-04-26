import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config'

/**
 * 동적 robots.txt 생성.
 * siteConfig.url 기반으로 Host, Sitemap URL을 자동 설정한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*', '/offline'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
