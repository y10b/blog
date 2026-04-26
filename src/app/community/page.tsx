import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig, brandConfig } from '@/config'

export const metadata: Metadata = {
  title: `Community - ${siteConfig.shortName}`,
  description: 'Join our community',
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-3xl font-bold text-gray-900">
              {brandConfig.logo.text}
            </Link>
            <nav>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 ml-6">소개</Link>
              <Link href="/posts" className="text-gray-600 hover:text-gray-900 ml-6">글 목록</Link>
              <Link href="/archive" className="text-gray-600 hover:text-gray-900 ml-6">아카이브</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Community</h1>
        <p className="text-xl text-gray-600 mb-8">Coming soon...</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
          ← 홈으로
        </Link>
      </main>
    </div>
  )
}
