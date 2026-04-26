import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import { siteConfig } from '@/config'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  return {
    title: locale === 'en' ? siteConfig.title.en : siteConfig.title.ko,
    description: locale === 'en'
      ? siteConfig.description.en
      : siteConfig.description.ko,
    icons: {
      icon: '/icon',
      apple: '/apple-icon',
    },
    openGraph: {
      title: locale === 'en' ? siteConfig.title.en : siteConfig.title.ko,
      description: locale === 'en'
        ? siteConfig.description.en
        : siteConfig.description.ko,
      siteName: siteConfig.shortName,
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: locale === 'en' ? siteConfig.title.en : siteConfig.title.ko,
      description: locale === 'en'
        ? siteConfig.description.en
        : siteConfig.description.ko,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }
  
  return (
    <>
      <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      <link rel="dns-prefetch" href="https://i.ytimg.com" />
      {children}
    </>
  )
}