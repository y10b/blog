'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tagsToArray } from '@/lib/utils/tags'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  url: string
  duration?: string
  isShort?: boolean
  isPosted?: boolean
  postDetails?: {
    id: string
    slug: string
    status: string
  } | null
}

interface VideoResponse {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

type FilterType = 'all' | 'shorts' | 'regular'
type PostedFilter = 'all' | 'posted' | 'not-posted'

export default function YouTubeManagerPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()

  // Filters
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [postedFilter, setPostedFilter] = useState<PostedFilter>('all')

  // Bulk selection
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [isBulkCreating, setIsBulkCreating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })

  const fetchVideos = async (pageToken?: string) => {
    if (!pageToken) {
      setLoading(true)
      setVideos([])
    } else {
      setLoadingMore(true)
    }
    
    setError('')
    
    try {
      const url = new URL('/api/youtube/videos', window.location.origin)
      url.searchParams.set('limit', '50')
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken)
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data: VideoResponse = await response.json()
      console.log('YouTube videos response:', data)
      console.log('Sample video with post details:', data.videos.find(v => v.isPosted))
      
      if (pageToken) {
        setVideos(prev => [...prev, ...data.videos])
      } else {
        setVideos(data.videos)
      }
      
      setNextPageToken(data.nextPageToken)
    } catch (err) {
      setError('YouTube API 키를 설정해주세요. YOUTUBE_API_SETUP.md 파일을 확인하세요.')
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const notPostedVideos = filteredVideos.filter(v => !v.isPosted)
    setSelectedVideos(new Set(notPostedVideos.map(v => v.id)))
  }

  const clearSelection = () => {
    setSelectedVideos(new Set())
  }

  const createBulkPosts = async () => {
    const videosToCreate = videos.filter(v => selectedVideos.has(v.id))
    if (videosToCreate.length === 0) return

    setIsBulkCreating(true)
    setBulkProgress({ current: 0, total: videosToCreate.length })

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (let i = 0; i < videosToCreate.length; i++) {
      const video = videosToCreate[i]
      setBulkProgress({ current: i + 1, total: videosToCreate.length })

      try {
        await createPostFromVideoInternal(video)
        results.success++

        // Update UI immediately
        setVideos(prev =>
          prev.map(v => v.id === video.id ? { ...v, isPosted: true } : v)
        )

        // Remove from selection
        setSelectedVideos(prev => {
          const newSet = new Set(prev)
          newSet.delete(video.id)
          return newSet
        })
      } catch (error) {
        results.failed++
        results.errors.push(`${video.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Small delay between requests to avoid rate limiting
      if (i < videosToCreate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setIsBulkCreating(false)
    setBulkProgress({ current: 0, total: 0 })

    // Show results
    let message = `완료!\n성공: ${results.success}개\n실패: ${results.failed}개`
    if (results.errors.length > 0) {
      message += `\n\n실패한 항목:\n${results.errors.slice(0, 5).join('\n')}`
      if (results.errors.length > 5) {
        message += `\n...외 ${results.errors.length - 5}개`
      }
    }
    alert(message)
    router.refresh()
  }

  const createPostFromVideoInternal = async (video: YouTubeVideo) => {
    // YouTube 설명에서 콘텐츠 추출
    const lines = video.description.split('\n').filter((line: string) => line.trim())
    const rawExcerpt = lines.slice(0, 3).join(' ')
    const excerpt = rawExcerpt.length > 500 ? rawExcerpt.substring(0, 497) + '...' : rawExcerpt

    const hashtags = (video.description.match(/#\w+/g) || []).map((tag: string) => tag.slice(1)).slice(0, 5)
    const content = video.description

    const postContent = `## ${video.title}

${content}

`

    const timestamp = Date.now()
    // Convert to lowercase and replace underscores with hyphens for valid slug
    const sanitizedVideoId = video.id.toLowerCase().replace(/_/g, '-')
    const uniqueSlug = `yt-${sanitizedVideoId}-${timestamp}`

    const tags = hashtags.length > 0 ? hashtags : ['youtube', 'video']

    const coverImage = video.thumbnailUrl?.startsWith('http')
      ? video.thumbnailUrl
      : `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`

    const postData = {
      title: video.title,
      slug: uniqueSlug,
      content: postContent,
      excerpt: excerpt || video.title.substring(0, 200),
      coverImage,
      youtubeVideoId: video.id,
      tags,
      publishedAt: new Date().toISOString(),
    }

    // Debug logging
    console.log('=== POST DATA DEBUG ===')
    console.log('Video:', { id: video.id, title: video.title })
    console.log('Post Data:', postData)
    console.log('Validation:', {
      titleLength: postData.title.length,
      slugValid: /^[a-z0-9-]+$/.test(postData.slug),
      excerptLength: postData.excerpt?.length || 0,
      tagsCount: tagsToArray(postData.tags).length,
      coverImageIsUrl: postData.coverImage.startsWith('http'),
      youtubeIdValid: /^[a-zA-Z0-9_-]{11}$/.test(postData.youtubeVideoId),
    })

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== ERROR RESPONSE ===')
      console.error('Status:', response.status)
      console.error('Response:', errorText)

      let errorMessage = 'Failed to create post'
      try {
        const errorData = JSON.parse(errorText)
        console.error('Parsed error:', errorData)
        errorMessage = errorData.error || errorData.message || errorText
      } catch (e) {
        errorMessage = errorText
      }
      throw new Error(errorMessage)
    }
  }

  const createPostFromVideo = async (video: YouTubeVideo) => {
    setIsCreating(true)

    try {
      await createPostFromVideoInternal(video)

      setVideos(prevVideos =>
        prevVideos.map(v =>
          v.id === video.id
            ? { ...v, isPosted: true }
            : v
        )
      )

      router.refresh()
    } catch (err) {
      console.error('Error creating post:', err)
      alert(`포스트 생성 실패:\n${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
      setSelectedVideo(null)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Apply filters
  const filteredVideos = videos.filter(video => {
    // Type filter
    if (filterType === 'shorts' && !video.isShort) return false
    if (filterType === 'regular' && video.isShort) return false
    
    // Posted filter
    if (postedFilter === 'posted' && !video.isPosted) return false
    if (postedFilter === 'not-posted' && video.isPosted) return false
    
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">YouTube 동영상 관리</h1>
        <button
          onClick={() => fetchVideos()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로딩중...' : '새로고침'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 타입</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="shorts">쇼츠 (2분 미만)</option>
              <option value="regular">일반 영상</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">포스트 상태</label>
            <select
              value={postedFilter}
              onChange={(e) => setPostedFilter(e.target.value as PostedFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="posted">포스트 작성됨</option>
              <option value="not-posted">포스트 미작성</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          총 {videos.length}개 영상 중 {filteredVideos.length}개 표시 중
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Bulk Actions */}
      {filteredVideos.filter(v => !v.isPosted).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
              >
                전체 선택 ({filteredVideos.filter(v => !v.isPosted).length}개)
              </button>
              {selectedVideos.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  선택 해제
                </button>
              )}
              <span className="text-sm text-gray-600">
                {selectedVideos.size}개 선택됨
              </span>
            </div>

            {selectedVideos.size > 0 && (
              <button
                onClick={createBulkPosts}
                disabled={isBulkCreating}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isBulkCreating
                  ? `생성 중... (${bulkProgress.current}/${bulkProgress.total})`
                  : `선택한 항목 포스트 생성 (${selectedVideos.size}개)`
                }
              </button>
            )}
          </div>
        </div>
      )}

      {loading && !videos.length ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                <div className="relative aspect-video bg-gray-100">
                  {/* Checkbox for bulk selection */}
                  {!video.isPosted && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(video.id)}
                        onChange={() => toggleVideoSelection(video.id)}
                        className="w-5 h-5 cursor-pointer accent-green-600 bg-white rounded border-2 border-gray-300"
                      />
                    </div>
                  )}

                  {/* 기본 YouTube 썸네일 URL 사용 */}
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.log('Thumbnail load error for:', video.id, e.currentTarget.src);
                      const target = e.currentTarget;
                      // hqdefault가 실패하면 mqdefault로 폴백
                      if (target.src.includes('hqdefault')) {
                        target.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
                      } else if (target.src.includes('mqdefault')) {
                        // mqdefault도 실패하면 default로 폴백
                        target.src = `https://img.youtube.com/vi/${video.id}/default.jpg`;
                      }
                    }}
                  />
                  {video.isShort && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                      SHORTS
                    </div>
                  )}
                  {video.isPosted && (
                    <div className="absolute bottom-2 left-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-semibold">
                      포스트 작성됨
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                    {video.duration && (
                      <>
                        <span>•</span>
                        <span className={video.isShort ? 'text-purple-600 font-semibold' : ''}>
                          {video.isShort ? 'Shorts' : 'Video'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!video.isPosted ? (
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        포스트 생성
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('Post details:', video.postDetails);
                          if (video.postDetails?.id) {
                            router.push(`/admin/edit/${video.postDetails.id}`);
                          } else {
                            alert('포스트 ID를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        포스트 편집
                      </button>
                    )}
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      보기
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {nextPageToken && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchVideos(nextPageToken)}
                disabled={loadingMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    로딩중...
                  </>
                ) : (
                  '더 보기'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* 포스트 생성 확인 모달 */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">포스트 생성 확인</h2>
            <p className="mb-6">
              "{selectedVideo.title}" 동영상으로 블로그 포스트를 생성하시겠습니까?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={isCreating}
              >
                취소
              </button>
              <button
                onClick={() => createPostFromVideo(selectedVideo)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isCreating}
              >
                {isCreating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}