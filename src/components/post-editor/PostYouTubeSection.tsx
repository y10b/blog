'use client'

import { useState, useEffect } from 'react'
import { PostFormData, YouTubeVideo } from '@/types'
import { extractYouTubeVideoId } from '@/components/YouTubeEmbed'
import { getYouTubeThumbnailUrl } from '@/lib/youtube-thumbnail'

interface PostYouTubeSectionProps {
  formData: PostFormData
  onChange: (data: Partial<PostFormData>) => void
}

export function PostYouTubeSection({ formData, onChange }: PostYouTubeSectionProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)

  useEffect(() => {
    // 기존 YouTube ID가 있으면 URL 생성
    if (formData.youtubeVideoId) {
      setYoutubeUrl(`https://www.youtube.com/watch?v=${formData.youtubeVideoId}`)
    }
  }, [formData.youtubeVideoId])

  const fetchYouTubeVideos = async () => {
    setLoadingVideos(true)
    try {
      const response = await fetch('/api/youtube/videos?limit=10')
      if (!response.ok) throw new Error('Failed to fetch videos')
      const videos = await response.json()
      setYoutubeVideos(videos)
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      setYoutubeVideos([])
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setYoutubeUrl(url)
    const videoId = extractYouTubeVideoId(url)
    
    if (videoId) {
      // YouTube 썸네일을 coverImage로 자동 설정
      if (!formData.coverImage || formData.coverImage.includes('ytimg.com')) {
        // Use high quality thumbnail
        const thumbnailUrl = getYouTubeThumbnailUrl(videoId, 'maxresdefault')
        onChange({ 
          youtubeVideoId: videoId,
          coverImage: thumbnailUrl 
        })
      } else {
        onChange({ youtubeVideoId: videoId })
      }
    }
  }

  const selectYouTubeVideo = (video: YouTubeVideo) => {
    setYoutubeUrl(video.url)
    onChange({
      youtubeVideoId: video.id,
      coverImage: video.thumbnailUrl,
      title: formData.title || video.title,
      excerpt: formData.excerpt || video.description.substring(0, 200)
    })
    setShowYouTubeModal(false)
  }

  return (
    <>
      <div>
        <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
          YouTube Video
        </label>
        <div className="mt-1 space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              id="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setShowYouTubeModal(true)
                fetchYouTubeVideos()
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              내 비디오
            </button>
          </div>
          
          {formData.youtubeVideoId && (
            <div className="text-sm text-gray-600">
              Video ID: {formData.youtubeVideoId}
              <button
                type="button"
                onClick={() => {
                  onChange({ youtubeVideoId: '' })
                  setYoutubeUrl('')
                }}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* YouTube 비디오 선택 모달 */}
      {showYouTubeModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">내 YouTube 비디오 선택</h3>
                <button
                  onClick={() => setShowYouTubeModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] p-6">
              {loadingVideos ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-sm text-gray-500">비디오를 가져오는 중...</p>
                </div>
              ) : youtubeVideos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">비디오를 찾을 수 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {youtubeVideos.map((video) => (
                    <div
                      key={video.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectYouTubeVideo(video)}
                    >
                      <div className="aspect-w-16 aspect-h-9 mb-3">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}