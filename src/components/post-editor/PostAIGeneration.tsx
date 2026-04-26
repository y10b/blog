'use client'

import { useState } from 'react'
import { PostFormData } from '@/types'

interface PostAIGenerationProps {
  onChange: (data: Partial<PostFormData>) => void
}

export function PostAIGeneration({ onChange }: PostAIGenerationProps) {
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKeywords, setAiKeywords] = useState('')
  const [affiliateProducts, setAffiliateProducts] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateWithAI = async () => {
    if (!aiPrompt) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          keywords: aiKeywords.split(',').map(k => k.trim()).filter(Boolean),
          affiliateProducts: affiliateProducts.split(',').map(p => p.trim()).filter(Boolean)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      
      onChange({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        tags: data.tags.join(', '),
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        coverImage: data.coverImage || ''
      })
      
      // 성공 후 입력 필드 초기화
      setAiPrompt('')
      setAiKeywords('')
      setAffiliateProducts('')
    } catch (err) {
      console.error('AI generation failed:', err)
      setError('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
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
            disabled={isGenerating}
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
            disabled={isGenerating}
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
            disabled={isGenerating}
          />
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
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
  )
}