import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface VoiceCommand {
  command: string;
  variations: string[];
  action: () => void;
  description: string;
}

interface VoiceCommandsHook {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string) => void;
  amplitude: number;
  lastCommand: string;
  availableCommands: VoiceCommand[];
  supportStatus: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useVoiceCommands = (): VoiceCommandsHook => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [lastCommand, setLastCommand] = useState('');
  const [supportStatus, setSupportStatus] = useState('Checking...');
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessedCommandRef = useRef<string>('');
  const commandTimeoutRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  
  const navigate = useNavigate();

  // Check browser support and permissions
  const checkSupport = useCallback(async () => {
    console.log('🎤 Checking voice command support...');
    
    // Check if we're on HTTPS or localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      setSupportStatus('Requires HTTPS connection');
      console.warn('🎤 Voice commands require HTTPS connection');
      return false;
    }

    // Check SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportStatus('Speech Recognition not supported in this browser');
      console.warn('🎤 SpeechRecognition API not available');
      return false;
    }

    // Check SpeechSynthesis API  
    if (!('speechSynthesis' in window)) {
      setSupportStatus('Speech Synthesis not supported in this browser');
      console.warn('🎤 SpeechSynthesis API not available');
      return false;
    }

    // Check MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSupportStatus('Microphone access not supported in this browser');
      console.warn('🎤 MediaDevices API not available');
      return false;
    }

    try {
      // Test microphone permissions
      console.log('🎤 Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after test
      
      setSupportStatus('Voice commands ready');
      console.log('🎤 Voice commands fully supported');
      return true;
    } catch (error: any) {
      console.error('🎤 Microphone access denied:', error);
      if (error.name === 'NotAllowedError') {
        setSupportStatus('Microphone permission denied');
        toast.error('Please enable microphone access for voice commands', { 
          duration: 5000,
          description: 'Check your browser settings to allow microphone access'
        });
      } else if (error.name === 'NotFoundError') {
        setSupportStatus('No microphone found');
      } else {
        setSupportStatus('Microphone access failed');
      }
      return false;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const initializeVoiceCommands = async () => {
      const supported = await checkSupport();
      setIsSupported(supported);
      
      if (!supported) return;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognitionRef.current = recognition;
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        // Delay speak to avoid interference
        setTimeout(() => {
          speak('Voice commands activated. Say "help" for available commands.');
        }, 500);
      };
      
      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        setAmplitude(0);
        
        // Clean up audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        // Clean up media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 Voice recognition error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'no-speech':
            speak('I didn\'t hear anything. Please try again.');
            break;
          case 'not-allowed':
            toast.error('Microphone access denied. Please check your browser settings.');
            setSupportStatus('Microphone permission denied');
            break;
          case 'network':
            toast.error('Network error. Please check your internet connection.');
            break;
          case 'aborted':
            console.log('🎤 Recognition aborted (normal)');
            break;
          default:
            toast.error(`Voice recognition error: ${event.error}`);
        }
      };
      
      recognition.onresult = (event: any) => {
        try {
          const results = Array.from(event.results);
          const finalResult = results[results.length - 1] as any;
          
          if (finalResult && finalResult.isFinal) {
            const transcript = finalResult[0].transcript.toLowerCase().trim();
            const confidence = finalResult[0].confidence;
            
            console.log('🎤 Final transcript:', transcript, 'Confidence:', confidence);
            
            if (transcript && transcript !== lastProcessedCommandRef.current) {
              setLastCommand(transcript);
              lastProcessedCommandRef.current = transcript;
              
              // Clear any existing timeout
              if (commandTimeoutRef.current) {
                clearTimeout(commandTimeoutRef.current);
              }
              
              // Process command with debouncing
              commandTimeoutRef.current = setTimeout(() => {
                processVoiceCommand(transcript);
              }, 100);
            }
          }
        } catch (error) {
          console.error('🎤 Error processing recognition result:', error);
        }
      };
    };

    initializeVoiceCommands();
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('🎤 Error stopping recognition:', error);
        }
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [checkSupport]);

  // Setup audio visualization
  const setupAudioVisualization = async () => {
    try {
      console.log('🎤 Setting up audio visualization...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAmplitude = () => {
        if (!isListening || !analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAmplitude(Math.min(average / 128, 1)); // Normalize to 0-1
        
        animationFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      
      updateAmplitude();
      console.log('🎤 Audio visualization setup complete');
    } catch (error) {
      console.error('🎤 Audio visualization setup failed:', error);
      toast.warning('Audio visualization unavailable, but voice commands will still work');
    }
  };

  // Define voice commands
  const availableCommands: VoiceCommand[] = [
    {
      command: 'navigate home',
      variations: ['go home', 'home page', 'take me home', 'navigate to home', 'home'],
      action: () => {
        navigate('/');
        speak('Navigating to home page');
      },
      description: 'Navigate to the home page'
    },
    {
      command: 'navigate blog',
      variations: ['go to blog', 'blog page', 'show blog', 'articles', 'read articles', 'explore blog', 'blog'],
      action: () => {
        navigate('/blog');
        speak('Opening blog page');
      },
      description: 'Navigate to the blog page'
    },
    {
      command: 'navigate about',
      variations: ['about page', 'about us', 'learn more', 'company info', 'about'],
      action: () => {
        navigate('/about');
        speak('Opening about page');
      },
      description: 'Navigate to the about page'
    },
    {
      command: 'navigate contact',
      variations: ['contact page', 'get in touch', 'contact us', 'reach out', 'contact'],
      action: () => {
        navigate('/contact');
        speak('Opening contact page');
      },
      description: 'Navigate to the contact page'
    },
    {
      command: 'subscribe newsletter',
      variations: ['sign up newsletter', 'join newsletter', 'subscribe', 'get updates', 'newsletter'],
      action: () => {
        const newsletterSection = document.getElementById('newsletter');
        if (newsletterSection) {
          newsletterSection.scrollIntoView({ behavior: 'smooth' });
          speak('Scrolling to newsletter signup');
        } else {
          speak('Newsletter signup not available on this page');
        }
      },
      description: 'Subscribe to the newsletter'
    },
    {
      command: 'scroll up',
      variations: ['go up', 'scroll to top', 'back to top', 'top', 'up'],
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        speak('Scrolling to top');
      },
      description: 'Scroll to the top of the page'
    },
    {
      command: 'scroll down',
      variations: ['go down', 'scroll down', 'next section', 'down'],
      action: () => {
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        speak('Scrolling down');
      },
      description: 'Scroll down the page'
    },
    {
      command: 'dark mode',
      variations: ['enable dark mode', 'switch to dark', 'dark theme', 'dark', 'night mode'],
      action: () => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        speak('Dark mode enabled');
      },
      description: 'Enable dark mode'
    },
    {
      command: 'light mode',
      variations: ['enable light mode', 'switch to light', 'light theme', 'light', 'day mode'],
      action: () => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        speak('Light mode enabled');
      },
      description: 'Enable light mode'
    },
    {
      command: 'help',
      variations: ['show commands', 'what can you do', 'available commands', 'voice help', 'commands', 'help me'],
      action: () => {
        const commands = availableCommands.slice(0, 5).map(cmd => cmd.command).join(', ');
        speak(`Available commands include: ${commands}. Say "stop listening" to turn off voice commands.`);
      },
      description: 'List available voice commands'
    },
    {
      command: 'stop listening',
      variations: ['stop voice', 'turn off voice', 'disable voice', 'stop', 'quit', 'exit'],
      action: () => {
        speak('Voice commands disabled');
        setTimeout(() => stopListening(), 1000);
      },
      description: 'Stop voice recognition'
    }
  ];

  // Process voice command
  const processVoiceCommand = useCallback((transcript: string) => {
    console.log('🎤 Processing command:', transcript);
    
    const command = availableCommands.find(cmd => {
      return cmd.variations.some(variation => {
        const normalizedTranscript = transcript.toLowerCase().trim();
        const normalizedVariation = variation.toLowerCase().trim();
        
        return normalizedTranscript === normalizedVariation ||
               normalizedTranscript.includes(normalizedVariation) ||
               normalizedVariation.includes(normalizedTranscript);
      });
    });

    if (command) {
      console.log('🎤 Executing command:', command.command);
      toast.success(`Voice command: ${command.command}`, { 
        duration: 2000,
        description: command.description
      });
      
      try {
        command.action();
      } catch (error) {
        console.error('🎤 Error executing command:', error);
        speak('Sorry, there was an error executing that command');
      }
    } else {
      console.log('🎤 Unknown command:', transcript);
      speak('Sorry, I didn\'t understand that command. Say "help" for available commands.');
      
      // Show available commands in toast
      toast.info('Command not recognized', {
        description: 'Say "help" to hear available commands',
        duration: 3000
      });
    }
  }, [availableCommands, navigate]);

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('🎤 Speech synthesis not supported');
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      
      // Wait for voices to load
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Natural') || 
            voice.name.includes('Enhanced') ||
            voice.name.includes('Premium') ||
            (voice.lang.startsWith('en') && !voice.name.includes('Microsoft'))
          ) || voices.find(voice => voice.lang.startsWith('en'));
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      }
    } catch (error) {
      console.error('🎤 Speech synthesis error:', error);
    }
  }, []);

  // Start listening function
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error(`Voice commands not available: ${supportStatus}`);
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Voice recognition not initialized');
      return;
    }

    try {
      console.log('🎤 Starting voice recognition...');
      
      // Reset command tracking
      lastProcessedCommandRef.current = '';
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      
      recognitionRef.current.start();
      setupAudioVisualization();
      
      toast.success('Voice commands activated', {
        description: 'Say "help" for available commands',
        duration: 2000
      });
    } catch (error: any) {
      console.error('🎤 Error starting recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        // Recognition already started, stop and restart
        recognitionRef.current.stop();
        setTimeout(() => startListening(), 100);
      } else {
        toast.error('Failed to start voice recognition');
        setIsListening(false);
      }
    }
  }, [isSupported, supportStatus, setupAudioVisualization]);

  // Stop listening function
  const stopListening = useCallback(() => {
    console.log('🎤 Stopping voice recognition...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn('🎤 Error stopping recognition:', error);
      }
    }
    
    // Clear command tracking
    lastProcessedCommandRef.current = '';
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    
    setIsListening(false);
    setAmplitude(0);
    
    // Clean up audio resources
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    toast.info('Voice commands deactivated');
  }, []);

  // Toggle listening function
  const toggleListening = useCallback(() => {
    console.log('🎤 Toggling voice commands, currently listening:', isListening);
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    amplitude,
    lastCommand,
    availableCommands,
    supportStatus
  };
}; 