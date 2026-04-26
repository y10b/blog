import PageLayout from '@/components/PageLayout'
import { Metadata } from 'next'
import { siteConfig } from '@/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isKorean = locale === 'ko'

  return {
    title: isKorean ? `추천 | ${siteConfig.shortName}` : `Recommendations | ${siteConfig.shortName}`,
    description: isKorean
      ? '유용한 도구, 서비스, 리소스 추천'
      : 'Useful tools, services, and resource recommendations',
    openGraph: {
      title: isKorean ? `추천 | ${siteConfig.shortName}` : `Recommendations | ${siteConfig.shortName}`,
      description: isKorean
        ? '유용한 도구, 서비스, 리소스 추천'
        : 'Useful tools, services, and resource recommendations',
      type: 'website',
    },
  }
}

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'ko'

  return (
    <PageLayout locale={locale} currentPath="/recommendations">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {lang === 'ko' ? '추천' : 'Recommendations'}
        </h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {lang === 'ko' ? '개발 도구' : 'Development Tools'}
            </h2>
            <ul className="space-y-3">
              <li>
                <strong>Claude Code</strong> - {lang === 'ko' ? 'AI 기반 코딩 어시스턴트' : 'AI-powered coding assistant'}
              </li>
              <li>
                <strong>Vercel</strong> - {lang === 'ko' ? '웹 애플리케이션 배포 플랫폼' : 'Web application deployment platform'}
              </li>
              <li>
                <strong>Next.js</strong> - {lang === 'ko' ? 'React 기반 풀스택 프레임워크' : 'React-based full-stack framework'}
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {lang === 'ko' ? 'AI 도구' : 'AI Tools'}
            </h2>
            <ul className="space-y-3">
              <li>
                <strong>Claude</strong> - {lang === 'ko' ? '범용 AI 어시스턴트' : 'General-purpose AI assistant'}
              </li>
              <li>
                <strong>Gemini</strong> - {lang === 'ko' ? 'Google의 AI 모델' : 'Google\'s AI model'}
              </li>
              <li>
                <strong>ChatGPT</strong> - {lang === 'ko' ? 'OpenAI의 대화형 AI' : 'OpenAI\'s conversational AI'}
              </li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {lang === 'ko' ? '학습 리소스' : 'Learning Resources'}
            </h2>
            <ul className="space-y-3">
              <li>
                <strong>MDN Web Docs</strong> - {lang === 'ko' ? '웹 개발 참고 자료' : 'Web development reference'}
              </li>
              <li>
                <strong>TypeScript Handbook</strong> - {lang === 'ko' ? 'TypeScript 공식 문서' : 'Official TypeScript documentation'}
              </li>
              <li>
                <strong>React Documentation</strong> - {lang === 'ko' ? 'React 공식 가이드' : 'Official React guide'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}