import PageLayout from '@/components/PageLayout'

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'
  
  return (
    <PageLayout locale={locale} currentPath="/community">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {lang === 'ko' ? '커뮤니티' : 'Community'}
      </h1>
      <p className="text-gray-600">
        {lang === 'ko' 
          ? '커뮤니티 기능이 곧 추가될 예정입니다.'
          : 'Community features coming soon.'}
      </p>
    </PageLayout>
  )
}