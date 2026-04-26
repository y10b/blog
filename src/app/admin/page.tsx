import Link from 'next/link'
import { BulkImageUrlUploader } from '@/components/admin/BulkImageUrlUploader'
import { BulkImageUploader } from '@/components/admin/BulkImageUploader'
import { AdminPostsTable } from '@/components/admin/AdminPostsTable'
import NeedsThumbnailPosts from '@/components/admin/NeedsThumbnailPosts'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  // AdminPostsTable 컴포넌트가 자체적으로 API를 통해 posts를 가져옴

  return (
    <div className="space-y-8">
      {/* 관리 도구 바로가기 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">관리 도구</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/admin/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 포스트 작성
          </Link>
          <Link
            href="/admin/youtube"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube 비디오
          </Link>
          <Link
            href="/admin/youtube-sync"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            YouTube 자동 동기화
          </Link>
          <Link
            href="/admin/affiliate-products"
            className="flex items-center justify-center px-4 py-3 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            쿠팡 파트너스
          </Link>
        </div>
      </div>

      {/* 대량 이미지 파일 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUploader />
      </div>

      {/* 대량 이미지 URL 업로드 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <BulkImageUrlUploader />
      </div>

      {/* 썸네일이 필요한 포스트 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <NeedsThumbnailPosts />
      </div>

      {/* 게시물 목록 섹션 - Client Component로 분리 */}
      <AdminPostsTable posts={[]} />
    </div>
  )
}