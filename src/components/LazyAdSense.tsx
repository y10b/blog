'use client'

import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/config'

interface LazyAdSenseProps {
  slot: string
  format?: string
  style?: React.CSSProperties
}

export function LazyAdSense({ slot, format = 'auto', style }: LazyAdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const adClient = siteConfig.analytics.adsenseClientId

  useEffect(() => {
    if (!adClient) return // AdSense ID 미설정이면 광고 로딩 안 함

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            const loadAdSense = () => {
              if (!(window as any).adsbygoogle) {
                const script = document.createElement('script')
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`
                script.async = true
                script.defer = true
                script.crossOrigin = 'anonymous'
                script.onload = () => {
                  try {
                    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
                  } catch {}
                }
                document.head.appendChild(script)
              } else {
                try {
                  ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
                } catch {}
              }
            }

            setTimeout(loadAdSense, 100)
            setIsLoaded(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px', threshold: 0.01 }
    )

    if (adRef.current) observer.observe(adRef.current)
    return () => observer.disconnect()
  }, [isLoaded, adClient])

  // ID 미설정이면 자리 차지하지 않음
  if (!adClient) return null

  return (
    <div
      ref={adRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '280px',
        height: '280px',
        maxHeight: '280px',
        contain: 'layout style paint',
        ...style,
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-100 rounded-lg flex items-center justify-center">
          <span className="text-xs text-stone-400">Advertisement</span>
        </div>
      )}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: '280px',
          height: '280px',
          maxHeight: '280px',
        }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="false"
      />
    </div>
  )
}