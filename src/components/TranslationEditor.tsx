'use client'

import { useState, useEffect } from 'react'
import { PostImageUpload } from './post-editor/PostImageUpload'
import { PostFormData } from '@/types'

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

interface TranslationEditorProps {
  postId: string
  translation: Translation | null
  locale: 'ko' | 'en'
  onSave: () => void
}

export default function TranslationEditor({ postId, translation, locale, onSave }: TranslationEditorProps) {
  const [title, setTitle] = useState(translation?.title || '')
  const [content, setContent] = useState(translation?.content || '')
  const [excerpt, setExcerpt] = useState(translation?.excerpt || '')
  const [coverImage, setCoverImage] = useState(translation?.coverImage || '')
  const [seoTitle, setSeoTitle] = useState(translation?.seoTitle || '')
  const [seoDescription, setSeoDescription] = useState(translation?.seoDescription || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (translation) {
      setTitle(translation.title)
      setContent(translation.content)
      setExcerpt(translation.excerpt || '')
      setCoverImage(translation.coverImage || '')
      setSeoTitle(translation.seoTitle || '')
      setSeoDescription(translation.seoDescription || '')
    }
  }, [translation])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/posts/${postId}/translation`, {
        method: translation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          title,
          content,
          excerpt: excerpt || null,
          coverImage: coverImage || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
        }),
      })

      if (response.ok) {
        alert('번역이 저장되었습니다!')
        onSave()
      } else {
        throw new Error('Failed to save translation')
      }
    } catch (error) {
      console.error('Error saving translation:', error)
      alert('번역 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              {locale === 'ko' ? '한국어' : '영어'} 번역을 편집하고 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          요약
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          required
        />
      </div>

      <PostImageUpload
        formData={{
          title: '',
          slug: '',
          content: '',
          excerpt: '',
          coverImage: coverImage,
          tags: '',
          seoTitle: '',
          seoDescription: '',
          publishedAt: null,
          youtubeVideoId: ''
        }}
        onChange={(data: Partial<PostFormData>) => {
          if (data.coverImage !== undefined) {
            setCoverImage(data.coverImage)
          }
        }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SEO 제목
        </label>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="검색 결과에 표시될 제목 (비워두면 기본 제목 사용)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SEO 설명
        </label>
        <textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="검색 결과에 표시될 설명 (비워두면 요약 사용)"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title || !content}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '번역 저장'}
        </button>
      </div>
    </div>
  )
}