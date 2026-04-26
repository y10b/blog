export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { MASTER_SYSTEM_PROMPT, generateContentPrompt } from '@/lib/ai-prompts';
import { env } from '@/lib/env';
import { withErrorHandler, logger, ApiError, createSuccessResponse, validateRequest } from '@/lib/error-handler';
import { generateContentSchema } from '@/lib/validations';
import { generateSlug, generateUniqueSlugWithTimestamp } from '@/lib/utils/slug';
import { detectLanguage } from '@/lib/translation';
import { autoGenerateThumbnailUrl } from '@/lib/utils/thumbnail';
import { tagsToArray, tagsToString } from '@/lib/utils/tags'
import { checkGeminiRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { verifyAdminAuth } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Generate embedding for a text
async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Search for similar knowledge using vector similarity
async function searchSimilarKnowledge(queryEmbedding: number[], limit: number = 3) {
  // Use pgvector to find similar embeddings
  const results = await prisma.$queryRaw`
    SELECT id, content, source,
           1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "Knowledge"
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results as Array<{
    id: string;
    content: string;
    source: string | null;
    similarity: number;
  }>;
}

async function generateContentHandler(request: NextRequest) {
  // Validate input data
  const validatedData = await validateRequest(request, generateContentSchema);
  const { prompt, keywords, affiliateProducts, publishDate } = validatedData;

  logger.info('Generating content', {
    promptLength: prompt.length,
    keywordsCount: keywords?.length || 0
  });

  // Step 1 & 2: RAG temporarily disabled for SQLite/Turso compatibility
  // TODO: Implement SQLite-compatible vector search or use external vector DB
  logger.info('RAG disabled (pgvector not compatible with SQLite/Turso)');
  const similarKnowledge: Array<{id: string; content: string; source: string | null; similarity: number}> = [];

  // Step 3a: Temporarily disabled - deduplication check causing issues
  logger.info('Deduplication check temporarily disabled');
    const existingPosts: Array<{title: string; slug: string; tags: string}> = [];
    const existingPostsContext = '';

    // Step 3b: Create RAG context
    const ragContext = similarKnowledge.length > 0 
      ? `\n\n**과거 기록 컨텍스트 (Past Knowledge Context):**\n${
          similarKnowledge.map((k, i) => 
            `\n[Context ${i + 1}${k.source ? ` - from "${k.source}"` : ''}]:\n${k.content.substring(0, 500)}...`
          ).join('\n')
        }\n\n**위 컨텍스트를 참고하여 나의 과거 생각과 스타일을 반영해 글을 작성해주세요.**\n\n`
      : '';

    // Step 4: Generate content with RAG context and existing posts
    logger.info('Starting Gemini content generation');
    const fullPrompt = `${MASTER_SYSTEM_PROMPT}\n\n------\n\n${existingPostsContext}${ragContext}**EXECUTE TASK:**\n\n${generateContentPrompt(prompt, keywords, affiliateProducts)}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    logger.info('Calling Gemini API');
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    });

    logger.info('Gemini API call successful');
    const responseText = result.response.text();
    logger.info('Response text length', { length: responseText.length });

    // Step 5: Parse the generated content
    let parsedContent;
    try {
      // Remove markdown code block wrapper if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      parsedContent = JSON.parse(jsonText);

      // IMPORTANT: If parsed content already has a 'content' field,
      // ensure we're using ONLY that content, not the entire JSON
      if (parsedContent.content && typeof parsedContent.content === 'string') {
        // Content is already extracted correctly
      } else if (typeof parsedContent === 'object' && !parsedContent.content) {
        // JSON doesn't have a content field, treat entire text as content
        parsedContent = {
          title: parsedContent.title || prompt.substring(0, 60),
          content: responseText,
          excerpt: parsedContent.excerpt || responseText.substring(0, 160),
          tags: parsedContent.tags || keywords || []
        };
      }
    } catch {
      // If not JSON, wrap in content object
      parsedContent = {
        title: prompt.substring(0, 60),
        content: responseText,
        excerpt: responseText.substring(0, 160),
        tags: keywords || []
      };
    }

    // Step 6: Save to database as draft
    const scheduledAt = publishDate ? new Date(publishDate) : null;

    // Generate unique slug with timestamp (Turso compatibility)
    const slug = generateUniqueSlugWithTimestamp(parsedContent.title || prompt);

    // Auto-detect language from generated content
    const detectedLanguage = detectLanguage(
      (parsedContent.title || prompt) + ' ' + (parsedContent.content || responseText).substring(0, 500)
    );
    logger.info('Language detected for AI-generated content', {
      language: detectedLanguage,
      title: parsedContent.title || prompt
    });

    // Auto-generate thumbnail URL if no coverImage provided
    const postTitle = parsedContent.title || prompt;
    const coverImageUrl = parsedContent.coverImage || autoGenerateThumbnailUrl(postTitle, request);

    logger.info('Thumbnail generation for new post', {
      title: postTitle,
      hasAICoverImage: !!parsedContent.coverImage,
      generatedThumbnailUrl: !parsedContent.coverImage ? coverImageUrl : null
    });

    // TEMPORARY DEBUG: Log tags type and value
    logger.info('DEBUG: tags before conversion', {
      tagsType: typeof parsedContent.tags,
      tagsValue: parsedContent.tags,
      isArray: Array.isArray(parsedContent.tags)
    });

    const post = await prisma.post.create({
      data: {
        title: postTitle,
        slug,
        content: parsedContent.content || responseText,
        excerpt: parsedContent.excerpt || responseText.substring(0, 160),
        tags: tagsToString(parsedContent.tags || []),
        seoTitle: parsedContent.seoTitle || parsedContent.title,
        seoDescription: parsedContent.seoDescription || parsedContent.excerpt,
        coverImage: coverImageUrl,
        status: 'DRAFT',
        scheduledAt,
        author: 'n잡러 프리랜서',
        originalLanguage: detectedLanguage
      }
    });

  logger.info('Content generated and saved', {
    postId: post.id,
    slug: post.slug,
    status: post.status
  });

  return createSuccessResponse({
    ...parsedContent,
    id: post.id,
    slug: post.slug,
    status: post.status,
    scheduledAt: post.scheduledAt,
    ragContextUsed: similarKnowledge.length > 0
  }, new URL(request.url).pathname);
}

export async function POST(request: NextRequest) {
  // 🔒 인증 체크 (Admin만 AI 콘텐츠 생성 가능)
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  // 💰 Rate Limiting 체크 (비용 폭탄 방지)
  const rateLimit = checkGeminiRateLimit()
  if (!rateLimit.success) {
    return NextResponse.json(
      createRateLimitResponse(rateLimit.resetTime),
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
        }
      }
    )
  }

  return withErrorHandler(generateContentHandler)(request)
}