import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, ServerOff } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
}

const ACCEPTED_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.md'];

export const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if the backend document-ingestion endpoint is reachable
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        setBackendAvailable(res.ok);
      } catch {
        setBackendAvailable(false);
      }
    };
    check();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    if (!backendAvailable) {
      toast.error('Document ingestion requires a running backend service.');
      return;
    }

    const newFiles: UploadedFile[] = [];
    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
        toast.error(`Unsupported file type: ${file.name}. Use PDF, Markdown, or TXT.`);
        return;
      }
      newFiles.push({ name: file.name, size: file.size, type: file.type || ext, status: 'uploading' });
    });

    setFiles((prev) => [...prev, ...newFiles]);

    // Attempt real upload when backend is connected
    newFiles.forEach(async (f, i) => {
      try {
        // Build multipart form data
        const formData = new FormData();
        formData.append('file', fileList[i]);

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) throw new Error('Upload failed');

        setFiles((prev) =>
          prev.map((pf) => (pf.name === f.name && pf.status === 'uploading' ? { ...pf, status: 'success' } : pf)),
        );
        toast.success(`${f.name} uploaded successfully`);
      } catch {
        setFiles((prev) =>
          prev.map((pf) => (pf.name === f.name && pf.status === 'uploading' ? { ...pf, status: 'error' } : pf)),
        );
        toast.error(`Failed to upload ${f.name}`);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <div className="space-y-4">
      {/* Backend unavailable banner */}
      {!backendAvailable && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
          <ServerOff className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-yellow-600 dark:text-yellow-400">
              Document ingestion requires a backend service
            </p>
            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
              The Golang API with pgvector must be running to process uploads.
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (backendAvailable) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={backendAvailable ? handleDrop : (e) => e.preventDefault()}
        onClick={() => backendAvailable && inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          !backendAvailable
            ? 'border-medium-contrast/50 opacity-50 cursor-not-allowed'
            : isDragging
              ? 'border-accent-primary bg-accent-primary/5 cursor-pointer'
              : 'border-medium-contrast hover:border-accent-primary/50 hover:bg-low-contrast/50 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.txt"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={!backendAvailable}
        />
        <Upload
          className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-accent-primary' : 'text-low-contrast'}`}
        />
        <p className="text-body font-medium text-high-contrast mb-1">
          {backendAvailable ? 'Drop files here or click to browse' : 'Upload disabled — no backend connected'}
        </p>
        <p className="text-body-sm text-low-contrast">Supports PDF, Markdown, and TXT files</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 rounded-xl border border-medium-contrast bg-medium-contrast/30 px-4 py-3"
            >
              <FileText className="w-5 h-5 text-accent-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-high-contrast truncate">{file.name}</p>
                <p className="text-xs text-low-contrast">{formatSize(file.size)}</p>
              </div>
              {file.status === 'uploading' && (
                <div className="w-4 h-4 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              )}
              {file.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                className="p-1 text-low-contrast hover:text-high-contrast transition-colors rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
