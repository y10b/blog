import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { siteConfig, brandConfig, navigationConfig } from '@/config'
import { shouldUseNextImage } from '@/lib/image-utils'
import { tagsToArray } from '@/lib/utils/tags'

// Static generation with ISR
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    title: siteConfig.title[locale as keyof typeof siteConfig.title] ?? siteConfig.title[siteConfig.defaultLocale],
    description: siteConfig.description[locale as keyof typeof siteConfig.description] ?? siteConfig.description[siteConfig.defaultLocale],
    alternates: {
      canonical: `${siteConfig.url}/${locale}`,
      languages: {
        ...Object.fromEntries(siteConfig.locales.map(l => [l, `/${l}`])),
        'x-default': `/${siteConfig.defaultLocale}`,
      },
    },
  }
}

interface Translation {
  id: string
  locale: string
  title: string
  excerpt: string | null
}

type Post = Awaited<ReturnType<typeof prisma.post.findMany>>[number] & {
  translations?: Translation[]
}

function parseExcerpt(excerpt: string | null): string | null {
  if (!excerpt) return null
  if (excerpt.includes('```json') || excerpt.includes('"excerpt":')) {
    const jsonMatch = excerpt.match(/```json\s*([\s\S]*?)(?:```|$)/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        return parsed.excerpt || parsed.description || null
      } catch {
        // truncated json, fall through
      }
    }
    const excerptMatch = excerpt.match(/"excerpt"\s*:\s*"([^"]+)"/)
    if (excerptMatch) return excerptMatch[1]
    if (excerpt.startsWith('```json') || excerpt.startsWith('{')) {
      const titleMatch = excerpt.match(/"title"\s*:\s*"([^"]+)"/)
      if (titleMatch) return `Read about: ${titleMatch[1]}`
      return 'Click to read more...'
    }
  }
  return excerpt
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'

  let posts: Post[] = []

  try {
    posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null, lte: new Date() },
        coverImage: { not: null },
        ...(lang === 'ko'
          ? { originalLanguage: 'ko' }
          : {
              OR: [
                { originalLanguage: 'en' },
                {
                  AND: [
                    { originalLanguage: 'ko' },
                    { translations: { some: { locale: 'en' } } },
                  ],
                },
              ],
            }),
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      include: {
        translations: { where: { locale: lang } },
      },
    })
  } catch (error) {
    console.error('Database error:', error)
    posts = []
  }

  const featuredPost = posts[0]
  const restPosts = posts.slice(1)

  const t = {
    bioLine: lang === 'ko'
      ? '개발자 프리랜서. 풀스택 1년차에서 초기 스타트업의 AI 모델 개발자로 넘어가며 배운 것들을 기록합니다.'
      : 'Developer freelancer. Notes from a 1-year fullstack dev pivoting to AI model engineering at an early-stage startup.',
    featured: lang === 'ko' ? '대표 글' : 'Featured',
    latest: lang === 'ko' ? '최신 글' : 'Latest',
    seeAll: lang === 'ko' ? '전체 보기' : 'See all',
    noPosts: lang === 'ko' ? '아직 발행된 글이 없습니다.' : 'No posts published yet.',
    aboutMore: lang === 'ko' ? '운영자 소개 더 보기' : 'About the author',
    about: lang === 'ko' ? '소개' : 'About',
    posts: lang === 'ko' ? '전체 글' : 'All Posts',
    archive: lang === 'ko' ? '아카이브' : 'Archive',
    sitemap: lang === 'ko' ? '사이트맵' : 'Sitemap',
    privacy: lang === 'ko' ? '개인정보처리방침' : 'Privacy',
    terms: lang === 'ko' ? '이용약관' : 'Terms',
    article: lang === 'ko' ? '글' : 'Article',
  }

  const cat = {
    dev: {
      label: lang === 'ko' ? '개발 / AI' : 'Dev / AI',
      desc: lang === 'ko'
        ? 'AI 모델 학습 실전기, 상품·서비스 개발기, 풀스택→AI 전환, 초기 스타트업 엔지니어링.'
        : 'AI model training logs, product build journals, fullstack→AI transition, early-stage engineering.',
    },
    side: {
      label: lang === 'ko' ? 'N잡 / 도구 / 정책' : 'Side hustle / Tools / Policy',
      desc: lang === 'ko'
        ? '워크플로 자동화, 프리랜서·N잡 정책 정보, 도구 소개·후기, 사이드 프로젝트 수익화.'
        : 'Workflow automation, freelancer & side-hustle policies, tool reviews, monetizing side projects.',
    },
  }

  const dateLocale = lang === 'ko' ? 'ko-KR' : 'en-US'

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
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
                href="/ko"
                className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'ko' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
              >
                KOR
              </Link>
              <Link
                href="/en"
                className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${lang === 'en' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'}`}
              >
                ENG
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-5 pb-3 text-sm" aria-label="Main navigation">
            {(navigationConfig[lang as keyof typeof navigationConfig] ?? navigationConfig[siteConfig.defaultLocale]).map((item, index) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href === '/' ? '' : item.href}`}
                className={`pb-1.5 border-b-2 transition-colors ${
                  index === 0
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

      {/* Compact intro — bio + tagline (no giant hero) */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="flex items-start gap-4 mb-5">
            {brandConfig.logo.image ? (
              <Image
                src={brandConfig.logo.image}
                alt={brandConfig.logo.text}
                width={64}
                height={64}
                className="h-16 w-16 object-contain flex-shrink-0"
                priority
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                n
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {brandConfig.logo.text}
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                {lang === 'ko' ? '개발자 프리랜서 블로그' : 'Developer freelancer blog'}
              </p>
            </div>
          </div>
          <p className="text-base lg:text-lg text-stone-700 leading-relaxed max-w-2xl">
            {t.bioLine}
          </p>
          <Link
            href={`/${locale}/about`}
            className="inline-block mt-4 text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            {t.aboutMore} →
          </Link>
        </div>
      </section>

      {/* Category cards — subtle, border-only, single accent on hover */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href={`/${locale}/posts?category=dev`}
            className="group block rounded-xl bg-white border border-stone-200 p-6 hover:border-amber-400 hover:shadow-sm transition"
          >
            <div className="text-[10px] font-semibold tracking-[0.2em] text-amber-700 mb-2">
              CATEGORY
            </div>
            <h2 className="text-lg font-bold mb-2">{cat.dev.label}</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-3">{cat.dev.desc}</p>
            <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors">
              {t.seeAll} →
            </span>
          </Link>

          <Link
            href={`/${locale}/posts?category=sidehustle`}
            className="group block rounded-xl bg-white border border-stone-200 p-6 hover:border-amber-400 hover:shadow-sm transition"
          >
            <div className="text-[10px] font-semibold tracking-[0.2em] text-amber-700 mb-2">
              CATEGORY
            </div>
            <h2 className="text-lg font-bold mb-2">{cat.side.label}</h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-3">{cat.side.desc}</p>
            <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors">
              {t.seeAll} →
            </span>
          </Link>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Featured */}
        {featuredPost && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold tracking-tight text-stone-900">
                {t.featured}
              </h2>
            </div>
            <article className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition">
              <Link href={`/${locale}/posts/${featuredPost.slug}`} className="block">
                <div className="grid lg:grid-cols-5 gap-0">
                  {featuredPost.coverImage && (
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-2 bg-stone-100">
                      {shouldUseNextImage(featuredPost.coverImage) ? (
                        <Image
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          fill
                          priority
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 40vw"
                        />
                      ) : (
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="eager"
                        />
                      )}
                    </div>
                  )}
                  <div className="p-6 lg:p-8 lg:col-span-3 flex flex-col justify-center">
                    <h3 className="text-xl lg:text-2xl font-bold leading-snug mb-3 hover:text-stone-700 transition-colors">
                      {lang === 'en' && featuredPost.translations?.[0]?.title
                        ? featuredPost.translations[0].title
                        : featuredPost.title}
                    </h3>
                    {featuredPost.excerpt && (
                      <p className="text-stone-600 leading-relaxed line-clamp-3 mb-4">
                        {lang === 'en' && featuredPost.translations?.[0]?.excerpt
                          ? parseExcerpt(featuredPost.translations[0].excerpt)
                          : parseExcerpt(featuredPost.excerpt)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <time>
                        {new Date(featuredPost.publishedAt!).toLocaleDateString(dateLocale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      <span>·</span>
                      <span className="font-medium text-amber-700">{t.featured}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          </section>
        )}

        {/* Latest list */}
        {restPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold tracking-tight text-stone-900">
                {t.latest}
              </h2>
              <Link
                href={`/${locale}/archive`}
                className="text-sm font-medium text-stone-500 hover:text-stone-900"
              >
                {t.seeAll} →
              </Link>
            </div>
            <div className="space-y-0 divide-y divide-stone-200">
              {restPosts.map((post) => (
                <article key={post.id} className="py-5 first:pt-0">
                  <Link href={`/${locale}/posts/${post.slug}`} className="block group">
                    <div className="grid sm:grid-cols-4 gap-4 items-start">
                      {post.coverImage && (
                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-stone-100 sm:col-span-1">
                          {shouldUseNextImage(post.coverImage) ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              loading="lazy"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 100vw, 25vw"
                            />
                          ) : (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}
                        </div>
                      )}
                      <div className="sm:col-span-3">
                        <h3 className="text-lg font-semibold leading-snug mb-1.5 group-hover:text-stone-700 transition-colors">
                          {lang === 'en' && post.translations?.[0]?.title
                            ? post.translations[0].title
                            : post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-stone-600 leading-relaxed line-clamp-2 mb-2">
                            {lang === 'en' && post.translations?.[0]?.excerpt
                              ? parseExcerpt(post.translations[0].excerpt)
                              : parseExcerpt(post.excerpt)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <time>
                            {new Date(post.publishedAt!).toLocaleDateString(dateLocale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                          <span>·</span>
                          <span>{tagsToArray(post.tags)[0] || t.article}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="text-center py-20 text-stone-500">
            {t.noPosts}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200" role="contentinfo">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {brandConfig.logo.image ? (
                  <Image
                    src={brandConfig.logo.image}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <span className="inline-block w-6 h-6 rounded-md bg-stone-900" aria-hidden />
                )}
                <h3 className="font-semibold text-sm">{brandConfig.logo.text}</h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                {siteConfig.description[lang]}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-stone-500 tracking-[0.2em] mb-3">EXPLORE</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link href={`/${locale}/about`} className="text-stone-600 hover:text-stone-900">{t.about}</Link></li>
                <li><Link href={`/${locale}/posts`} className="text-stone-600 hover:text-stone-900">{t.posts}</Link></li>
                <li><Link href={`/${locale}/archive`} className="text-stone-600 hover:text-stone-900">{t.archive}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-stone-500 tracking-[0.2em] mb-3">CATEGORIES</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link href={`/${locale}/posts?category=dev`} className="text-stone-600 hover:text-amber-700">{cat.dev.label}</Link></li>
                <li><Link href={`/${locale}/posts?category=sidehustle`} className="text-stone-600 hover:text-amber-700">{cat.side.label}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-stone-500 tracking-[0.2em] mb-3">MORE</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link href={`/${locale}/sitemap`} className="text-stone-600 hover:text-stone-900">{t.sitemap}</Link></li>
                <li><Link href={`/${locale}/privacy`} className="text-stone-600 hover:text-stone-900">{t.privacy}</Link></li>
                <li><Link href={`/${locale}/terms`} className="text-stone-600 hover:text-stone-900">{t.terms}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-100 pt-5 text-center text-xs text-stone-500">
            &copy; {new Date().getFullYear()} {brandConfig.copyright.holder}
          </div>
        </div>
      </footer>
    </div>
  )
}
