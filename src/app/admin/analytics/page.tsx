import { Metadata } from 'next'
import Link from 'next/link'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | n잡러 프리랜서 Admin',
  description: 'View blog post analytics and performance metrics',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            <nav className="flex gap-4">
              <Link 
                href="/admin/posts" 
                className="text-gray-600 hover:text-gray-900"
              >
                Posts
              </Link>
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900"
                target="_blank"
              >
                View Site ↗
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </main>
    </div>
  )
}