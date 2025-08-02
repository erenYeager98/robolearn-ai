import { useState, useRef, useCallback } from 'react';

const TEXT_TO_SPEECH_API_URL = 'https://api.erenyeager-dk.live/api/text-to-speech'; // Replace with your actual endpoint

export const useTextToSpeech = () => {
  const [state, setState] = useState({
    isPlaying: false,
    playingId: null,
    isLoading: false
  });
  
  const audioRef = useRef(null);
  const currentIdRef = useRef(null);

  const playAudio = useCallback(async (id, text) => {
    console.log(`[🔊] Playing audio for ID: ${id,text}`);
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setState(prev => ({ ...prev, isLoading: true, playingId: id }));
      currentIdRef.current = id;

      // Send text to your TTS endpoint
      const response = await fetch(TEXT_TO_SPEECH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'en-US-Standard-A', // Adjust based on your TTS service
          speed: 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Only proceed if this is still the current request
      if (currentIdRef.current === id) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onloadeddata = () => {
          if (currentIdRef.current === id) {
            setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
          }
        };

        audio.onended = () => {
          if (currentIdRef.current === id) {
            setState(prev => ({ ...prev, isPlaying: false, playingId: null }));
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            currentIdRef.current = null;
          }
        };

        audio.onerror = () => {
          if (currentIdRef.current === id) {
            setState(prev => ({ ...prev, isPlaying: false, playingId: null, isLoading: false }));
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            currentIdRef.current = null;
          }
        };

        await audio.play();
      } else {
        // Clean up if request was cancelled
        URL.revokeObjectURL(audioUrl);
      }

    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Fallback to browser's built-in speech synthesis
      if (currentIdRef.current === id) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          
          utterance.onstart = () => {
            if (currentIdRef.current === id) {
              setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
            }
          };
          
          utterance.onend = () => {
            if (currentIdRef.current === id) {
              setState(prev => ({ ...prev, isPlaying: false, playingId: null }));
              currentIdRef.current = null;
            }
          };
          
          utterance.onerror = () => {
            if (currentIdRef.current === id) {
              setState(prev => ({ ...prev, isPlaying: false, playingId: null, isLoading: false }));
              currentIdRef.current = null;
            }
          };
          
          speechSynthesis.speak(utterance);
        } catch (fallbackError) {
          console.error('Fallback TTS also failed:', fallbackError);
          setState(prev => ({ ...prev, isPlaying: false, playingId: null, isLoading: false }));
          currentIdRef.current = null;
        }
      }
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Stop speech synthesis if it's being used
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    setState(prev => ({ ...prev, isPlaying: false, playingId: null, isLoading: false }));
    currentIdRef.current = null;
  }, []);

  return {
    ...state,
    playAudio,
    stopAudio
  };
};