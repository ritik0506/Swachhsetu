import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, CheckCircle, AlertCircle, Languages, X } from 'lucide-react';
import api from '../utils/api';

/**
 * VoiceInput Component
 * 
 * Features:
 * - Voice recording with real-time audio visualization
 * - Automatic language detection (10 Indian languages + English)
 * - AI-powered transcription and translation
 * - Sentiment analysis
 * - Professional summarization
 * 
 * @param {Function} onChange - Callback with transcription result
 * @param {boolean} isGlobalAILoading - Global AI loading state
 * @param {Function} setGlobalAILoading - Set global AI loading state
 * @param {number} maxDurationSeconds - Maximum recording duration (default: 60)
 */
const VoiceInput = ({
  onChange,
  isGlobalAILoading,
  setGlobalAILoading,
  maxDurationSeconds = 60
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [listeningStatus, setListeningStatus] = useState(''); // 'listening', 'processing', etc.

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null); // Keep MediaStreamSource reference
  const animationFrameRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef(''); // Buffer interim results separately
  const isRecordingRef = useRef(false); // Track recording state for callbacks
  const noSpeechRetryCount = useRef(0); // Track no-speech retries
  const hasReceivedSpeech = useRef(false); // Track if any speech was received
  const stopDelayTimeoutRef = useRef(null); // Delay before stopping
  const streamRef = useRef(null); // Keep stream reference
  const volumeCheckIntervalRef = useRef(null); // Volume monitoring interval
  const lastVolumeWarningRef = useRef(0); // Throttle volume warnings
  const recognitionRestartTimeoutRef = useRef(null); // Track restart timeout

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (stopDelayTimeoutRef.current) {
        clearTimeout(stopDelayTimeoutRef.current);
      }
      if (volumeCheckIntervalRef.current) {
        clearInterval(volumeCheckIntervalRef.current);
      }
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current);
      }
      // Clean up AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Audio level visualization
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  };

  /**
   * Volume Sensitivity Check
   * Uses AnalyserNode to detect if input signal is too low
   * Returns: { level: 0-1, isTooLow: boolean, suggestion: string }
   */
  const checkVolume = () => {
    if (!analyserRef.current) return { level: 0, isTooLow: true, suggestion: 'Mic not initialized' };

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for better volume accuracy
    let sumOfSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumOfSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumOfSquares / dataArray.length);
    const normalizedLevel = rms / 255;

    // Thresholds tuned for speech detection
    const TOO_LOW_THRESHOLD = 0.02; // Below 2% is definitely too quiet
    const WEAK_THRESHOLD = 0.05;    // Below 5% might have issues
    const GOOD_THRESHOLD = 0.1;     // Above 10% is good

    let suggestion = '';
    let isTooLow = false;

    if (normalizedLevel < TOO_LOW_THRESHOLD) {
      isTooLow = true;
      suggestion = 'No audio detected. Check if mic is muted or disconnected.';
    } else if (normalizedLevel < WEAK_THRESHOLD) {
      isTooLow = true;
      suggestion = 'Volume very low. Move closer to microphone or increase mic sensitivity.';
    } else if (normalizedLevel < GOOD_THRESHOLD) {
      suggestion = 'Volume is acceptable but could be louder for better accuracy.';
    }

    return { level: normalizedLevel, isTooLow, suggestion };
  };

  /**
   * Map user language to supported Speech Recognition language code
   * SwachhSetu supports 10 Indian languages + English
   */
  const getRecognitionLanguage = (userLanguage) => {
    // Supported language mappings for Indian languages
    const languageMap = {
      // Hindi variants
      'hi': 'hi-IN',
      'hi-IN': 'hi-IN',
      // English variants (default to Indian English for better accent handling)
      'en': 'en-IN',
      'en-IN': 'en-IN',
      'en-US': 'en-IN',
      'en-GB': 'en-IN',
      // Marathi
      'mr': 'mr-IN',
      'mr-IN': 'mr-IN',
      // Tamil
      'ta': 'ta-IN',
      'ta-IN': 'ta-IN',
      // Telugu
      'te': 'te-IN',
      'te-IN': 'te-IN',
      // Kannada
      'kn': 'kn-IN',
      'kn-IN': 'kn-IN',
      // Malayalam
      'ml': 'ml-IN',
      'ml-IN': 'ml-IN',
      // Gujarati
      'gu': 'gu-IN',
      'gu-IN': 'gu-IN',
      // Bengali
      'bn': 'bn-IN',
      'bn-IN': 'bn-IN',
      // Punjabi
      'pa': 'pa-IN',
      'pa-IN': 'pa-IN',
      // Odia
      'or': 'or-IN',
      'or-IN': 'or-IN',
    };

    // Check if we have a direct mapping
    if (languageMap[userLanguage]) {
      return languageMap[userLanguage];
    }

    // Try to extract base language code
    const baseCode = userLanguage?.split('-')[0];
    if (baseCode && languageMap[baseCode]) {
      return languageMap[baseCode];
    }

    // Default to Indian English for better handling of Indian accents
    return 'en-IN';
  };

  const startRecording = async () => {
    try {
      setError('');
      setAnalysisResult(null);
      setDuration(0);
      setListeningStatus('initializing');
      noSpeechRetryCount.current = 0;
      hasReceivedSpeech.current = false;

      // Clear transcript at the start of a NEW session
      transcriptRef.current = '';
      interimTranscriptRef.current = '';
      setTranscription('');

      // Check for Speech Recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      // ===== STEP 1: AUDIO CONTEXT WARM-UP =====
      // Create AudioContext and get mic stream FIRST to warm up the hardware
      // This ensures the mic is actively streaming before SpeechRecognition starts

      console.log('🔧 Step 1: Warming up audio hardware...');
      setListeningStatus('warmup');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Help with varying mic sensitivities
          sampleRate: 44100,
          channelCount: 1 // Mono for speech recognition
        }
      });
      streamRef.current = stream;

      // Create AudioContext and connect MediaStreamSource
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100 // Match the stream sample rate
      });

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.3; // Faster response for speech

      // Create MediaStreamSource - this is the key to hardware warm-up
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserRef.current);

      // Resume AudioContext if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Start visualization immediately to confirm audio is flowing
      visualizeAudio();

      // ===== STEP 2: HARDWARE WARM-UP DELAY =====
      // Wait briefly to ensure the mic hardware is fully initialized
      // This is crucial for mobile devices and USB headsets
      console.log('⏳ Waiting for hardware initialization...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // ===== STEP 3: VOLUME CHECK =====
      // Check if we have sufficient audio input before starting speech recognition
      console.log('🔊 Step 2: Checking volume levels...');

      // Set up periodic volume monitoring
      let lowVolumeFrames = 0;
      const VOLUME_CHECK_INTERVAL = 2000; // Check every 2 seconds

      volumeCheckIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;

        const volumeInfo = checkVolume();
        const now = Date.now();

        // Only warn if volume is consistently low and we haven't received speech
        if (volumeInfo.isTooLow && !hasReceivedSpeech.current) {
          lowVolumeFrames++;

          // Throttle warnings to avoid spam (max once every 5 seconds)
          if (now - lastVolumeWarningRef.current > 5000 && lowVolumeFrames >= 2) {
            console.warn(`⚠️ Volume check: ${volumeInfo.suggestion}`);
            setError(volumeInfo.suggestion);
            lastVolumeWarningRef.current = now;
          }
        } else {
          lowVolumeFrames = 0;
          // Clear volume-related errors when audio is good
          if (!hasReceivedSpeech.current) {
            setError('');
          }
        }
      }, VOLUME_CHECK_INTERVAL);

      // Initial volume check
      const initialVolume = checkVolume();
      if (initialVolume.isTooLow) {
        console.warn('⚠️ Initial volume low:', initialVolume.suggestion);
        // Don't block, just inform the user
        setError(initialVolume.suggestion);
      }

      // ===== STEP 4: SPEECH RECOGNITION SETUP WITH STRICT LANGUAGE =====
      console.log('🎤 Step 3: Setting up speech recognition...');

      const recognition = new SpeechRecognition();

      // Continuous mode - keep listening even during pauses
      recognition.continuous = true;

      // Enable interim results but buffer them properly
      recognition.interimResults = true;

      // STRICT LANGUAGE MAPPING - Don't let browser guess
      const userLang = navigator.language || 'en-IN';
      recognition.lang = getRecognitionLanguage(userLang);

      // Single alternative for faster processing
      recognition.maxAlternatives = 1;

      console.log(`🌐 Speech recognition language: ${recognition.lang}`);

      // ===== STEP 5: INTERIM RESULT BUFFERING =====
      recognition.onresult = (event) => {
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            // ONLY commit to final transcript when isFinal is true
            // This prevents dropping first syllables
            transcriptRef.current += transcript + ' ';
            hasReceivedSpeech.current = true;
            noSpeechRetryCount.current = 0; // Reset retry counter on successful speech
            console.log('✓ Final transcript chunk:', transcript.substring(0, 50));
          } else {
            // Buffer interim results separately
            currentInterim += transcript;
          }
        }

        // Store current interim for reference
        interimTranscriptRef.current = currentInterim;

        // Display: accumulated final + current interim
        setTranscription((transcriptRef.current + currentInterim).trim());
        setListeningStatus('listening');
        setError(''); // Clear any volume/speech errors on successful input
      };

      // ===== STEP 6: WATCHDOG PATTERN - SMART AUTO-RESTART =====
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);

        if (event.error === 'no-speech') {
          // WATCHDOG: no-speech error - check if we should restart
          console.log('🐕 Watchdog: no-speech detected');

          noSpeechRetryCount.current += 1;
          const hasNoTranscript = transcriptRef.current.trim().length === 0;

          // Only restart if still recording and we haven't captured anything yet
          // Or if we've had multiple consecutive no-speech errors
          if (isRecordingRef.current) {
            if (hasNoTranscript) {
              setListeningStatus('waiting');

              // Show warning after multiple retries
              if (noSpeechRetryCount.current >= 3) {
                const volumeInfo = checkVolume();
                if (volumeInfo.isTooLow) {
                  setError(volumeInfo.suggestion);
                } else {
                  setError('No speech detected. Please speak clearly into your microphone.');
                }
              }

              // Auto-restart will happen in onend handler
            }
            // If we have transcript, just silently continue
          }
          return; // Don't set hard error
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted (expected during stop)');
          // Don't show error for user-initiated stop
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found. Please connect a microphone and try again.');
        } else if (event.error === 'service-not-allowed') {
          setError('Speech recognition service not allowed. Please use HTTPS or localhost.');
        } else {
          setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      // ===== WATCHDOG: SMART onend HANDLER =====
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');

        // Clear any pending restart timeout
        if (recognitionRestartTimeoutRef.current) {
          clearTimeout(recognitionRestartTimeoutRef.current);
        }

        // WATCHDOG: Check if we should auto-restart
        if (isRecordingRef.current) {
          const hasTranscript = transcriptRef.current.trim().length > 0;

          console.log(`🐕 Watchdog check: isRecording=${isRecordingRef.current}, hasTranscript=${hasTranscript}, retries=${noSpeechRetryCount.current}`);

          // Always restart if still recording, but with exponential backoff after failures
          const MAX_RETRIES = 10; // Maximum restart attempts without speech

          if (noSpeechRetryCount.current >= MAX_RETRIES && !hasTranscript) {
            console.log('⚠️ Max no-speech retries reached, stopping auto-restart');
            setError('Unable to detect speech after multiple attempts. Please check your microphone and try again.');
            setListeningStatus('error');
            return;
          }

          // Restart with slight delay - longer delay after failures
          const restartDelay = hasTranscript ? 50 : Math.min(100 + (noSpeechRetryCount.current * 50), 500);

          recognitionRestartTimeoutRef.current = setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log(`🔄 Recognition auto-restarted (delay: ${restartDelay}ms)`);
                setListeningStatus(hasTranscript ? 'listening' : 'waiting');
              } catch (e) {
                // Recognition might already be running or in an invalid state
                if (e.name !== 'InvalidStateError') {
                  console.warn('Could not auto-restart recognition:', e);
                }
              }
            }
          }, restartDelay);
        }
      };

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setListeningStatus('listening');
      };

      recognitionRef.current = recognition;

      // ===== STEP 7: START RECOGNITION (after hardware is warm) =====
      recognition.start();

      console.log('✓ Speech recognition active');

      // ===== STEP 8: SETUP MEDIA RECORDER FOR AUDIO BLOB =====
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Process the audio
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      console.log('🎤 Recording started successfully');

    } catch (err) {
      console.error('Error accessing microphone:', err);

      // Provide specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is busy or not available. Please close other apps using the mic.');
      } else {
        setError('Unable to access microphone. Please grant permission and try again.');
      }

      setListeningStatus('');

      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    }
  };

  const stopRecording = (immediate = false) => {
    // Add a small delay before stopping to capture final words
    const stopDelay = immediate ? 0 : 500; // 500ms grace period

    if (stopDelayTimeoutRef.current) {
      clearTimeout(stopDelayTimeoutRef.current);
    }

    const performStop = () => {
      if (mediaRecorderRef.current && (isRecording || isRecordingRef.current)) {
        console.log('🛑 Stopping recording...');

        // CRITICAL: Set recording state to false FIRST
        // This prevents the watchdog from restarting recognition
        isRecordingRef.current = false;
        setIsRecording(false);
        setListeningStatus('processing');

        // Clear the recognition restart timeout
        if (recognitionRestartTimeoutRef.current) {
          clearTimeout(recognitionRestartTimeoutRef.current);
          recognitionRestartTimeoutRef.current = null;
        }

        // Stop volume monitoring
        if (volumeCheckIntervalRef.current) {
          clearInterval(volumeCheckIntervalRef.current);
          volumeCheckIntervalRef.current = null;
        }

        // Stop speech recognition first
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort(); // Use abort() for immediate stop
            console.log('✓ Speech recognition stopped');
          } catch (e) {
            console.warn('Speech recognition already stopped');
          }
        }

        // Stop media recorder (triggers onstop -> processAudio)
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          console.warn('MediaRecorder already stopped');
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Disconnect source node to clean up audio pipeline
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch (e) {
            // Already disconnected
          }
        }

        setAudioLevel(0);

        // Include any pending interim results in final transcript
        if (interimTranscriptRef.current && interimTranscriptRef.current.trim()) {
          transcriptRef.current += interimTranscriptRef.current + ' ';
          interimTranscriptRef.current = '';
        }

        console.log('📝 Final transcript length:', transcriptRef.current.trim().length);
      }
    };

    if (stopDelay > 0) {
      setListeningStatus('finishing');
      stopDelayTimeoutRef.current = setTimeout(performStop, stopDelay);
    } else {
      performStop();
    }
  };

  const processAudio = async (blob, retryCount = 0) => {
    const MAX_RETRIES = 2;
    setIsProcessing(true);
    if (setGlobalAILoading) setGlobalAILoading(true);
    setError('');

    try {
      const finalTranscript = transcriptRef.current.trim();
      
      if (!finalTranscript || finalTranscript.length === 0) {
        throw new Error('No speech detected. Please try recording again and speak clearly.');
      }

      if (finalTranscript.length < 5) {
        throw new Error('Transcript too short. Please provide a more detailed description.');
      }

      console.log('🗣️ Processing transcript:', finalTranscript.substring(0, 100) + '...');
      console.log('📊 Transcript length:', finalTranscript.length, 'characters');

      // Call linguistic analysis API with transcript (no /api prefix, baseURL already has it)
      const response = await api.post('/ai/linguistic/analyze', {
        transcript: finalTranscript
      }, {
        timeout: 60000 // 60 second timeout (AI processing can take time)
      });

      const result = response.data;
      
      console.log('✓ Analysis result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed. Please try again.');
      }
      
      setAnalysisResult(result);
      
      // Use the best available translation
      const displayText = result.english_translation || result.summarized_complaint || finalTranscript;
      setTranscription(displayText);

      // Call parent onChange with the result
      if (onChange) {
        const voiceData = {
          transcript: result.english_translation || finalTranscript,
          summary: result.summarized_complaint || result.english_translation || finalTranscript,
          language: result.detected_language,
          sentiment: result.sentiment_tone,
          urgency: result.urgency_rating,
          location: result.extracted_location,
          confidence: result.confidence,
          fullResult: result
        };
        onChange(voiceData);
      }

    } catch (err) {
      // If AI processing fails but we have a transcript, use it as fallback
      const finalTranscript = transcriptRef.current.trim();
      if (err.message?.includes('timeout') && finalTranscript && finalTranscript.length > 0) {
        console.log('⚠️ AI processing timeout, using raw transcript as fallback');
        setTranscription(finalTranscript);
        setIsProcessing(false);
        
        // Call parent onChange with raw transcript
        if (onChange) {
          const fallbackData = {
            transcript: finalTranscript,
            summary: finalTranscript,
            language: 'unknown',
            sentiment: 'neutral',
            urgency: 'medium',
            location: null,
            confidence: 0.5,
            fullResult: { fallback: true, reason: 'AI processing timeout' }
          };
          onChange(fallbackData);
        }
        
        // Don't show error, just success message since transcript was captured
        setError('');
        return;
      }
      
      console.error('❌ Processing error:', err);
      
      // Retry logic for network errors (not timeout)
      if (retryCount < MAX_RETRIES && err.message?.includes('network')) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setError(`Connection issue. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return processAudio(blob, retryCount + 1);
      }
      
      // User-friendly error messages
      let errorMessage = 'Failed to process audio. Please try again.';
      
      if (err.response?.status === 400) {
        errorMessage = 'Invalid audio input. Please record your message again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check if the backend AI service is running.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Processing timeout. The AI service might be busy. Please try again.';
      } else if (err.message?.includes('network') || err.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setListeningStatus('');
      if (setGlobalAILoading) setGlobalAILoading(false);

      // Now safe to close AudioContext after processing
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    }
  };

  const handleClear = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setTranscription('');
    setAnalysisResult(null);
    setError('');
    setDuration(0);
    setListeningStatus('');
    audioChunksRef.current = [];
    transcriptRef.current = '';
    interimTranscriptRef.current = '';
    noSpeechRetryCount.current = 0;
    hasReceivedSpeech.current = false;
    lastVolumeWarningRef.current = 0;

    // Clear volume check interval
    if (volumeCheckIntervalRef.current) {
      clearInterval(volumeCheckIntervalRef.current);
      volumeCheckIntervalRef.current = null;
    }

    // Clear recognition restart timeout
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }

    // Clean up AudioContext when clearing
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }

    if (onChange) {
      onChange(null);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Description
        </h3>
        {analysisResult && (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Processed
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Recording Interface */}
      {!audioBlob && !isProcessing && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/50">
          {!isRecording ? (
            <>
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Record Voice Description
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Speak in any language (Hindi, Marathi, Tamil, English, etc.)
              </p>
              <button
                onClick={startRecording}
                disabled={isGlobalAILoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                Maximum {maxDurationSeconds} seconds
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center animate-pulse relative"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.2})`
                  }}
                >
                  <MicOff className="w-10 h-10 text-white" />

                  {/* Ripple effect */}
                  {audioLevel > 0.3 && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" style={{ animationDelay: '0.2s' }} />
                    </>
                  )}
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {listeningStatus === 'warmup' ? 'Initializing microphone...' :
                 listeningStatus === 'waiting' ? 'Waiting for speech...' :
                 listeningStatus === 'finishing' ? 'Finishing up...' :
                 listeningStatus === 'error' ? 'Error detected' :
                 'Recording...'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {listeningStatus === 'warmup' ? 'Warming up audio hardware...' :
                 listeningStatus === 'waiting' ? 'Please speak into your microphone' :
                 listeningStatus === 'listening' ? 'Listening... speak clearly' :
                 listeningStatus === 'error' ? 'Check your microphone settings' :
                 'Processing your input'}
              </p>
              <p className="text-2xl font-mono text-red-600 dark:text-red-400 mb-4">
                {formatDuration(duration)}
              </p>
              {/* Live transcript preview */}
              {transcription && (
                <div className="mb-4 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg max-h-20 overflow-y-auto">
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                    "{transcription.substring(0, 100)}{transcription.length > 100 ? '...' : ''}"
                  </p>
                </div>
              )}
              <button
                onClick={() => stopRecording(false)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center gap-2 mx-auto"
              >
                <MicOff className="w-5 h-5" />
                Stop Recording
              </button>
            </>
          )}
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-white dark:bg-gray-800">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Processing Audio...
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Transcribing and analyzing your voice input
          </p>
        </div>
      )}

      {/* Result Display */}
      {audioBlob && !isProcessing && analysisResult && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <h4 className="font-semibold">Voice Processed Successfully</h4>
                  <p className="text-sm opacity-90">Duration: {formatDuration(duration)}</p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <audio 
                  controls 
                  src={audioUrl} 
                  className="flex-1 h-10"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Analysis Results */}
          <div className="p-4 space-y-3">
            {/* Language Badge */}
            {analysisResult.detected_language && (
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  {analysisResult.detected_language}
                </span>
                {analysisResult.confidence && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(analysisResult.confidence * 100)}% confident
                  </span>
                )}
              </div>
            )}

            {/* Transcription */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Transcription:
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {transcription}
              </p>
            </div>

            {/* Sentiment & Urgency */}
            <div className="grid grid-cols-2 gap-3">
              {analysisResult.sentiment_tone && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Sentiment:
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                    analysisResult.sentiment_tone === 'Angry' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    analysisResult.sentiment_tone === 'Frustrated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                    analysisResult.sentiment_tone === 'Urgent' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {analysisResult.sentiment_tone}
                  </span>
                </div>
              )}

              {analysisResult.urgency_rating && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Urgency:
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                    analysisResult.urgency_rating === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    analysisResult.urgency_rating === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {analysisResult.urgency_rating}
                  </span>
                </div>
              )}
            </div>

            {/* Extracted Location */}
            {analysisResult.extracted_location && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Detected Location:
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  📍 {analysisResult.extracted_location}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
