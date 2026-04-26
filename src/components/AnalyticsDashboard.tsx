'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AnalyticsData {
  summary: {
    totalViews: number
    totalPosts: number
    avgViewsPerPost: number
    period: string
  }
  topPosts: Array<{
    id: string
    title: string
    slug: string
    views: number
    publishedAt: string
  }>
  topTags: Array<{
    tag: string
    views: number
  }>
  monthlyData: Array<{
    month: string
    count: number
    views: number
  }>
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/posts?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading analytics: {error}
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="24hours">Last 24 Hours</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Views
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.summary.totalViews.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Posts
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.summary.totalPosts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Avg Views/Post
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.summary.avgViewsPerPost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Monthly Trend */}
      {data.monthlyData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Trend</h2>
          <div className="space-y-3">
            {data.monthlyData.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{month.count} posts</span>
                  <span className="font-medium">{month.views.toLocaleString()} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Posts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Posts</h2>
        <div className="space-y-3">
          {data.topPosts.map((post, index) => (
            <div key={post.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-8">
                  #{index + 1}
                </span>
                <Link 
                  href={`/posts/${post.slug}`}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                >
                  {post.title}
                </Link>
              </div>
              <span className="font-medium text-gray-900">
                {post.views.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Tags</h2>
        <div className="flex flex-wrap gap-3">
          {data.topTags.map((tagData) => (
            <div
              key={tagData.tag}
              className="bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2"
            >
              <span className="font-medium">{tagData.tag}</span>
              <span className="text-sm text-gray-600">
                {tagData.views.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}