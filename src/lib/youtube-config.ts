// YouTube API 설정
// 주의: 프로덕션에서는 반드시 환경 변수를 사용하세요!

export function getYouTubeConfig() {
  // Vercel에서 환경 변수가 설정되지 않은 경우를 위한 임시 설정
  const config = {
    apiKey: process.env.YOUTUBE_API_KEY || '',
    channelId: process.env.YOUTUBE_CHANNEL_ID || '',
  };

  // 환경 변수가 없으면 경고 로그
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('⚠️ YOUTUBE_API_KEY is not set in environment variables!');
    console.error('Please set it in Vercel Dashboard: Settings → Environment Variables');
  }
  
  if (!process.env.YOUTUBE_CHANNEL_ID) {
    console.error('⚠️ YOUTUBE_CHANNEL_ID is not set in environment variables!');
    console.error('Please set it in Vercel Dashboard: Settings → Environment Variables');
  }

  return config;
}