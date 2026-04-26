'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { PostFormData } from '@/types'
import { PostTitleSlugFields } from './post-editor/PostTitleSlugFields'
import { PostImageUpload } from './post-editor/PostImageUpload'
import { PostYouTubeSection } from './post-editor/PostYouTubeSection'
import { PostAIGeneration } from './post-editor/PostAIGeneration'

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
  const [formData, setFormData] = useState<PostFormData>({
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
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (data: Partial<PostFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PostTitleSlugFields formData={formData} onChange={updateFormData} />
      
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={(e) => updateFormData({ excerpt: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <PostImageUpload formData={formData} onChange={updateFormData} />
      
      <PostYouTubeSection formData={formData} onChange={updateFormData} />
      
      <PostAIGeneration onChange={updateFormData} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <MDEditor
          value={formData.content}
          onChange={(val) => updateFormData({ content: val || '' })}
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
          onChange={(e) => updateFormData({ tags: e.target.value })}
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
            onChange={(e) => updateFormData({ seoTitle: e.target.value })}
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
            onChange={(e) => updateFormData({ seoDescription: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!!formData.publishedAt}
            onChange={(e) => updateFormData({ 
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
  )
}