/**
 * YouTube Data API v3 Response Types
 * These types define the structure of responses from the YouTube Data API
 */

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeVideoSnippet {
  publishedAt?: string;
  channelId?: string;
  title?: string;
  description?: string;
  thumbnails?: YouTubeThumbnails;
  channelTitle?: string;
  categoryId?: string;
  liveBroadcastContent?: string;
  localized?: {
    title?: string;
    description?: string;
  };
  resourceId?: {
    kind?: string;
    videoId?: string;
  };
}

export interface YouTubeContentDetails {
  duration?: string;
  dimension?: string;
  definition?: string;
  caption?: string;
  licensedContent?: boolean;
  projection?: string;
  relatedPlaylists?: {
    likes?: string;
    uploads?: string;
  };
}

export interface YouTubeVideoResource {
  kind?: string;
  etag?: string;
  id?: string;
  snippet?: YouTubeVideoSnippet;
  contentDetails?: YouTubeContentDetails;
}

export interface YouTubePlaylistItemResource {
  kind?: string;
  etag?: string;
  id?: string;
  snippet?: YouTubeVideoSnippet;
}

export interface YouTubeChannelResource {
  kind?: string;
  etag?: string;
  id?: string;
  contentDetails?: {
    relatedPlaylists?: {
      likes?: string;
      uploads?: string;
    };
  };
}

export interface YouTubeListResponse<T> {
  kind?: string;
  etag?: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
  items?: T[];
}

export type YouTubeVideosResponse = YouTubeListResponse<YouTubeVideoResource>;
export type YouTubePlaylistItemsResponse = YouTubeListResponse<YouTubePlaylistItemResource>;
export type YouTubeChannelsResponse = YouTubeListResponse<YouTubeChannelResource>;
