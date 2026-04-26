import PageLayout from '@/components/PageLayout'

export default async function HowIAIPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  
  return (
    <PageLayout locale={locale} currentPath="/how-i-ai">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {lang === 'ko' ? '내가 AI를 쓰는 법' : 'How I AI'}
      </h1>
      <p className="text-gray-600">
        {lang === 'ko' 
          ? 'AI 활용 방법에 대한 콘텐츠가 곧 추가될 예정입니다.'
          : 'Content about how I use AI coming soon.'}
      </p>
    </PageLayout>
  )
}