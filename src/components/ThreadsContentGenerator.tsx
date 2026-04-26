'use client'

import { useState } from 'react'

interface ThreadsContentGeneratorProps {
  post: {
    title: string
    excerpt: string | null
    content: string
    tags: string[]
    slug: string
  }
}

export default function ThreadsContentGenerator({ post }: ThreadsContentGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  
  // Generate Threads-optimized content
  const generateThreadsContent = () => {
    // Extract key points from content (first paragraph or excerpt)
    const excerpt = post.excerpt || post.content.substring(0, 200)
    
    // Clean up excerpt if it has JSON
    let cleanExcerpt = excerpt
    if (excerpt.includes('```json') || excerpt.includes('"excerpt":')) {
      const excerptMatch = excerpt.match(/"excerpt"\s*:\s*"([^"]+)"/)
      if (excerptMatch) {
        cleanExcerpt = excerptMatch[1]
      } else {
        cleanExcerpt = post.title
      }
    }
    
    // Generate hashtags from tags
    const tags = Array.isArray(post.tags) ? post.tags : []
    const hashtags = tags
      .slice(0, 5) // Limit to 5 hashtags
      .map(tag => `#${tag.replace(/\s+/g, '')}`)
      .join(' ')
    
    // Create Threads post (500 character limit)
    const threadContent = `🚀 ${post.title}

${cleanExcerpt}...

Read more: ${siteUrl}/posts/${post.slug}

${hashtags} #newsletter #startup #growth`
    
    // Ensure it's under 500 characters
    if (threadContent.length > 500) {
      const trimmedExcerpt = cleanExcerpt.substring(0, 300)
      return `🚀 ${post.title}

${trimmedExcerpt}...

Read more: ${siteUrl}/posts/${post.slug}

${hashtags}`
    }
    
    return threadContent
  }
  
  const content = generateThreadsContent()
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Threads Content</h3>
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            readOnly
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
          />
          <div className="absolute bottom-2 right-2 text-sm text-gray-500">
            {content.length}/500 characters
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          
          <a
            href="https://threads.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Open Threads →
          </a>
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Tips for Threads:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Keep it under 500 characters</li>
            <li>Use emojis to catch attention</li>
            <li>Include 3-5 relevant hashtags</li>
            <li>Add a clear call-to-action</li>
          </ul>
        </div>
      </div>
    </div>
  )
}