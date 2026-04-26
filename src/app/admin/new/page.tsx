'use client'

import { useRouter } from 'next/navigation'
import PostEditor from '@/components/PostEditor'

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

export default function NewPostPage() {
  const router = useRouter()

  const handleSubmit = async (data: PostFormData) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.push('/admin')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Post</h1>
      <PostEditor onSubmit={handleSubmit} />
    </div>
  )
}