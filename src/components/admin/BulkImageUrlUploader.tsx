'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Post {
  id: string
  title: string
  coverImage: string | null
}

interface BulkImageUrlUploaderProps {
  onUploadComplete?: (results: any[]) => void
}

export function BulkImageUrlUploader({ onUploadComplete }: BulkImageUrlUploaderProps) {
  const [imageUrls, setImageUrls] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const handleSubmit = async () => {
    if (!imageUrls.trim()) {
      alert('이미지 URL을 입력해주세요.')
      return
    }

    setIsUploading(true)
    setProgress(0)
    setResults([])

    try {
      // URL들을 줄바꿈으로 분리
      const urls = imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      if (urls.length === 0) {
        alert('유효한 URL이 없습니다.')
        return
      }

      // 발행일 순으로 정렬된 게시물 가져오기
      const postsResponse = await fetch('/api/admin/posts?orderBy=publishedAt&order=asc')
      const posts: Post[] = await postsResponse.json()

      const uploadResults = []
      const totalUrls = Math.min(urls.length, posts.length)

      for (let i = 0; i < totalUrls; i++) {
        const url = urls[i]
        const post = posts[i]
        
        try {
          // 게시물 업데이트
          const updateResponse = await fetch(`/api/posts/${post.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverImage: url })
          })

          if (updateResponse.ok) {
            uploadResults.push({
              postId: post.id,
              postTitle: post.title,
              imageUrl: url,
              order: i + 1,
              success: true
            })
          } else {
            throw new Error('게시물 업데이트 실패')
          }
        } catch (error) {
          uploadResults.push({
            postId: post.id,
            postTitle: post.title,
            imageUrl: url,
            order: i + 1,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          })
        }

        // 진행률 업데이트
        setProgress(Math.round(((i + 1) / totalUrls) * 100))
      }

      setResults(uploadResults)
      trackEvent('bulk_image_url_upload_complete', 'admin', `${uploadResults.filter(r => r.success).length}/${totalUrls} success`)
      
      if (onUploadComplete) {
        onUploadComplete(uploadResults)
      }

      // 성공한 업로드 개수 알림
      const successCount = uploadResults.filter(r => r.success).length
      alert(`${successCount}/${totalUrls}개 이미지 URL 업데이트 완료!`)

    } catch (error) {
      console.error('Bulk URL upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">대량 이미지 URL 업로드</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지 URL 입력 (한 줄에 하나씩)
        </label>
        <textarea
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg
..."
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isUploading}
        />
        <p className="mt-2 text-sm text-gray-500">
          * 첫 번째 URL은 가장 오래된 게시물에, 순서대로 매칭됩니다.
        </p>
      </div>

      {/* 업로드 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isUploading || !imageUrls.trim()}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          isUploading || !imageUrls.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isUploading ? '업로드 중...' : '일괄 업로드 시작'}
      </button>

      {/* 진행률 표시 */}
      {isUploading && (
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  진행중
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div 
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">업로드 결과</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-md text-sm ${
                  result.success 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {result.order}. {result.postTitle}
                  </span>
                  <span className="font-medium">
                    {result.success ? '✅ 성공' : `❌ 실패: ${result.error}`}
                  </span>
                </div>
                {result.success && (
                  <div className="mt-1 text-xs text-gray-600 truncate">
                    URL: {result.imageUrl}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}