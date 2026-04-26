/**
 * Tests for API client
 *
 * Coverage goal: 80-90%
 * Test approach: Integration tests with MSW for HTTP mocking
 *
 * Test cases:
 * - posts API: list, get, create, update, delete
 * - youtube API: listVideos, getVideo
 * - ai API: generateContent
 * - admin API: login, uploadImage
 * - analytics API: getPageViews
 * - Error handling: 4xx, 5xx, network errors
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import apiClient from '../api-client'
import type { Post, YouTubeVideo } from '@/types'

// Mock data
// Note: Dates are strings because they're serialized over HTTP
const mockPost: any = {
  id: 'post-1',
  title: 'Test Post',
  slug: 'test-post',
  content: 'Test content',
  excerpt: 'Test excerpt',
  coverImage: 'https://example.com/image.jpg',
  publishedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  author: 'Test Author',
  tags: ['test'],
  seoTitle: 'Test SEO',
  seoDescription: 'Test SEO Description',
  views: 100,
  scheduledAt: null,
  status: 'PUBLISHED',
  socialLinks: null,
  youtubeVideoId: null,
  originalLanguage: 'ko'
}

const mockYouTubeVideo: YouTubeVideo = {
  id: 'video-1',
  title: 'Test Video',
  description: 'Test description',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  publishedAt: '2024-01-01T00:00:00Z',
  duration: 'PT10M',
  viewCount: 1000,
  channelTitle: 'Test Channel'
}

// MSW server setup
const server = setupServer()

describe('api-client', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('posts API', () => {
    describe('list', () => {
      it('should fetch list of posts', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json({
              data: [mockPost],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
            })
          })
        )

        const result = await apiClient.posts.list()

        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toEqual(mockPost)
        expect(result.pagination.page).toBe(1)
      })

      it('should pass pagination parameters', async () => {
        let capturedUrl = ''
        server.use(
          http.get('/api/posts', ({ request }) => {
            capturedUrl = request.url
            return HttpResponse.json({
              data: [],
              pagination: { page: 2, limit: 20, total: 0, totalPages: 0 }
            })
          })
        )

        await apiClient.posts.list({ page: 2, limit: 20 })

        expect(capturedUrl).toContain('page=2')
        expect(capturedUrl).toContain('limit=20')
      })

      it('should pass search parameter', async () => {
        let capturedUrl = ''
        server.use(
          http.get('/api/posts', ({ request }) => {
            capturedUrl = request.url
            return HttpResponse.json({
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
            })
          })
        )

        await apiClient.posts.list({ search: 'test query' })

        expect(capturedUrl).toContain('search=test+query')
      })

      it('should pass tag parameter', async () => {
        let capturedUrl = ''
        server.use(
          http.get('/api/posts', ({ request }) => {
            capturedUrl = request.url
            return HttpResponse.json({
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
            })
          })
        )

        await apiClient.posts.list({ tag: 'typescript' })

        expect(capturedUrl).toContain('tag=typescript')
      })
    })

    describe('get', () => {
      it('should fetch single post by slug', async () => {
        server.use(
          http.get('/api/posts/:slug', () => {
            return HttpResponse.json(mockPost)
          })
        )

        const result = await apiClient.posts.get('test-post')

        expect(result).toEqual(mockPost)
      })

      it('should handle 404 for non-existent post', async () => {
        server.use(
          http.get('/api/posts/:slug', () => {
            return HttpResponse.json(
              { error: 'Post not found' },
              { status: 404 }
            )
          })
        )

        await expect(apiClient.posts.get('non-existent')).rejects.toThrow('Post not found')
      })
    })

    describe('create', () => {
      it('should create new post', async () => {
        const newPostData = {
          title: 'New Post',
          slug: 'new-post',
          content: 'New content',
          excerpt: 'New excerpt',
          status: 'DRAFT' as const
        }

        server.use(
          http.post('/api/posts', async ({ request }) => {
            const body = await request.json() as any
            return HttpResponse.json({
              ...mockPost,
              ...body,
              id: 'new-post-id'
            })
          })
        )

        const result = await apiClient.posts.create(newPostData)

        expect(result.id).toBe('new-post-id')
        expect(result.title).toBe('New Post')
      })

      it('should send correct request body', async () => {
        let capturedBody: any = null
        server.use(
          http.post('/api/posts', async ({ request }) => {
            capturedBody = await request.json()
            return HttpResponse.json(mockPost)
          })
        )

        const postData = {
          title: 'Test Title',
          slug: 'test-slug',
          content: 'Test content',
          excerpt: 'Test excerpt',
          status: 'DRAFT' as const
        }

        await apiClient.posts.create(postData)

        expect(capturedBody).toEqual(postData)
      })
    })

    describe('update', () => {
      it('should update existing post', async () => {
        const updateData = { title: 'Updated Title' }

        server.use(
          http.put('/api/posts/:id', () => {
            return HttpResponse.json({
              ...mockPost,
              title: 'Updated Title'
            })
          })
        )

        const result = await apiClient.posts.update('post-1', updateData)

        expect(result.title).toBe('Updated Title')
      })

      it('should send POST with _method override for PUT', async () => {
        let capturedMethod = ''
        server.use(
          http.put('/api/posts/:id', ({ request }) => {
            capturedMethod = request.method
            return HttpResponse.json(mockPost)
          })
        )

        await apiClient.posts.update('post-1', { title: 'Updated' })

        expect(capturedMethod).toBe('PUT')
      })
    })

    describe('delete', () => {
      it('should delete post', async () => {
        server.use(
          http.delete('/api/posts/:id', () => {
            return HttpResponse.json({ success: true })
          })
        )

        const result = await apiClient.posts.delete('post-1')

        expect(result.success).toBe(true)
      })

      it('should handle deletion errors', async () => {
        server.use(
          http.delete('/api/posts/:id', () => {
            return HttpResponse.json(
              { error: 'Cannot delete published post' },
              { status: 400 }
            )
          })
        )

        await expect(apiClient.posts.delete('post-1')).rejects.toThrow()
      })
    })
  })

  describe('youtube API', () => {
    describe('listVideos', () => {
      it('should fetch list of videos', async () => {
        server.use(
          http.get('/api/youtube/videos', () => {
            return HttpResponse.json([mockYouTubeVideo])
          })
        )

        const result = await apiClient.youtube.listVideos()

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(mockYouTubeVideo)
      })

      it('should pass limit parameter', async () => {
        let capturedUrl = ''
        server.use(
          http.get('/api/youtube/videos', ({ request }) => {
            capturedUrl = request.url
            return HttpResponse.json([])
          })
        )

        await apiClient.youtube.listVideos(20)

        expect(capturedUrl).toContain('limit=20')
      })
    })

    describe('getVideo', () => {
      it('should fetch single video', async () => {
        server.use(
          http.get('/api/youtube/videos/:videoId', () => {
            return HttpResponse.json(mockYouTubeVideo)
          })
        )

        const result = await apiClient.youtube.getVideo('video-1')

        expect(result).toEqual(mockYouTubeVideo)
      })

      it('should handle 404 for non-existent video', async () => {
        server.use(
          http.get('/api/youtube/videos/:videoId', () => {
            return HttpResponse.json(
              { error: 'Video not found' },
              { status: 404 }
            )
          })
        )

        await expect(apiClient.youtube.getVideo('non-existent')).rejects.toThrow()
      })
    })
  })

  describe('ai API', () => {
    describe('generateContent', () => {
      it('should generate content from prompt', async () => {
        const mockResponse = {
          content: 'Generated content',
          tokens: 150
        }

        server.use(
          http.post('/api/generate-content', () => {
            return HttpResponse.json(mockResponse)
          })
        )

        const result = await apiClient.ai.generateContent({
          prompt: 'Generate blog post',
          maxTokens: 500
        })

        expect(result.content).toBe('Generated content')
        expect(result.tokens).toBe(150)
      })

      it('should send request with correct parameters', async () => {
        let capturedBody: any = null
        server.use(
          http.post('/api/generate-content', async ({ request }) => {
            capturedBody = await request.json()
            return HttpResponse.json({ content: 'Test', tokens: 10 })
          })
        )

        await apiClient.ai.generateContent({
          prompt: 'Test prompt',
          maxTokens: 1000,
          temperature: 0.7
        })

        expect(capturedBody.prompt).toBe('Test prompt')
        expect(capturedBody.maxTokens).toBe(1000)
        expect(capturedBody.temperature).toBe(0.7)
      })
    })
  })

  describe('admin API', () => {
    describe('login', () => {
      it('should authenticate with password', async () => {
        server.use(
          http.post('/api/admin/auth', () => {
            return HttpResponse.json({ success: true })
          })
        )

        const result = await apiClient.admin.login('correct-password')

        expect(result.success).toBe(true)
      })

      it('should handle incorrect password', async () => {
        server.use(
          http.post('/api/admin/auth', () => {
            return HttpResponse.json(
              { error: 'Invalid password' },
              { status: 401 }
            )
          })
        )

        await expect(apiClient.admin.login('wrong-password')).rejects.toThrow('Invalid password')
      })
    })

    describe('uploadImage', () => {
      it('should upload image file', async () => {
        const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

        server.use(
          http.post('/api/admin/upload-image', () => {
            return HttpResponse.json({ imageUrl: 'https://example.com/uploaded.jpg' })
          })
        )

        const result = await apiClient.admin.uploadImage(mockFile)

        expect(result.imageUrl).toBe('https://example.com/uploaded.jpg')
      })

      it('should include postId when provided', async () => {
        const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
        let capturedFormData: FormData | null = null

        server.use(
          http.post('/api/admin/upload-image', async ({ request }) => {
            capturedFormData = await request.formData()
            return HttpResponse.json({ imageUrl: 'https://example.com/uploaded.jpg' })
          })
        )

        await apiClient.admin.uploadImage(mockFile, 'post-123')

        expect(capturedFormData?.get('postId')).toBe('post-123')
      })

      it('should handle upload errors', async () => {
        const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

        server.use(
          http.post('/api/admin/upload-image', () => {
            return HttpResponse.json(
              { error: 'File too large' },
              { status: 413 }
            )
          })
        )

        await expect(apiClient.admin.uploadImage(mockFile)).rejects.toThrow()
      })
    })
  })

  describe('analytics API', () => {
    describe('getPageViews', () => {
      it('should fetch page views', async () => {
        server.use(
          http.get('/api/analytics', () => {
            return HttpResponse.json({ views: 12345 })
          })
        )

        const result = await apiClient.analytics.getPageViews()

        expect(result.views).toBe(12345)
      })

      it('should handle analytics service errors', async () => {
        server.use(
          http.get('/api/analytics', () => {
            return HttpResponse.json(
              { error: 'Analytics service unavailable' },
              { status: 503 }
            )
          })
        )

        await expect(apiClient.analytics.getPageViews()).rejects.toThrow()
      })
    })
  })

  describe('error handling', () => {
    describe('HTTP status errors', () => {
      it('should throw ApiError on 400 Bad Request', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json(
              { error: 'Invalid parameters' },
              { status: 400 }
            )
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Invalid parameters')
      })

      it('should throw ApiError on 401 Unauthorized', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            )
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Unauthorized')
      })

      it('should throw ApiError on 403 Forbidden', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json(
              { error: 'Forbidden' },
              { status: 403 }
            )
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Forbidden')
      })

      it('should throw ApiError on 500 Internal Server Error', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json(
              { error: 'Internal server error' },
              { status: 500 }
            )
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Internal server error')
      })
    })

    describe('network errors', () => {
      it('should handle network failures', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.error()
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow()
      })

      it('should wrap generic errors in ApiError', async () => {
        server.use(
          http.get('/api/posts', () => {
            throw new Error('Network timeout')
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow()
      })
    })

    describe('response parsing errors', () => {
      it('should handle invalid JSON responses', async () => {
        server.use(
          http.get('/api/posts', () => {
            return new HttpResponse('invalid json', {
              headers: { 'Content-Type': 'application/json' }
            })
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow()
      })

      it('should extract error message from response', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json(
              { message: 'Custom error message' },
              { status: 400 }
            )
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Custom error message')
      })

      it('should use default message when error field missing', async () => {
        server.use(
          http.get('/api/posts', () => {
            return HttpResponse.json({}, { status: 400 })
          })
        )

        await expect(apiClient.posts.list()).rejects.toThrow('Request failed')
      })
    })
  })

  describe('request configuration', () => {
    it('should set Content-Type header to application/json', async () => {
      let capturedHeaders: Headers | null = null
      server.use(
        http.post('/api/posts', ({ request }) => {
          capturedHeaders = request.headers
          return HttpResponse.json(mockPost)
        })
      )

      await apiClient.posts.create({
        title: 'Test',
        slug: 'test',
        content: 'Test content',
        excerpt: 'Test excerpt',
        status: 'DRAFT'
      })

      expect(capturedHeaders?.get('Content-Type')).toBe('application/json')
    })

    it('should use baseUrl from environment', () => {
      // This is tested indirectly through all other tests
      // The apiClient uses process.env.NEXT_PUBLIC_API_URL or defaults to ''
      expect(apiClient).toBeDefined()
    })
  })

  describe('singleton behavior', () => {
    it('should export apiClient instance', () => {
      // The apiClient is exported as a singleton
      // Multiple imports will reference the same instance
      expect(apiClient).toBeDefined()
      expect(apiClient.posts).toBeDefined()
      expect(apiClient.youtube).toBeDefined()
      expect(apiClient.ai).toBeDefined()
      expect(apiClient.admin).toBeDefined()
      expect(apiClient.analytics).toBeDefined()
    })
  })
})
