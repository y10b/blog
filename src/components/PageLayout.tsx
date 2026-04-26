import Link from 'next/link'
import Image from 'next/image'
import { siteConfig, brandConfig, navigationConfig } from '@/config'

interface PageLayoutProps {
  locale: string
  currentPath: string
  children: React.ReactNode
}

export default function PageLayout({ locale, currentPath, children }: PageLayoutProps) {
  const lang = locale === 'en' ? 'en' : 'ko'
  const t = {
    privacy: lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy',
    terms: lang === 'ko' ? '이용약관' : 'Terms of Service',
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-5">
            <Link href={`/${locale}`} className="flex items-center" aria-label={brandConfig.logo.text}>
              {brandConfig.logo.image ? (
                <Image
                  src={brandConfig.logo.image}
                  alt={brandConfig.logo.text}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              ) : (
                <span className="flex items-center gap-2.5">
                  <span className="inline-block w-7 h-7 rounded-md bg-stone-900" aria-hidden />
                  <span className="text-base font-semibold tracking-tight">
                    {brandConfig.logo.text}
                  </span>
                </span>
              )}
            </Link>
            <div className="flex gap-1">
              <Link
                href={`/ko${currentPath}`}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'ko' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
              >
                KOR
              </Link>
              <Link
                href={`/en${currentPath}`}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'en' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
              >
                ENG
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-5 pb-3 text-sm" aria-label="Main navigation">
            {(navigationConfig[lang as keyof typeof navigationConfig] ?? navigationConfig[siteConfig.defaultLocale]).map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href === '/' ? '' : item.href}`}
                className={`pb-1.5 border-b-2 transition-colors ${
                  currentPath === item.href
                    ? 'text-stone-900 border-stone-900 font-medium'
                    : 'text-stone-500 border-transparent hover:text-stone-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {children}
      </main>

      <footer className="bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              {brandConfig.logo.image ? (
                <Image
                  src={brandConfig.logo.image}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <span className="inline-block w-5 h-5 rounded bg-stone-900" aria-hidden />
              )}
              <span>&copy; {brandConfig.copyright.startYear} {brandConfig.copyright.holder}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href={`/${locale}/privacy`} className="text-stone-500 hover:text-stone-900">
                {t.privacy}
              </Link>
              <Link href={`/${locale}/terms`} className="text-stone-500 hover:text-stone-900">
                {t.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
