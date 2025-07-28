/**
 * Advanced Video Player Component
 * Full-featured video player with analytics, quality selection, and custom controls
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, SkipBack, SkipForward, RotateCcw, Loader,
  Download, Share2, Heart, MessageCircle, Bookmark
} from 'lucide-react';
import { videoStreamingService, VideoSource, PlaybackState, StreamingEvent } from '../../services/video/VideoStreamingService';
import { ModernButton } from '../ModernDesignSystem';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface AdvancedVideoPlayerProps {
  videoId: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onError?: (error: string) => void;
  enableAnalytics?: boolean;
  enableSocialFeatures?: boolean;
  enableDownload?: boolean;
  customControls?: boolean;
}

interface QualityMenuProps {
  qualities: string[];
  currentQuality: string;
  onQualityChange: (quality: string) => void;
  onClose: () => void;
}

interface SpeedMenuProps {
  speeds: number[];
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onClose: () => void;
}

const QualityMenu: React.FC<QualityMenuProps> = ({ qualities, currentQuality, onQualityChange, onClose }) => (
  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] z-50">
    <div className="text-white text-body-sm font-medium mb-2 px-2">Quality</div>
    {qualities.map(quality => (
      <button
        key={quality}
        onClick={() => {
          onQualityChange(quality);
          onClose();
        }}
        className={`w-full text-left px-2 py-1 text-body-sm text-white hover:bg-white/20 rounded transition-colors ${
          currentQuality === quality ? 'bg-blue-500' : ''
        }`}
      >
        {quality}
      </button>
    ))}
  </div>
);

const SpeedMenu: React.FC<SpeedMenuProps> = ({ speeds, currentSpeed, onSpeedChange, onClose }) => (
  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[100px] z-50">
    <div className="text-white text-body-sm font-medium mb-2 px-2">Speed</div>
    {speeds.map(speed => (
      <button
        key={speed}
        onClick={() => {
          onSpeedChange(speed);
          onClose();
        }}
        className={`w-full text-left px-2 py-1 text-body-sm text-white hover:bg-white/20 rounded transition-colors ${
          currentSpeed === speed ? 'bg-blue-500' : ''
        }`}
      >
        {speed === 1 ? 'Normal' : `${speed}x`}
      </button>
    ))}
  </div>
);

export const AdvancedVideoPlayer: React.FC<AdvancedVideoPlayerProps> = ({
  videoId,
  autoplay = false,
  muted = false,
  loop = false,
  poster,
  className = '',
  onTimeUpdate,
  onPlayStateChange,
  onError,
  enableAnalytics = true,
  enableSocialFeatures = true,
  enableDownload = false,
  customControls = true
}) => {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTime: 0,
    duration: 0,
    paused: true,
    muted: muted,
    volume: 1,
    playbackRate: 1,
    buffered: null,
    seekable: null,
    currentQuality: 'auto',
    availableQualities: [],
    isLive: false,
    hasError: false
  });

  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const analyticsSessionRef = useRef<{
    startTime: number;
    lastProgressTime: number;
    watchTime: number;
    qualityChanges: number;
    seeks: number;
    maxProgressReached: number;
  }>({
    startTime: 0,
    lastProgressTime: 0,
    watchTime: 0,
    qualityChanges: 0,
    seeks: 0,
    maxProgressReached: 0
  });

  // Load video source
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        const source = await videoStreamingService.getVideoSource(videoId);
        if (!source) {
          throw new Error('Video not found');
        }

        setVideoSource(source);
        
        // Get optimal stream
        const optimalStream = videoStreamingService.getOptimalStream(source);
        
        setPlaybackState(prev => ({
          ...prev,
          availableQualities: source.streams.map(s => s.quality),
          currentQuality: optimalStream.quality
        }));

        // Set video source
        if (videoRef.current) {
          videoRef.current.src = optimalStream.url;
          videoRef.current.poster = poster || source.thumbnail;
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, poster, onError]);

  // Initialize analytics session
  useEffect(() => {
    if (enableAnalytics && videoSource) {
      analyticsSessionRef.current.startTime = Date.now();
      
      // Track video load
      videoStreamingService.trackEvent(videoId, {
        type: 'progress',
        timestamp: Date.now(),
        data: { action: 'video_loaded', quality: playbackState.currentQuality }
      });
    }
  }, [videoSource, videoId, enableAnalytics, playbackState.currentQuality]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;

    setPlaybackState(prev => ({
      ...prev,
      duration: videoRef.current!.duration,
      buffered: videoRef.current!.buffered,
      seekable: videoRef.current!.seekable
    }));
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    setPlaybackState(prev => ({
      ...prev,
      currentTime,
      buffered: videoRef.current!.buffered
    }));

    onTimeUpdate?.(currentTime, duration);

    // Analytics tracking
    if (enableAnalytics) {
      const session = analyticsSessionRef.current;
      const now = Date.now();
      
      if (session.lastProgressTime > 0) {
        session.watchTime += (now - session.lastProgressTime);
      }
      session.lastProgressTime = now;

      const progress = (currentTime / duration) * 100;
      if (progress > session.maxProgressReached) {
        session.maxProgressReached = progress;
      }

      // Track progress milestones
      if (Math.floor(progress) % 25 === 0 && Math.floor(progress) > 0) {
        videoStreamingService.trackEvent(videoId, {
          type: 'progress',
          timestamp: now,
          data: { 
            progress: Math.floor(progress),
            currentTime,
            duration
          }
        });
      }
    }
  };

  const handlePlay = () => {
    setPlaybackState(prev => ({ ...prev, paused: false }));
    onPlayStateChange?.(true);
    
    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'play',
        timestamp: Date.now(),
        data: { currentTime: playbackState.currentTime }
      });
    }
  };

  const handlePause = () => {
    setPlaybackState(prev => ({ ...prev, paused: true }));
    onPlayStateChange?.(false);
    
    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'pause',
        timestamp: Date.now(),
        data: { currentTime: playbackState.currentTime }
      });
    }
  };

  const handleEnded = () => {
    setPlaybackState(prev => ({ ...prev, paused: true }));
    onPlayStateChange?.(false);
    
    if (enableAnalytics) {
      const session = analyticsSessionRef.current;
      videoStreamingService.trackEvent(videoId, {
        type: 'ended',
        timestamp: Date.now(),
        data: {
          watchTime: session.watchTime,
          completionRate: (session.maxProgressReached / 100),
          qualityChanges: session.qualityChanges,
          seeks: session.seeks
        }
      });

      // Update view count
      videoStreamingService.updateViewCount(videoId, {
        watchTime: session.watchTime,
        completed: session.maxProgressReached >= 90,
        quality: playbackState.currentQuality,
        device: this.getDeviceType(),
        location: this.getUserLocation()
      });
    }
  };

  const handleError = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const errorMessage = `Video error: ${video.error?.message || 'Unknown error'}`;
    
    setError(errorMessage);
    setPlaybackState(prev => ({ ...prev, hasError: true, error: errorMessage }));
    onError?.(errorMessage);

    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'error',
        timestamp: Date.now(),
        data: { error: errorMessage }
      });
    }
  };

  // Control handlers
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (playbackState.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    const newMuted = !playbackState.muted;
    videoRef.current.muted = newMuted;
    setPlaybackState(prev => ({ ...prev, muted: newMuted }));

    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'volumechange',
        timestamp: Date.now(),
        data: { muted: newMuted, volume: playbackState.volume }
      });
    }
  };

  const handleVolumeChange = useCallback((volume: number) => {
    if (!videoRef.current) return;

    videoRef.current.volume = volume;
    videoRef.current.muted = volume === 0;
    
    setPlaybackState(prev => ({
      ...prev,
      volume,
      muted: volume === 0
    }));

    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'volumechange',
        timestamp: Date.now(),
        data: { volume, muted: volume === 0 }
      });
    }
  }, [videoId, enableAnalytics]);

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = time;
    setPlaybackState(prev => ({ ...prev, currentTime: time }));

    if (enableAnalytics) {
      analyticsSessionRef.current.seeks++;
      videoStreamingService.trackEvent(videoId, {
        type: 'seek',
        timestamp: Date.now(),
        data: { fromTime: playbackState.currentTime, toTime: time }
      });
    }
  }, [videoId, enableAnalytics, playbackState.currentTime]);

  const handleQualityChange = (quality: string) => {
    if (!videoRef.current || !videoSource) return;

    const stream = videoSource.streams.find(s => s.quality === quality);
    if (!stream) return;

    const currentTime = videoRef.current.currentTime;
    const wasPaused = playbackState.paused;

    videoRef.current.src = stream.url;
    videoRef.current.currentTime = currentTime;

    if (!wasPaused) {
      videoRef.current.play();
    }

    setPlaybackState(prev => ({ ...prev, currentQuality: quality }));

    if (enableAnalytics) {
      analyticsSessionRef.current.qualityChanges++;
      videoStreamingService.trackEvent(videoId, {
        type: 'qualitychange',
        timestamp: Date.now(),
        data: { 
          fromQuality: playbackState.currentQuality,
          toQuality: quality,
          currentTime
        }
      });
    }

    toast.success(`Quality changed to ${quality}`);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;

    videoRef.current.playbackRate = speed;
    setPlaybackState(prev => ({ ...prev, playbackRate: speed }));

    if (enableAnalytics) {
      videoStreamingService.trackEvent(videoId, {
        type: 'ratechange',
        timestamp: Date.now(),
        data: { 
          fromRate: playbackState.playbackRate,
          toRate: speed
        }
      });
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!fullscreen) {
        await containerRef.current.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const skipBackward = () => {
    handleSeek(Math.max(0, playbackState.currentTime - 10));
  };

  const skipForward = () => {
    handleSeek(Math.min(playbackState.duration, playbackState.currentTime + 10));
  };

  // Social features
  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please sign in to like videos');
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (response.ok) {
        setLiked(!liked);
        toast.success(liked ? 'Like removed' : 'Video liked!');
      }
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error('Please sign in to bookmark videos');
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
        toast.success(bookmarked ? 'Bookmark removed' : 'Video bookmarked!');
      }
    } catch (error) {
      toast.error('Failed to bookmark video');
    }
  };

  const handleShare = async () => {
    if (!videoSource) return;

    const shareData = {
      title: videoSource.title,
      text: videoSource.description,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Video link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = () => {
    if (!videoSource) return;
    
    const link = document.createElement('a');
    link.href = videoSource.streams[0].url;
    link.download = `${videoSource.title}.mp4`;
    link.click();
  };

  // Controls visibility
  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!playbackState.paused && !isDragging) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const hideControls = () => {
    if (!playbackState.paused && !isDragging) {
      setControlsVisible(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar handlers
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    const newTime = percentage * playbackState.duration;
    
    handleSeek(newTime);
  };

  // Volume bar handlers
  const handleVolumeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;

    const rect = volumeRef.current.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    
    handleVolumeChange(Math.max(0, Math.min(1, percentage)));
  };

  // Utility methods
  const getDeviceType = () => {
    if (window.innerWidth <= 768) return 'mobile';
    if (window.innerWidth <= 1024) return 'tablet';
    return 'desktop';
  };

  const getUserLocation = () => {
    // In production, get from IP geolocation
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center text-white p-8 text-center">
          <div>
            <div className="text-red-400 mb-2">⚠️</div>
            <div className="text-body font-medium mb-2">Video Error</div>
            <div className="text-body-sm text-gray-300">{error}</div>
            <ModernButton
              variant="minimal"
              intent="secondary"
              className="mt-4"
              icon={RotateCcw}
              onClick={() => window.location.reload()}
            >
              Retry
            </ModernButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={showControls}
      onMouseLeave={hideControls}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onClick={togglePlayPause}
      />

      {/* Custom Controls Overlay */}
      {customControls && (
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="bg-black/50 hover:bg-black/70 rounded-full p-4 transition-all duration-200 backdrop-blur-sm"
            >
              {playbackState.paused ? (
                <Play className="w-12 h-12 text-white fill-current" />
              ) : (
                <Pause className="w-12 h-12 text-white fill-current" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-500 rounded-full relative"
                style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayPause}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  {playbackState.paused ? (
                    <Play className="w-5 h-5 fill-current" />
                  ) : (
                    <Pause className="w-5 h-5 fill-current" />
                  )}
                </button>

                <button
                  onClick={skipBackward}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={skipForward}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    {playbackState.muted || playbackState.volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <div 
                    ref={volumeRef}
                    className="w-20 h-2 bg-white/20 rounded-full cursor-pointer"
                    onClick={handleVolumeClick}
                  >
                    <div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${playbackState.volume * 100}%` }}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-body-sm">
                  {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-2">
                {/* Social Features */}
                {enableSocialFeatures && (
                  <>
                    <button
                      onClick={handleLike}
                      className={`p-2 hover:bg-white/20 rounded transition-colors ${
                        liked ? 'text-red-400' : ''
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={handleBookmark}
                      className={`p-2 hover:bg-white/20 rounded transition-colors ${
                        bookmarked ? 'text-yellow-400' : ''
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Download */}
                {enableDownload && (
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}

                {/* Settings Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {showQualityMenu && (
                    <QualityMenu
                      qualities={playbackState.availableQualities}
                      currentQuality={playbackState.currentQuality}
                      onQualityChange={handleQualityChange}
                      onClose={() => setShowQualityMenu(false)}
                    />
                  )}
                </div>

                {/* Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="p-2 hover:bg-white/20 rounded transition-colors text-body-sm"
                  >
                    {playbackState.playbackRate}x
                  </button>

                  {showSpeedMenu && (
                    <SpeedMenu
                      speeds={[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
                      currentSpeed={playbackState.playbackRate}
                      onSpeedChange={handleSpeedChange}
                      onClose={() => setShowSpeedMenu(false)}
                    />
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  {fullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 