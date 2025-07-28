/**
 * @fileoverview Modern Design System components for Carelwave Media
 * Provides reusable Button and Card components with multiple design variants
 * Supports flowing gradients, holographic effects, neumorphism, glass morphism, and brutalist styles
 * @version 2.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 * @updated 2025-01-15
 */

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { useMicroInteraction } from '../hooks/useAdvancedAnimations';

/**
 * Design variant options for components
 */
type DesignVariant = 'default' | 'neumorphic' | 'glass' | 'brutalist' | 'minimal';

/**
 * Component intent/purpose options
 */
type ComponentIntent = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'ghost';

/**
 * Size options for components
 */
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Icon position options for buttons
 */
type IconPosition = 'left' | 'right';

/**
 * Base component props shared across design system components
 */
interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Component children */
  children?: React.ReactNode;
}

/**
 * Props for the ModernButton component
 * @interface ModernButtonProps
 */
interface ModernButtonProps extends BaseComponentProps {
  /** Visual design variant */
  variant?: DesignVariant;
  /** Button intent/purpose */
  intent?: ComponentIntent;
  /** Button size */
  size?: ComponentSize;
  /** Icon component to display */
  icon?: LucideIcon;
  /** Position of the icon relative to text */
  iconPosition?: IconPosition;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  loading?: boolean;
  /** URL for link buttons */
  href?: string;
  /** Click event handler */
  onClick?: () => void;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
}

export const ModernButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, ModernButtonProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    intent = 'primary', 
    onClick, 
    disabled, 
    loading, 
    icon: Icon,
    iconPosition = 'left',
    href,
    type = 'button',
    className = '',
    children,
    ...props 
  }, ref) => {
    const microInteraction = useMicroInteraction({
      type: 'button',
      intensity: variant === 'brutalist' ? 'bold' : 'medium',
      context: intent
    });

    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Size styles
    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs rounded-md',
      sm: 'px-3 py-2 text-sm rounded-md',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
      '2xl': 'px-10 py-5 text-xl rounded-2xl'
    };

    // Variant styles
    const variantStyles = {
      default: {
        primary: 'btn-gradient-flow text-white shadow-lg hover:shadow-xl hover:hover-gradient-glow',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        accent: 'btn-holographic text-white shadow-lg hover:shadow-xl hover:hover-gradient-glow',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'text-accent-primary hover:bg-gradient-flow-subtle focus:ring-accent-primary'
      },
      neumorphic: {
        primary: 'bg-gray-100 text-gray-900 shadow-neumorphic hover:shadow-neumorphic-inset dark:bg-gray-800 dark:text-gray-100 dark:shadow-neumorphic-dark',
        secondary: 'bg-gray-50 text-gray-700 shadow-neumorphic-sm hover:shadow-neumorphic-inset-sm dark:bg-gray-900 dark:text-gray-300',
        accent: 'bg-gradient-flow-subtle text-white shadow-neumorphic hover:shadow-neumorphic-inset',
        success: 'bg-green-50 text-green-700 shadow-neumorphic hover:shadow-neumorphic-inset dark:bg-green-900/20 dark:text-green-300',
        warning: 'bg-yellow-50 text-yellow-700 shadow-neumorphic hover:shadow-neumorphic-inset dark:bg-yellow-900/20 dark:text-yellow-300',
        error: 'bg-red-50 text-red-700 shadow-neumorphic hover:shadow-neumorphic-inset dark:bg-red-900/20 dark:text-red-300',
        ghost: 'text-gray-600 hover:shadow-neumorphic-sm dark:text-gray-400'
      },
      glass: {
        primary: 'bg-white/20 backdrop-blur-md border border-white/30 text-gray-900 hover:bg-white/30 dark:text-white',
        secondary: 'bg-gray-500/20 backdrop-blur-md border border-gray-500/30 text-gray-700 hover:bg-gray-500/30 dark:text-gray-300',
        accent: 'bg-holographic-subtle backdrop-blur-md border border-white/30 text-white hover:bg-white/30',
        success: 'bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-700 hover:bg-green-500/30 dark:text-green-300',
        warning: 'bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/30 dark:text-yellow-300',
        error: 'bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-700 hover:bg-red-500/30 dark:text-red-300',
        ghost: 'backdrop-blur-sm border border-white/20 text-gray-600 hover:bg-white/10 dark:text-gray-400'
      },
      brutalist: {
        primary: 'bg-gradient-flow text-white border-4 border-black hover:bg-white hover:text-black transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        secondary: 'bg-white text-black border-4 border-black hover:bg-black hover:text-white transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        accent: 'bg-holographic text-white border-4 border-black hover:bg-white hover:text-black transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        success: 'bg-green-600 text-white border-4 border-green-600 hover:bg-white hover:text-green-600 transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        warning: 'bg-yellow-600 text-white border-4 border-yellow-600 hover:bg-white hover:text-yellow-600 transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        error: 'bg-red-600 text-white border-4 border-red-600 hover:bg-white hover:text-red-600 transform hover:translate-x-1 hover:translate-y-1 shadow-brutalist',
        ghost: 'border-4 border-black text-black hover:bg-black hover:text-white transform hover:translate-x-1 hover:translate-y-1'
      },
      minimal: {
        primary: 'text-gradient-flow hover:underline underline-offset-4 decoration-2',
        secondary: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
        accent: 'text-holographic hover:opacity-80',
        success: 'text-green-600 hover:text-green-700',
        warning: 'text-yellow-600 hover:text-yellow-700',
        error: 'text-red-600 hover:text-red-700',
        ghost: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }
    };

    const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant][intent]} ${className}`;

    const content = (
      <>
        {Icon && iconPosition === 'left' && (
          <Icon className={`${children ? 'mr-2' : ''} ${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
        )}
        {loading && (
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${children ? 'mr-2' : ''} ${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <Icon className={`${children ? 'ml-2' : ''} ${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
        )}
        {/* Ripple effect container */}
        <div className="absolute inset-0 overflow-hidden rounded-inherit">
          {microInteraction.ripples.map((ripple) => (
            <div
              key={ripple.id}
              className="absolute bg-white/30 rounded-full animate-ping"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20
              }}
            />
          ))}
        </div>
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={href}
          className={`${buttonClasses} relative overflow-hidden`}
          style={microInteraction.style}
          {...microInteraction.handlers}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${buttonClasses} relative overflow-hidden`}
        style={microInteraction.style}
        {...microInteraction.handlers}
        {...props}
      >
        {content}
      </button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

// Modern Card Component - 2025 Standards
export interface ModernCardProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

export const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(
  ({ 
    variant = 'default', 
    padding = 'md', 
    elevation = 'md', 
    hover = false,
    onClick,
    className = '',
    children,
    ...props 
  }, ref) => {
    const microInteraction = useMicroInteraction({
      type: 'card',
      intensity: 'subtle',
      context: 'secondary'
    });

    const baseStyles = 'rounded-xl transition-all duration-300';
    
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };

    const variantStyles = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      neumorphic: 'bg-gray-100 dark:bg-gray-800 shadow-neumorphic dark:shadow-neumorphic-dark',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20',
      brutalist: 'bg-white border-4 border-black shadow-brutalist',
      minimal: 'bg-transparent',
      'gradient-flow': 'card-gradient-flow text-white',
      'holographic': 'card-holographic text-white'
    };

    const elevationStyles = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-lg',
      lg: 'shadow-xl',
      xl: 'shadow-2xl'
    };

    const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer' : '';

    const cardClasses = `${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${elevationStyles[elevation]} ${hoverStyles} ${className}`;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`${cardClasses} ${onClick ? 'relative overflow-hidden' : ''}`}
        style={onClick ? microInteraction.style : undefined}
        {...(onClick ? microInteraction.handlers : {})}
        {...props}
      >
        {children}
        {onClick && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {microInteraction.ripples.map((ripple) => (
              <div
                key={ripple.id}
                className="absolute bg-accent-primary/20 rounded-full animate-ping"
                style={{
                  left: ripple.x - 15,
                  top: ripple.y - 15,
                  width: 30,
                  height: 30
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ModernCard.displayName = 'ModernCard';

// Modern Input Component - 2025 Standards
export interface ModernInputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({ 
    variant = 'default',
    size = 'md',
    type = 'text',
    placeholder,
    value,
    onChange,
    disabled,
    error,
    label,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    ...props 
  }, ref) => {
    const microInteraction = useMicroInteraction({
      type: 'input',
      intensity: 'subtle',
      context: error ? 'error' : 'secondary'
    });

    const baseStyles = 'w-full transition-all duration-200 focus:outline-none';
    
    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs rounded-md',
      sm: 'px-3 py-2 text-sm rounded-md',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-5 py-3 text-base rounded-lg',
      xl: 'px-6 py-4 text-lg rounded-xl',
      '2xl': 'px-8 py-5 text-xl rounded-2xl'
    };

    const variantStyles = {
      default: `bg-white dark:bg-gray-800 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-accent-primary focus:ring-accent-primary'} focus:ring-2 focus:ring-offset-1`,
      neumorphic: `bg-gray-100 dark:bg-gray-800 shadow-neumorphic-inset ${error ? 'shadow-red-200' : ''} focus:shadow-neumorphic border-none`,
      glass: `bg-white/10 backdrop-blur-md border ${error ? 'border-red-500/50' : 'border-white/30'} focus:border-accent-primary/50 focus:bg-white/20`,
      brutalist: `bg-white border-4 ${error ? 'border-red-600' : 'border-black'} focus:border-accent-primary`,
      minimal: `bg-transparent border-b-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-accent-primary rounded-none`
    };

    const iconPadding = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
    const inputClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${iconPadding} ${className}`;

    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
              <Icon className={`${size === 'xs' || size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${error ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={inputClasses}
            style={microInteraction.style}
            {...microInteraction.handlers}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

export default {
  ModernButton,
  ModernCard,
  ModernInput
}; 