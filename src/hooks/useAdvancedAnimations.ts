import { useEffect, useRef, useState, useCallback } from 'react';

// 2025 Advanced Animation System
// Based on global market leaders: Apple, Google, Stripe, Framer

export interface MotionPreferences {
  prefersReducedMotion: boolean;
  devicePerformance: 'high' | 'medium' | 'low';
  networkSpeed: 'fast' | 'slow';
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay: number;
  stagger?: number;
  trigger?: 'hover' | 'click' | 'intersection' | 'scroll' | 'voice' | 'gesture';
  adaptive?: boolean;
}

export interface MicroInteractionConfig {
  type: 'button' | 'input' | 'card' | 'navigation' | 'form' | 'feedback';
  intensity: 'subtle' | 'medium' | 'bold';
  context: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
}

// Adaptive animation based on user preferences and device capabilities
export const useMotionPreferences = (): MotionPreferences => {
  const [preferences, setPreferences] = useState<MotionPreferences>({
    prefersReducedMotion: false,
    devicePerformance: 'high',
    networkSpeed: 'fast'
  });

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences(prev => ({
      ...prev,
      prefersReducedMotion: mediaQuery.matches
    }));

    // Detect device performance
    const detectPerformance = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        setPreferences(prev => ({
          ...prev,
          networkSpeed: ['4g', '3g'].includes(effectiveType) ? 'fast' : 'slow',
          devicePerformance: connection.downlink > 10 ? 'high' : connection.downlink > 1.5 ? 'medium' : 'low'
        }));
      }

      // Hardware concurrency check
      if (navigator.hardwareConcurrency) {
        const cores = navigator.hardwareConcurrency;
        setPreferences(prev => ({
          ...prev,
          devicePerformance: cores >= 8 ? 'high' : cores >= 4 ? 'medium' : 'low'
        }));
      }
    };

    detectPerformance();

    const handleChange = () => {
      setPreferences(prev => ({
        ...prev,
        prefersReducedMotion: mediaQuery.matches
      }));
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return preferences;
};

// Advanced intersection observer with performance optimization
export const useIntersectionAnimation = (
  config: AnimationConfig = {
    duration: 600,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    delay: 0
  }
) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const preferences = useMotionPreferences();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip animation if user prefers reduced motion
    if (preferences.prefersReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasAnimated, preferences.prefersReducedMotion]);

  return { ref, isVisible, hasAnimated };
};

// Micro-interaction hook for 2025 standards
export const useMicroInteraction = (config: MicroInteractionConfig) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const preferences = useMotionPreferences();

  const createRipple = useCallback((event: React.MouseEvent) => {
    if (preferences.prefersReducedMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, [preferences.prefersReducedMotion]);

  const getAnimationStyle = useCallback(() => {
    if (preferences.prefersReducedMotion) {
      return {
        transition: 'none'
      };
    }

    const intensity = config.intensity === 'subtle' ? 0.02 : config.intensity === 'medium' ? 0.05 : 0.08;
    const duration = preferences.devicePerformance === 'high' ? '150ms' : '300ms';

    let transform = 'scale(1)';
    if (isPressed) transform = `scale(${1 - intensity})`;
    else if (isHovered) transform = `scale(${1 + intensity})`;

    return {
      transform,
      transition: `all ${duration} cubic-bezier(0.16, 1, 0.3, 1)`,
      willChange: 'transform'
    };
  }, [isHovered, isPressed, config.intensity, preferences]);

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onClick: createRipple
  };

  return {
    handlers,
    style: getAnimationStyle(),
    state: { isHovered, isPressed, isFocused },
    ripples
  };
};

// Staggered animations for lists and grids
export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement>(null);
  const preferences = useMotionPreferences();

  useEffect(() => {
    if (preferences.prefersReducedMotion) {
      setVisibleItems(new Set(Array.from({ length: itemCount }, (_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the animation of child items
          Array.from({ length: itemCount }, (_, i) => i).forEach((index) => {
            setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, index]));
            }, index * delay);
          });
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [itemCount, delay, preferences.prefersReducedMotion]);

  return { containerRef, visibleItems };
};

// Voice-triggered animations (2025 trend)
export const useVoiceAnimation = () => {
  const [isListening, setIsListening] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    let recognition: any;
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;

    const startListening = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateAmplitude = () => {
          if (!isListening) return;
          
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAmplitude(average / 255);
          
          requestAnimationFrame(updateAmplitude);
        };

        updateAmplitude();
      } catch (error) {
        console.error('Voice animation error:', error);
      }
    };

    if (isListening) {
      startListening();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isListening]);

  return { isListening, setIsListening, amplitude };
};

// Gesture-based animations (2025 trend)
export const useGestureAnimation = () => {
  const [gesture, setGesture] = useState<'swipe-left' | 'swipe-right' | 'pinch' | 'rotate' | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let startDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        startDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          setGesture(deltaX > 0 ? 'swipe-right' : 'swipe-left');
          setTimeout(() => setGesture(null), 300);
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { elementRef, gesture };
};

// Performance-optimized scroll animations
export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollY = () => {
      const newScrollY = window.scrollY;
      setScrollDirection(newScrollY > lastScrollY.current ? 'down' : 'up');
      setScrollY(newScrollY);
      lastScrollY.current = newScrollY;
      ticking.current = false;
    };

    const requestTick = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollY);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    return () => window.removeEventListener('scroll', requestTick);
  }, []);

  return { scrollY, scrollDirection };
};

// AI-powered adaptive animations (2025 cutting-edge)
export const useAIAdaptiveAnimation = (userBehavior: {
  clickPatterns: number;
  timeOnPage: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}) => {
  const [adaptedConfig, setAdaptedConfig] = useState<AnimationConfig>({
    duration: 300,
    easing: 'ease-out',
    delay: 0
  });

  useEffect(() => {
    // AI-like logic to adapt animations based on user behavior
    const adaptAnimations = () => {
      let newConfig = { ...adaptedConfig };

      // Adapt based on click patterns
      if (userBehavior.clickPatterns > 10) {
        // User is active, prefer faster animations
        newConfig.duration = 200;
        newConfig.easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      } else {
        // User is casual, prefer smoother animations
        newConfig.duration = 400;
        newConfig.easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
      }

      // Adapt based on time on page
      if (userBehavior.timeOnPage > 60000) { // 1 minute
        // User is engaged, can handle more complex animations
        newConfig.delay = 50;
      }

      // Adapt based on device type
      if (userBehavior.deviceType === 'mobile') {
        // Mobile users prefer faster, simpler animations
        newConfig.duration = Math.min(newConfig.duration, 250);
      }

      setAdaptedConfig(newConfig);
    };

    adaptAnimations();
  }, [userBehavior]);

  return adaptedConfig;
};

export default {
  useMotionPreferences,
  useIntersectionAnimation,
  useMicroInteraction,
  useStaggeredAnimation,
  useVoiceAnimation,
  useGestureAnimation,
  useScrollAnimation,
  useAIAdaptiveAnimation
}; 