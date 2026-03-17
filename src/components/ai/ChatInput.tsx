import React from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  researchMode: boolean;
  attachedFile: File | null;
  onAttachFile: () => void;
  onRemoveFile: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isLoading,
  researchMode,
  attachedFile,
  onAttachFile,
  onRemoveFile,
  onFileSelect,
  inputRef,
  fileInputRef,
}) => (
  <>
    {/* File attachment preview */}
    {attachedFile && (
      <div className="px-4 pb-1">
        <div className="flex items-center gap-2 text-xs text-medium-contrast bg-medium-contrast/30 rounded-lg px-3 py-2">
          <Paperclip className="w-3.5 h-3.5 text-accent-primary" />
          <span className="truncate flex-1">{attachedFile.name}</span>
          <button onClick={onRemoveFile} className="text-low-contrast hover:text-high-contrast">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )}

    {/* Input area */}
    <div className="px-4 py-3 border-t border-medium-contrast/40 bg-gradient-to-r from-medium-contrast/40 via-medium-contrast/20 to-medium-contrast/40 flex-shrink-0">
      <div className="flex items-end gap-2">
        <button
          onClick={onAttachFile}
          disabled={isLoading}
          className="p-2 text-low-contrast hover:text-high-contrast transition-colors rounded-lg hover:bg-medium-contrast/40 disabled:opacity-40 flex-shrink-0"
          title="Attach file (PDF, TXT, MD)"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={onFileSelect}
          className="hidden"
        />

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={researchMode ? 'Enter a research topic...' : 'Ask about your documents...'}
          disabled={isLoading}
          rows={1}
          aria-label="Type your question"
          className={`flex-1 bg-white dark:bg-gray-800 border rounded-xl px-4 py-2.5 text-body-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all resize-none overflow-hidden ${
            researchMode
              ? 'border-indigo-500/30 focus:ring-indigo-500/40 focus:border-indigo-500/40'
              : 'border-gray-300 dark:border-gray-600 focus:ring-accent-primary/40 focus:border-accent-primary/40'
          }`}
        />

        <button
          onClick={onSend}
          disabled={(!input.trim() && !attachedFile) || isLoading}
          aria-label="Send message"
          className={`p-2.5 text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 flex-shrink-0 ${
            researchMode
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/20'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/20'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  </>
);
