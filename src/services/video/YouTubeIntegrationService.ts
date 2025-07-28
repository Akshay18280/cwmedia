/**
 * YouTube & Vimeo Integration Service
 * Handles API integration, content sync, and embedding for external video platforms
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  category: string;
  privacy: 'public' | 'unlisted' | 'private';
  embedUrl: string;
  watchUrl: string;
  channelId: string;
  channelTitle: string;
}

export interface VimeoVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  createdAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  privacy: 'anybody' | 'nobody' | 'contacts' | 'password';
  embedUrl: string;
  watchUrl: string;
  userDisplay: string;
  userId: string;
}

export interface VideoUploadOptions {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  privacy?: string;
  thumbnail?: File;
  scheduledPublishTime?: Date;
  monetization?: boolean;
  ageRestriction?: boolean;
}

export interface UploadProgress {
  platform: 'youtube' | 'vimeo';
  videoId?: string;
  progress: number;
  stage: 'uploading' | 'processing' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  customUrl?: string;
  verified?: boolean;
}

export interface VideoAnalytics {
  platform: 'youtube' | 'vimeo';
  videoId: string;
  views: number;
  impressions?: number;
  clickThroughRate?: number;
  averageViewDuration: number;
  subscribersGained?: number;
  likes: number;
  dislikes?: number;
  comments: number;
  shares: number;
  revenue?: number;
  topCountries: Array<{ country: string; views: number }>;
  topDevices: Array<{ device: string; views: number }>;
  audienceRetention: Array<{ time: number; percentage: number }>;
}

class YouTubeIntegrationService {
  private readonly YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  private readonly YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
  private readonly VIMEO_ACCESS_TOKEN = import.meta.env.VITE_VIMEO_ACCESS_TOKEN;
  
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private vimeoToken: string | null = null;

  constructor() {
    this.loadStoredTokens();
  }

  /**
   * Authenticate with YouTube OAuth2
   */
  public async authenticateYouTube(): Promise<boolean> {
    try {
      // Initialize Google OAuth2
      await this.loadGoogleAPI();

      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      const authResult = await authInstance.signIn();

      if (authResult.isSignedIn()) {
        this.accessToken = authResult.getAuthResponse().access_token;
        this.refreshToken = authResult.getAuthResponse().refresh_token;
        
        // Store tokens securely
        this.storeTokens('youtube', {
          accessToken: this.accessToken,
          refreshToken: this.refreshToken
        });

        return true;
      }

      return false;

    } catch (error) {
      console.error('YouTube authentication error:', error);
      return false;
    }
  }

  /**
   * Authenticate with Vimeo
   */
  public async authenticateVimeo(): Promise<boolean> {
    try {
      // Redirect to Vimeo OAuth
      const clientId = import.meta.env.VITE_VIMEO_CLIENT_ID;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/vimeo/callback');
      const scope = 'public private purchased upload delete edit';
      
      const authUrl = `https://vimeo.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
      
      window.location.href = authUrl;
      return true;

    } catch (error) {
      console.error('Vimeo authentication error:', error);
      return false;
    }
  }

  /**
   * Get YouTube channel information
   */
  public async getYouTubeChannel(): Promise<ChannelInfo | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with YouTube');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch channel info');
      }

      const data = await response.json();
      const channel = data.items[0];

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.default.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        viewCount: parseInt(channel.statistics.viewCount),
        customUrl: channel.snippet.customUrl,
        verified: channel.status?.longUploadsStatus === 'allowed'
      };

    } catch (error) {
      console.error('Error fetching YouTube channel:', error);
      return null;
    }
  }

  /**
   * Get YouTube videos from channel
   */
  public async getYouTubeVideos(maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with YouTube');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed video information
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${videoIds}&access_token=${this.accessToken}`
      );

      const detailsData = await detailsResponse.json();

      return detailsData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        duration: this.parseYouTubeDuration(video.contentDetails.duration),
        publishedAt: new Date(video.snippet.publishedAt),
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
        tags: video.snippet.tags || [],
        category: video.snippet.categoryId,
        privacy: video.status.privacyStatus,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        watchUrl: `https://www.youtube.com/watch?v=${video.id}`,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle
      }));

    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return [];
    }
  }

  /**
   * Upload video to YouTube
   */
  public async uploadToYouTube(
    file: File, 
    options: VideoUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with YouTube');
      }

      // Initialize upload
      const metadata = {
        snippet: {
          title: options.title,
          description: options.description || '',
          tags: options.tags || [],
          categoryId: options.category || '22', // People & Blogs
        },
        status: {
          privacyStatus: options.privacy || 'private',
          embeddable: true,
          license: 'youtube'
        }
      };

      onProgress?.({
        platform: 'youtube',
        progress: 0,
        stage: 'uploading',
        message: 'Starting upload to YouTube...'
      });

      // Create resumable upload session
      const uploadResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': file.size.toString(),
          'X-Upload-Content-Type': file.type
        },
        body: JSON.stringify(metadata)
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to initialize YouTube upload');
      }

      const uploadUrl = uploadResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('No upload URL returned');
      }

      // Upload file in chunks
      const chunkSize = 256 * 1024; // 256KB chunks
      let uploadedBytes = 0;

      while (uploadedBytes < file.size) {
        const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);
        const isLastChunk = uploadedBytes + chunkSize >= file.size;

        const chunkResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunk.size - 1}/${file.size}`,
            'Content-Type': file.type
          },
          body: chunk
        });

        if (chunkResponse.status === 308) {
          // Continue uploading
          uploadedBytes += chunk.size;
          const progress = (uploadedBytes / file.size) * 100;

          onProgress?.({
            platform: 'youtube',
            progress,
            stage: 'uploading',
            message: `Uploading to YouTube... ${Math.round(progress)}%`
          });

        } else if (chunkResponse.status === 200 || chunkResponse.status === 201) {
          // Upload complete
          const result = await chunkResponse.json();
          
          onProgress?.({
            platform: 'youtube',
            videoId: result.id,
            progress: 100,
            stage: 'processing',
            message: 'Video uploaded successfully! Processing...'
          });

          // Upload thumbnail if provided
          if (options.thumbnail) {
            await this.uploadYouTubeThumbnail(result.id, options.thumbnail);
          }

          onProgress?.({
            platform: 'youtube',
            videoId: result.id,
            progress: 100,
            stage: 'completed',
            message: 'Upload completed successfully!'
          });

          return result.id;

        } else {
          throw new Error(`Upload failed with status ${chunkResponse.status}`);
        }
      }

      return null;

    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      onProgress?.({
        platform: 'youtube',
        progress: 0,
        stage: 'failed',
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get Vimeo videos
   */
  public async getVimeoVideos(maxResults: number = 50): Promise<VimeoVideo[]> {
    try {
      if (!this.vimeoToken && !this.VIMEO_ACCESS_TOKEN) {
        throw new Error('Not authenticated with Vimeo');
      }

      const token = this.vimeoToken || this.VIMEO_ACCESS_TOKEN;
      const response = await fetch(`https://api.vimeo.com/me/videos?per_page=${maxResults}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Vimeo videos');
      }

      const data = await response.json();

      return data.data.map((video: any) => ({
        id: video.uri.split('/').pop(),
        title: video.name,
        description: video.description || '',
        thumbnail: video.pictures.sizes.find((size: any) => size.width >= 640)?.link || video.pictures.base_link,
        duration: video.duration,
        createdAt: new Date(video.created_time),
        viewCount: video.stats.plays,
        likeCount: video.metadata.interactions.like.total,
        commentCount: video.metadata.interactions.comment.total,
        tags: video.tags.map((tag: any) => tag.name),
        privacy: video.privacy.view,
        embedUrl: video.player_embed_url,
        watchUrl: video.link,
        userDisplay: video.user.name,
        userId: video.user.uri.split('/').pop()
      }));

    } catch (error) {
      console.error('Error fetching Vimeo videos:', error);
      return [];
    }
  }

  /**
   * Upload video to Vimeo
   */
  public async uploadToVimeo(
    file: File,
    options: VideoUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    try {
      if (!this.vimeoToken && !this.VIMEO_ACCESS_TOKEN) {
        throw new Error('Not authenticated with Vimeo');
      }

      const token = this.vimeoToken || this.VIMEO_ACCESS_TOKEN;

      onProgress?.({
        platform: 'vimeo',
        progress: 0,
        stage: 'uploading',
        message: 'Starting upload to Vimeo...'
      });

      // Create upload session
      const createResponse = await fetch('https://api.vimeo.com/me/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upload: {
            approach: 'tus',
            size: file.size
          },
          name: options.title,
          description: options.description || '',
          privacy: {
            view: options.privacy || 'nobody'
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create Vimeo upload session');
      }

      const createData = await createResponse.json();
      const uploadUrl = createData.upload.upload_link;
      const videoId = createData.uri.split('/').pop();

      // Upload file using TUS protocol
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': '0',
          'Content-Type': 'application/offset+octet-stream'
        },
        body: file
      });

      if (uploadResponse.ok) {
        onProgress?.({
          platform: 'vimeo',
          videoId,
          progress: 100,
          stage: 'processing',
          message: 'Video uploaded successfully! Processing...'
        });

        // Update video metadata
        await fetch(`https://api.vimeo.com/videos/${videoId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: options.title,
            description: options.description || '',
            tags: options.tags?.join(',') || ''
          })
        });

        onProgress?.({
          platform: 'vimeo',
          videoId,
          progress: 100,
          stage: 'completed',
          message: 'Upload completed successfully!'
        });

        return videoId;
      }

      throw new Error('Vimeo upload failed');

    } catch (error) {
      console.error('Error uploading to Vimeo:', error);
      onProgress?.({
        platform: 'vimeo',
        progress: 0,
        stage: 'failed',
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get video analytics from YouTube
   */
  public async getYouTubeAnalytics(videoId: string, days: number = 30): Promise<VideoAnalytics | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated with YouTube');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      const response = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&metrics=views,averageViewDuration,likes,dislikes,comments,shares&filters=video==${videoId}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch YouTube analytics');
      }

      const data = await response.json();
      const metrics = data.rows[0] || [];

      return {
        platform: 'youtube',
        videoId,
        views: metrics[0] || 0,
        averageViewDuration: metrics[1] || 0,
        likes: metrics[2] || 0,
        dislikes: metrics[3] || 0,
        comments: metrics[4] || 0,
        shares: metrics[5] || 0,
        topCountries: [],
        topDevices: [],
        audienceRetention: []
      };

    } catch (error) {
      console.error('Error fetching YouTube analytics:', error);
      return null;
    }
  }

  /**
   * Sync videos with local database
   */
  public async syncVideos(platform: 'youtube' | 'vimeo'): Promise<number> {
    try {
      const videos = platform === 'youtube' 
        ? await this.getYouTubeVideos(100)
        : await this.getVimeoVideos(100);

      let syncedCount = 0;

      for (const video of videos) {
        try {
          const response = await fetch('/api/videos/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              platform,
              externalId: video.id,
              ...video
            })
          });

          if (response.ok) {
            syncedCount++;
          }

        } catch (error) {
          console.error(`Error syncing video ${video.id}:`, error);
        }
      }

      return syncedCount;

    } catch (error) {
      console.error('Error syncing videos:', error);
      return 0;
    }
  }

  // Private helper methods

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('auth2', () => {
          (window as any).gapi.auth2.init({
            client_id: this.YOUTUBE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly'
          }).then(resolve).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private parseYouTubeDuration(duration: string): number {
    // Parse ISO 8601 duration (PT4M13S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  private async uploadYouTubeThumbnail(videoId: string, thumbnail: File): Promise<void> {
    try {
      if (!this.accessToken) return;

      await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': thumbnail.type
        },
        body: thumbnail
      });

    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    }
  }

  private loadStoredTokens(): void {
    try {
      const youtubeTokens = localStorage.getItem('youtube_tokens');
      if (youtubeTokens) {
        const tokens = JSON.parse(youtubeTokens);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
      }

      const vimeoToken = localStorage.getItem('vimeo_token');
      if (vimeoToken) {
        this.vimeoToken = vimeoToken;
      }

    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
  }

  private storeTokens(platform: 'youtube' | 'vimeo', tokens: any): void {
    try {
      if (platform === 'youtube') {
        localStorage.setItem('youtube_tokens', JSON.stringify(tokens));
      } else {
        localStorage.setItem('vimeo_token', tokens.accessToken);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }
}

// Export singleton instance
export const youtubeIntegrationService = new YouTubeIntegrationService(); 