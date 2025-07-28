/**
 * Modern Form Components for Carelwave Media
 * Comprehensive form system with validation, accessibility, and 2025 design standards
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle, Upload, Search, Calendar, Clock } from 'lucide-react';

// Base form field props
interface BaseFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Input field component
interface InputProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    required, 
    disabled, 
    className = '', 
    type = 'text',
    value,
    onChange,
    placeholder,
    autoComplete,
    maxLength,
    pattern,
    onBlur,
    onFocus,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = useRef(`input-${Math.random().toString(36).substr(2, 9)}`).current;
    const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
    const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className={`form-field ${className}`}>
        {label && (
          <label 
            htmlFor={inputId}
            className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}
          >
            {label}
            {required && <span className="required-indicator">*</span>}
          </label>
        )}
        
        <div className={`input-container ${isFocused ? 'focused' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            maxLength={maxLength}
            pattern={pattern}
            disabled={disabled}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
            className="form-input"
            {...props}
          />
          
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          
          {error && (
            <AlertCircle className="w-4 h-4 error-icon" aria-hidden="true" />
          )}
        </div>
        
        {error && (
          <div id={errorId} className="error-message" role="alert">
            {error}
          </div>
        )}
        
        {helperText && !error && (
          <div id={helperId} className="helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
interface TextareaProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  autoResize = false,
  onBlur,
  onFocus,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useRef(`textarea-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className={`textarea-container ${isFocused ? 'focused' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className="form-textarea"
          {...props}
        />
        
        {error && (
          <AlertCircle className="w-4 h-4 error-icon" aria-hidden="true" />
        )}
      </div>
      
      {maxLength && (
        <div className={`character-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
          {characterCount}/{maxLength}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
};

// Select component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchable = false,
  onBlur,
  onFocus,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const inputId = useRef(`select-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div 
        ref={selectRef}
        className={`select-container ${isFocused ? 'focused' : ''} ${isOpen ? 'open' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <button
          type="button"
          id={inputId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className="select-trigger"
        >
          <span className={selectedOption ? 'selected' : 'placeholder'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="select-arrow" />
        </button>
        
        {isOpen && (
          <div className="select-dropdown" role="listbox">
            {searchable && (
              <div className="select-search">
                <Search className="w-4 h-4 search-icon" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            )}
            
            <div className="select-options">
              {filteredOptions.length === 0 ? (
                <div className="no-options">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleOptionSelect(option.value)}
                    disabled={option.disabled}
                    className={`select-option ${option.value === value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.label}
                    {option.value === value && <Check className="w-4 h-4 check-icon" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        
        {error && (
          <AlertCircle className="w-4 h-4 error-icon" aria-hidden="true" />
        )}
      </div>
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
};

// Checkbox component
interface CheckboxProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  checked,
  onChange,
  children,
  indeterminate = false,
  ...props
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const inputId = useRef(`checkbox-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className={`form-field checkbox-field ${className}`}>
      <div className={`checkbox-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          ref={checkboxRef}
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className="checkbox-input"
          {...props}
        />
        
        <div className="checkbox-box">
          {checked && !indeterminate && <Check className="w-3 h-3 check-icon" />}
          {indeterminate && <div className="indeterminate-indicator" />}
        </div>
        
        <label htmlFor={inputId} className="checkbox-label">
          {children}
          {required && <span className="required-indicator">*</span>}
        </label>
      </div>
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
};

// Radio group component
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  value,
  onChange,
  options,
  orientation = 'vertical',
  ...props
}) => {
  const groupId = useRef(`radio-group-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  return (
    <div className={`form-field radio-group-field ${className}`}>
      {label && (
        <fieldset className="radio-fieldset">
          <legend className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}>
            {label}
            {required && <span className="required-indicator">*</span>}
          </legend>
          
          <div 
            className={`radio-group ${orientation} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
            role="radiogroup"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          >
            {options.map((option) => {
              const radioId = `${groupId}-${option.value}`;
              
              return (
                <div key={option.value} className="radio-option">
                  <input
                    type="radio"
                    id={radioId}
                    name={groupId}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled || option.disabled}
                    required={required}
                    className="radio-input"
                    {...props}
                  />
                  
                  <div className="radio-box">
                    {value === option.value && <div className="radio-indicator" />}
                  </div>
                  
                  <label htmlFor={radioId} className="radio-label">
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
};

// File upload component
interface FileUploadProps extends BaseFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onError?: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  value,
  onChange,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  onError,
  ...props
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useRef(`file-upload-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  const validateFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return null;
    }
    
    for (const file of fileArray) {
      if (file.size > maxSize) {
        onError?.(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        return null;
      }
    }
    
    return fileArray;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = validateFiles(files);
    if (validFiles) {
      onChange(multiple ? [...value, ...validFiles] : validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`form-field file-upload-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div 
        className={`file-upload-container ${isDragOver ? 'drag-over' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={inputId}
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className="file-input"
          {...props}
        />
        
        <div className="file-upload-area">
          <Upload className="w-8 h-8 upload-icon" />
          <div className="upload-text">
            <span className="primary-text">
              Click to upload or drag and drop
            </span>
            <span className="secondary-text">
              {accept ? `Supported formats: ${accept}` : 'All file types supported'}
            </span>
            <span className="size-text">
              Max {formatFileSize(maxSize)} per file, up to {maxFiles} files
            </span>
          </div>
        </div>
      </div>
      
      {value.length > 0 && (
        <div className="uploaded-files">
          {value.map((file, index) => (
            <div key={index} className="uploaded-file">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="remove-file"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
};

// Date picker component
interface DatePickerProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'datetime-local' | 'time';
  min?: string;
  max?: string;
  step?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
  value,
  onChange,
  type = 'date',
  min,
  max,
  step,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useRef(`date-picker-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = useRef(`error-${Math.random().toString(36).substr(2, 9)}`).current;
  const helperId = useRef(`helper-${Math.random().toString(36).substr(2, 9)}`).current;

  const getIcon = () => {
    switch (type) {
      case 'time':
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className={`form-field date-picker-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`form-label ${required ? 'required' : ''} ${error ? 'error' : ''}`}
        >
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className={`date-picker-container ${isFocused ? 'focused' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
        <input
          type={type}
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim()}
          className="date-picker-input"
          {...props}
        />
        
        <div className="date-picker-icon">
          {getIcon()}
        </div>
        
        {error && (
          <AlertCircle className="w-4 h-4 error-icon" aria-hidden="true" />
        )}
      </div>
      
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
}; 