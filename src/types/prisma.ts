import { Prisma } from '@prisma/client';

// Prisma 모델의 기본 타입들을 재사용
export type PostWithRelations = Prisma.PostGetPayload<{}>;

// Select 타입 헬퍼
export type PostSelect = Prisma.PostSelect;
export type PostInclude = Prisma.PostInclude;

// Create/Update Input 타입
export type PostCreateInput = Prisma.PostCreateInput;
export type PostUpdateInput = Prisma.PostUpdateInput;

// Where 조건 타입
export type PostWhereInput = Prisma.PostWhereInput;
export type PostOrderByInput = Prisma.PostOrderByWithRelationInput;

// 자주 사용하는 선택 필드 정의
export const postBasicSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  views: true,
  tags: true,
} as const;

export const postDetailSelect = {
  ...postBasicSelect,
  content: true,
  seoTitle: true,
  seoDescription: true,
  youtubeVideoId: true,
  socialLinks: true,
  createdAt: true,
  updatedAt: true,
} as const;

// 타입 안전한 Prisma 결과 타입
export type PostBasic = Prisma.PostGetPayload<{ select: typeof postBasicSelect }>;
export type PostDetail = Prisma.PostGetPayload<{ select: typeof postDetailSelect }>;

// JSON 필드 타입 정의
export interface PostSocialLinks {
  threads?: string[];
  youtube?: string[];
}

// 날짜 처리를 위한 헬퍼 타입
export type SerializedPost<T extends PostWithRelations> = Omit<T, 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};