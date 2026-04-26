import PageLayout from '@/components/PageLayout'

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  
  return (
    <PageLayout locale={locale} currentPath="/podcast">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {lang === 'ko' ? '팟캐스트' : 'Podcast'}
      </h1>
      <p className="text-gray-600">
        {lang === 'ko' 
          ? '팟캐스트 콘텐츠가 곧 추가될 예정입니다.'
          : 'Podcast content coming soon.'}
      </p>
    </PageLayout>
  )
}