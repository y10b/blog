import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Raw transcript item from youtube-transcript library
 */
interface RawTranscriptItem {
  text: string;
  start?: number;
  offset?: number;
  duration?: number;
  dur?: number;
}

export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export interface ProcessedTranscript {
  fullText: string;
  chunks: string[];
  duration: number;
  hasTimestamps: boolean;
}

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  thumbnailUrl: string;
}

export class YouTubeTranscriptService {
  /**
   * Fetch transcript for a YouTube video
   */
  async fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
    try {
      // Try to fetch transcript
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'ko', // Try Korean first
      }).catch(() => 
        // Fallback to English if Korean not available
        YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      ).catch(() => 
        // Fallback to any available language
        YoutubeTranscript.fetchTranscript(videoId)
      );

      // Map the response to our TranscriptItem interface
      return transcript.map((item: RawTranscriptItem): TranscriptItem => ({
        text: item.text,
        start: item.start ?? item.offset ?? 0,
        duration: item.duration ?? item.dur ?? 0
      }));
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      throw new Error('Transcript not available for this video');
    }
  }

  /**
   * Process raw transcript into usable format
   */
  processTranscript(transcript: TranscriptItem[]): ProcessedTranscript {
    // Combine all text
    const fullText = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Calculate total duration
    const duration = transcript.length > 0 
      ? Math.max(...transcript.map(item => item.start + item.duration))
      : 0;

    // Chunk transcript for long videos (4000 characters per chunk)
    const chunks = this.chunkTranscript(fullText, 4000);

    return {
      fullText,
      chunks,
      duration,
      hasTimestamps: transcript.some(item => item.start > 0),
    };
  }

  /**
   * Intelligent chunking that tries to break at sentence boundaries
   */
  private chunkTranscript(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract key moments from transcript with timestamps
   */
  extractKeyMoments(transcript: TranscriptItem[], maxMoments: number = 5): Array<{
    text: string;
    timestamp: number;
    timeString: string;
  }> {
    // Simple implementation: extract evenly distributed moments
    const interval = Math.floor(transcript.length / maxMoments);
    const moments = [];

    for (let i = 0; i < maxMoments && i * interval < transcript.length; i++) {
      const item = transcript[i * interval];
      moments.push({
        text: item.text.slice(0, 100) + '...',
        timestamp: item.start,
        timeString: this.formatTimestamp(item.start),
      });
    }

    return moments;
  }

  /**
   * Format timestamp to YouTube format (e.g., 1:23:45)
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate prompt for Gemini to convert transcript to blog post
   */
  generateBlogPrompt(
    transcript: ProcessedTranscript,
    metadata: YouTubeVideoMetadata,
    chunkIndex?: number,
    isShort: boolean = false
  ): string {
    const chunk = chunkIndex !== undefined
      ? transcript.chunks[chunkIndex]
      : transcript.fullText;

    const durationMinutes = Math.floor(transcript.duration / 60);
    const durationSeconds = Math.floor(transcript.duration % 60);
    const durationText = durationMinutes > 0
      ? `${durationMinutes}분 ${durationSeconds}초`
      : `${durationSeconds}초`;

    // 페르소나: 풀스택 1년차 → 초기 스타트업 AI 모델 개발자 ("n잡러 프리랜서").
    // YouTube 영상은 외부 콘텐츠라 운영자 1인칭이 아닌 "운영자가 본 영상에 대한 정리·해설" 톤으로 작성.

    if (isShort) {
      return `
당신은 "n잡러 프리랜서" 블로그를 운영하는 풀스택 출신 AI 모델 개발자입니다.
유튜브 Shorts 영상을 본 뒤, 그 핵심 메시지를 풀어 1,000자 이상의 한국어 블로그 포스트로 정리하세요.

VIDEO INFORMATION:
- Title: ${metadata.title}
- Channel: ${metadata.channelTitle}
- Published: ${metadata.publishedAt}
- Duration: ${durationText} (Shorts 영상)

SHORTS TRANSCRIPT:
${chunk}

요구사항:
1. **도입부 (150-200자)** — 주제가 왜 중요한지, 독자에게 어떤 질문에 답이 되는지.
2. **핵심 내용 확장 (600-800자)** — 영상이 말한 핵심을 본인 관점에서 풀어쓰기. 배경 지식·원리·구체적 예시·How-to·주의사항.
3. **추가 인사이트 (200-300자)** — 영상이 다루지 못한 부분. 본인이 풀스택→AI 전환하면서 봤거나 들은 관련 사례, 또는 N잡/도구/엔지니어링 관점의 코멘트(둘 중 영상 주제에 가까운 쪽으로).
4. **마무리 (100-150자)** — 3-5 bullet 요약 + 독자 행동 아이템.

스타일:
- 솔직, 분석적, 후발주자의 실험 로그 톤.
- 영상 화자가 한 말을 본인이 한 것처럼 가장하지 말 것 — 영상에서 본 내용은 "이 영상에서는 ~라고 말한다", 본인 관점은 "내가 비슷한 경험을 해보니 ~" 식으로 분리.
- 한국어. 이모지는 필요할 때만 1~2개.
- 전문 용어는 한 번씩 풀어쓰기.

금지 표현 (이전 운영자 흔적): "Colemearchy", "Wegovy", "ADHD", "케토", "PM 출신", "디자이너 출신", "바이오해킹".

Shorts가 짧다고 블로그도 짧으면 안 됩니다. 영상에 없는 배경/원리/사례를 보강해 1,000자 이상의 가치 있는 글을 만드세요.

Generate a comprehensive, well-structured blog post in Korean.
`;
    }

    return `
당신은 "n잡러 프리랜서" 블로그를 운영하는 풀스택 출신 AI 모델 개발자입니다.
유튜브 영상을 본 뒤, 그 내용을 정리·해설하는 한국어 블로그 포스트를 작성하세요.

VIDEO INFORMATION:
- Title: ${metadata.title}
- Channel: ${metadata.channelTitle}
- Published: ${metadata.publishedAt}
- Duration: ${durationText}

TRANSCRIPT TO CONVERT:
${chunk}

TASK:
1. 영상 자막을 가독성 있는 블로그 글로 변환 (헤딩, 단락, bullet).
2. 군더더기 제거 (필러 단어, 반복).
3. 화자의 핵심 통찰은 보존하되, 본인이 말한 것처럼 가장하지 말 것. "이 영상에서는 ~라고 말한다" 식으로 출처 분리.
4. 본인 코멘트(풀스택→AI 개발자 관점, 또는 N잡/도구/엔지니어링 관점)는 별도 섹션으로 명확히 표시.
5. SEO 친화적 키워드 자연스럽게.
6. 도입부 후킹 + 결론 핵심 정리.

IMPORTANT:
- 이것은 ${chunkIndex !== undefined ? `part ${chunkIndex + 1} of ${transcript.chunks.length}` : '전체 자막'}.
- 톤: 솔직, 분석적, 1년차 후발주자의 실험 로그 결.
- 금지 표현: "Colemearchy", "Wegovy", "ADHD", "케토", "PM 출신", "디자이너 출신", "바이오해킹".
- 영상을 안 본 독자에게도 가치 있는 글이 되도록.

Generate a well-structured blog post in Korean.
`;
  }
}