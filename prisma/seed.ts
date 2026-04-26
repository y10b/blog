import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import * as fs from 'fs'
import * as path from 'path'

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''
const adapter = tursoUrl.startsWith('libsql://')
  ? new PrismaLibSQL({ url: tursoUrl, authToken: process.env.DATABASE_AUTH_TOKEN || '' })
  : undefined

const prisma = adapter
  ? new PrismaClient({ adapter })
  : new PrismaClient()

interface SeoPost {
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string
  seoTitle: string
  seoDescription: string
  author: string
  publishedAt: string
  source: string
  sourceUrl: string
  coverImage: string | null
  originalLanguage: string
}

async function main() {
  console.log('🌱 Seeding intalk-blog database...')

  // 기존 데이터 전부 삭제
  await prisma.postAffiliateProduct.deleteMany()
  await prisma.affiliateProduct.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.postTranslation.deleteMany()
  await prisma.post.deleteMany()
  await prisma.knowledge.deleteMany()

  console.log('✅ Cleared all existing data.')

  // SEO 최적화된 콘텐츠 JSON 읽기
  const contentDir = path.resolve(__dirname, '../../intalk-blog-content')

  const file1 = path.join(contentDir, 'intalkpartners-com-seo.json')
  const file2 = path.join(contentDir, 'inblog-io-seo.json')

  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    console.error('❌ SEO content files not found in:', contentDir)
    console.error('   Expected:', file1)
    console.error('   Expected:', file2)
    process.exit(1)
  }

  const posts1: SeoPost[] = JSON.parse(fs.readFileSync(file1, 'utf-8'))
  const posts2: SeoPost[] = JSON.parse(fs.readFileSync(file2, 'utf-8'))
  const allPosts = [...posts1, ...posts2]

  console.log(`📄 Loaded ${posts1.length} posts from intalkpartners.com`)
  console.log(`📄 Loaded ${posts2.length} posts from inblog.io`)
  console.log(`📄 Total: ${allPosts.length} posts`)

  // slug 중복 체크
  const slugs = new Set<string>()
  for (const post of allPosts) {
    if (slugs.has(post.slug)) {
      console.warn(`⚠️  Duplicate slug: ${post.slug} - skipping`)
      continue
    }
    slugs.add(post.slug)
  }

  // 포스트 생성
  let created = 0
  for (const post of allPosts) {
    const publishedAt = post.publishedAt
      ? new Date(post.publishedAt)
      : new Date()

    try {
      await prisma.post.create({
        data: {
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || '',
          tags: post.tags,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          author: post.author || '인톡 파트너스',
          coverImage: post.coverImage,
          originalLanguage: post.originalLanguage || 'ko',
          status: 'PUBLISHED',
          publishedAt,
          views: Math.floor(Math.random() * 200) + 20,
        },
      })
      created++
      console.log(`  ✓ ${post.slug}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ ${post.slug}: ${message}`)
    }
  }

  console.log(`\n🎉 Done! Seeded ${created}/${allPosts.length} posts.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
