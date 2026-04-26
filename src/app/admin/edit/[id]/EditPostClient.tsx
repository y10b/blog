'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PostEditor from '@/components/PostEditor'
import ThreadsContentGenerator from '@/components/ThreadsContentGenerator'
import TranslationEditor from '@/components/TranslationEditor'
import { tagsToArray } from '@/lib/utils/tags'

interface Translation {
  id: string
  locale: string
  title: string
  content: string
  excerpt?: string | null
  coverImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

interface Post {
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
  originalLanguage?: string
  translations?: Translation[]
}

// 카테고리는 tags[0] 컨벤션. 'dev' | 'sidehustle' | undefined.
type PostCategory = 'dev' | 'sidehustle'

function detectCategory(tags?: string[]): PostCategory | null {
  const first = tags?.[0]?.toLowerCase().trim()
  if (first === 'dev' || first === 'sidehustle') return first
  return null
}

const CATEGORY_META: Record<PostCategory, { label: string; tistory: string; color: string }> = {
  dev: { label: '개발/AI', tistory: '개발막차', color: 'bg-indigo-100 text-indigo-800' },
  sidehustle: { label: 'N잡/도구', tistory: 'n잡러 프리랜서', color: 'bg-amber-100 text-amber-800' },
}

interface PostFormData {
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  publishedAt?: string | null
  youtubeVideoId?: string | null
}

export default function EditPostClient({ id }: { id: string }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ko' | 'en'>('ko')
  const [isTranslating, setIsTranslating] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [copiedTistory, setCopiedTistory] = useState(false)

  const handleCopyForTistory = (currentPost: Post) => {
    // 티스토리 글쓰기 창에 붙여넣기 좋은 형태: 제목 + 빈 줄 + 마크다운 본문
    const md = `# ${currentPost.title}\n\n${currentPost.content}`
    navigator.clipboard.writeText(md)
    setCopiedTistory(true)
    setTimeout(() => setCopiedTistory(false), 2000)
  }

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data)
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (data: PostFormData) => {
    console.log('📤 Submitting data:', data)

    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      alert('저장이 완료되었습니다!')
      router.push('/admin')
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('❌ Error response:', errorData)
      alert(`저장 중 오류가 발생했습니다:\n${JSON.stringify(errorData, null, 2)}`)
    }
  }

  // 원본 언어에 따라 초기 탭 설정 - hooks는 조건문 전에 호출되어야 함
  useEffect(() => {
    if (post?.originalLanguage) {
      setActiveTab(post.originalLanguage as 'ko' | 'en')
    }
  }, [post?.originalLanguage])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!post) {
    return <div>Post not found</div>
  }

  const hasEnglishTranslation = post.translations?.some(t => t.locale === 'en')
  const hasKoreanTranslation = post.translations?.some(t => t.locale === 'ko')
  const englishTranslation = post.translations?.find(t => t.locale === 'en')
  const koreanTranslation = post.translations?.find(t => t.locale === 'ko')
  
  const isOriginalKorean = post.originalLanguage === 'ko'
  const isOriginalEnglish = post.originalLanguage === 'en'
  
  const needsKoreanTranslation = isOriginalEnglish && !hasKoreanTranslation
  const needsEnglishTranslation = isOriginalKorean && !hasEnglishTranslation
  const targetLang = isOriginalEnglish ? 'ko' : 'en'
  const targetLangName = isOriginalEnglish ? '한국어' : '영어'

  const handleTranslate = async () => {
    const needsTranslation = isOriginalEnglish ? needsKoreanTranslation : needsEnglishTranslation
    if (!needsTranslation) {
      alert(`이미 ${targetLangName} 번역이 있습니다.`)
      return
    }

    if (!confirm(`이 포스트를 ${targetLangName}로 번역하시겠습니까?`)) {
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch('/api/admin/translate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postIds: [id],
          targetLang
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const successCount = result.results?.filter((r: any) => r.status === 'success').length || 0
        const errorCount = result.results?.filter((r: any) => r.status === 'error').length || 0
        
        if (successCount > 0) {
          alert('번역이 완료되었습니다!')
          // Refresh the page to show the translation
          window.location.reload()
        } else if (errorCount > 0) {
          const errorMessages = result.results
            ?.filter((r: any) => r.status === 'error')
            .map((r: any) => r.message)
            .join('\n')
          throw new Error(errorMessages || 'Translation failed')
        }
      } else {
        throw new Error(result.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Error translating post:', error)
      if (error instanceof Error) {
        alert(`번역 중 오류가 발생했습니다:\n${error.message}`)
      } else {
        alert('번역 중 오류가 발생했습니다.')
      }
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 -ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            목록으로
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Post</h1>
          
          {/* 원본 언어 태그 */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isOriginalKorean ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {isOriginalKorean ? '한국어 원본' : '영어 원본'}
          </span>
        </div>
        
        {/* 카테고리 + 티스토리 복사 섹션 */}
        {(() => {
          const category = detectCategory(post.tags)
          const meta = category ? CATEGORY_META[category] : null
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">게시 정보</h3>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">카테고리:</span>
                  {meta ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                      미분류 — tags 첫 항목을 <code className="mx-1 px-1 bg-white rounded">dev</code> 또는 <code className="mx-1 px-1 bg-white rounded">sidehustle</code>로 설정
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyForTistory(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                  title={meta ? `티스토리 "${meta.tistory}" 블로그에 붙여넣기` : '티스토리에 붙여넣기'}
                >
                  {copiedTistory ? '복사됨' : '티스토리용 복사'}
                  {meta && <span className="text-xs text-gray-500">({meta.tistory})</span>}
                </button>
              </div>
            </div>
          )
        })()}

        {/* URL 정보 섹션 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">게시물 URL</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">한국어:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                  {process.env.NEXT_PUBLIC_SITE_URL || ''}/ko/posts/{post.slug}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`{process.env.NEXT_PUBLIC_SITE_URL || ''}/ko/posts/${post.slug}`)
                    setCopiedUrl('ko')
                    setTimeout(() => setCopiedUrl(null), 2000)
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {copiedUrl === 'ko' ? '✓ 복사됨' : '복사'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">영어:</span>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                  {process.env.NEXT_PUBLIC_SITE_URL || ''}/en/posts/{post.slug}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`{process.env.NEXT_PUBLIC_SITE_URL || ''}/en/posts/${post.slug}`)
                    setCopiedUrl('en')
                    setTimeout(() => setCopiedUrl(null), 2000)
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {copiedUrl === 'en' ? '✓ 복사됨' : '복사'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 언어 탭 */}
          <div className="flex rounded-lg shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveTab('ko')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                activeTab === 'ko'
                  ? 'bg-indigo-600 text-white border-indigo-600 z-10'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              한국어
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l-0 border ${
                activeTab === 'en'
                  ? 'bg-indigo-600 text-white border-indigo-600 z-10'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              English
            </button>
          </div>
          
          {/* 번역 버튼 - 현재 탭에 따라 표시 */}
          {((activeTab === 'ko' && isOriginalEnglish && !hasKoreanTranslation) ||
            (activeTab === 'en' && isOriginalKorean && !hasEnglishTranslation)) && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  번역 중...
                </>
              ) : (
                `${activeTab === 'ko' ? '한국어' : '영어'}로 번역하기`
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* 원본 언어의 탭에서는 PostEditor, 번역 언어의 탭에서는 TranslationEditor */}
      {(activeTab === 'ko' && isOriginalKorean) || (activeTab === 'en' && isOriginalEnglish) ? (
        <PostEditor initialData={post} onSubmit={handleSubmit} isEdit />
      ) : (
        <div>
          {/* 번역 편집기 또는 번역 버튼 */}
          {(activeTab === 'ko' && hasKoreanTranslation) || (activeTab === 'en' && hasEnglishTranslation) ? (
            <TranslationEditor
              postId={id}
              translation={activeTab === 'ko' ? (koreanTranslation || null) : (englishTranslation || null)}
              locale={activeTab}
              onSave={() => window.location.reload()}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">
                {activeTab === 'ko' ? '한국어' : '영어'} 번역이 아직 없습니다.
              </p>
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {isTranslating ? '번역 중...' : '지금 번역하기'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Threads content generator - only visible in admin */}
      <div className="mt-8">
        <ThreadsContentGenerator post={{
          title: post.title,
          excerpt: post.excerpt || null,
          content: post.content,
          tags: tagsToArray(post.tags),
          slug: post.slug
        }} />
      </div>
    </div>
  )
}