'use client'

import { useState } from 'react'
import Image from 'next/image'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  aspectRatio?: '16:9' | '4:3'
}

export default function YouTubeEmbed({ 
  videoId, 
  title = 'YouTube video', 
  aspectRatio = '16:9' 
}: YouTubeEmbedProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
  
  // Facade pattern: Show thumbnail first, load iframe on click
  if (!showPlayer) {
    return (
      <div className={`relative w-full ${aspectClass} my-8 rounded-lg overflow-hidden bg-black cursor-pointer group`}>
        <button
          onClick={() => setShowPlayer(true)}
          className="absolute inset-0 w-full h-full"
          aria-label={`Play ${title}`}
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="object-cover"
            loading="lazy"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 rounded-xl p-4 group-hover:bg-red-700 transition-colors">
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    )
  }
  
  return (
    <div className={`relative w-full ${aspectClass} my-8 rounded-lg overflow-hidden bg-black`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=0&disablekb=1&fs=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

// Helper function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Regular YouTube URLs
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (youtubeMatch) return youtubeMatch[1]
  
  // YouTube Shorts
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]
  
  // If it's already just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  
  return null
}