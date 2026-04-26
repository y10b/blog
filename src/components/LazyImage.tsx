'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'
import YouTubeThumbnail from './YouTubeThumbnail'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  fill,
  sizes,
  width,
  height 
}: LazyImageProps) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || hasLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      {
        // Start loading when image is 250px away from viewport for better performance
        rootMargin: '250px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [priority, hasLoaded])

  const shouldLoad = priority || isIntersecting
  
  // Check if this is a YouTube thumbnail URL
  const isYouTubeThumbnail = src.includes('ytimg.com') || src.includes('img.youtube.com')
  const youtubeVideoIdMatch = src.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
  const youtubeVideoId = youtubeVideoIdMatch ? youtubeVideoIdMatch[1] : null
  
  // Use YouTube thumbnail component for YouTube images
  if (isYouTubeThumbnail && youtubeVideoId) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {shouldLoad ? (
          <YouTubeThumbnail
            videoId={youtubeVideoId}
            alt={alt}
            fill={fill}
            width={width}
            height={height}
            sizes={sizes}
            className={className}
            priority={priority}
            onLoad={() => setHasLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    )
  }

  // For markdown images, we don't know dimensions, so use regular img with lazy loading
  if (!fill && !width && !height) {
    return (
      <div ref={ref} style={{maxWidth: '100%', margin: '1.5rem 0'}}>
        {shouldLoad ? (
          <img 
            src={src} 
            alt={alt}
            loading="lazy"
            style={{maxWidth: '100%', height: 'auto', borderRadius: '0.5rem'}}
            onLoad={() => setHasLoaded(true)}
            className={!hasLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
          />
        ) : (
          <div style={{paddingBottom: '56.25%', backgroundColor: '#e5e7eb', borderRadius: '0.5rem'}} />
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={fill ? `absolute inset-0 ${className}` : `relative ${className}`}
    >
      {shouldLoad && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setHasLoaded(true)}
          className={`${className} ${!hasLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
      )}
      {!hasLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}