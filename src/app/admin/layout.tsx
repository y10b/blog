export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-gray-700 hover:text-gray-900">Posts</a>
              <a href="/admin/analytics" className="text-gray-700 hover:text-gray-900">Analytics</a>
              <a href="/admin/youtube" className="text-gray-700 hover:text-gray-900">YouTube</a>
              <a 
                href="/api/download/desktop-app" 
                className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Desktop App
              </a>
              <a href="/admin/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">New Post</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}