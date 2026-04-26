export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import {
  buildSystemPrompt,
  generateContentPrompt,
  extractFirstJsonObject,
  type ContentCategory,
} from '@/lib/ai-prompts';
import { backupSinglePost } from '@/lib/auto-backup';
import { searchUnsplashImage, getOptimizedImageUrl } from '@/lib/unsplash';
import { siteConfig } from '@/config';

// Vercel cron uses GET; manual triggers use POST. Both go through the same handler.

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

interface ParsedPost {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

async function fetchCoverImage(coverKeyword: string | undefined, fallbackTitle: string): Promise<string | null> {
  try {
    const query = (coverKeyword && coverKeyword.trim())
      || fallbackTitle.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).slice(0, 3).join(' ')
      || 'technology';
    const image = await searchUnsplashImage(query, 'landscape');
    if (image) return getOptimizedImageUrl(image, 1200, 80);
  } catch (e) {
    console.warn('Unsplash image fetch failed:', e);
  }
  return null;
}

interface CategorizedTopic {
  topic: string;
  category: ContentCategory;
}

/**
 * 카테고리별로 주제를 생성. 기본 6 dev + 4 sidehustle.
 * 각 줄을 "DEV: ..." 또는 "SIDE: ..." 접두사로 받아 파싱.
 */
async function generateTopicIdeas(anthropic: Anthropic): Promise<CategorizedTopic[]> {
  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `당신은 "n잡러 프리랜서" 블로그의 콘텐츠 전략가입니다.
운영자는 풀스택 개발 1년차에서 초기 스타트업의 AI 모델 개발자(이미지 생성 모델 FLUX LoRA, 얼굴 인상 분석 MLP 등)로 전환 중인 사람입니다.

오늘 발행할 한국어 블로그 주제 10개를 생성해주세요. 카테고리는 두 종류:

[DEV — 개발/AI 모델/초기 스타트업 엔지니어링]
- AI 모델 학습기 (FLUX LoRA, ImpressionMLP 같은 자체 개발 경험)
- 풀스택 → AI 전환기 (Next/Node에서 LLM 붙이기, Python 통합)
- 초기 스타트업 엔지니어링 (Colab, 단위경제, 1인 멀티롤)

[SIDE — N잡/AI 도구/사이드 프로젝트/생활 자동화]
- AI 도구 실사용 후기 (Gemini, Claude, fal.ai 등)
- 1인 운영자의 자동화 워크플로 (블로그 RAG, 자동 발행)
- 개발 사이드 프로젝트로 수익 만들기

요구사항:
- DEV 카테고리 6개 + SIDE 카테고리 4개, 총 10개
- 각 주제는 15~30자 한국어 제목
- 클릭 유도형 (단, 과장 금지)
- 운영자가 실제로 경험할 수 있는 구체적 주제만 (수치/모델 버전/실험 결과 포함되도록)
- 출력 형식 정확히 지키기. 한 줄에 하나씩, 다른 설명 없이:

DEV: [주제1]
DEV: [주제2]
DEV: [주제3]
DEV: [주제4]
DEV: [주제5]
DEV: [주제6]
SIDE: [주제7]
SIDE: [주제8]
SIDE: [주제9]
SIDE: [주제10]`
    }],
  });

  const text = result.content[0].type === 'text' ? result.content[0].text : '';
  const topics: CategorizedTopic[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DEV:')) {
      const topic = trimmed.replace(/^DEV:/, '').trim();
      if (topic.length > 5) topics.push({ topic, category: 'dev' });
    } else if (trimmed.startsWith('SIDE:')) {
      const topic = trimmed.replace(/^SIDE:/, '').trim();
      if (topic.length > 5) topics.push({ topic, category: 'sidehustle' });
    }
  }
  return topics.slice(0, 10);
}

async function generateBlogPost(anthropic: Anthropic, topic: string, category: ContentCategory): Promise<ParsedPost> {
  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: buildSystemPrompt(category),
    messages: [{
      role: 'user',
      content: generateContentPrompt(topic, undefined, undefined, category),
    }],
  });

  const raw = result.content[0].type === 'text' ? result.content[0].text : '';
  const parsed = extractFirstJsonObject<ParsedPost>(raw);

  if (!parsed.title || !parsed.content) {
    throw new Error('Generated post missing required fields (title/content)');
  }
  if (!Array.isArray(parsed.tags)) {
    parsed.tags = [];
  }
  return parsed;
}

interface GenerationResult {
  generatedPosts: Array<{
    id: string;
    title: string;
    slug: string;
    category: ContentCategory;
    scheduledAt: string;
    contentLength: number;
  }>;
  failedTopics: string[];
}

async function runDailyGeneration(): Promise<GenerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('Starting daily content generation...');
  const topics = await generateTopicIdeas(anthropic);
  console.log(`Generated ${topics.length} topics (${topics.filter(t => t.category === 'dev').length} dev / ${topics.filter(t => t.category === 'sidehustle').length} side)`);

  const generatedPosts: GenerationResult['generatedPosts'] = [];
  const failedTopics: string[] = [];

  // 발행 시간: 내일 KST 9AM부터 1시간 간격 = UTC 0AM~9AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfDay = new Date(tomorrow);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const publishTimes: Date[] = [];
  for (let i = 0; i < topics.length; i++) {
    const t = new Date(startOfDay);
    t.setUTCHours(i, 0, 0, 0);
    publishTimes.push(t);
  }

  for (let i = 0; i < topics.length; i++) {
    const { topic, category } = topics[i];
    console.log(`Generating (${i + 1}/${topics.length}) [${category}]: "${topic}"`);

    try {
      const parsed = await generateBlogPost(anthropic, topic, category);

      const minLength = category === 'dev' ? 2000 : 1200;
      if (parsed.content.length < minLength) {
        console.warn(`Content too short (${parsed.content.length} chars, min ${minLength}), skipping...`);
        failedTopics.push(topic);
        continue;
      }

      const coverImage = await fetchCoverImage(undefined, parsed.title);
      const baseSlug = parsed.slug?.trim() || generateSlug(parsed.title);
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      // 카테고리를 첫 번째 태그로 prepend (라우팅/필터링에 사용)
      const tagsArr = parsed.tags.filter(Boolean);
      if (tagsArr[0] !== category) tagsArr.unshift(category);
      const categorizedTags = tagsArr.join(',');

      const post = await prisma.post.create({
        data: {
          title: parsed.title,
          slug: uniqueSlug,
          content: parsed.content,
          excerpt: parsed.excerpt || parsed.content.substring(0, 160),
          tags: categorizedTags,
          coverImage,
          seoTitle: parsed.seoTitle || parsed.title,
          seoDescription: parsed.seoDescription || parsed.excerpt || parsed.content.substring(0, 160),
          status: 'PUBLISHED',
          author: siteConfig.author.name,
          publishedAt: publishTimes[i],
          createdAt: new Date(),
        },
      });

      try {
        await backupSinglePost(post.id, 'post-create');
      } catch (backupError) {
        console.warn(`Auto-backup failed for post ${post.id}:`, backupError);
      }

      generatedPosts.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        category,
        scheduledAt: publishTimes[i].toISOString(),
        contentLength: parsed.content.length,
      });

      console.log(`Created [${category}]: "${post.title}" (${parsed.content.length} chars) → ${publishTimes[i].toISOString()}`);
    } catch (error) {
      console.error(`Failed: "${topic}"`, error);
      failedTopics.push(topic);
    }

    if (i < topics.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`Done. ${generatedPosts.length} posts, ${failedTopics.length} failed.`);
  return { generatedPosts, failedTopics };
}

async function handle(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runDailyGeneration();
    return NextResponse.json({
      success: true,
      message: `Generated ${result.generatedPosts.length} posts`,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in daily content generation:', error);
    return NextResponse.json({
      error: 'Failed to generate daily content',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }
