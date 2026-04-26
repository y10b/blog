'use client'

import dynamic from 'next/dynamic'
import { useState, Fragment } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import { extractYouTubeVideoId } from '@/components/YouTubeEmbed'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface PostEditorProps {
  initialData?: {
    title: string
    slug: string
    content: string
    excerpt?: string
    coverImage?: string
    tags?: string[]
    seoTitle?: string
    seoDescription?: string
    publishedAt?: string | null
    youtubeVideoId?: string
  }
  onSubmit: (data: {
    title: string
    slug: string
    content: string
    excerpt: string
    coverImage: string
    tags: string[]
    seoTitle: string
    seoDescription: string
    publishedAt: string | null
    youtubeVideoId: string | null
  }) => Promise<void>
  isEdit?: boolean
}

export default function PostEditor({ initialData, onSubmit, isEdit = false }: PostEditorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    coverImage: initialData?.coverImage || '',
    tags: initialData?.tags?.join(', ') || '',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    publishedAt: initialData?.publishedAt || null,
    youtubeVideoId: initialData?.youtubeVideoId || '',
  })
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKeywords, setAiKeywords] = useState('')
  const [affiliateProducts, setAffiliateProducts] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        youtubeVideoId: formData.youtubeVideoId || null,
      })
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setFormData({ ...formData, slug })
  }

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

  const selectYouTubeVideo = (video: any) => {
    setYoutubeUrl(video.url)
    setFormData(prev => ({
      ...prev,
      youtubeVideoId: video.id,
      coverImage: video.thumbnailUrl,
      title: prev.title || video.title,
      excerpt: prev.excerpt || video.description.substring(0, 200)
    }))
    setShowYouTubeModal(false)
  }

  const generateWithAI = async () => {
    if (!aiPrompt) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          keywords: aiKeywords.split(',').map(k => k.trim()).filter(Boolean),
          affiliateProducts: affiliateProducts.split(',').map(p => p.trim()).filter(Boolean)
        }),
      })
      
      const data = await response.json()
      
      // Handle structured response
      if (data.title) {
        setFormData({
          ...formData,
          title: data.title || formData.title,
          slug: data.slug || formData.slug,
          content: data.content || '',
          excerpt: data.excerpt || formData.excerpt,
          tags: data.tags?.join(', ') || formData.tags,
          seoTitle: data.seoTitle || data.title || formData.seoTitle,
          seoDescription: data.seoDescription || data.excerpt || formData.seoDescription,
        })
      } else if (data.content) {
        setFormData({ ...formData, content: data.content })
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={generateSlug}
            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
          >
            Generate
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
          Cover Image
        </label>
        <div className="mt-1 space-y-2">
          <input
            type="url"
            id="coverImage"
            placeholder="이미지 URL을 입력하거나 아래에서 파일을 업로드하세요"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          
          {/* 이미지 업로드 섹션 */}
          <div className="flex items-center space-x-4">
            <label className="block">
              <span className="sr-only">Choose image file</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  // 파일 업로드 처리
                  const formData = new FormData()
                  formData.append('image', file)
                  formData.append('postId', 'temp-' + Date.now()) // 임시 ID
                  
                  try {
                    const response = await fetch('/api/admin/upload-image', {
                      method: 'POST',
                      body: formData
                    })
                    
                    if (response.ok) {
                      const { imageUrl } = await response.json()
                      setFormData(prev => ({ ...prev, coverImage: imageUrl }))
                    }
                  } catch (error) {
                    console.error('Image upload failed:', error)
                  }
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </label>
            
            {/* 이미지 미리보기 */}
            {formData.coverImage && (
              <div className="relative w-20 h-20">
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
              onChange={async (e) => {
                const url = e.target.value
                setYoutubeUrl(url)
                const videoId = extractYouTubeVideoId(url)
                if (videoId) {
                  setFormData({ ...formData, youtubeVideoId: videoId })
                  
                  // YouTube 썸네일을 coverImage로 자동 설정
                  if (!formData.coverImage || formData.coverImage.includes('ytimg.com')) {
                    // hqdefault를 기본으로 사용 (항상 존재)
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    setFormData(prev => ({ 
                      ...prev, 
                      youtubeVideoId: videoId,
                      coverImage: thumbnailUrl 
                    }))
                  }
                }
              }}
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
                  setFormData({ ...formData, youtubeVideoId: '' })
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

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          AI Content Generation
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="ai-topic" className="block text-sm font-medium text-gray-700">
              Topic & Tone
            </label>
            <input
              type="text"
              id="ai-topic"
              placeholder="e.g., My brutally honest Wegovy review after 6 months"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="ai-keywords" className="block text-sm font-medium text-gray-700">
              Target Keywords (comma-separated)
            </label>
            <input
              type="text"
              id="ai-keywords"
              placeholder="e.g., wegovy review, wegovy side effects, weight loss"
              value={aiKeywords}
              onChange={(e) => setAiKeywords(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="affiliate-products" className="block text-sm font-medium text-gray-700">
              Affiliate Products (comma-separated, optional)
            </label>
            <input
              type="text"
              id="affiliate-products"
              placeholder="e.g., MyFitnessPal Premium, Withings Scale"
              value={affiliateProducts}
              onChange={(e) => setAffiliateProducts(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <button
            type="button"
            onClick={generateWithAI}
            disabled={isGenerating || !aiPrompt}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? 'Generating SEO-Optimized Content...' : 'Generate with AI'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <MDEditor
          value={formData.content}
          onChange={(val) => setFormData({ ...formData, content: val || '' })}
          height={400}
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
            SEO Title
          </label>
          <input
            type="text"
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
            SEO Description
          </label>
          <input
            type="text"
            id="seoDescription"
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!!formData.publishedAt}
            onChange={(e) => setFormData({ 
              ...formData, 
              publishedAt: e.target.checked ? new Date().toISOString() : null 
            })}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>

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