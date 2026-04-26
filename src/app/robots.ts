import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config'

/**
 * 동적 robots.txt 생성.
 * siteConfig.url 기반으로 Host, Sitemap URL을 자동 설정한다.
 * public/robots.txt 대신 이 파일이 우선 적용된다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/server-sitemap.xml`,
    ],
    host: siteConfig.url,
  }
}
