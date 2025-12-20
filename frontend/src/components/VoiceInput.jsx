import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, CheckCircle, AlertCircle, Languages } from 'lucide-react';
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

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  const startRecording = async () => {
    try {
      setError('');
      setTranscription('');
      setAnalysisResult(null);
      setDuration(0);
      transcriptRef.current = '';

      // Check for Speech Recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Setup Speech Recognition with auto language detection
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Try to detect user's language or default to Hindi
      const userLang = navigator.language || 'hi-IN';
      recognition.lang = userLang.startsWith('en') ? 'en-IN' : 'hi-IN';
      recognition.maxAlternatives = 1;
      
      console.log(`🎤 Speech recognition started with language: ${recognition.lang}`);

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        transcriptRef.current += finalTranscript;
        setTranscription(transcriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please speak clearly into your microphone.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted (user stopped)');
        } else {
          setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        // Only log, don't restart automatically
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Setup audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      visualizeAudio();

      // Setup media recorder
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
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

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

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('✓ Speech recognition stopped');
        } catch (e) {
          console.warn('Speech recognition already stopped');
        }
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          console.log('✓ Audio context closed');
        } catch (e) {
          console.warn('Audio context already closed');
        }
      }
      
      setAudioLevel(0);
      
      console.log('📝 Final transcript length:', transcriptRef.current.length);
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
      if (setGlobalAILoading) setGlobalAILoading(false);
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
    audioChunksRef.current = [];
    
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
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Recording...
              </h4>
              <p className="text-2xl font-mono text-red-600 dark:text-red-400 mb-4">
                {formatDuration(duration)}
              </p>
              <button
                onClick={stopRecording}
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
