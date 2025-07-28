import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Video, FileText, Presentation, Music } from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'powerpoint' | 'audio';
  size: number;
  url: string;
  thumbnail?: string;
  file?: File;
  uploadProgress?: number;
}

interface MediaUploaderProps {
  onFilesUpload: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  existingFiles?: MediaFile[];
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFilesUpload,
  maxFiles = 10,
  maxFileSize = 100,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.ppt', '.pptx', 'audio/*'],
  existingFiles = []
}) => {
  const [files, setFiles] = useState<MediaFile[]>(existingFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): MediaFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('powerpoint') || file.type.includes('presentation') || 
        file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) return 'powerpoint';
    return 'document';
  };

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'powerpoint': return Presentation;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    });
    
    if (!isValidType) {
      return 'File type not supported';
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<MediaFile> => {
    const fileId = `file_${Date.now()}_${Math.random()}`;
    
    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', getFileType(file));
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: current + 10 };
        });
      }, 200);

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      const mediaFile: MediaFile = {
        id: fileId,
        name: file.name,
        type: getFileType(file),
        size: file.size,
        url: result.url || URL.createObjectURL(file),
        thumbnail: result.thumbnail,
        file: file
      };

      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 1000);

      return mediaFile;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      throw error;
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    try {
      const uploadPromises = validFiles.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const updatedFiles = [...files, ...uploadedFiles];
      setFiles(updatedFiles);
      onFilesUpload(updatedFiles);
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload some files');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onFilesUpload(updatedFiles);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <ModernCard 
        variant="neumorphic" 
        padding="lg"
        className={`transition-all duration-200 cursor-pointer ${
          isDragging ? 'border-2 border-gradient-accent bg-gradient-flow-subtle' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        <div className="text-center py-8">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-body-lg font-bold text-gradient-accent mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-medium-contrast mb-4">
            Support for images, videos, documents, presentations, and audio files
          </p>
          <div className="text-body-sm text-subtle">
            Max {maxFiles} files • Up to {maxFileSize}MB each
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          
          <ModernButton
            variant="default"
            intent="primary"
            size="lg"
            icon={Upload}
            className="mt-4"
          >
            Choose Files
          </ModernButton>
        </div>
      </ModernCard>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-body font-bold text-gradient-accent">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              const progress = uploadProgress[file.id];
              
              return (
                <ModernCard key={file.id} variant="glass" padding="md">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {file.type === 'image' && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-flow rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-high-contrast truncate">
                        {file.name}
                      </p>
                      <p className="text-caption text-medium-contrast">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                      
                      {progress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-flow h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-caption text-gray-500 mt-1">
                            {progress}% uploaded
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </ModernCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <ModernCard variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div className="text-body-sm text-medium-contrast">
              Total: {files.length} files • {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-caption text-green-600">
                ✓ All files ready
              </span>
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
}; 