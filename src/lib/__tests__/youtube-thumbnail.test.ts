/**
 * Tests for YouTube thumbnail utilities
 *
 * Coverage goal: 90-100%
 * Test approach: Unit tests (no mocks, pure functions)
 *
 * Test cases:
 * - extractYouTubeVideoId: various URL formats, video ID validation
 * - getYouTubeThumbnailUrl: URL generation for different qualities
 * - getYouTubeThumbnailUrls: primary and fallback URLs
 * - normalizeYouTubeThumbnailUrl: URL normalization
 * - getBestThumbnailFromApiResponse: API response parsing
 */

import { describe, it, expect } from 'vitest'
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeThumbnailUrls,
  normalizeYouTubeThumbnailUrl,
  getBestThumbnailFromApiResponse,
  type YouTubeThumbnailQuality,
} from '../youtube-thumbnail'

describe('extractYouTubeVideoId', () => {
  describe('direct video ID', () => {
    it('should return video ID when input is already a video ID', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should handle video IDs with underscores and dashes', () => {
      expect(extractYouTubeVideoId('abc_123-XYZ')).toBe('abc_123-XYZ')
    })
  })

  describe('standard YouTube URLs', () => {
    it('should extract ID from watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from youtu.be short URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from URL with multiple query params', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share'))
        .toBe('dQw4w9WgXcQ')
    })

    it('should extract ID when v is not first param', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })
  })

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(extractYouTubeVideoId('')).toBeNull()
    })

    it('should return null for invalid URL', () => {
      expect(extractYouTubeVideoId('not-a-youtube-url')).toBeNull()
    })

    it('should return null for URL without video ID', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com')).toBeNull()
    })

    it('should return null for short video ID', () => {
      expect(extractYouTubeVideoId('shortid')).toBeNull()
    })

    it('should return null for long video ID', () => {
      expect(extractYouTubeVideoId('toolongvideoid')).toBeNull()
    })
  })
})

describe('getYouTubeThumbnailUrl', () => {
  const videoId = 'dQw4w9WgXcQ'

  describe('basic functionality', () => {
    it('should generate thumbnail URL with default quality', () => {
      const url = getYouTubeThumbnailUrl(videoId)
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    it('should generate URL with maxresdefault quality', () => {
      const url = getYouTubeThumbnailUrl(videoId, 'maxresdefault')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
    })

    it('should generate URL with sddefault quality', () => {
      const url = getYouTubeThumbnailUrl(videoId, 'sddefault')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/sddefault.jpg')
    })

    it('should generate URL with hqdefault quality', () => {
      const url = getYouTubeThumbnailUrl(videoId, 'hqdefault')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    it('should generate URL with mqdefault quality', () => {
      const url = getYouTubeThumbnailUrl(videoId, 'mqdefault')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
    })

    it('should generate URL with default quality', () => {
      const url = getYouTubeThumbnailUrl(videoId, 'default')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg')
    })
  })

  describe('URL format', () => {
    it('should always start with https://img.youtube.com/vi/', () => {
      const url = getYouTubeThumbnailUrl(videoId)
      expect(url.startsWith('https://img.youtube.com/vi/')).toBe(true)
    })

    it('should always end with .jpg', () => {
      const url = getYouTubeThumbnailUrl(videoId)
      expect(url.endsWith('.jpg')).toBe(true)
    })

    it('should include video ID in URL', () => {
      const url = getYouTubeThumbnailUrl(videoId)
      expect(url).toContain(videoId)
    })
  })
})

describe('getYouTubeThumbnailUrls', () => {
  const videoId = 'dQw4w9WgXcQ'

  describe('return structure', () => {
    it('should return object with primary and fallbacks', () => {
      const result = getYouTubeThumbnailUrls(videoId)

      expect(result).toHaveProperty('primary')
      expect(result).toHaveProperty('fallbacks')
    })

    it('should have primary as maxresdefault quality', () => {
      const result = getYouTubeThumbnailUrls(videoId)

      expect(result.primary).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
    })

    it('should have 3 fallback URLs', () => {
      const result = getYouTubeThumbnailUrls(videoId)

      expect(result.fallbacks).toHaveLength(3)
    })

    it('should have fallbacks in descending quality order', () => {
      const result = getYouTubeThumbnailUrls(videoId)

      expect(result.fallbacks[0]).toContain('hqdefault')
      expect(result.fallbacks[1]).toContain('mqdefault')
      expect(result.fallbacks[2]).toContain('default')
    })
  })

  describe('all URLs', () => {
    it('should have unique URLs', () => {
      const result = getYouTubeThumbnailUrls(videoId)
      const allUrls = [result.primary, ...result.fallbacks]

      const uniqueUrls = new Set(allUrls)
      expect(uniqueUrls.size).toBe(allUrls.length)
    })

    it('should all be valid URLs', () => {
      const result = getYouTubeThumbnailUrls(videoId)
      const allUrls = [result.primary, ...result.fallbacks]

      allUrls.forEach(url => {
        expect(url.startsWith('https://')).toBe(true)
        expect(url.endsWith('.jpg')).toBe(true)
      })
    })
  })
})

describe('normalizeYouTubeThumbnailUrl', () => {
  describe('YouTube thumbnail URLs', () => {
    it('should normalize YouTube thumbnail URL to hqdefault', () => {
      const input = 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg'
      const result = normalizeYouTubeThumbnailUrl(input)

      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    it('should extract video ID and generate hqdefault URL', () => {
      const input = 'https://img.youtube.com/vi/abc123XYZ_-/mqdefault.jpg'
      const result = normalizeYouTubeThumbnailUrl(input)

      expect(result).toBe('https://img.youtube.com/vi/abc123XYZ_-/hqdefault.jpg')
    })

    it('should normalize maxresdefault to hqdefault', () => {
      const input = 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      const result = normalizeYouTubeThumbnailUrl(input)

      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })
  })

  describe('non-YouTube URLs', () => {
    it('should return non-YouTube URL as-is', () => {
      const input = 'https://example.com/image.jpg'
      const result = normalizeYouTubeThumbnailUrl(input)

      expect(result).toBe(input)
    })

    it('should return custom CDN URL as-is', () => {
      const input = 'https://cdn.example.com/thumbnails/video-123.jpg'
      const result = normalizeYouTubeThumbnailUrl(input)

      expect(result).toBe(input)
    })
  })

  describe('edge cases', () => {
    it('should return null for undefined', () => {
      expect(normalizeYouTubeThumbnailUrl(undefined)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(normalizeYouTubeThumbnailUrl('')).toBeNull()
    })
  })
})

describe('getBestThumbnailFromApiResponse', () => {
  describe('standard API response', () => {
    it('should return maxres thumbnail if available', () => {
      const thumbnails = {
        maxres: { url: 'https://example.com/maxres.jpg' },
        high: { url: 'https://example.com/high.jpg' },
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/maxres.jpg')
    })

    it('should fallback to high quality if maxres unavailable', () => {
      const thumbnails = {
        high: { url: 'https://example.com/high.jpg' },
        medium: { url: 'https://example.com/medium.jpg' },
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/high.jpg')
    })

    it('should fallback to medium quality', () => {
      const thumbnails = {
        medium: { url: 'https://example.com/medium.jpg' },
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/medium.jpg')
    })

    it('should fallback to standard quality', () => {
      const thumbnails = {
        standard: { url: 'https://example.com/standard.jpg' },
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/standard.jpg')
    })

    it('should use default quality as last resort', () => {
      const thumbnails = {
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/default.jpg')
    })
  })

  describe('fallback behavior', () => {
    it('should use first available quality if none match priority', () => {
      const thumbnails = {
        custom: { url: 'https://example.com/custom.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/custom.jpg')
    })

    it('should return empty string for empty thumbnails object', () => {
      const result = getBestThumbnailFromApiResponse({})
      expect(result).toBe('')
    })

    it('should return empty string for null', () => {
      const result = getBestThumbnailFromApiResponse(null)
      expect(result).toBe('')
    })

    it('should return empty string for undefined', () => {
      const result = getBestThumbnailFromApiResponse(undefined)
      expect(result).toBe('')
    })
  })

  describe('malformed responses', () => {
    it('should handle thumbnail without url property', () => {
      const thumbnails = {
        high: { width: 480, height: 360 },
        default: { url: 'https://example.com/default.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/default.jpg')
    })

    it('should skip null thumbnail objects', () => {
      const thumbnails = {
        maxres: null,
        high: { url: 'https://example.com/high.jpg' },
      }

      const result = getBestThumbnailFromApiResponse(thumbnails)
      expect(result).toBe('https://example.com/high.jpg')
    })
  })
})
