/**
 * Video Upload Modal Component
 * Comprehensive interface for uploading videos with multiple options
 * @version 1.0.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Film, Youtube, Link as LinkIcon, FileVideo, Image, Clock, Eye, EyeOff, Calendar, Plus, Trash2 } from 'lucide-react';
import { videoUploadService, UploadProgress } from '../../services/video/VideoUploadService';
import { videoPostsService } from '../../services/video/VideoPostsService';
import { youtubeIntegrationService } from '../../services/video/YouTubeIntegrationService';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (postId: string) => void;
}

interface VideoFile {
  file: File;
  preview: string;
  metadata?: any;
}

interface ChapterData {
  id: string;
  title: string;
  startTime: string;
  description: string;
}

interface SubtitleData {
  id: string;
  language: string;
  label: string;
  file?: File;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] = useState<'file' | 'youtube' | 'vimeo'>('file');
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    categories: [] as string[],
    tags: [] as string[],
    published: false,
    featured: false,
    monetized: false,
    ageRestricted: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    scheduledDate: '',
    externalUrl: '',
    privacy: 'public' as 'public' | 'private' | 'unlisted'
  });

  // Advanced features
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleData[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [step, setStep] = useState<'upload' | 'details' | 'advanced'>('upload');

  // Available options
  const availableCategories = [
    'Technology', 'Tutorial', 'Entertainment', 'Education', 'Gaming',
    'Music', 'Sports', 'News', 'Lifestyle', 'Business', 'Science', 'Art'
  ];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  // File selection handlers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 2GB limit');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setSelectedFile({ file, preview });

    // Extract title from filename
    if (!formData.title) {
      const titleFromFile = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setFormData(prev => ({ ...prev, title: titleFromFile }));
    }

    setStep('details');
  }, [formData.title]);

  const handleThumbnailSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setCustomThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }, []);

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleKeywordsChange = (keywordsString: string) => {
    const keywords = keywordsString.split(',').map(kw => kw.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, seoKeywords: keywords }));
  };

  // Chapter management
  const addChapter = () => {
    const newChapter: ChapterData = {
      id: `chapter_${Date.now()}`,
      title: '',
      startTime: '00:00',
      description: ''
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const updateChapter = (id: string, field: string, value: string) => {
    setChapters(prev => 
      prev.map(chapter => 
        chapter.id === id ? { ...chapter, [field]: value } : chapter
      )
    );
  };

  const removeChapter = (id: string) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== id));
  };

  // Subtitle management
  const addSubtitle = () => {
    const newSubtitle: SubtitleData = {
      id: `subtitle_${Date.now()}`,
      language: 'en',
      label: 'English'
    };
    setSubtitles(prev => [...prev, newSubtitle]);
  };

  const updateSubtitle = (id: string, field: string, value: any) => {
    setSubtitles(prev =>
      prev.map(subtitle =>
        subtitle.id === id ? { ...subtitle, [field]: value } : subtitle
      )
    );
  };

  const removeSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(subtitle => subtitle.id !== id));
  };

  // Upload handlers
  const handleFileUpload = async () => {
    if (!selectedFile || !currentUser) return;

    try {
      setUploading(true);

      // Validate form
      if (!formData.title.trim()) {
        toast.error('Please enter a title');
        return;
      }

      if (formData.categories.length === 0) {
        toast.error('Please select at least one category');
        return;
      }

      // Create video post
      const postId = await videoPostsService.createVideoPost(
        selectedFile.file,
        {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          categories: formData.categories,
          tags: formData.tags,
          published: formData.published,
          featured: formData.featured,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          monetized: formData.monetized,
          ageRestricted: formData.ageRestricted
        },
        currentUser.id,
        setUploadProgress
      );

      toast.success('Video uploaded successfully!');
      onUploadComplete?.(postId);
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleExternalUpload = async () => {
    if (!formData.externalUrl.trim() || !currentUser) return;

    try {
      setUploading(true);

      // Validate form
      if (!formData.title.trim()) {
        toast.error('Please enter a title');
        return;
      }

      // Determine platform
      let platform: 'youtube' | 'vimeo';
      if (formData.externalUrl.includes('youtube.com') || formData.externalUrl.includes('youtu.be')) {
        platform = 'youtube';
      } else if (formData.externalUrl.includes('vimeo.com')) {
        platform = 'vimeo';
      } else {
        toast.error('Please enter a valid YouTube or Vimeo URL');
        return;
      }

      // Create external video post
      const postId = await videoPostsService.createExternalVideoPost(
        formData.externalUrl,
        platform,
        {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          categories: formData.categories,
          tags: formData.tags,
          published: formData.published,
          featured: formData.featured,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          seoKeywords: formData.seoKeywords,
          monetized: formData.monetized,
          ageRestricted: formData.ageRestricted
        },
        currentUser.id
      );

      toast.success('External video post created successfully!');
      onUploadComplete?.(postId);
      onClose();

    } catch (error) {
      console.error('External upload error:', error);
      toast.error('Failed to create external video post');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (uploadType === 'file') {
      handleFileUpload();
    } else {
      handleExternalUpload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <ModernCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-medium-contrast">
          <h2 className="text-title font-bold text-high-contrast">Upload Video</h2>
          <button
            onClick={onClose}
            className="p-2 text-low-contrast hover:text-medium-contrast transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Type Selection */}
              <div>
                <h3 className="text-subtitle font-semibold text-high-contrast mb-4">Choose Upload Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setUploadType('file')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      uploadType === 'file'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-medium-contrast hover:border-blue-300'
                    }`}
                  >
                    <FileVideo className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                    <h4 className="font-medium text-high-contrast mb-2">Upload File</h4>
                    <p className="text-body-sm text-medium-contrast">Upload a video file from your device</p>
                  </button>

                  <button
                    onClick={() => setUploadType('youtube')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      uploadType === 'youtube'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-medium-contrast hover:border-red-300'
                    }`}
                  >
                    <Youtube className="w-8 h-8 mx-auto mb-3 text-red-500" />
                    <h4 className="font-medium text-high-contrast mb-2">YouTube Video</h4>
                    <p className="text-body-sm text-medium-contrast">Embed a YouTube video</p>
                  </button>

                  <button
                    onClick={() => setUploadType('vimeo')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      uploadType === 'vimeo'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-medium-contrast hover:border-green-300'
                    }`}
                  >
                    <Film className="w-8 h-8 mx-auto mb-3 text-green-500" />
                    <h4 className="font-medium text-high-contrast mb-2">Vimeo Video</h4>
                    <p className="text-body-sm text-medium-contrast">Embed a Vimeo video</p>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              {uploadType === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {!selectedFile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-12 border-2 border-dashed border-medium-contrast hover:border-blue-500 rounded-lg transition-colors text-center"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-medium-contrast" />
                      <h4 className="text-body-lg font-medium text-high-contrast mb-2">
                        Drop video file here or click to upload
                      </h4>
                      <p className="text-body-sm text-medium-contrast">
                        Supports MP4, WebM, AVI, MOV, WMV, FLV, MKV (Max 2GB)
                      </p>
                    </button>
                  ) : (
                    <div className="border border-medium-contrast rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <video
                          src={selectedFile.preview}
                          className="w-32 h-18 object-cover rounded"
                          controls
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-high-contrast">{selectedFile.file.name}</h4>
                          <p className="text-body-sm text-medium-contrast">
                            {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setStep('upload');
                          }}
                          className="p-2 text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* External URL Input */}
              {(uploadType === 'youtube' || uploadType === 'vimeo') && (
                <div>
                  <label className="block text-body font-medium text-high-contrast mb-2">
                    {uploadType === 'youtube' ? 'YouTube' : 'Vimeo'} URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-low-contrast" />
                    <input
                      type="url"
                      value={formData.externalUrl}
                      onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                      placeholder={`Enter ${uploadType} video URL`}
                      className="w-full pl-10 pr-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                    />
                  </div>
                  
                  {formData.externalUrl && (
                    <ModernButton
                      variant="default"
                      intent="primary"
                      className="mt-4"
                      onClick={() => setStep('details')}
                    >
                      Continue
                    </ModernButton>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter video title"
                      className="w-full px-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter video description"
                      rows={4}
                      className="w-full px-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="tutorial, programming, web development"
                      className="w-full px-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Thumbnail */}
                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Custom Thumbnail
                    </label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-medium-contrast hover:border-blue-500 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Image className="w-8 h-8 mx-auto mb-2 text-medium-contrast" />
                          <p className="text-body-sm text-medium-contrast">Upload thumbnail</p>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Privacy
                    </label>
                    <select
                      value={formData.privacy}
                      onChange={(e) => handleInputChange('privacy', e.target.value)}
                      className="w-full px-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {/* Scheduled Publishing */}
                  <div>
                    <label className="block text-body font-medium text-high-contrast mb-2">
                      Scheduled Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-low-contrast" />
                      <input
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-body font-medium text-high-contrast mb-2">
                  Categories *
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-3 py-2 rounded-full text-body-sm font-medium transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-blue-500 text-white'
                          : 'bg-low-contrast text-medium-contrast hover:bg-medium-contrast'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => handleInputChange('published', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-body-sm text-medium-contrast">Publish immediately</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-body-sm text-medium-contrast">Featured</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.monetized}
                    onChange={(e) => handleInputChange('monetized', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-body-sm text-medium-contrast">Monetize</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ageRestricted}
                    onChange={(e) => handleInputChange('ageRestricted', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-body-sm text-medium-contrast">Age restricted</span>
                </label>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-medium-contrast">
                <ModernButton
                  variant="minimal"
                  intent="secondary"
                  onClick={() => setStep('upload')}
                >
                  Back
                </ModernButton>

                <div className="flex items-center space-x-3">
                  <ModernButton
                    variant="minimal"
                    intent="secondary"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    Advanced Options
                  </ModernButton>

                  <ModernButton
                    variant="default"
                    intent="primary"
                    onClick={handleSubmit}
                    loading={uploading}
                    disabled={!formData.title.trim() || formData.categories.length === 0}
                  >
                    {uploadType === 'file' ? 'Upload Video' : 'Create Post'}
                  </ModernButton>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress && (
            <div className="mt-6 p-4 bg-low-contrast rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-sm font-medium text-high-contrast">
                  {uploadProgress.message}
                </span>
                <span className="text-body-sm text-medium-contrast">
                  {Math.round(uploadProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-medium-contrast rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              {uploadProgress.timeRemaining && (
                <p className="text-caption text-low-contrast mt-2">
                  {Math.round(uploadProgress.timeRemaining / 1000)}s remaining
                </p>
              )}
            </div>
          )}

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="mt-6 p-6 bg-low-contrast rounded-lg space-y-6">
              <h3 className="text-subtitle font-semibold text-high-contrast">Advanced Options</h3>

              {/* SEO Settings */}
              <div className="space-y-4">
                <h4 className="text-body font-medium text-high-contrast">SEO Settings</h4>
                
                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    placeholder="Custom title for search engines"
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                    placeholder="Meta description for search engines"
                    rows={2}
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast resize-none"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-medium-contrast mb-1">
                    SEO Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.seoKeywords.join(', ')}
                    onChange={(e) => handleKeywordsChange(e.target.value)}
                    placeholder="video, tutorial, programming"
                    className="w-full px-3 py-2 bg-medium-contrast border border-medium-contrast rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-high-contrast"
                  />
                </div>
              </div>

              {/* Video Chapters */}
              {uploadType === 'file' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-body font-medium text-high-contrast">Video Chapters</h4>
                    <ModernButton
                      variant="minimal"
                      intent="primary"
                      size="sm"
                      icon={Plus}
                      onClick={addChapter}
                    >
                      Add Chapter
                    </ModernButton>
                  </div>

                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-2">
                        <label className="block text-caption text-medium-contrast mb-1">
                          Start Time
                        </label>
                        <input
                          type="text"
                          value={chapter.startTime}
                          onChange={(e) => updateChapter(chapter.id, 'startTime', e.target.value)}
                          placeholder="00:00"
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-caption text-medium-contrast mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                          placeholder="Chapter title"
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-caption text-medium-contrast mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={chapter.description}
                          onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                          placeholder="Chapter description"
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeChapter(chapter.id)}
                          className="p-1 text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtitles */}
              {uploadType === 'file' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-body font-medium text-high-contrast">Subtitles</h4>
                    <ModernButton
                      variant="minimal"
                      intent="primary"
                      size="sm"
                      icon={Plus}
                      onClick={addSubtitle}
                    >
                      Add Subtitle
                    </ModernButton>
                  </div>

                  {subtitles.map((subtitle) => (
                    <div key={subtitle.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3">
                        <label className="block text-caption text-medium-contrast mb-1">
                          Language
                        </label>
                        <select
                          value={subtitle.language}
                          onChange={(e) => updateSubtitle(subtitle.id, 'language', e.target.value)}
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        >
                          {availableLanguages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-caption text-medium-contrast mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={subtitle.label}
                          onChange={(e) => updateSubtitle(subtitle.id, 'label', e.target.value)}
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-caption text-medium-contrast mb-1">
                          File
                        </label>
                        <input
                          type="file"
                          accept=".srt,.vtt"
                          onChange={(e) => updateSubtitle(subtitle.id, 'file', e.target.files?.[0])}
                          className="w-full px-2 py-1 bg-medium-contrast border border-medium-contrast rounded text-body-sm text-high-contrast"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeSubtitle(subtitle.id)}
                          className="p-1 text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ModernCard>
    </div>
  );
}; 