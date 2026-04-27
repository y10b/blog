'use client'

import { useState } from 'react'

interface Props {
  koMd: string
  enMd: string | null
  koCover: string | null
  enCover: string | null
}

export default function MarkdownCopyClient({ koMd, enMd, koCover, enCover }: Props) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en'>('ko')
  const [copied, setCopied] = useState<'all' | 'image' | null>(null)

  const currentMd = activeLang === 'ko' ? koMd : (enMd ?? '(영문 번역이 아직 없습니다.)')
  const currentCover = activeLang === 'ko' ? koCover : enCover

  const flashCopied = (kind: 'all' | 'image') => {
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(currentMd)
    flashCopied('all')
  }

  const handleCopyImage = () => {
    if (!currentCover) return
    navigator.clipboard.writeText(currentCover)
    flashCopied('image')
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveLang('ko')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              activeLang === 'ko'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => setActiveLang('en')}
            disabled={!enMd}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              activeLang === 'en'
                ? 'bg-stone-900 text-white'
                : !enMd
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            English {!enMd && '(없음)'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyImage}
            disabled={!currentCover}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              !currentCover
                ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                : 'border-stone-300 text-stone-700 hover:bg-stone-100'
            }`}
            title={currentCover ?? '이미지 없음'}
          >
            {copied === 'image' ? '복사됨' : '이미지 URL'}
          </button>
          <button
            onClick={handleCopyAll}
            className="px-4 py-1.5 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {copied === 'all' ? '복사됨' : '전체 복사'}
          </button>
        </div>
      </div>

      {currentCover && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-200 bg-white">
          <img
            src={currentCover}
            alt="cover preview"
            className="w-20 h-12 object-cover rounded border border-stone-200 flex-shrink-0"
          />
          <code className="flex-1 text-xs text-stone-500 truncate">{currentCover}</code>
        </div>
      )}

      <textarea
        readOnly
        value={currentMd}
        className="w-full h-[60vh] p-5 font-mono text-sm leading-relaxed text-stone-800 bg-white focus:outline-none resize-none"
        onFocus={e => e.currentTarget.select()}
      />
      <div className="px-4 py-2 border-t border-stone-200 bg-stone-50 text-xs text-stone-500">
        {currentMd.length.toLocaleString()}자 · 클릭하면 전체 선택됩니다 · Ctrl+A 후 Ctrl+C도 가능
      </div>
    </div>
  )
}
