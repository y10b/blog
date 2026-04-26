export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoGenerateThumbnailUrl } from '@/lib/utils/thumbnail';
import { verifyAdminAuth } from '@/lib/auth';

/**
 * Batch generate thumbnails for posts without coverImage
 * GET: List posts without thumbnails
 * POST: Generate thumbnails for posts without coverImage
 */

export async function GET(request: NextRequest) {
  // 🔒 인증 체크
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  try {
    // Find posts without coverImage
    const postsWithoutThumbnails = await prisma.post.findMany({
      where: {
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        originalLanguage: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 posts for safety
    });

    return NextResponse.json({
      success: true,
      data: {
        total: postsWithoutThumbnails.length,
        posts: postsWithoutThumbnails
      }
    });
  } catch (error) {
    console.error('Failed to fetch posts without thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 🔒 인증 체크
  if (!verifyAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  try {
    const { postIds, limit = 10 } = await request.json();

    // Find posts without coverImage
    const whereClause = {
      OR: [
        { coverImage: null },
        { coverImage: '' }
      ],
      ...(postIds ? { id: { in: postIds } } : {})
    };

    const postsToUpdate = await prisma.post.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true
      },
      take: limit
    });

    const updatedPosts = [];

    // Generate thumbnails for each post
    for (const post of postsToUpdate) {
      const thumbnailUrl = autoGenerateThumbnailUrl(post.title, request);

      // Update the post with the generated thumbnail URL
      const updatedPost = await prisma.post.update({
        where: { id: post.id },
        data: { coverImage: thumbnailUrl },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true
        }
      });

      updatedPosts.push(updatedPost);
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedPosts.length,
        posts: updatedPosts
      }
    });

  } catch (error) {
    console.error('Failed to generate thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnails' },
      { status: 500 }
    );
  }
}