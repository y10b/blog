// PERF-CRITICAL: Do NOT add preconnect links (use dns-prefetch only).
// Do NOT wrap GA/SW/AdBlocker in dynamic() - causes TBT spike from chunk loading.
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "./globals.css";
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AdBlockerNotice from '@/components/AdBlockerNotice';
import { siteConfig, brandConfig, featuresConfig } from '@/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title[siteConfig.defaultLocale],
    template: `%s | ${siteConfig.shortName}`
  },
  description: siteConfig.description[siteConfig.defaultLocale],
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    type: "website",
    locale: siteConfig.defaultLocale === 'ko' ? 'ko_KR' : 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title[siteConfig.defaultLocale],
    description: siteConfig.description[siteConfig.defaultLocale],
    images: [
      {
        url: brandConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description[siteConfig.defaultLocale],
    ...(siteConfig.social.twitter ? { creator: siteConfig.social.twitter } : {}),
    images: [brandConfig.ogImage]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.url,
    languages: Object.fromEntries(
      siteConfig.locales.map(locale => [locale, `/${locale}`])
    ),
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description[siteConfig.defaultLocale],
    publisher: {
      '@type': siteConfig.author.type,
      name: siteConfig.author.name,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {siteConfig.analytics.adsenseClientId && (
          <Script
            id="google-adsense"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.analytics.adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        {siteConfig.analytics.gaId && <GoogleAnalytics />}
        {featuresConfig.serviceWorker && <ServiceWorkerRegistration />}
        {children}
        {featuresConfig.adBlockerNotice && <AdBlockerNotice />}
      </body>
    </html>
  );
}
