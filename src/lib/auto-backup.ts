#!/usr/bin/env tsx

/**
 * 자동 로컬 백업 시스템
 * 포스트 생성/수정 시 자동으로 로컬에 백업하여 데이터 손실 방지
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

// 백업 디렉토리 설정
const BACKUP_DIR = path.join(process.cwd(), 'local-backups')

export interface PostBackup {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  author: string
  tags: string
  seoTitle: string | null
  seoDescription: string | null
  views: number
  status: string
  socialLinks: string | null
  youtubeVideoId: string | null
  originalLanguage: string
  globalRank: number | null
  translations?: any[]
}

export type BackupTrigger = 'post-create' | 'post-update' | 'daily-backup' | 'manual-request' | 'youtube-sync'

export interface BackupFile {
  timestamp: string
  version: string
  totalPosts: number
  posts: PostBackup[]
  metadata: {
    source: 'turso-database'
    backupType: 'automatic' | 'manual' | 'migration'
    triggeredBy?: BackupTrigger
  }
}

/**
 * 백업 디렉토리 초기화
 */
function ensureBackupDirectory(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`📁 백업 디렉토리 생성: ${BACKUP_DIR}`)
  }
}

/**
 * 특정 포스트의 로컬 백업 생성
 *
 * @param postId - 백업할 포스트의 ID
 * @param triggeredBy - 백업 트리거 타입 (기본값: 'post-update')
 * @returns 백업 파일 경로 또는 실패 시 null
 *
 * @example
 * ```typescript
 * const backupPath = await backupSinglePost('post-123', 'post-create')
 * if (backupPath) {
 *   console.log(`Backup created at: ${backupPath}`)
 * }
 * ```
 */
export async function backupSinglePost(postId: string, triggeredBy: BackupTrigger = 'post-update'): Promise<string | null> {
  try {
    // 입력 검증
    if (!postId || typeof postId !== 'string' || postId.trim().length === 0) {
      throw new Error('Invalid postId: postId must be a non-empty string')
    }

    ensureBackupDirectory()

    // 포스트 데이터 가져오기
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        translations: true
      }
    })

    if (!post) {
      console.error(`❌ 포스트를 찾을 수 없습니다: ${postId}`)
      return null
    }

    // 백업 파일 생성
    const backupData: BackupFile = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      totalPosts: 1,
      posts: [post as PostBackup],
      metadata: {
        source: 'turso-database',
        backupType: 'automatic',
        triggeredBy
      }
    }

    // 안전한 파일명 생성 (slug가 너무 길 경우 잘라내기)
    const safeSlug = post.slug.substring(0, 50).replace(/[^a-zA-Z0-9-]/g, '-')
    const fileName = `single-post-backup-${safeSlug}-${Date.now()}.json`
    const filePath = path.join(BACKUP_DIR, fileName)

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

    console.log(`✅ 단일 포스트 백업 완료: ${fileName}`)
    console.log(`📄 포스트: "${post.title}"`)

    return filePath
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ 단일 포스트 백업 실패 (postId: ${postId}):`, errorMessage)
    return null
  }
}

/**
 * 전체 데이터베이스 백업 생성
 *
 * @param triggeredBy - 백업 트리거 타입 (기본값: 'daily-backup')
 * @returns 백업 파일 경로 또는 실패 시 null
 *
 * @example
 * ```typescript
 * const backupPath = await backupAllPosts('manual-request')
 * if (backupPath) {
 *   console.log(`Full backup created: ${backupPath}`)
 * }
 * ```
 */
export async function backupAllPosts(triggeredBy: BackupTrigger = 'daily-backup'): Promise<string | null> {
  try {
    ensureBackupDirectory()

    console.log('🔄 전체 포스트 백업 시작...')

    // 모든 포스트 데이터 가져오기
    const posts = await prisma.post.findMany({
      include: {
        translations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 백업할 포스트 수: ${posts.length}개`)

    if (posts.length === 0) {
      console.warn('⚠️ 백업할 포스트가 없습니다')
    }

    // 백업 파일 생성
    const backupData: BackupFile = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      totalPosts: posts.length,
      posts: posts as PostBackup[],
      metadata: {
        source: 'turso-database',
        backupType: 'automatic',
        triggeredBy
      }
    }

    const fileName = `full-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
    const filePath = path.join(BACKUP_DIR, fileName)

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

    console.log(`✅ 전체 백업 완료: ${fileName}`)
    console.log(`📄 백업된 포스트: ${posts.length}개`)
    console.log(`📁 파일 위치: ${filePath}`)

    return filePath
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ 전체 백업 실패:`, errorMessage)
    return null
  }
}

/**
 * 백업 파일 목록 조회 (최신순 정렬)
 *
 * @returns 백업 파일명 배열 (최신순)
 *
 * @example
 * ```typescript
 * const backups = listBackups()
 * console.log(`Total backups: ${backups.length}`)
 * ```
 */
export function listBackups(): string[] {
  try {
    ensureBackupDirectory()

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const aTime = fs.statSync(path.join(BACKUP_DIR, a)).mtime
        const bTime = fs.statSync(path.join(BACKUP_DIR, b)).mtime
        return bTime.getTime() - aTime.getTime() // 최신순
      })

    return files
  } catch (error) {
    console.error('❌ 백업 파일 목록 조회 실패:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

/**
 * 백업 파일에서 데이터 복원
 *
 * @param backupFileName - 복원할 백업 파일명
 * @returns 성공 여부
 *
 * @throws 백업 파일이 유효하지 않거나 형식이 잘못된 경우
 *
 * @example
 * ```typescript
 * const success = await restoreFromBackup('full-backup-2025-10-27.json')
 * if (success) {
 *   console.log('Restore completed successfully')
 * }
 * ```
 */
export async function restoreFromBackup(backupFileName: string): Promise<boolean> {
  try {
    // 입력 검증
    if (!backupFileName || typeof backupFileName !== 'string') {
      throw new Error('Invalid backupFileName: must be a non-empty string')
    }

    // 경로 traversal 공격 방지
    if (backupFileName.includes('..') || backupFileName.includes('/') || backupFileName.includes('\\')) {
      throw new Error('Invalid backupFileName: path traversal detected')
    }

    const backupPath = path.join(BACKUP_DIR, backupFileName)

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupFileName}`)
      return false
    }

    const backupContent = fs.readFileSync(backupPath, 'utf8')
    const backupData: BackupFile = JSON.parse(backupContent)

    // 백업 파일 형식 검증
    if (!backupData.posts || !Array.isArray(backupData.posts)) {
      throw new Error('Invalid backup file format: posts array missing')
    }

    console.log(`🔄 백업에서 복원 시작...`)
    console.log(`📊 복원할 포스트 수: ${backupData.totalPosts}개`)

    let successCount = 0
    let errorCount = 0

    for (const postData of backupData.posts) {
      try {
        // tags 데이터 정규화
        const tagsString = Array.isArray(postData.tags)
          ? postData.tags.join(',')
          : postData.tags || ''

        await prisma.post.upsert({
          where: { slug: postData.slug },
          update: {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            coverImage: postData.coverImage,
            publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : null,
            updatedAt: new Date(),
            author: postData.author,
            tags: tagsString,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
            views: postData.views || 0,
            status: (postData.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
            socialLinks: postData.socialLinks,
            youtubeVideoId: postData.youtubeVideoId,
            originalLanguage: postData.originalLanguage || 'ko',
            globalRank: postData.globalRank
          },
          create: {
            id: postData.id,
            title: postData.title,
            slug: postData.slug,
            content: postData.content,
            excerpt: postData.excerpt,
            coverImage: postData.coverImage,
            publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : null,
            createdAt: postData.createdAt ? new Date(postData.createdAt) : new Date(),
            updatedAt: new Date(),
            author: postData.author,
            tags: tagsString,
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
            views: postData.views || 0,
            status: (postData.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
            socialLinks: postData.socialLinks,
            youtubeVideoId: postData.youtubeVideoId,
            originalLanguage: postData.originalLanguage || 'ko',
            globalRank: postData.globalRank
          }
        })

        successCount++
        console.log(`✅ 복원 완료: ${postData.title}`)
      } catch (error) {
        errorCount++
        console.error(`❌ 복원 실패 (${postData.title}):`, error)
      }
    }

    console.log(`🎉 복원 완료! 성공: ${successCount}개, 실패: ${errorCount}개`)
    return errorCount === 0
  } catch (error) {
    console.error(`❌ 백업 복원 실패:`, error)
    return false
  }
}

/**
 * 오래된 백업 파일 정리
 *
 * @param maxAgeInDays - 보관 기간 (일 단위, 기본값: 30일)
 * @returns 삭제된 파일 개수
 *
 * @example
 * ```typescript
 * const deletedCount = cleanupOldBackups(60) // 60일 이상된 백업 파일 삭제
 * console.log(`Deleted ${deletedCount} old backup files`)
 * ```
 */
export function cleanupOldBackups(maxAgeInDays: number = 30): number {
  try {
    // 입력 검증
    if (typeof maxAgeInDays !== 'number' || maxAgeInDays < 0 || !Number.isFinite(maxAgeInDays)) {
      throw new Error('Invalid maxAgeInDays: must be a positive number')
    }

    ensureBackupDirectory()

    const files = fs.readdirSync(BACKUP_DIR)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays)

    let deletedCount = 0

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file)

      try {
        const stat = fs.statSync(filePath)

        // 디렉토리는 건너뛰기
        if (stat.isDirectory()) {
          return
        }

        if (stat.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
          console.log(`🗑️ 오래된 백업 파일 삭제: ${file}`)
        }
      } catch (error) {
        console.warn(`⚠️ 파일 삭제 실패: ${file}`, error instanceof Error ? error.message : 'Unknown error')
      }
    })

    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount}개의 오래된 백업 파일을 정리했습니다`)
    } else {
      console.log(`✨ 정리할 오래된 백업 파일이 없습니다`)
    }

    return deletedCount
  } catch (error) {
    console.error('❌ 백업 파일 정리 실패:', error instanceof Error ? error.message : 'Unknown error')
    return 0
  }
}

/**
 * 백업 상태 조회
 *
 * @returns 백업 디렉토리 정보, 백업 개수, 최신 백업 파일명, 총 크기
 *
 * @example
 * ```typescript
 * const status = getBackupStatus()
 * console.log(`Backups: ${status.totalBackups}, Size: ${status.totalSize}`)
 * ```
 */
export function getBackupStatus(): {
  backupDir: string
  totalBackups: number
  latestBackup: string | null
  totalSize: string
} {
  try {
    ensureBackupDirectory()

    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'))

    // 최신 파일 찾기 (수정 시간 기준)
    let latestBackup: string | null = null
    let latestTime = 0

    files.forEach(file => {
      try {
        const filePath = path.join(BACKUP_DIR, file)
        const stat = fs.statSync(filePath)
        if (stat.mtime.getTime() > latestTime) {
          latestTime = stat.mtime.getTime()
          latestBackup = file
        }
      } catch (error) {
        console.warn(`⚠️ 파일 통계 조회 실패: ${file}`)
      }
    })

    // 총 크기 계산
    let totalSize = 0
    files.forEach(file => {
      try {
        const filePath = path.join(BACKUP_DIR, file)
        totalSize += fs.statSync(filePath).size
      } catch (error) {
        console.warn(`⚠️ 파일 크기 조회 실패: ${file}`)
      }
    })

    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    return {
      backupDir: BACKUP_DIR,
      totalBackups: files.length,
      latestBackup,
      totalSize: formatSize(totalSize)
    }
  } catch (error) {
    console.error('❌ 백업 상태 조회 실패:', error instanceof Error ? error.message : 'Unknown error')
    return {
      backupDir: BACKUP_DIR,
      totalBackups: 0,
      latestBackup: null,
      totalSize: '0 B'
    }
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    switch (command) {
      case 'backup-all':
        await backupAllPosts('manual-request')
        break
      case 'backup-post':
        const postId = args[1]
        if (!postId) {
          console.error('❌ 포스트 ID를 제공해주세요: npm run backup-post <post-id>')
          process.exit(1)
        }
        await backupSinglePost(postId, 'manual-request')
        break
      case 'list':
        const backups = listBackups()
        console.log(`📋 백업 파일 목록 (${backups.length}개):`)
        backups.forEach((file, index) => {
          console.log(`${index + 1}. ${file}`)
        })
        break
      case 'status':
        const status = getBackupStatus()
        console.log('📊 백업 상태:')
        console.log(`  디렉토리: ${status.backupDir}`)
        console.log(`  총 백업: ${status.totalBackups}개`)
        console.log(`  최신 백업: ${status.latestBackup || 'None'}`)
        console.log(`  총 크기: ${status.totalSize}`)
        break
      case 'cleanup':
        const days = parseInt(args[1]) || 30
        cleanupOldBackups(days)
        break
      case 'restore':
        const backupFile = args[1]
        if (!backupFile) {
          console.error('❌ 백업 파일명을 제공해주세요: npm run restore <backup-file>')
          process.exit(1)
        }
        await restoreFromBackup(backupFile)
        break
      default:
        console.log('사용법:')
        console.log('  npm run backup-all          # 전체 백업')
        console.log('  npm run backup-post <id>     # 단일 포스트 백업')
        console.log('  npm run backup-list          # 백업 목록')
        console.log('  npm run backup-status        # 백업 상태')
        console.log('  npm run backup-cleanup [days] # 오래된 백업 정리')
        console.log('  npm run backup-restore <file> # 백업에서 복원')
    }
  }

  main().catch(console.error)
}