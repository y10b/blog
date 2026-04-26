import { google } from 'googleapis';
import { getBestThumbnailFromApiResponse } from './youtube-thumbnail';
import { env } from './env';
import type {
  YouTubeChannelsResponse,
  YouTubePlaylistItemsResponse,
  YouTubeVideosResponse,
  YouTubeVideoResource,
} from '@/types/youtube';

// ISO 8601 duration을 초 단위로 변환하는 함수
function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// YouTube API 클라이언트를 함수로 변경하여 런타임에 환경 변수 로드
function getYouTubeClient() {
  return google.youtube({
    version: 'v3',
    auth: env.YOUTUBE_API_KEY,
  });
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
  duration?: string;
  isShort?: boolean;
}

// 채널의 최신 동영상 가져오기
export async function getChannelVideos(maxResults: number = 10, pageToken?: string): Promise<{ videos: YouTubeVideo[], nextPageToken?: string }> {
  try {
    const channelId = env.YOUTUBE_CHANNEL_ID;
    const apiKey = env.YOUTUBE_API_KEY;

    console.log('YouTube API Config:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      hasChannelId: !!channelId,
      channelId: channelId,
      timestamp: new Date().toISOString()
    });

    const youtube = getYouTubeClient();

    // 채널의 업로드 플레이리스트 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist for channel: ' + channelId);
    }

    // 플레이리스트의 동영상 목록 가져오기
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults,
      pageToken,
    }) as { data: YouTubePlaylistItemsResponse };

    const videos: YouTubeVideo[] = [];
    const videoIds: string[] = [];
    
    // 먼저 비디오 ID들을 수집
    for (const item of playlistResponse.data.items || []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId) {
        videoIds.push(videoId);
      }
    }
    
    // 비디오 상세 정보 가져오기 (duration 포함)
    const videoDetails = new Map<string, YouTubeVideoResource>();
    if (videoIds.length > 0) {
      const videoResponse = await youtube.videos.list({
        part: ['contentDetails', 'snippet'],
        id: videoIds,
      }) as { data: YouTubeVideosResponse };

      for (const video of videoResponse.data.items || []) {
        if (video.id) {
          videoDetails.set(video.id, video);
        }
      }
    }
    
    // 비디오 정보 조합
    for (const item of playlistResponse.data.items || []) {
      const snippet = item.snippet;
      if (!snippet) continue;
      
      const videoId = snippet.resourceId?.videoId;
      if (!videoId) continue;
      
      const details = videoDetails.get(videoId);
      const duration = details?.contentDetails?.duration || '';
      const durationInSeconds = parseDuration(duration);
      const isShort = durationInSeconds > 0 && durationInSeconds < 120; // 2분 미만을 쇼츠로 분류
      
      videos.push({
        id: videoId,
        title: snippet.title || '',
        description: snippet.description || '',
        thumbnailUrl: getBestThumbnailFromApiResponse(details?.snippet?.thumbnails || snippet.thumbnails) || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: snippet.publishedAt || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        duration,
        isShort,
      });
    }

    return {
      videos,
      nextPageToken: playlistResponse.data.nextPageToken || undefined
    };
  } catch (error) {
    const err = error as Error & {
      code?: string | number;
      errors?: unknown[];
    };
    console.error('Error fetching YouTube videos:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      errors: err.errors
    });
    throw err;
  }
}

// 특정 동영상의 상세 정보 가져오기
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const youtube = getYouTubeClient();

    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    }) as { data: YouTubeVideosResponse };

    const video = response.data.items?.[0];
    if (!video || !video.snippet) return null;

    const duration = video.contentDetails?.duration || '';
    const durationInSeconds = parseDuration(duration);
    const isShort = durationInSeconds > 0 && durationInSeconds < 120;

    return {
      id: videoId,
      title: video.snippet.title || '',
      description: video.snippet.description || '',
      thumbnailUrl: getBestThumbnailFromApiResponse(video.snippet.thumbnails),
      publishedAt: video.snippet.publishedAt || '',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      duration,
      isShort,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

// 동영상의 확장된 메타데이터 가져오기 (transcript 서비스와 함께 사용)
export async function getVideoMetadataForBlog(videoId: string): Promise<{
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  thumbnailUrl: string;
} | null> {
  try {
    const youtube = getYouTubeClient();

    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    }) as { data: YouTubeVideosResponse };

    const video = response.data.items?.[0];
    if (!video || !video.snippet) return null;

    return {
      id: videoId,
      title: video.snippet.title || '',
      description: video.snippet.description || '',
      channelTitle: video.snippet.channelTitle || '',
      publishedAt: video.snippet.publishedAt || '',
      duration: video.contentDetails?.duration || '',
      thumbnailUrl: getBestThumbnailFromApiResponse(video.snippet.thumbnails),
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

// YouTube 설명에서 블로그 콘텐츠용 텍스트 추출
export function extractContentFromDescription(description: string): {
  excerpt: string;
  content: string;
  hashtags: string[];
} {
  // 설명에서 해시태그 추출
  const hashtagRegex = /#\w+/g;
  const hashtags = (description.match(hashtagRegex) || []).map(tag => tag.slice(1));
  
  // 첫 3줄을 excerpt로 사용
  const lines = description.split('\n').filter(line => line.trim());
  const excerpt = lines.slice(0, 3).join(' ').substring(0, 200);
  
  // 전체 설명을 마크다운으로 변환
  const content = description
    .replace(/\n\n/g, '\n\n') // 단락 유지
    .replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)'); // URL을 링크로 변환
  
  return {
    excerpt,
    content,
    hashtags: hashtags.slice(0, 5), // 최대 5개 태그
  };
}