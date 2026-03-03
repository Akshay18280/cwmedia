/**
 * Video Upload Service
 * Handles video file uploads, compression, transcoding, and cloud storage integration
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number;
  format: string;
  quality: VideoQuality;
  thumbnail?: string;
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  bitrate: number;
  framerate: number;
  aspectRatio: string;
  codec: string;
  fileSize: number;
  resolution: string;
}

export interface VideoQuality {
  label: string;
  height: number;
  bitrate: number;
  codec: string;
}

export interface UploadProgress {
  videoId: string;
  progress: number;
  stage: UploadStage;
  message: string;
  timeRemaining?: number;
  uploadSpeed?: number;
}

export interface TranscodingJob {
  id: string;
  videoId: string;
  inputUrl: string;
  outputQualities: VideoQuality[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export type UploadStage = 
  | 'validating' 
  | 'compressing' 
  | 'uploading' 
  | 'transcoding' 
  | 'generating_thumbnail' 
  | 'completed' 
  | 'failed';

class VideoUploadService {
  private readonly SUPPORTED_FORMATS = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 
    'video/mov', 'video/wmv', 'video/flv', 'video/mkv'
  ];
  
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  private readonly MIN_DURATION = 1; // 1 second
  private readonly MAX_DURATION = 3600; // 1 hour
  
  private readonly QUALITY_PRESETS: VideoQuality[] = [
    { label: '240p', height: 240, bitrate: 400, codec: 'h264' },
    { label: '360p', height: 360, bitrate: 800, codec: 'h264' },
    { label: '480p', height: 480, bitrate: 1200, codec: 'h264' },
    { label: '720p', height: 720, bitrate: 2500, codec: 'h264' },
    { label: '1080p', height: 1080, bitrate: 4500, codec: 'h264' },
    { label: '1440p', height: 1440, bitrate: 8000, codec: 'h264' },
    { label: '2160p', height: 2160, bitrate: 15000, codec: 'h264' }
  ];

  private uploadProgress = new Map<string, UploadProgress>();
  private progressCallbacks = new Map<string, (progress: UploadProgress) => void>();

  /**
   * Validate video file before upload
   */
  public async validateFile(file: File): Promise<{ valid: boolean; error?: string; metadata?: VideoMetadata }> {
    try {
      // Check file type
      if (!this.SUPPORTED_FORMATS.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported video format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`
        };
      }

      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size exceeds maximum limit of ${this.formatFileSize(this.MAX_FILE_SIZE)}`
        };
      }

      // Extract video metadata
      const metadata = await this.extractVideoMetadata(file);

      // Check duration
      if (metadata.duration < this.MIN_DURATION) {
        return {
          valid: false,
          error: `Video duration too short. Minimum ${this.MIN_DURATION} second(s)`
        };
      }

      if (metadata.duration > this.MAX_DURATION) {
        return {
          valid: false,
          error: `Video duration too long. Maximum ${this.MAX_DURATION / 60} minutes`
        };
      }

      // Check resolution
      if (metadata.width < 240 || metadata.height < 240) {
        return {
          valid: false,
          error: 'Video resolution too low. Minimum 240p required'
        };
      }

      return { valid: true, metadata };

    } catch (error) {
      console.error('Error validating video file:', error);
      return {
        valid: false,
        error: 'Failed to validate video file. Please try again.'
      };
    }
  }

  /**
   * Upload video with compression and transcoding
   */
  public async uploadVideo(
    file: File,
    options: {
      userId: string;
      title: string;
      description?: string;
      tags?: string[];
      category?: string;
      privacy?: 'public' | 'private' | 'unlisted';
      enableTranscoding?: boolean;
      targetQualities?: string[];
    }
  ): Promise<string> {
    const videoId = this.generateVideoId();
    
    try {
      // Initialize progress tracking
      this.updateProgress(videoId, {
        videoId,
        progress: 0,
        stage: 'validating',
        message: 'Validating video file...'
      });

      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const metadata = validation.metadata!;

      this.updateProgress(videoId, {
        videoId,
        progress: 10,
        stage: 'compressing',
        message: 'Compressing video...'
      });

      // Compress video if needed
      const compressedFile = await this.compressVideo(file, metadata);

      this.updateProgress(videoId, {
        videoId,
        progress: 30,
        stage: 'uploading',
        message: 'Uploading video to cloud storage...'
      });

      // Upload to Firebase Storage
      const uploadUrl = await this.uploadToStorage(compressedFile, videoId, metadata);

      this.updateProgress(videoId, {
        videoId,
        progress: 60,
        stage: 'generating_thumbnail',
        message: 'Generating video thumbnail...'
      });

      // Generate thumbnail
      const thumbnailUrl = await this.generateThumbnail(file, videoId);

      // Save video metadata to database
      await this.saveVideoMetadata(videoId, {
        ...options,
        url: uploadUrl,
        thumbnailUrl,
        metadata,
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        compressedFile: {
          name: compressedFile.name,
          size: compressedFile.size,
          type: compressedFile.type
        },
        uploadedAt: new Date(),
        status: 'uploaded'
      });

      // Start transcoding if enabled
      if (options.enableTranscoding !== false) {
        this.updateProgress(videoId, {
          videoId,
          progress: 80,
          stage: 'transcoding',
          message: 'Processing video for different qualities...'
        });

        await this.startTranscoding(videoId, uploadUrl, metadata, options.targetQualities);
      }

      this.updateProgress(videoId, {
        videoId,
        progress: 100,
        stage: 'completed',
        message: 'Video upload completed successfully!'
      });

      return videoId;

    } catch (error) {
      console.error('Error uploading video:', error);
      
      this.updateProgress(videoId, {
        videoId,
        progress: 0,
        stage: 'failed',
        message: error instanceof Error ? error.message : 'Upload failed'
      });

      throw error;
    }
  }

  /**
   * Subscribe to upload progress
   */
  public subscribeToProgress(videoId: string, callback: (progress: UploadProgress) => void): () => void {
    this.progressCallbacks.set(videoId, callback);
    
    // Send current progress if available
    const currentProgress = this.uploadProgress.get(videoId);
    if (currentProgress) {
      callback(currentProgress);
    }

    return () => {
      this.progressCallbacks.delete(videoId);
    };
  }

  /**
   * Get upload progress
   */
  public getProgress(videoId: string): UploadProgress | null {
    return this.uploadProgress.get(videoId) || null;
  }

  /**
   * Cancel video upload
   */
  public async cancelUpload(videoId: string): Promise<void> {
    try {
      // Remove from storage if exists
      const storageRef = ref(storage, `videos/${videoId}/original.mp4`);
      await deleteObject(storageRef);

      // Remove progress tracking
      this.uploadProgress.delete(videoId);
      this.progressCallbacks.delete(videoId);

      // Remove from database
      await this.deleteVideoMetadata(videoId);

    } catch (error) {
      console.error('Error canceling upload:', error);
      throw error;
    }
  }

  /**
   * Extract video metadata using Web APIs
   */
  private async extractVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        try {
          const metadata: VideoMetadata = {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            bitrate: this.estimateBitrate(file.size, video.duration),
            framerate: 30, // Default, actual detection requires more complex analysis
            aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
            codec: this.detectCodec(file.type),
            fileSize: file.size,
            resolution: this.getResolutionLabel(video.videoHeight)
          };

          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress video using Web APIs and Canvas
   */
  private async compressVideo(file: File, metadata: VideoMetadata): Promise<File> {
    // For now, return original file
    // In production, implement actual compression using WebCodecs API or server-side processing
    
    const targetQuality = this.getOptimalQuality(metadata);
    
    if (metadata.height <= targetQuality.height && file.size <= this.MAX_FILE_SIZE * 0.8) {
      // File is already in good quality and size
      return file;
    }

    // Placeholder for compression logic
    // In production, you would use WebCodecs API or send to server for processing
    console.log(`Compressing video to ${targetQuality.label}...`);
    
    return file;
  }

  /**
   * Upload file to Firebase Storage with progress tracking
   */
  private async uploadToStorage(file: File, videoId: string, metadata: VideoMetadata): Promise<string> {
    const storageRef = ref(storage, `videos/${videoId}/original.mp4`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          videoId,
          width: metadata.width.toString(),
          height: metadata.height.toString(),
          duration: metadata.duration.toString(),
          originalName: file.name
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const uploadSpeed = this.calculateUploadSpeed(snapshot.bytesTransferred, Date.now());
          const timeRemaining = this.calculateTimeRemaining(
            snapshot.totalBytes - snapshot.bytesTransferred,
            uploadSpeed
          );

          this.updateProgress(videoId, {
            videoId,
            progress: 30 + (progress * 0.3), // Upload is 30-60% of total progress
            stage: 'uploading',
            message: `Uploading... ${Math.round(progress)}%`,
            uploadSpeed,
            timeRemaining
          });
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Generate video thumbnail
   */
  private async generateThumbnail(file: File, videoId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.muted = true;
      video.crossOrigin = 'anonymous';

      video.onloadeddata = () => {
        // Seek to 10% of video duration for thumbnail
        video.currentTime = video.duration * 0.1;
      };

      video.onseeked = async () => {
        try {
          // Set canvas dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate thumbnail'));
              return;
            }

            try {
              // Upload thumbnail to storage
              const thumbnailRef = ref(storage, `videos/${videoId}/thumbnail.jpg`);
              const uploadTask = uploadBytesResumable(thumbnailRef, blob);

              uploadTask.on('state_changed', null, reject, async () => {
                const thumbnailUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(thumbnailUrl);
              });

            } catch (error) {
              reject(error);
            }
          }, 'image/jpeg', 0.8);

        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Start transcoding process
   */
  private async startTranscoding(
    videoId: string, 
    inputUrl: string, 
    metadata: VideoMetadata, 
    targetQualities?: string[]
  ): Promise<void> {
    try {
      // Determine target qualities based on input resolution
      const qualities = this.getTargetQualities(metadata, targetQualities);

      const transcodingJob: TranscodingJob = {
        id: this.generateTranscodingJobId(),
        videoId,
        inputUrl,
        outputQualities: qualities,
        status: 'queued',
        progress: 0,
        createdAt: new Date()
      };

      // Save transcoding job
      await this.saveTranscodingJob(transcodingJob);

      // In production, this would trigger server-side transcoding
      // For now, simulate the process
      console.log(`Starting transcoding for video ${videoId} with qualities:`, qualities.map(q => q.label));
      
      // Simulate transcoding progress
      await this.simulateTranscoding(transcodingJob);

    } catch (error) {
      console.error('Error starting transcoding:', error);
      throw error;
    }
  }

  // Private helper methods

  private updateProgress(videoId: string, progress: UploadProgress): void {
    this.uploadProgress.set(videoId, progress);
    
    const callback = this.progressCallbacks.get(videoId);
    if (callback) {
      callback(progress);
    }
  }

  private generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTranscodingJobId(): string {
    return `transcode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateBitrate(fileSize: number, duration: number): number {
    return Math.round((fileSize * 8) / (duration * 1000)); // kbps
  }

  private detectCodec(mimeType: string): string {
    if (mimeType.includes('mp4')) return 'h264';
    if (mimeType.includes('webm')) return 'vp9';
    if (mimeType.includes('ogg')) return 'theora';
    return 'unknown';
  }

  private getResolutionLabel(height: number): string {
    if (height >= 2160) return '4K';
    if (height >= 1440) return '1440p';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    return '240p';
  }

  private getOptimalQuality(metadata: VideoMetadata): VideoQuality {
    // Find the best quality that doesn't exceed the input resolution
    return this.QUALITY_PRESETS
      .filter(q => q.height <= metadata.height)
      .pop() || this.QUALITY_PRESETS[0];
  }

  private getTargetQualities(metadata: VideoMetadata, targetQualities?: string[]): VideoQuality[] {
    let qualities = this.QUALITY_PRESETS.filter(q => q.height <= metadata.height);

    if (targetQualities && targetQualities.length > 0) {
      qualities = qualities.filter(q => targetQualities.includes(q.label));
    }

    // Always include at least one quality
    if (qualities.length === 0) {
      qualities = [this.QUALITY_PRESETS[0]];
    }

    return qualities;
  }

  private calculateUploadSpeed(bytesTransferred: number, timestamp: number): number {
    // Simplified calculation - in production, use a rolling average
    const elapsed = (timestamp - Date.now()) / 1000;
    return elapsed > 0 ? bytesTransferred / elapsed : 0;
  }

  private calculateTimeRemaining(remainingBytes: number, uploadSpeed: number): number | undefined {
    return uploadSpeed > 0 ? remainingBytes / uploadSpeed : undefined;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private async saveVideoMetadata(videoId: string, data: any): Promise<void> {
    // In production, save to Firestore
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, ...data })
      });

      if (!response.ok) {
        throw new Error('Failed to save video metadata');
      }
    } catch (error) {
      console.error('Error saving video metadata:', error);
      throw error;
    }
  }

  private async deleteVideoMetadata(videoId: string): Promise<void> {
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete video metadata');
      }
    } catch (error) {
      console.error('Error deleting video metadata:', error);
      throw error;
    }
  }

  private async saveTranscodingJob(job: TranscodingJob): Promise<void> {
    try {
      const response = await fetch('/api/videos/transcoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job)
      });

      if (!response.ok) {
        throw new Error('Failed to save transcoding job');
      }
    } catch (error) {
      console.error('Error saving transcoding job:', error);
      throw error;
    }
  }

  private async simulateTranscoding(job: TranscodingJob): Promise<void> {
    // Simulate transcoding progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.updateProgress(job.videoId, {
        videoId: job.videoId,
        progress: 80 + (i * 0.2),
        stage: 'transcoding',
        message: `Processing video quality... ${i}%`
      });
    }
  }
}

// Export singleton instance
export const videoUploadService = new VideoUploadService(); 