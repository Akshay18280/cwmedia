import React from 'react';
import { Loader2, Zap, Activity, Globe, Database, Code } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'bounce' | 'skeleton' | 'dots' | 'wave' | 'tech';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'gradient';
  fullScreen?: boolean;
  text?: string;
  transparent?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'blue',
  fullScreen = false,
  text,
  transparent = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600 border-blue-600',
    green: 'text-green-600 border-green-600',
    purple: 'text-purple-600 border-purple-600',
    orange: 'text-orange-600 border-orange-600',
    gray: 'text-gray-600 border-gray-600',
    gradient: 'text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text'
  };

  const textSizeClasses = {
    xs: 'text-caption',
    sm: 'text-body-sm',
    md: 'text-base',
    lg: 'text-body',
    xl: 'text-body-lg'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          />
        );

      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full bg-current animate-pulse`} />
        );

      case 'bounce':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'} ${colorClasses[color]} rounded-full bg-current animate-bounce`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        );

      case 'skeleton':
        return (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${size === 'xs' ? 'w-0.5 h-0.5' : size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : 'w-3 h-3'} ${colorClasses[color]} rounded-full bg-current animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${size === 'xs' ? 'w-0.5' : size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'} ${colorClasses[color]} bg-current rounded-t animate-bounce`}
                style={{
                  height: `${(i + 1) * (size === 'xs' ? 2 : size === 'sm' ? 3 : size === 'md' ? 4 : size === 'lg' ? 6 : 8)}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'tech':
        const techIcons = [Code, Database, Zap, Activity, Globe];
        const TechIcon = techIcons[Math.floor(Date.now() / 1000) % techIcons.length];
        return (
          <div className="relative">
            <TechIcon 
              className={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse`}
            />
            <div className="absolute inset-0 animate-ping">
              <TechIcon 
                className={`${sizeClasses[size]} ${colorClasses[color]} opacity-30`}
              />
            </div>
          </div>
        );

      default:
        return (
          <Loader2 
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          />
        );
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm' 
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20'
      }`}>
        <div className={`${transparent ? '' : 'bg-medium-contrast rounded-2xl p-8 shadow-2xl border border-low-contrast'}`}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Preset loading components for common use cases
export const PageLoader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <LoadingSpinner 
    variant="tech" 
    size="lg" 
    color="gradient" 
    fullScreen 
    text={text}
  />
);

export const InlineLoader: React.FC<{ size?: LoadingSpinnerProps['size'] }> = ({ size = 'sm' }) => (
  <LoadingSpinner 
    variant="spinner" 
    size={size} 
    color="blue" 
  />
);

export const ButtonLoader: React.FC = () => (
  <LoadingSpinner 
    variant="spinner" 
    size="sm" 
    color="blue" 
    className="mr-2"
  />
);

export const CardLoader: React.FC = () => (
  <div className="p-6 bg-medium-contrast rounded-xl border border-low-contrast">
    <LoadingSpinner 
      variant="skeleton" 
      size="md"
    />
  </div>
);

export const DataLoader: React.FC<{ text?: string }> = ({ text = "Loading data..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <LoadingSpinner 
      variant="dots" 
      size="lg" 
      color="purple" 
      text={text}
    />
  </div>
);

export const AnalyticsLoader: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner 
      variant="wave" 
      size="md" 
      color="gradient" 
      text="Loading analytics..."
    />
  </div>
);

export default LoadingSpinner; 