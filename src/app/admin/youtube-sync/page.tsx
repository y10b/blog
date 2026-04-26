'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function YouTubeSyncPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testYouTubeSync = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-youtube-sync')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">YouTube 자동 동기화</h1>
              <Link
                href="/admin"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ← 관리자 홈으로
              </Link>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 설명 섹션 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                YouTube 자동 포스팅 기능
              </h2>
              <p className="text-blue-700 mb-3">
                이 기능은 YouTube 채널의 새 영상을 자동으로 블로그 포스트로 변환합니다.
              </p>
              <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                <li>매일 정오(12:00)에 자동 실행</li>
                <li>최근 24시간 내 업로드된 영상 확인</li>
                <li>AI를 활용한 블로그 콘텐츠 생성</li>
                <li>중복 포스팅 자동 방지</li>
              </ul>
            </div>

            {/* 수동 실행 버튼 */}
            <div className="flex items-center gap-4">
              <button
                onClick={testYouTubeSync}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    동기화 중...
                  </>
                ) : (
                  '지금 동기화 실행'
                )}
              </button>
              
              <span className="text-sm text-gray-500">
                수동으로 YouTube 영상 동기화를 실행합니다.
              </span>
            </div>

            {/* 에러 표시 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-semibold">오류 발생:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* 결과 표시 */}
            {result && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  동기화 결과
                </h3>
                
                {/* 요약 정보 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-500">전체 영상</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.result?.summary?.total || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-500">성공</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.result?.summary?.success || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-500">건너뜀</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {result.result?.summary?.skipped || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-500">오류</p>
                    <p className="text-2xl font-bold text-red-600">
                      {result.result?.summary?.error || 0}
                    </p>
                  </div>
                </div>

                {/* 상세 결과 */}
                {result.result?.results && result.result.results.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">상세 내역:</h4>
                    <div className="space-y-2">
                      {result.result.results.map((item: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            item.status === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : item.status === 'skipped'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {item.title || `Video ID: ${item.videoId}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                상태: {item.status === 'success' ? '성공' : 
                                      item.status === 'skipped' ? '건너뜀' : '오류'}
                                {item.reason && ` - ${item.reason}`}
                              </p>
                            </div>
                            {item.status === 'success' && item.slug && (
                              <Link
                                href={`/posts/${item.slug}`}
                                target="_blank"
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                              >
                                포스트 보기 →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 타임스탬프 */}
                <p className="text-sm text-gray-500 mt-4">
                  실행 시간: {new Date(result.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
            )}

            {/* 환경 변수 확인 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                환경 변수 설정 확인
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                YouTube 자동 동기화가 작동하려면 다음 환경 변수가 설정되어야 합니다:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">YOUTUBE_API_KEY</code>
                  <span className="text-gray-500">YouTube Data API v3 키</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">YOUTUBE_CHANNEL_ID</code>
                  <span className="text-gray-500">동기화할 YouTube 채널 ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">GEMINI_API_KEY</code>
                  <span className="text-gray-500">AI 콘텐츠 생성용 (선택사항)</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">CRON_SECRET</code>
                  <span className="text-gray-500">Cron 작업 인증용</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">REDEPLOY_WEBHOOK_URL</code>
                  <span className="text-gray-500">자동 재배포용 (선택사항)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}