import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MarkdownCopyClient from './MarkdownCopyClient'

// /admin 하위라 미들웨어 Basic Auth 자동 적용 — 운영자만 접근 가능
export const dynamic = 'force-dynamic'

export default async function MarkdownViewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      translations: true,
    },
  })

  if (!post) notFound()

  const koTranslation = post.translations?.find(t => t.locale === 'ko')
  const enTranslation = post.translations?.find(t => t.locale === 'en')
  const koContent = koTranslation?.content ?? post.content
  const koTitle = koTranslation?.title ?? post.title
  const enContent = enTranslation?.content
  const enTitle = enTranslation?.title

  // 커버 이미지를 마크다운 맨 앞에 ![alt](url) 형태로 prepend → 티스토리 등에 붙여넣을 때 이미지도 같이 들어간다
  const koCover = post.coverImage
  const enCover = enTranslation?.coverImage ?? post.coverImage
  const koCoverMd = koCover ? `![${koTitle}](${koCover})\n\n` : ''
  const enCoverMd = enCover ? `![${enTitle ?? koTitle}](${enCover})\n\n` : ''

  const koMd = `# ${koTitle}\n\n${koCoverMd}${koContent}`
  const enMd = enContent ? `# ${enTitle}\n\n${enCoverMd}${enContent}` : null

  const tistoryUrl = (post.tags?.split(',')[0] || '').trim() === 'sidehustle'
    ? 'https://nzapper-freelancer.tistory.com'
    : 'https://devlatetrain.tistory.com'

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900">
              ← 어드민
            </Link>
            <span className="text-stone-300">/</span>
            <h1 className="text-base font-semibold tracking-tight">마크다운 보기</h1>
          </div>
          <Link
            href={`/admin/edit/${post.id}`}
            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
          >
            글 편집 →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-sm text-stone-500">slug: <code className="bg-stone-100 px-1.5 py-0.5 rounded">{post.slug}</code></p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {post.tags.split(',').filter(Boolean).map((tag, i) => {
                  const t = tag.trim()
                  const isCategory = i === 0 && (t === 'dev' || t === 'sidehustle')
                  return (
                    <span
                      key={t}
                      className={
                        isCategory
                          ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'
                          : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600'
                      }
                    >
                      {t}
                    </span>
                  )
                })}
              </div>
            </div>
            <a
              href={tistoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 whitespace-nowrap"
            >
              티스토리 열기 ↗
            </a>
          </div>
        </div>

        <MarkdownCopyClient
          koMd={koMd}
          enMd={enMd}
          koCover={koCover}
          enCover={enCover}
        />
      </main>
    </div>
  )
}
