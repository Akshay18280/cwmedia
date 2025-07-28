import { useEffect, useState, useCallback } from 'react';

// 2025 Advanced Typography System
// Based on trends: Bold Typography, Variable Fonts, Dynamic Sizing, Contextual Typography

export interface TypographyPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontWeight: 'light' | 'regular' | 'medium' | 'bold' | 'extra-bold';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'tight' | 'normal' | 'wide';
  readingMode: 'default' | 'dyslexia-friendly' | 'high-contrast';
}

export interface DynamicTypographyConfig {
  containerWidth: number;
  viewportWidth: number;
  readingDistance: 'close' | 'normal' | 'far';
  lightingCondition: 'bright' | 'normal' | 'dim';
  userAge?: number;
}

export interface ContextualTextStyle {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  fontFamily: string;
  textShadow?: string;
  fontVariationSettings?: string;
}

// Hook for user typography preferences
export const useTypographyPreferences = (): [TypographyPreferences, (prefs: Partial<TypographyPreferences>) => void] => {
  const [preferences, setPreferences] = useState<TypographyPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typography-preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      fontSize: 'medium',
      fontWeight: 'regular',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      readingMode: 'default'
    };
  });

  const updatePreferences = useCallback((newPrefs: Partial<TypographyPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      if (typeof window !== 'undefined') {
        localStorage.setItem('typography-preferences', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    // Apply preferences to CSS custom properties
    const root = document.documentElement;
    
    // Font size multipliers based on preference
    const fontSizeMultipliers = {
      'small': 0.875,
      'medium': 1,
      'large': 1.125,
      'extra-large': 1.25
    };

    // Line height values
    const lineHeightValues = {
      'tight': 1.25,
      'normal': 1.5,
      'relaxed': 1.75,
      'loose': 2
    };

    // Letter spacing values
    const letterSpacingValues = {
      'tight': '-0.025em',
      'normal': '0',
      'wide': '0.025em'
    };

    root.style.setProperty('--font-size-multiplier', fontSizeMultipliers[preferences.fontSize].toString());
    root.style.setProperty('--line-height-base', lineHeightValues[preferences.lineHeight].toString());
    root.style.setProperty('--letter-spacing-base', letterSpacingValues[preferences.letterSpacing]);

    // Apply reading mode styles
    if (preferences.readingMode === 'dyslexia-friendly') {
      root.style.setProperty('--font-family-primary', 'OpenDyslexic, ui-sans-serif, system-ui, sans-serif');
      root.style.setProperty('--letter-spacing-base', '0.05em');
    } else if (preferences.readingMode === 'high-contrast') {
      root.style.setProperty('--text-color', '#000');
      root.style.setProperty('--bg-color', '#fff');
    } else {
      root.style.setProperty('--font-family-primary', 'ui-sans-serif, system-ui, sans-serif');
    }
  }, [preferences]);

  return [preferences, updatePreferences];
};

// Dynamic typography that adapts to container and context
export const useDynamicTypography = (config: DynamicTypographyConfig) => {
  const [typographyStyle, setTypographyStyle] = useState<ContextualTextStyle>({
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  });

  useEffect(() => {
    const calculateOptimalTypography = () => {
      const { containerWidth, viewportWidth, readingDistance, lightingCondition, userAge } = config;

      // Base font size calculation (2025 responsive typography)
      const baseFontSize = Math.max(16, Math.min(24, containerWidth / 40));
      
      // Adjust for viewport width (mobile-first approach)
      let responsiveFontSize = baseFontSize;
      if (viewportWidth < 768) {
        responsiveFontSize = Math.max(14, baseFontSize * 0.875);
      } else if (viewportWidth < 1024) {
        responsiveFontSize = baseFontSize * 0.9375;
      }

      // Adjust for reading distance
      const distanceMultiplier = {
        'close': 0.9,
        'normal': 1,
        'far': 1.1
      };
      responsiveFontSize *= distanceMultiplier[readingDistance];

      // Adjust for lighting conditions
      let fontWeight = '400';
      let textShadow = undefined;
      if (lightingCondition === 'bright') {
        fontWeight = '500'; // Slightly bolder for bright conditions
      } else if (lightingCondition === 'dim') {
        fontWeight = '300'; // Lighter for dim conditions
        textShadow = '0 0 1px rgba(255, 255, 255, 0.1)';
      }

      // Age-based adjustments (accessibility)
      if (userAge && userAge > 60) {
        responsiveFontSize *= 1.1;
        fontWeight = Math.max(parseInt(fontWeight), 400).toString();
      }

      // Optimal line height based on font size
      const lineHeight = (1.2 + (responsiveFontSize - 14) * 0.02).toFixed(2);

      // Variable font settings for advanced typography
      const fontVariationSettings = `'wght' ${fontWeight}, 'slnt' 0`;

      setTypographyStyle({
        fontSize: `${responsiveFontSize}px`,
        fontWeight,
        lineHeight,
        letterSpacing: containerWidth < 600 ? '0.01em' : '0',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        textShadow,
        fontVariationSettings
      });
    };

    calculateOptimalTypography();
  }, [config]);

  return typographyStyle;
};

// Bold typography hook for 2025 trend
export const useBoldTypography = (intensity: 'subtle' | 'medium' | 'bold' | 'extreme' = 'medium') => {
  const [boldStyle, setBoldStyle] = useState<ContextualTextStyle>({
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '1.2',
    letterSpacing: '0',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
  });

  useEffect(() => {
    const intensityConfigs = {
      subtle: {
        fontWeight: '600',
        fontSize: '1.125rem',
        letterSpacing: '-0.01em',
        lineHeight: '1.3'
      },
      medium: {
        fontWeight: '700',
        fontSize: '1.5rem',
        letterSpacing: '-0.02em',
        lineHeight: '1.2'
      },
      bold: {
        fontWeight: '800',
        fontSize: '2rem',
        letterSpacing: '-0.03em',
        lineHeight: '1.1'
      },
      extreme: {
        fontWeight: '900',
        fontSize: '3rem',
        letterSpacing: '-0.04em',
        lineHeight: '1'
      }
    };

    const config = intensityConfigs[intensity];
    setBoldStyle({
      ...boldStyle,
      ...config,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    });
  }, [intensity]);

  return boldStyle;
};

// Responsive typography that adjusts to screen size and orientation
export const useResponsiveTypography = () => {
  const [screenConfig, setScreenConfig] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'landscape' as 'portrait' | 'landscape'
  });

  useEffect(() => {
    const updateScreenConfig = () => {
      setScreenConfig({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      });
    };

    window.addEventListener('resize', updateScreenConfig);
    window.addEventListener('orientationchange', updateScreenConfig);

    return () => {
      window.removeEventListener('resize', updateScreenConfig);
      window.removeEventListener('orientationchange', updateScreenConfig);
    };
  }, []);

  // Calculate responsive font sizes
  const getResponsiveFontSize = useCallback((baseSize: number) => {
    const { width, orientation } = screenConfig;
    
    // Mobile-first scaling
    if (width < 480) {
      return `${baseSize * 0.8}rem`;
    } else if (width < 768) {
      return `${baseSize * 0.9}rem`;
    } else if (width < 1024) {
      return `${baseSize}rem`;
    } else if (width < 1440) {
      return `${baseSize * 1.1}rem`;
    } else {
      return `${baseSize * 1.2}rem`;
    }
  }, [screenConfig]);

  return { screenConfig, getResponsiveFontSize };
};

// Typography animation for smooth transitions
export const useTypographyAnimation = (duration: number = 300) => {
  const [animatedStyle, setAnimatedStyle] = useState<React.CSSProperties>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const animateTypography = useCallback((newStyle: Partial<ContextualTextStyle>) => {
    setIsAnimating(true);
    
    // Apply transition
    setAnimatedStyle(prev => ({
      ...prev,
      ...newStyle,
      transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
    }));

    // Remove transition after animation
    setTimeout(() => {
      setAnimatedStyle(prev => ({
        ...prev,
        transition: 'none'
      }));
      setIsAnimating(false);
    }, duration);
  }, [duration]);

  return { animatedStyle, animateTypography, isAnimating };
};

// Reading experience optimization
export const useReadingExperience = () => {
  const [readingMetrics, setReadingMetrics] = useState({
    readingSpeed: 200, // words per minute
    comprehension: 'good' as 'poor' | 'fair' | 'good' | 'excellent',
    eyeStrain: 'low' as 'low' | 'medium' | 'high'
  });

  const getOptimalTypography = useCallback(() => {
    const { readingSpeed, comprehension, eyeStrain } = readingMetrics;

    // Adjust typography based on reading metrics
    let fontSize = '1rem';
    let lineHeight = '1.6';
    let letterSpacing = '0';

    if (readingSpeed < 150) {
      // Slower readers benefit from larger text
      fontSize = '1.125rem';
      lineHeight = '1.8';
      letterSpacing = '0.01em';
    }

    if (comprehension === 'poor' || comprehension === 'fair') {
      // Better spacing for comprehension
      lineHeight = '1.8';
      letterSpacing = '0.02em';
    }

    if (eyeStrain === 'high') {
      // Reduce eye strain with better contrast and spacing
      fontSize = '1.125rem';
      lineHeight = '1.7';
    }

    return {
      fontSize,
      lineHeight,
      letterSpacing,
      fontWeight: '400',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    };
  }, [readingMetrics]);

  return { readingMetrics, setReadingMetrics, getOptimalTypography };
};

// Export all typography utilities
export default {
  useTypographyPreferences,
  useDynamicTypography,
  useBoldTypography,
  useResponsiveTypography,
  useTypographyAnimation,
  useReadingExperience
}; 