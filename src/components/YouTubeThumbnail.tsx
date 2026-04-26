'use client'

import { useState } from 'react'
import { getYouTubeThumbnailUrls } from '@/lib/youtube-thumbnail'

interface YouTubeThumbnailProps {
  videoId: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export default function YouTubeThumbnail({
  videoId,
  alt,
  className = '',
  fill,
  sizes,
  width,
  height,
  priority = false,
  onLoad,
  onError
}: YouTubeThumbnailProps) {
  const { primary, fallbacks } = getYouTubeThumbnailUrls(videoId)
  const [currentUrlIndex, setCurrentUrlIndex] = useState(-1)
  const [hasError, setHasError] = useState(false)
  
  // Start with primary URL, then use fallbacks
  const currentUrl = currentUrlIndex === -1 ? primary : fallbacks[currentUrlIndex]
  
  const handleError = () => {
    // Try next fallback URL
    if (currentUrlIndex < fallbacks.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1)
    } else {
      // All URLs failed
      setHasError(true)
      onError?.()
    }
  }
  
  const handleLoad = () => {
    onLoad?.()
  }
  
  // If all attempts failed, show placeholder
  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <div className="text-gray-400 text-center p-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <p className="text-sm">Thumbnail unavailable</p>
        </div>
      </div>
    )
  }
  
  // Use regular img tag to bypass Vercel image optimization (avoid 402 Payment Required error)
  if (fill) {
    return (
      <img
        src={currentUrl}
        alt={alt}
        className={`${className} absolute inset-0 w-full h-full object-cover`}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        onLoad={handleLoad}
      />
    )
  }

  // Fixed dimensions
  return (
    <img
      src={currentUrl}
      alt={alt}
      width={width || 640}
      height={height || 360}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}