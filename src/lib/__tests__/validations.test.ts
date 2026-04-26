/**
 * Tests for validation schemas and utilities
 *
 * Coverage goal: 70-80%
 * Test approach: Unit tests (no mocks, schema validation)
 *
 * Test cases:
 * - Zod schemas: valid inputs, invalid inputs, edge cases
 * - extractYouTubeVideoId: various URL formats, edge cases
 */

import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import {
  slugSchema,
  tagsSchema,
  youtubeVideoIdSchema,
  youtubeUrlSchema,
  generateContentSchema,
  imageUploadSchema,
  paginationSchema,
  adminAuthSchema,
  createPostSchema,
  updatePostSchema,
  extractYouTubeVideoId,
} from '../validations'

describe('slugSchema', () => {
  describe('valid slugs', () => {
    it('should accept valid slug', () => {
      expect(slugSchema.parse('hello-world')).toBe('hello-world')
    })

    it('should accept slug with numbers', () => {
      expect(slugSchema.parse('post-123')).toBe('post-123')
    })

    it('should accept slug with multiple hyphens', () => {
      expect(slugSchema.parse('this-is-a-long-slug')).toBe('this-is-a-long-slug')
    })
  })

  describe('invalid slugs', () => {
    it('should reject empty string', () => {
      expect(() => slugSchema.parse('')).toThrow(ZodError)
    })

    it('should reject uppercase letters', () => {
      expect(() => slugSchema.parse('Hello-World')).toThrow(ZodError)
    })

    it('should reject special characters', () => {
      expect(() => slugSchema.parse('hello_world')).toThrow(ZodError)
      expect(() => slugSchema.parse('hello!world')).toThrow(ZodError)
      expect(() => slugSchema.parse('hello world')).toThrow(ZodError)
    })

    it('should allow hyphens anywhere (including start/end)', () => {
      // Note: The regex ^[a-z0-9-]+$ allows hyphens anywhere
      expect(slugSchema.parse('-hello')).toBe('-hello')
      expect(slugSchema.parse('hello-')).toBe('hello-')
      expect(slugSchema.parse('-hello-')).toBe('-hello-')
    })
  })
})

describe('tagsSchema', () => {
  describe('valid tags', () => {
    it('should accept array with single tag', () => {
      expect(tagsSchema.parse(['tech'])).toEqual(['tech'])
    })

    it('should accept array with multiple tags', () => {
      expect(tagsSchema.parse(['tech', 'programming', 'ai'])).toEqual(['tech', 'programming', 'ai'])
    })

    it('should accept up to 10 tags', () => {
      const tags = Array(10).fill('tag')
      expect(tagsSchema.parse(tags)).toEqual(tags)
    })
  })

  describe('invalid tags', () => {
    it('should reject empty array', () => {
      expect(() => tagsSchema.parse([])).toThrow(ZodError)
    })

    it('should reject more than 10 tags', () => {
      const tags = Array(11).fill('tag')
      expect(() => tagsSchema.parse(tags)).toThrow(ZodError)
    })

    it('should reject array with empty strings', () => {
      expect(() => tagsSchema.parse([''])).toThrow(ZodError)
      expect(() => tagsSchema.parse(['tag1', '', 'tag3'])).toThrow(ZodError)
    })
  })
})

describe('youtubeVideoIdSchema', () => {
  describe('valid video IDs', () => {
    it('should accept valid 11-character ID', () => {
      expect(youtubeVideoIdSchema.parse('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should accept ID with hyphens and underscores', () => {
      expect(youtubeVideoIdSchema.parse('a1b2_c3-d4e')).toBe('a1b2_c3-d4e')
    })

    it('should accept null', () => {
      expect(youtubeVideoIdSchema.parse(null)).toBeNull()
    })

    it('should accept undefined', () => {
      expect(youtubeVideoIdSchema.parse(undefined)).toBeUndefined()
    })
  })

  describe('invalid video IDs', () => {
    it('should reject IDs shorter than 11 characters', () => {
      expect(() => youtubeVideoIdSchema.parse('short')).toThrow(ZodError)
    })

    it('should reject IDs longer than 11 characters', () => {
      expect(() => youtubeVideoIdSchema.parse('toolongvideoid')).toThrow(ZodError)
    })

    it('should reject IDs with invalid characters', () => {
      expect(() => youtubeVideoIdSchema.parse('hello!world')).toThrow(ZodError)
    })
  })
})

describe('youtubeUrlSchema', () => {
  describe('valid YouTube URLs', () => {
    it('should accept standard watch URL', () => {
      expect(youtubeUrlSchema.parse('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })

    it('should accept youtu.be short URL', () => {
      expect(youtubeUrlSchema.parse('https://youtu.be/dQw4w9WgXcQ')).toBe('https://youtu.be/dQw4w9WgXcQ')
    })

    it('should accept embed URL', () => {
      expect(youtubeUrlSchema.parse('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('should accept URL without www', () => {
      expect(youtubeUrlSchema.parse('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
    })

    it('should accept http protocol', () => {
      expect(youtubeUrlSchema.parse('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('http://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })
  })

  describe('invalid YouTube URLs', () => {
    it('should reject non-YouTube URLs', () => {
      expect(() => youtubeUrlSchema.parse('https://vimeo.com/123456')).toThrow(ZodError)
    })

    it('should reject invalid URL format', () => {
      expect(() => youtubeUrlSchema.parse('not a url')).toThrow(ZodError)
    })

    it('should reject YouTube URL with invalid video ID length', () => {
      expect(() => youtubeUrlSchema.parse('https://www.youtube.com/watch?v=short')).toThrow(ZodError)
    })
  })
})

describe('generateContentSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid content generation request', () => {
      const input = {
        prompt: 'Write about AI trends in 2024',
        keywords: ['AI', 'machine learning'],
        affiliateProducts: ['product1'],
      }
      expect(generateContentSchema.parse(input)).toEqual(input)
    })

    it('should accept prompt without optional fields', () => {
      const input = { prompt: 'Write about tech' }
      expect(generateContentSchema.parse(input)).toEqual(input)
    })

    it('should accept up to 20 keywords', () => {
      const input = {
        prompt: 'Test prompt for validation',
        keywords: Array(20).fill('keyword'),
      }
      expect(generateContentSchema.parse(input)).toEqual(input)
    })

    it('should accept up to 10 affiliate products', () => {
      const input = {
        prompt: 'Test prompt for validation',
        affiliateProducts: Array(10).fill('product'),
      }
      expect(generateContentSchema.parse(input)).toEqual(input)
    })
  })

  describe('invalid inputs', () => {
    it('should reject prompt shorter than 10 characters', () => {
      expect(() => generateContentSchema.parse({ prompt: 'short' })).toThrow(ZodError)
    })

    it('should reject prompt longer than 1000 characters', () => {
      const longPrompt = 'a'.repeat(1001)
      expect(() => generateContentSchema.parse({ prompt: longPrompt })).toThrow(ZodError)
    })

    it('should reject more than 20 keywords', () => {
      const input = {
        prompt: 'Valid prompt here',
        keywords: Array(21).fill('keyword'),
      }
      expect(() => generateContentSchema.parse(input)).toThrow(ZodError)
    })

    it('should reject more than 10 affiliate products', () => {
      const input = {
        prompt: 'Valid prompt here',
        affiliateProducts: Array(11).fill('product'),
      }
      expect(() => generateContentSchema.parse(input)).toThrow(ZodError)
    })
  })
})

describe('imageUploadSchema', () => {
  describe('valid image uploads', () => {
    it('should accept image within size limit', () => {
      const input = {
        size: 3 * 1024 * 1024, // 3MB
        type: 'image/png',
      }
      expect(imageUploadSchema.parse(input)).toEqual(input)
    })

    it('should accept various image types', () => {
      expect(imageUploadSchema.parse({ size: 1024, type: 'image/jpeg' })).toBeTruthy()
      expect(imageUploadSchema.parse({ size: 1024, type: 'image/gif' })).toBeTruthy()
      expect(imageUploadSchema.parse({ size: 1024, type: 'image/webp' })).toBeTruthy()
    })
  })

  describe('invalid image uploads', () => {
    it('should reject files larger than 5MB', () => {
      const input = {
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/png',
      }
      expect(() => imageUploadSchema.parse(input)).toThrow(ZodError)
    })

    it('should reject non-image files', () => {
      const input = {
        size: 1024,
        type: 'application/pdf',
      }
      expect(() => imageUploadSchema.parse(input)).toThrow(ZodError)
    })
  })
})

describe('paginationSchema', () => {
  describe('valid pagination params', () => {
    it('should accept valid page and limit', () => {
      const input = { page: '1', limit: '10' }
      const result = paginationSchema.parse(input)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should transform string numbers to integers', () => {
      const result = paginationSchema.parse({ page: '5', limit: '20' })
      expect(typeof result.page).toBe('number')
      expect(typeof result.limit).toBe('number')
    })

    it('should accept search and tag filters', () => {
      const input = { search: 'test query', tag: 'tech' }
      expect(paginationSchema.parse(input)).toEqual(input)
    })

    it('should accept null values', () => {
      const input = { page: null, limit: null }
      expect(paginationSchema.parse(input)).toEqual(input)
    })
  })

  describe('invalid pagination params', () => {
    it('should reject page less than 1', () => {
      expect(() => paginationSchema.parse({ page: '0' })).toThrow(ZodError)
      expect(() => paginationSchema.parse({ page: '-1' })).toThrow(ZodError)
    })

    it('should reject limit greater than 100', () => {
      expect(() => paginationSchema.parse({ limit: '101' })).toThrow(ZodError)
    })

    it('should reject limit less than 1', () => {
      expect(() => paginationSchema.parse({ limit: '0' })).toThrow(ZodError)
    })
  })
})

describe('adminAuthSchema', () => {
  describe('valid auth', () => {
    it('should accept non-empty password', () => {
      expect(adminAuthSchema.parse({ password: 'secret123' })).toEqual({ password: 'secret123' })
    })

    it('should accept long password', () => {
      const password = 'a'.repeat(100)
      expect(adminAuthSchema.parse({ password })).toEqual({ password })
    })
  })

  describe('invalid auth', () => {
    it('should reject empty password', () => {
      expect(() => adminAuthSchema.parse({ password: '' })).toThrow(ZodError)
    })
  })
})

describe('createPostSchema', () => {
  describe('valid post creation', () => {
    it('should accept complete post data', () => {
      const post = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'This is the content',
        excerpt: 'Short description',
        coverImage: 'https://example.com/image.jpg',
        tags: ['tech', 'ai'],
        seoTitle: 'SEO Title',
        seoDescription: 'SEO Description',
        youtubeVideoId: 'dQw4w9WgXcQ',
      }
      expect(createPostSchema.parse(post)).toEqual(post)
    })

    it('should accept minimal post data', () => {
      const post = {
        title: 'Minimal Post',
        slug: 'minimal-post',
        content: 'Content',
      }
      expect(createPostSchema.parse(post)).toBeDefined()
    })
  })

  describe('invalid post creation', () => {
    it('should reject missing required fields', () => {
      expect(() => createPostSchema.parse({})).toThrow(ZodError)
      expect(() => createPostSchema.parse({ title: 'Test' })).toThrow(ZodError)
      expect(() => createPostSchema.parse({ title: 'Test', slug: 'test' })).toThrow(ZodError)
    })

    it('should reject title longer than 200 characters', () => {
      const post = {
        title: 'a'.repeat(201),
        slug: 'test',
        content: 'content',
      }
      expect(() => createPostSchema.parse(post)).toThrow(ZodError)
    })

    it('should reject invalid cover image URL', () => {
      const post = {
        title: 'Test',
        slug: 'test',
        content: 'content',
        coverImage: 'not a url',
      }
      expect(() => createPostSchema.parse(post)).toThrow(ZodError)
    })

    it('should reject SEO title longer than 70 characters', () => {
      const post = {
        title: 'Test',
        slug: 'test',
        content: 'content',
        seoTitle: 'a'.repeat(71),
      }
      expect(() => createPostSchema.parse(post)).toThrow(ZodError)
    })

    it('should reject SEO description longer than 160 characters', () => {
      const post = {
        title: 'Test',
        slug: 'test',
        content: 'content',
        seoDescription: 'a'.repeat(161),
      }
      expect(() => createPostSchema.parse(post)).toThrow(ZodError)
    })
  })
})

describe('updatePostSchema', () => {
  it('should accept partial updates', () => {
    expect(updatePostSchema.parse({ title: 'New Title' })).toBeDefined()
    expect(updatePostSchema.parse({ content: 'New Content' })).toBeDefined()
    expect(updatePostSchema.parse({})).toBeDefined()
  })

  it('should validate partial fields correctly', () => {
    // Should still enforce validation rules
    expect(() => updatePostSchema.parse({ title: 'a'.repeat(201) })).toThrow(ZodError)
  })
})

describe('extractYouTubeVideoId', () => {
  describe('standard watch URLs', () => {
    it('should extract ID from standard URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from URL without www', () => {
      expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from URL with additional params', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share')).toBe('dQw4w9WgXcQ')
    })
  })

  describe('short URLs', () => {
    it('should extract ID from youtu.be URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from youtu.be with params', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe('dQw4w9WgXcQ')
    })
  })

  describe('embed URLs', () => {
    it('should extract ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })
  })

  describe('direct video ID', () => {
    it('should return ID if already in correct format', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should validate ID length', () => {
      expect(extractYouTubeVideoId('short')).toBeNull()
      expect(extractYouTubeVideoId('toolongvideoid')).toBeNull()
    })
  })

  describe('invalid inputs', () => {
    it('should return null for non-YouTube URLs', () => {
      expect(extractYouTubeVideoId('https://vimeo.com/123456')).toBeNull()
    })

    it('should return null for invalid URLs', () => {
      expect(extractYouTubeVideoId('not a url')).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractYouTubeVideoId('')).toBeNull()
    })

    it('should handle errors gracefully', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch')).toBeNull()
    })
  })
})
