'use client'

import { useState } from 'react'

interface Props {
  koMd: string
  enMd: string | null
}

export default function MarkdownCopyClient({ koMd, enMd }: Props) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en'>('ko')
  const [copied, setCopied] = useState(false)

  const currentMd = activeLang === 'ko' ? koMd : (enMd ?? '(영문 번역이 아직 없습니다.)')

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
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
        <button
          onClick={handleCopy}
          className="px-4 py-1.5 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          {copied ? '복사됨' : '전체 복사'}
        </button>
      </div>
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
