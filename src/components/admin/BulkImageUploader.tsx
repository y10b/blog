'use client'

import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '@/components/GoogleAnalytics'
import { uploadWithRetry, validateImageFile } from '@/lib/upload-utils'

interface BulkImageUploaderProps {
  onUploadComplete?: (results: UploadResult[]) => void
}

interface UploadResult {
  postId: string
  postTitle: string
  imageUrl: string
  order: number
  success: boolean
  error?: string
}

interface UploadProgress {
  current: number
  total: number
  currentFile: string
}

// 이미지 미리보기 컴포넌트 - 메모리 누수 방지
function ImagePreview({ image, alt, className }: { image: File; alt: string; className: string }) {
  const [imageUrl, setImageUrl] = useState<string>('')
  
  useEffect(() => {
    const url = URL.createObjectURL(image)
    setImageUrl(url)
    
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [image])
  
  return <img src={imageUrl} alt={alt} className={className} />
}

export function BulkImageUploader({ onUploadComplete }: BulkImageUploaderProps) {
  const [images, setImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<UploadResult[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  // 드래그앤드롭 처리
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  // 파일 처리 및 정렬
  const processFiles = (files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })
    
    if (errors.length > 0) {
      alert(errors.join('\n'))
    }
    
    const sortedFiles = validFiles.sort((a, b) => {
      // 파일명에서 숫자 추출 (1.png, 2.png, 10.png 등)
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0')
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0')
      return numA - numB
    })
    
    setImages(prev => [...prev, ...sortedFiles])
    trackEvent('bulk_image_select', 'admin', `${sortedFiles.length} images`)
  }

  // 일괄 업로드 처리
  const handleBulkUpload = async () => {
    if (images.length === 0) {
      alert('이미지를 선택해주세요.')
      return
    }

    setIsUploading(true)
    setProgress(0)
    setResults([])

    try {
      // 1. 발행일 순으로 게시물 목록 가져오기
      const postsResponse = await fetch('/api/admin/posts?orderBy=createdAt&order=asc')
      const allPosts = await postsResponse.json()
      
      // 커버 이미지가 없는 게시물만 필터링
      const posts = allPosts.filter((post: any) => !post.coverImage)
      
      console.log(`커버 이미지가 없는 게시물: ${posts.length}개`)

      if (!posts || posts.length === 0) {
        alert('커버 이미지가 없는 게시물이 없습니다.')
        return
      }

      const uploadResults: UploadResult[] = []
      const totalImages = Math.min(images.length, posts.length)

      // 2. 각 이미지를 순서대로 업로드
      for (let i = 0; i < totalImages; i++) {
        const image = images[i]
        const post = posts[i]
        
        try {
          // FormData 생성
          const formData = new FormData()
          formData.append('image', image)
          formData.append('postId', post.id)

          // 이미지 업로드 with retry
          const uploadResponse = await uploadWithRetry(async () => {
            return await fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData
            })
          })

          if (uploadResponse.ok) {
            const { imageUrl } = await uploadResponse.json()
            
            // 게시물 업데이트 - admin API 사용
            const updateResponse = await fetch(`/api/admin/posts/${post.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coverImage: imageUrl })
            })

            if (updateResponse.ok) {
              uploadResults.push({
                postId: post.id,
                postTitle: post.title,
                imageUrl,
                order: i + 1,
                success: true
              })
            } else {
              const errorData = await updateResponse.json().catch(() => ({}))
              throw new Error(errorData.error || '게시물 업데이트 실패')
            }
          } else {
            const errorData = await uploadResponse.json().catch(() => ({}))
            throw new Error(errorData.error || '이미지 업로드 실패')
          }
        } catch (error) {
          uploadResults.push({
            postId: post.id,
            postTitle: post.title,
            imageUrl: '',
            order: i + 1,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          })
        }

        // 진행률 업데이트
        setProgress(Math.round(((i + 1) / totalImages) * 100))
        setUploadProgress({
          current: i + 1,
          total: totalImages,
          currentFile: image.name
        })
      }

      setResults(uploadResults)
      trackEvent('bulk_image_upload_complete', 'admin', `${uploadResults.filter(r => r.success).length}/${totalImages} success`)
      
      if (onUploadComplete) {
        onUploadComplete(uploadResults)
      }

      // 성공한 업로드 개수 알림
      const successCount = uploadResults.filter(r => r.success).length
      alert(`${successCount}/${totalImages}개 이미지 업로드 완료!`)

    } catch (error) {
      console.error('Bulk upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 전체 초기화
  const clearAll = () => {
    setImages([])
    setResults([])
    setProgress(0)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">대량 이미지 업로드</h2>
      
      {/* 드래그앤드롭 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          이미지를 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-gray-500 mt-1">
          파일명 숫자 순서대로 자동 정렬됩니다 (1.png, 2.png...)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 선택된 이미지 목록 */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">선택된 이미지 ({images.length}개)</h3>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              전체 삭제
            </button>
          </div>
          
          <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <ImagePreview
                  image={image}
                  alt={image.name}
                  className="w-full h-24 object-cover rounded"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <button
                    onClick={() => removeImage(index)}
                    className="text-white bg-red-600 rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs px-1 rounded-br">
                  {index + 1}
                </div>
                <div className="text-xs text-center truncate mt-1">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 버튼 및 진행률 */}
      {images.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleBulkUpload}
            disabled={isUploading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUploading ? '업로드 중...' : '일괄 업로드 시작'}
          </button>

          {/* 진행률 표시 */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {uploadProgress && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>현재 업로드 중: {uploadProgress.currentFile}</p>
                  <p>{uploadProgress.current} / {uploadProgress.total} 완료</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 업로드 결과 */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">업로드 결과</h3>
          <div className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded mb-1 ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex-1">
                  <span className="font-mono text-sm mr-2">{result.order}.</span>
                  <span className="text-sm">{result.postTitle}</span>
                </div>
                <div className="text-sm">
                  {result.success ? (
                    <span className="text-green-600">✓ 성공</span>
                  ) : (
                    <span className="text-red-600">✗ {result.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">사용 방법</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. 피그마에서 이미지를 1.png, 2.png... 순서로 저장</li>
          <li>2. 모든 이미지를 한번에 드래그앤드롭 또는 선택</li>
          <li>3. 자동으로 발행일 순서대로 매칭되어 업로드</li>
          <li>4. 게시물 수보다 이미지가 많으면 초과분은 무시됨</li>
        </ol>
      </div>
    </div>
  )
}