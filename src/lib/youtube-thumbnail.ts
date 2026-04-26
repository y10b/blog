/**
 * YouTube Thumbnail Utilities
 * Handles YouTube thumbnail URL generation with proper quality fallbacks
 */

import type { YouTubeThumbnails } from '@/types/youtube'

export type YouTubeThumbnailQuality = 
  | 'maxresdefault'  // 1280x720 (not always available)
  | 'sddefault'      // 640x480 (not always available)
  | 'hqdefault'      // 480x360 (usually available)
  | 'mqdefault'      // 320x180 (always available)
  | 'default'        // 120x90 (always available)

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Already a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Generate YouTube thumbnail URL for a given video ID and quality
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = 'hqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get the best available YouTube thumbnail URL
 * Returns an object with primary URL and fallback URLs
 */
export function getYouTubeThumbnailUrls(videoId: string): {
  primary: string
  fallbacks: string[]
} {
  return {
    primary: getYouTubeThumbnailUrl(videoId, 'maxresdefault'),
    fallbacks: [
      getYouTubeThumbnailUrl(videoId, 'hqdefault'),
      getYouTubeThumbnailUrl(videoId, 'mqdefault'),
      getYouTubeThumbnailUrl(videoId, 'default'),
    ]
  }
}

/**
 * Normalize YouTube thumbnail URL from API response
 * YouTube API might return URLs with different patterns
 */
export function normalizeYouTubeThumbnailUrl(url: string | undefined): string | null {
  if (!url) return null
  
  // Extract video ID from the URL if it's a YouTube thumbnail URL
  const match = url.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
  if (match) {
    const videoId = match[1]
    // Return high quality version
    return getYouTubeThumbnailUrl(videoId, 'hqdefault')
  }
  
  // Return as-is if it's not a YouTube thumbnail URL
  return url
}

/**
 * Get thumbnail from YouTube API response with fallbacks
 */
export function getBestThumbnailFromApiResponse(thumbnails: YouTubeThumbnails | undefined): string {
  if (!thumbnails) return ''

  // Priority order: maxres > high > medium > standard > default
  const qualities: Array<keyof YouTubeThumbnails> = ['maxres', 'high', 'standard', 'medium', 'default']

  for (const quality of qualities) {
    const thumbnail = thumbnails[quality]
    if (thumbnail?.url) {
      return thumbnail.url
    }
  }

  return ''
}