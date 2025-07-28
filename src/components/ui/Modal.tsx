/**
 * Modern Modal System for Carelwave Media
 * Accessible, responsive modal components with 2025 design standards
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle as AlertIcon } from 'lucide-react';

// Base modal props
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  persistent?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Main Modal component
export const Modal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md',
  position = 'center',
  animation = 'fade',
  persistent = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const firstFocusableElement = useRef<HTMLElement | null>(null);
  const lastFocusableElement = useRef<HTMLElement | null>(null);

  // Get focusable elements within the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    
    return Array.from(
      modalRef.current.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
  }, []);

  // Handle focus trap
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !modalRef.current) return;

    if (event.key === 'Escape' && closeOnEscape && !persistent) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, closeOnEscape, persistent, onClose, getFocusableElements]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (
      closeOnOverlayClick && 
      !persistent && 
      event.target === event.currentTarget
    ) {
      onClose();
    }
  }, [closeOnOverlayClick, persistent, onClose]);

  // Effect for opening/closing modal
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Show modal with animation
      setIsVisible(true);
      setIsAnimating(true);
      
      // Focus first element after animation
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
        setIsAnimating(false);
      }, 150);

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
    } else {
      setIsAnimating(true);
      
      // Hide modal after animation
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      }, 150);

      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, getFocusableElements]);

  // Don't render if not visible
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full w-full h-full'
  };

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-16',
    bottom: 'items-end justify-center pb-16'
  };

  const animationClasses = {
    fade: `transition-opacity duration-150 ${isOpen ? 'opacity-100' : 'opacity-0'}`,
    slide: `transition-transform duration-150 ${isOpen ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'}`,
    scale: `transition-transform duration-150 ${isOpen ? 'scale-100' : 'scale-95'}`,
    none: ''
  };

  const modalContent = (
    <div 
      className={`modal-overlay fixed inset-0 z-50 flex ${positionClasses[position]} bg-black/50 backdrop-blur-sm p-4 ${animationClasses.fade}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <div 
        ref={modalRef}
        className={`modal-content bg-white dark:bg-gray-900 rounded-xl shadow-2xl ${sizeClasses[size]} ${animationClasses[animation === 'fade' ? 'scale' : animation]} ${className}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Modal Header component
interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  closeButton?: boolean;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  closeButton = true,
  className = ''
}) => {
  return (
    <div className={`modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="modal-title text-xl font-semibold text-gray-900 dark:text-white">
        {children}
      </div>
      {closeButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="modal-close-button p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Modal Body component
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = '',
  scrollable = true
}) => {
  return (
    <div className={`modal-body p-6 ${scrollable ? 'max-h-96 overflow-y-auto' : ''} ${className}`}>
      {children}
    </div>
  );
};

// Modal Footer component
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
  align = 'right'
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`modal-footer flex ${alignClasses[align]} gap-3 p-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

// Confirmation Modal component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertIcon className="w-6 h-6 text-yellow-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" persistent={loading}>
      <ModalHeader onClose={!loading ? onClose : undefined} closeButton={!loading}>
        <div className="flex items-center gap-3">
          {icons[variant]}
          {title}
        </div>
      </ModalHeader>
      
      <ModalBody>
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </ModalBody>
      
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[variant]}`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            confirmText
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
};

// Alert Modal component
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  buttonText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK'
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertIcon className="w-6 h-6 text-yellow-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          {icons[variant]}
          {title}
        </div>
      </ModalHeader>
      
      <ModalBody>
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </ModalBody>
      
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 rounded-lg transition-colors ${buttonStyles[variant]}`}
        >
          {buttonText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

// Loading Modal component
interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = 'Loading',
  message = 'Please wait while we process your request...'
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      size="sm" 
      persistent={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <ModalBody className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

// Image Preview Modal component
interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  src,
  alt,
  title
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full" 
      className="bg-black/90"
      animation="fade"
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 bg-black/50 rounded-full transition-colors"
          aria-label="Close image preview"
        >
          <X className="w-6 h-6" />
        </button>
        
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
        />
        
        {title && (
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white bg-black/50 px-4 py-2 rounded-lg">
              {title}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}; 