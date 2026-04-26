export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

export async function GET() {
  // Desktop app download information
  const downloadInfo = {
    name: '블로그 데스크톱',
    version: '1.0.0',
    description: '블로그 관리와 일일 보고서를 위한 데스크톱 애플리케이션',
    features: [
      '일일 보고서 자동 생성',
      '오프라인 글 작성 지원',
      'AI 콘텐츠 생성',
      '예약 게시물 관리',
      '실시간 알림'
    ],
    requirements: {
      macOS: '10.15 이상',
      Windows: 'Windows 10 이상',
      Linux: 'Ubuntu 18.04 이상'
    },
    downloads: {
      mac: {
        url: 'https://github.com/colemearchy/colemearchy-desktop/releases/download/v1.0.0/Colemearchy-Desktop-1.0.0.dmg',
        size: '약 120MB'
      },
      windows: {
        url: 'https://github.com/colemearchy/colemearchy-desktop/releases/download/v1.0.0/Colemearchy-Desktop-Setup-1.0.0.exe',
        size: '약 100MB'
      },
      linux: {
        url: 'https://github.com/colemearchy/colemearchy-desktop/releases/download/v1.0.0/Colemearchy-Desktop-1.0.0.AppImage',
        size: '약 130MB'
      }
    },
    setupInstructions: {
      step1: '다운로드한 파일을 실행하여 설치',
      step2: '첫 실행 시 API URL 입력 (사이트 도메인)',
      step3: '설정에서 일일 보고서 시간 설정',
      step4: '시스템 트레이에서 언제든지 접근 가능'
    }
  }

  // HTML response with download page
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>블로그 데스크톱 앱 다운로드</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-2xl mb-4" style="background-color: #6E6AF6;">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">${downloadInfo.name}</h1>
        <p class="text-xl text-gray-600">${downloadInfo.description}</p>
      </div>

      <!-- Features -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">주요 기능</h2>
        <div class="grid md:grid-cols-2 gap-4">
          ${downloadInfo.features.map(feature => `
            <div class="flex items-start">
              <span class="text-2xl mr-3">${feature.substring(0, 2)}</span>
              <span class="text-gray-700">${feature.substring(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Download Options -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">다운로드</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <!-- macOS -->
          <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">macOS</h3>
              <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <p class="text-sm text-gray-600 mb-4">${downloadInfo.requirements.macOS}</p>
            <p class="text-xs text-gray-500 mb-4">${downloadInfo.downloads.mac.size}</p>
            <button onclick="alert('다운로드 링크가 곧 제공됩니다.')" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
              다운로드
            </button>
          </div>

          <!-- Windows -->
          <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Windows</h3>
              <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
              </svg>
            </div>
            <p class="text-sm text-gray-600 mb-4">${downloadInfo.requirements.Windows}</p>
            <p class="text-xs text-gray-500 mb-4">${downloadInfo.downloads.windows.size}</p>
            <button onclick="alert('다운로드 링크가 곧 제공됩니다.')" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
              다운로드
            </button>
          </div>

          <!-- Linux -->
          <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Linux</h3>
              <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"/>
              </svg>
            </div>
            <p class="text-sm text-gray-600 mb-4">${downloadInfo.requirements.Linux}</p>
            <p class="text-xs text-gray-500 mb-4">${downloadInfo.downloads.linux.size}</p>
            <button onclick="alert('다운로드 링크가 곧 제공됩니다.')" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
              다운로드
            </button>
          </div>
        </div>
      </div>

      <!-- Setup Instructions -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">설치 및 설정</h2>
        <ol class="space-y-4">
          <li class="flex">
            <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">1</span>
            <span class="text-gray-700">${downloadInfo.setupInstructions.step1}</span>
          </li>
          <li class="flex">
            <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">2</span>
            <span class="text-gray-700">${downloadInfo.setupInstructions.step2}</span>
          </li>
          <li class="flex">
            <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">3</span>
            <span class="text-gray-700">${downloadInfo.setupInstructions.step3}</span>
          </li>
          <li class="flex">
            <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">4</span>
            <span class="text-gray-700">${downloadInfo.setupInstructions.step4}</span>
          </li>
        </ol>
      </div>

      <!-- Back to Admin -->
      <div class="text-center">
        <a href="/admin" class="text-blue-600 hover:text-blue-700">
          ← Admin 대시보드로 돌아가기
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}