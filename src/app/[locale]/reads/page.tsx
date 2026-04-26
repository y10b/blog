import PageLayout from '@/components/PageLayout'

export default async function ReadsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  
  return (
    <PageLayout locale={locale} currentPath="/reads">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {lang === 'ko' ? '읽을거리' : 'Reads'}
      </h1>
      <p className="text-gray-600">
        {lang === 'ko' 
          ? '추천 읽을거리가 곧 추가될 예정입니다.'
          : 'Recommended reads coming soon.'}
      </p>
    </PageLayout>
  )
}