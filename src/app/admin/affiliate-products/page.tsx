'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AffiliateProduct {
  id: string
  name: string
  coupangUrl: string
  category: string
  price: number | null
  imageUrl: string | null
  keywords: string
  description: string | null
  createdAt: string
}

export default function AffiliateProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AffiliateProduct | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    coupangUrl: '',
    category: '',
    price: '',
    imageUrl: '',
    keywords: '',
    description: ''
  })

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // 개발 환경에서는 비밀번호 프롬프트 스킵
      const password = process.env.NODE_ENV === 'development'
        ? 'dksguswns2'
        : prompt('Admin 비밀번호를 입력하세요:')

      if (!password) return

      const res = await fetch(`/api/admin/affiliate-products?password=${password}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setProducts(data.data.products || [])
    } catch (error) {
      alert('상품 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const password = prompt('Admin 비밀번호를 입력하세요:')
    if (!password) return

    try {
      const url = editingProduct
        ? `/api/admin/affiliate-products/${editingProduct.id}?password=${password}`
        : `/api/admin/affiliate-products?password=${password}`

      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseInt(formData.price) : null
        })
      })

      if (!res.ok) throw new Error('Failed to save')

      alert(editingProduct ? '수정되었습니다!' : '등록되었습니다!')
      setIsFormOpen(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        coupangUrl: '',
        category: '',
        price: '',
        imageUrl: '',
        keywords: '',
        description: ''
      })
      fetchProducts()
    } catch (error) {
      alert('저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const password = prompt('Admin 비밀번호를 입력하세요:')
    if (!password) return

    try {
      const res = await fetch(`/api/admin/affiliate-products/${id}?password=${password}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      alert('삭제되었습니다!')
      fetchProducts()
    } catch (error) {
      alert('삭제에 실패했습니다.')
    }
  }

  const handleEdit = (product: AffiliateProduct) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      coupangUrl: product.coupangUrl,
      category: product.category,
      price: product.price?.toString() || '',
      imageUrl: product.imageUrl || '',
      keywords: product.keywords,
      description: product.description || ''
    })
    setIsFormOpen(true)
  }

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">쿠팡 파트너스 상품 관리</h1>
        <button
          onClick={() => {
            setIsFormOpen(true)
            setEditingProduct(null)
            setFormData({
              name: '',
              coupangUrl: '',
              category: '',
              price: '',
              imageUrl: '',
              keywords: '',
              description: ''
            })
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          + 새 상품 등록
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">키워드</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded mr-3 object-cover" />
                    )}
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.price ? `₩${product.price.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-xs truncate">{product.keywords}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                  <a
                    href={product.coupangUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-900"
                  >
                    링크
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            등록된 상품이 없습니다. 새 상품을 등록해보세요!
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? '상품 수정' : '새 상품 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">쿠팡 파트너스 링크 *</label>
                <input
                  type="url"
                  required
                  value={formData.coupangUrl}
                  onChange={(e) => setFormData({ ...formData, coupangUrl: e.target.value })}
                  placeholder="https://link.coupang.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">선택하세요</option>
                  <option value="전자기기">전자기기</option>
                  <option value="생활용품">생활용품</option>
                  <option value="건강/다이어트">건강/다이어트</option>
                  <option value="도서">도서</option>
                  <option value="의류">의류</option>
                  <option value="가구/인테리어">가구/인테리어</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="예: 29900"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO 키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="무선이어폰, ADHD, 집중력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingProduct(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {editingProduct ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
