export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPostTranslation, detectLanguage } from '@/lib/translation'
import { withErrorHandler, logger, createSuccessResponse, ApiError, validateRequest } from '@/lib/error-handler'
import { createPostSchema } from '@/lib/validations'

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('Fetching all posts');

  // Select only necessary fields for list view
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      publishedAt: true,
      createdAt: true,
      author: true,
      status: true,
      views: true,
      youtubeVideoId: true,
      originalLanguage: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return createSuccessResponse(posts, new URL(request.url).pathname);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Validate input data
  const data = await validateRequest(request, createPostSchema);

  logger.info('Creating post', {
    title: data.title,
    slug: data.slug,
    youtubeVideoId: data.youtubeVideoId,
    tags: data.tags,
    publishedAt: data.publishedAt
  });

  // Check if slug already exists
  const existingPost = await prisma.post.findUnique({
    where: { slug: data.slug }
  });

  if (existingPost) {
    logger.warn('Slug already exists', { slug: data.slug });
    throw new ApiError(409, 'Slug already exists', { slug: data.slug });
  }

  // Detect source language
  const sourceLang = detectLanguage(data.title + ' ' + data.content);

  // Use transaction to ensure data consistency
  const post = await prisma.$transaction(async (tx) => {
    // Create post
    const createdPost = await tx.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        tags: Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || ''),
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        youtubeVideoId: data.youtubeVideoId || null,
        originalLanguage: sourceLang,
        status: data.publishedAt ? 'PUBLISHED' : 'DRAFT',
      },
    });

    return createdPost;
  });

  // Create translations OUTSIDE transaction (optional, non-blocking)
  // This way translation failure won't prevent post creation
  try {
    const targetLang = sourceLang === 'ko' ? 'en' : 'ko';

    const translation = await createPostTranslation({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
    }, targetLang);

    // Create translated version
    await prisma.postTranslation.create({
      data: {
        postId: post.id,
        ...translation,
      },
    });

    // Create original language version
    await prisma.postTranslation.create({
      data: {
        postId: post.id,
        locale: sourceLang,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });

    logger.info('Translation created successfully', { postId: post.id });
  } catch (translationError) {
    // Translation failure is non-critical, just log it
    logger.error('Translation failed (non-critical)', translationError, { postId: post.id });
    // Post is still created successfully, translation can be added later
  }

  // If post is published, trigger sitemap update
  if (post.status === 'PUBLISHED' && post.publishedAt) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sitemap/update`, {
        method: 'POST',
      });
      logger.info('Sitemap update triggered', { postId: post.id });
    } catch (error) {
      logger.error('Failed to trigger sitemap update', error, { postId: post.id });
    }
  }

  logger.info('Post created successfully', { postId: post.id, slug: post.slug });
  return createSuccessResponse(post, new URL(request.url).pathname);
});