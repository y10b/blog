import Link from 'next/link'
import { siteConfig } from '@/config'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-3xl font-bold text-gray-900">
              {siteConfig.shortName}
            </Link>
            <nav>
              <Link href="/about" className="text-gray-900 hover:text-gray-600 ml-6">소개</Link>
              <Link href="/posts" className="text-gray-600 hover:text-gray-900 ml-6">글 목록</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">소개</h1>

        <div className="prose prose-lg">
          <p>
            <strong>개발자 프리랜서가 운영하는 블로그</strong>입니다.
            한 가지 주제로 좁히지 않고, 일하며 배우고 시도해본 것들을 다양한 카테고리로 기록합니다.
          </p>

          <p>
            지금은 풀스택 개발 1년차에서 초기 스타트업의 AI 모델 개발자로 넘어가는 전환기.
            풀스택 시기엔 자사 서비스에 LLM을 붙여본 경험이 있고, 현재는 이미지 생성 모델(FLUX LoRA)을 학습·운영합니다.
            스택은 Next.js / Node.js / Python / AWS / GCP / PyTorch / Diffusers 정도.
          </p>

          <h2>다루는 카테고리</h2>
          <ul>
            <li>
              <strong>개발 / AI</strong> — AI 모델 학습기(FLUX LoRA, 얼굴 인상 분석 MLP), <strong>상품·서비스 개발기</strong>(빌드 비하인드, 아키텍처 결정),
              풀스택→AI 전환, 초기 스타트업에서 한 사람이 학습·서빙·프론트를 다 할 때의 의사결정.
            </li>
            <li>
              <strong>N잡 / 도구 / 정책</strong> — 1인 운영자의 <strong>워크플로 자동화</strong>(블로그 RAG, Zapier·n8n, AI 콘텐츠 파이프라인),
              <strong>프리랜서·N잡 정책 정보</strong>(지원금·세금·계약), AI/생산성 도구 소개·후기, 사이드 프로젝트 수익화.
            </li>
          </ul>

          <h2>글의 톤</h2>
          <p>
            성공보다 <strong>삽질·실패·우회</strong>를 더 자세히 적습니다.
            추상적인 조언 대신 숫자(F1, MAE, step, 시간, 비용)를 우선하고, 안 써본 도구는 후기를 쓰지 않습니다.
          </p>

          <h2>운영 정보</h2>
          <p>
            글의 일부는 자동 생성 후 사람이 검토해 발행합니다. 출처가 분명한 일화·수치만 사용합니다.
          </p>
        </div>
      </main>

      <footer className="bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} {siteConfig.shortName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
