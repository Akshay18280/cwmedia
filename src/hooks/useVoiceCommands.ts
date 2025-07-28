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
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessedCommandRef = useRef<string>('');
  const commandTimeoutRef = useRef<NodeJS.Timeout>();
  
  const navigate = useNavigate();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false to prevent continuous processing
      recognition.interimResults = false; // Changed to false to only get final results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1; // Reduced to 1 for clarity
      
      recognitionRef.current = recognition;
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        speak('Voice commands activated. What would you like to do?');
      };
      
      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        // Auto restart if still supposed to be listening (for continuous mode)
        if (isListening) {
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              recognitionRef.current.start();
            }
          }, 100);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 Voice recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          speak('I didn\'t hear anything. Please try again.');
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable microphone permissions.');
        }
      };
      
      recognition.onresult = (event: any) => {
        // Only process final results to prevent double execution
        const results = Array.from(event.results);
        const finalResult = results[results.length - 1] as any;
        
        if (finalResult && finalResult.isFinal) {
          const transcript = finalResult[0].transcript.toLowerCase().trim();
          
          if (transcript && transcript !== lastProcessedCommandRef.current) {
            console.log('🎤 Final transcript:', transcript);
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
      };
    } else {
      console.warn('🎤 Speech recognition not supported');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Setup audio visualization
  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
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
        setAmplitude(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      
      updateAmplitude();
    } catch (error) {
      console.error('🎤 Audio visualization setup failed:', error);
    }
  };

  // Define voice commands
  const availableCommands: VoiceCommand[] = [
    {
      command: 'navigate home',
      variations: ['go home', 'home page', 'take me home', 'navigate to home'],
      action: () => {
        navigate('/');
        speak('Navigating to home page');
      },
      description: 'Navigate to the home page'
    },
    {
      command: 'navigate blog',
      variations: ['go to blog', 'blog page', 'show blog', 'articles', 'read articles', 'explore blog'],
      action: () => {
        navigate('/blog');
        speak('Opening blog page');
      },
      description: 'Navigate to the blog page'
    },
    {
      command: 'navigate about',
      variations: ['about page', 'about us', 'learn more', 'company info'],
      action: () => {
        navigate('/about');
        speak('Opening about page');
      },
      description: 'Navigate to the about page'
    },
    {
      command: 'navigate contact',
      variations: ['contact page', 'get in touch', 'contact us', 'reach out'],
      action: () => {
        navigate('/contact');
        speak('Opening contact page');
      },
      description: 'Navigate to the contact page'
    },
    {
      command: 'subscribe newsletter',
      variations: ['sign up newsletter', 'join newsletter', 'subscribe', 'get updates'],
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
      variations: ['go up', 'scroll to top', 'back to top'],
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        speak('Scrolling to top');
      },
      description: 'Scroll to the top of the page'
    },
    {
      command: 'scroll down',
      variations: ['go down', 'scroll down', 'next section'],
      action: () => {
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        speak('Scrolling down');
      },
      description: 'Scroll down the page'
    },
    {
      command: 'dark mode',
      variations: ['enable dark mode', 'switch to dark', 'dark theme'],
      action: () => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        speak('Dark mode enabled');
      },
      description: 'Enable dark mode'
    },
    {
      command: 'light mode',
      variations: ['enable light mode', 'switch to light', 'light theme'],
      action: () => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        speak('Light mode enabled');
      },
      description: 'Enable light mode'
    },
    {
      command: 'help',
      variations: ['show commands', 'what can you do', 'available commands', 'voice help'],
      action: () => {
        const commands = availableCommands.slice(0, 5).map(cmd => cmd.command).join(', ');
        speak(`Available commands include: ${commands}. Say "stop listening" to turn off voice commands.`);
      },
      description: 'List available voice commands'
    },
    {
      command: 'stop listening',
      variations: ['stop voice', 'turn off voice', 'disable voice', 'stop'],
      action: () => {
        speak('Voice commands disabled');
        setTimeout(() => stopListening(), 1000);
      },
      description: 'Stop voice recognition'
    }
  ];

  // Process voice command
  const processVoiceCommand = useCallback((transcript: string) => {
    const command = availableCommands.find(cmd => {
      return cmd.variations.some(variation => 
        transcript.includes(variation) || 
        variation.includes(transcript) ||
        transcript.toLowerCase().includes(cmd.command.toLowerCase())
      );
    });

    if (command) {
      console.log('🎤 Executing command:', command.command);
      toast.success(`Voice command: ${command.command}`, { duration: 2000 });
      command.action();
    } else {
      console.log('🎤 Unknown command:', transcript);
      speak('Sorry, I didn\'t understand that command. Say "help" for available commands.');
    }
  }, [availableCommands, navigate]);

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Try to use a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Natural') || 
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Start listening function
  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      try {
        // Reset command tracking
        lastProcessedCommandRef.current = '';
        if (commandTimeoutRef.current) {
          clearTimeout(commandTimeoutRef.current);
        }
        
        recognitionRef.current.start();
        setupAudioVisualization();
      } catch (error) {
        console.error('🎤 Error starting recognition:', error);
        setIsListening(false);
      }
    }
  }, [isSupported]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear command tracking
    lastProcessedCommandRef.current = '';
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    
    setIsListening(false);
    setAmplitude(0);
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Toggle listening function
  const toggleListening = useCallback(() => {
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
    availableCommands
  };
}; 