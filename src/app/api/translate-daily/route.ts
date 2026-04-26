export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = env.CRON_SECRET

  console.log('[DEBUG] Verifying cron secret:', {
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!cronSecret,
    authHeaderLength: authHeader?.length,
    cronSecretLength: cronSecret?.length
  })

  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured in environment variables')
    return false
  }

  const expectedHeader = `Bearer ${cronSecret}`
  const isValid = authHeader === expectedHeader

  if (!isValid) {
    console.error('❌ Invalid authorization header')
  }

  return isValid
}

// Daily quota limit (leave buffer)
const DAILY_QUOTA = 45

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌍 Starting daily translation batch...')

    // Get posts needing translation
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        originalLanguage: true,
        translations: {
          select: { locale: true }
        }
      }
    })

    // Find posts needing EN translation
    const needsEN = posts.filter(p =>
      p.originalLanguage === 'ko' &&
      !p.translations.some(t => t.locale === 'en')
    )

    // Find posts needing KO translation
    const needsKO = posts.filter(p =>
      p.originalLanguage === 'en' &&
      !p.translations.some(t => t.locale === 'ko')
    )

    console.log(`📊 Found ${needsEN.length} posts needing English translation`)
    console.log(`📊 Found ${needsKO.length} posts needing Korean translation`)

    // Combine all translations needed
    const allTranslations = [
      ...needsEN.map(p => ({ id: p.id, title: p.title, targetLang: 'en' as const })),
      ...needsKO.map(p => ({ id: p.id, title: p.title, targetLang: 'ko' as const }))
    ]

    if (allTranslations.length === 0) {
      console.log('✅ No translations needed!')
      return NextResponse.json({
        success: true,
        message: 'No translations needed',
        completed: 0,
        remaining: 0
      })
    }

    // Process up to daily quota
    const todaysBatch = allTranslations.slice(0, DAILY_QUOTA)
    console.log(`🚀 Processing ${todaysBatch.length} translations today`)

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: Array<{ postId: string; error: string }> = []

    for (let i = 0; i < todaysBatch.length; i++) {
      const item = todaysBatch[i]
      console.log(`[${i + 1}/${todaysBatch.length}] Translating: "${item.title.substring(0, 50)}..." → ${item.targetLang}`)

      try {
        // Call the translate-posts API
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/admin/translate-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postIds: [item.id],
            targetLang: item.targetLang
          })
        })

        const result = await response.json()

        if (result.success && result.results.length > 0) {
          const r = result.results[0]
          if (r.status === 'success') {
            successCount++
            console.log(`  ✓ Success`)
          } else if (r.status === 'skipped') {
            skippedCount++
            console.log(`  ○ Skipped: ${r.message}`)
          } else {
            errorCount++
            errors.push({ postId: item.id, error: r.message })
            console.log(`  ✗ Error: ${r.message}`)

            // If quota exceeded, stop immediately
            if (r.message.includes('quota') || r.message.includes('429')) {
              console.log('⚠️  Daily quota exceeded. Stopping for today.')
              break
            }
          }
        } else {
          errorCount++
          errors.push({ postId: item.id, error: 'API call failed' })
          console.log(`  ✗ API call failed`)
        }

        // Small delay between requests to avoid rate limiting
        if (i < todaysBatch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ postId: item.id, error: errorMsg })
        console.error(`  ✗ Request failed:`, errorMsg)
      }
    }

    const remaining = allTranslations.length - todaysBatch.length + errorCount
    const daysRemaining = Math.ceil(remaining / DAILY_QUOTA)

    console.log('='.repeat(60))
    console.log('📊 Daily Translation Batch Complete!')
    console.log('='.repeat(60))
    console.log(`✓ Success: ${successCount}`)
    console.log(`○ Skipped: ${skippedCount}`)
    console.log(`✗ Errors: ${errorCount}`)
    console.log(`⏳ Remaining: ${remaining} translations`)
    console.log(`📅 Estimated days remaining: ${daysRemaining}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount + skippedCount} translations`,
      stats: {
        successful: successCount,
        skipped: skippedCount,
        errors: errorCount,
        remaining,
        daysRemaining
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in daily translation batch:', error)
    return NextResponse.json({
      error: 'Failed to process translations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Support GET for manual testing
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get translation status
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      originalLanguage: true,
      translations: {
        select: { locale: true }
      }
    }
  })

  const needsEN = posts.filter(p =>
    p.originalLanguage === 'ko' &&
    !p.translations.some(t => t.locale === 'en')
  ).length

  const needsKO = posts.filter(p =>
    p.originalLanguage === 'en' &&
    !p.translations.some(t => t.locale === 'ko')
  ).length

  return NextResponse.json({
    message: 'Daily translation endpoint is ready',
    status: {
      needsEnglish: needsEN,
      needsKorean: needsKO,
      total: needsEN + needsKO,
      dailyQuota: DAILY_QUOTA,
      estimatedDays: Math.ceil((needsEN + needsKO) / DAILY_QUOTA)
    },
    timestamp: new Date().toISOString()
  })
}
