/**
 * Tests for YouTube configuration
 *
 * Coverage goal: 100%
 * Test approach: Unit tests with environment variable mocking
 *
 * Test cases:
 * - getYouTubeConfig: valid config, missing env vars, console warnings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('youtube-config', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleErrorSpy.mockRestore()
    vi.resetModules()
  })

  describe('getYouTubeConfig', () => {
    describe('with valid environment variables', () => {
      it('should return config with apiKey and channelId', async () => {
        process.env.YOUTUBE_API_KEY = 'test-api-key-123'
        process.env.YOUTUBE_CHANNEL_ID = 'test-channel-id-456'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config).toEqual({
          apiKey: 'test-api-key-123',
          channelId: 'test-channel-id-456',
        })
      })

      it('should not log warnings when env vars are set', async () => {
        process.env.YOUTUBE_API_KEY = 'test-api-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-channel-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        getYouTubeConfig()

        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })

      it('should handle different API key formats', async () => {
        process.env.YOUTUBE_API_KEY = 'AIzaSyABC123-XYZ789_def456'
        process.env.YOUTUBE_CHANNEL_ID = 'UCxxxxxxxxxxxxxxxxxxx'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config.apiKey).toBe('AIzaSyABC123-XYZ789_def456')
        expect(config.channelId).toBe('UCxxxxxxxxxxxxxxxxxxx')
      })
    })

    describe('with missing environment variables', () => {
      it('should return empty strings when both vars are missing', async () => {
        delete process.env.YOUTUBE_API_KEY
        delete process.env.YOUTUBE_CHANNEL_ID
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config).toEqual({
          apiKey: '',
          channelId: '',
        })
      })

      it('should log warning when YOUTUBE_API_KEY is missing', async () => {
        delete process.env.YOUTUBE_API_KEY
        process.env.YOUTUBE_CHANNEL_ID = 'test-channel-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        getYouTubeConfig()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_API_KEY is not set in environment variables!'
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Please set it in Vercel Dashboard: Settings → Environment Variables'
        )
      })

      it('should log warning when YOUTUBE_CHANNEL_ID is missing', async () => {
        process.env.YOUTUBE_API_KEY = 'test-api-key'
        delete process.env.YOUTUBE_CHANNEL_ID
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        getYouTubeConfig()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_CHANNEL_ID is not set in environment variables!'
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Please set it in Vercel Dashboard: Settings → Environment Variables'
        )
      })

      it('should log both warnings when both vars are missing', async () => {
        delete process.env.YOUTUBE_API_KEY
        delete process.env.YOUTUBE_CHANNEL_ID
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        getYouTubeConfig()

        // Should have 4 calls total (2 for each missing var)
        expect(consoleErrorSpy).toHaveBeenCalledTimes(4)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_API_KEY is not set in environment variables!'
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_CHANNEL_ID is not set in environment variables!'
        )
      })

      it('should handle empty string env vars as missing', async () => {
        process.env.YOUTUBE_API_KEY = ''
        process.env.YOUTUBE_CHANNEL_ID = ''
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        // Empty strings should be returned as-is
        expect(config.apiKey).toBe('')
        expect(config.channelId).toBe('')

        // Warnings should be logged (because empty strings are falsy)
        expect(consoleErrorSpy).toHaveBeenCalledTimes(4) // 2 for each missing var
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_API_KEY is not set in environment variables!'
        )
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '⚠️ YOUTUBE_CHANNEL_ID is not set in environment variables!'
        )
      })
    })

    describe('return value structure', () => {
      it('should always return object with apiKey and channelId properties', async () => {
        process.env.YOUTUBE_API_KEY = 'test-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config).toHaveProperty('apiKey')
        expect(config).toHaveProperty('channelId')
        expect(typeof config.apiKey).toBe('string')
        expect(typeof config.channelId).toBe('string')
      })

      it('should have exactly 2 properties', async () => {
        process.env.YOUTUBE_API_KEY = 'test-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(Object.keys(config)).toHaveLength(2)
      })

      it('should not mutate environment variables', async () => {
        process.env.YOUTUBE_API_KEY = 'original-key'
        process.env.YOUTUBE_CHANNEL_ID = 'original-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        getYouTubeConfig()

        expect(process.env.YOUTUBE_API_KEY).toBe('original-key')
        expect(process.env.YOUTUBE_CHANNEL_ID).toBe('original-id')
      })
    })

    describe('multiple calls', () => {
      it('should return consistent values on multiple calls', async () => {
        process.env.YOUTUBE_API_KEY = 'test-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config1 = getYouTubeConfig()
        const config2 = getYouTubeConfig()

        expect(config1).toEqual(config2)
      })

      it('should create new config object on each call', async () => {
        process.env.YOUTUBE_API_KEY = 'test-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config1 = getYouTubeConfig()
        const config2 = getYouTubeConfig()

        // Should be equal but not the same reference
        expect(config1).toEqual(config2)
        expect(config1).not.toBe(config2)
      })

      it('should log warnings on each call when vars are missing', async () => {
        delete process.env.YOUTUBE_API_KEY
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')

        getYouTubeConfig()
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2)

        getYouTubeConfig()
        expect(consoleErrorSpy).toHaveBeenCalledTimes(4) // 2 more calls
      })
    })

    describe('edge cases', () => {
      it('should handle very long API keys', async () => {
        const longKey = 'A'.repeat(1000)
        process.env.YOUTUBE_API_KEY = longKey
        process.env.YOUTUBE_CHANNEL_ID = 'test-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config.apiKey).toBe(longKey)
        expect(config.apiKey.length).toBe(1000)
      })

      it('should handle special characters in env vars', async () => {
        process.env.YOUTUBE_API_KEY = 'key-with-!@#$%^&*()_+-='
        process.env.YOUTUBE_CHANNEL_ID = 'id-with-special-chars_123'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config.apiKey).toBe('key-with-!@#$%^&*()_+-=')
        expect(config.channelId).toBe('id-with-special-chars_123')
      })

      it('should handle unicode characters', async () => {
        process.env.YOUTUBE_API_KEY = 'test-🔑-key'
        process.env.YOUTUBE_CHANNEL_ID = 'test-📺-id'
        vi.resetModules()

        const { getYouTubeConfig } = await import('../youtube-config')
        const config = getYouTubeConfig()

        expect(config.apiKey).toBe('test-🔑-key')
        expect(config.channelId).toBe('test-📺-id')
      })
    })
  })
})
