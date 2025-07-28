import React, { useState, useRef } from 'react';
import { 
  Save, X, Upload, Image, Video, FileText, Presentation, 
  Calendar, Globe, Lock, Eye, EyeOff, Tags, Hash,
  Share2, Linkedin, MessageCircle, Link, Clock, Zap
} from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';

interface PostEditorProps {
  post?: any;
  onSave: (post: any) => void;
  onClose: () => void;
}

export const PostEditor: React.FC<PostEditorProps> = ({ post, onSave, onClose }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [mediaFiles, setMediaFiles] = useState(post?.mediaFiles || []);
  const [status, setStatus] = useState(post?.status || 'draft');
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt || '');
  const [tags, setTags] = useState(post?.tags || []);
  const [category, setCategory] = useState(post?.category || 'blog');
  const [seoTitle, setSeoTitle] = useState(post?.seoData?.metaTitle || '');
  const [seoDescription, setSeoDescription] = useState(post?.seoData?.metaDescription || '');
  const [enableComments, setEnableComments] = useState(true);
  const [enableSharing, setEnableSharing] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      const mediaFile = {
        id: `media_${Date.now()}_${Math.random()}`,
        type: getFileType(file.type),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file
      };
      setMediaFiles(prev => [...prev, mediaFile]);
    });
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    return 'document';
  };

  const handleSave = async () => {
    const postData = {
      id: post?.id || `post_${Date.now()}`,
      title,
      content,
      mediaFiles,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      tags,
      category,
      seoData: {
        metaTitle: seoTitle,
        metaDescription: seoDescription,
        keywords: tags
      },
      settings: {
        enableComments,
        enableSharing,
        emailNotification
      },
      shareUrls: generateShareUrls(title),
      createdAt: post?.createdAt || new Date(),
      updatedAt: new Date()
    };

    // Upload media files first
    for (const media of mediaFiles) {
      if (media.file) {
        await uploadMediaFile(media);
      }
    }

    onSave(postData);
  };

  const uploadMediaFile = async (media: any) => {
    const formData = new FormData();
    formData.append('file', media.file);
    formData.append('type', media.type);
    
    try {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      media.url = result.url;
      media.thumbnail = result.thumbnail;
      delete media.file;
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const generateShareUrls = (title: string) => {
    const encodedTitle = encodeURIComponent(title);
    const baseUrl = window.location.origin;
    return {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${baseUrl}&title=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle} ${baseUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${baseUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}`,
      direct: `${baseUrl}/post/${post?.id || 'new'}`
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-flow text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-subtitle font-bold">
              {post ? 'Edit Post' : 'Create New Post'}
            </h2>
            <p className="text-white/80">Build engaging content with multimedia support</p>
          </div>
          <ModernButton
            variant="glass"
            intent="secondary"
            icon={X}
            onClick={onClose}
          />
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-body-sm font-medium mb-2 text-gradient-accent">
                  Post Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter compelling title..."
                  className="input-modern w-full text-body"
                  required
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-body-sm font-medium mb-2 text-gradient-accent">
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content here... (Supports Markdown)"
                  className="input-modern w-full h-64 resize-none"
                  required
                />
                <div className="text-caption text-gray-500 mt-2">
                  Supports Markdown formatting. Use **bold**, *italic*, # headings, and more.
                </div>
              </div>

              {/* Media Upload */}
              <ModernCard variant="neumorphic" padding="lg">
                <div className="text-center">
                  <h3 className="text-body font-bold mb-4 text-holographic">Media Files</h3>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pptx,.ppt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <ModernButton
                    variant="default"
                    intent="accent"
                    size="lg"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Files
                  </ModernButton>
                  
                  <p className="text-body-sm text-gray-500 mt-2">
                    Support: Images, Videos, PowerPoint, Documents (Max 100MB each)
                  </p>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square bg-gradient-flow-subtle rounded-lg flex items-center justify-center">
                          {file.type === 'image' && <Image className="w-8 h-8 text-white" />}
                          {file.type === 'video' && <Video className="w-8 h-8 text-white" />}
                          {file.type === 'powerpoint' && <Presentation className="w-8 h-8 text-white" />}
                          {file.type === 'document' && <FileText className="w-8 h-8 text-white" />}
                        </div>
                        <button
                          onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-caption text-center mt-2 truncate">{file.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ModernCard>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              {/* Status & Scheduling */}
              <ModernCard variant="glass" padding="md">
                <h3 className="text-body font-bold mb-4 text-gradient-flow">Publishing</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-modern w-full"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Publish Now</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  {status === 'scheduled' && (
                    <div>
                      <label className="block text-body-sm font-medium mb-2">Schedule Date</label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="input-modern w-full"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-body-sm font-medium mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-modern w-full"
                    >
                      <option value="blog">Blog Article</option>
                      <option value="video">Video Content</option>
                      <option value="short">Short Video</option>
                      <option value="presentation">Presentation</option>
                      <option value="mixed">Mixed Media</option>
                    </select>
                  </div>
                </div>
              </ModernCard>

              {/* Tags */}
              <ModernCard variant="default" padding="md">
                <h3 className="text-body font-bold mb-4 text-holographic">Tags</h3>
                <input
                  type="text"
                  placeholder="Add tags (comma separated)"
                  value={tags.join(', ')}
                  onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                  className="input-modern w-full"
                />
              </ModernCard>

              {/* Settings */}
              <ModernCard variant="neumorphic" padding="md">
                <h3 className="text-body font-bold mb-4 text-gradient-accent">Features</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enableComments}
                      onChange={(e) => setEnableComments(e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-body-sm">Enable Comments</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enableSharing}
                      onChange={(e) => setEnableSharing(e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-body-sm">Enable Sharing</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-body-sm">Email Subscribers</span>
                  </label>
                </div>
              </ModernCard>

              {/* SEO */}
              <ModernCard variant="brutalist" padding="md">
                <h3 className="text-body font-bold mb-4">SEO Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="SEO optimized title..."
                      className="input-modern w-full"
                      maxLength={60}
                    />
                    <div className="text-caption text-gray-500 mt-1">{seoTitle.length}/60</div>
                  </div>
                  
                  <div>
                    <label className="block text-body-sm font-medium mb-2">Meta Description</label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Compelling description for search results..."
                      className="input-modern w-full h-20 resize-none"
                      maxLength={160}
                    />
                    <div className="text-caption text-gray-500 mt-1">{seoDescription.length}/160</div>
                  </div>
                </div>
              </ModernCard>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-low-contrast">
            <div className="flex items-center gap-4">
              <ModernButton
                variant="minimal"
                intent="secondary"
                onClick={onClose}
              >
                Cancel
              </ModernButton>
              
              <ModernButton
                variant="neumorphic"
                intent="secondary"
                icon={Save}
                onClick={() => handleSave()}
              >
                Save Draft
              </ModernButton>
            </div>

            <div className="flex items-center gap-4">
              {status === 'scheduled' && (
                <div className="flex items-center text-body-sm text-blue-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Will publish on {new Date(scheduledAt).toLocaleDateString()}
                </div>
              )}
              
              <ModernButton
                variant="default"
                intent="primary"
                icon={status === 'live' ? Globe : Calendar}
                onClick={handleSave}
                size="lg"
              >
                {status === 'live' ? 'Publish Now' : 
                 status === 'scheduled' ? 'Schedule Post' : 
                 'Save & Preview'}
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 