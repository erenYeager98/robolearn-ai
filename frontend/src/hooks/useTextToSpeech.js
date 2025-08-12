import { useState, useRef, useCallback } from 'react';

// Change to your API endpoint
const TEXT_TO_SPEECH_API_URL = 'https://api.erenyeager-dk.live/api/text-to-speech';

// Simple markdown stripper (basic)
const stripMarkdown = (md) => {
  if (!md) return "";
  return md
    .replace(/!\[.*?\]\(.*?\)/g, "")       // remove images
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1") // remove links but keep text
    .replace(/[`*_>{}#+\-~]/g, "")          // remove formatting chars
    .replace(/\n+/g, " ")                   // replace newlines with spaces
    .trim();
};

export const useTextToSpeech = () => {
  const [state, setState] = useState({
    isPlaying: false,
    playingId: null,
    isLoading: false,
    currentWordIndex: -1 // start before first word
  });

  const audioRef = useRef(null);
  const currentIdRef = useRef(null);
  const highlightTimerRef = useRef(null);

  const clearHighlightTimer = () => {
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  };

  const playAudio = useCallback(async (id, text) => {
    try {
      // Clean up existing audio and timers
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearHighlightTimer();

      // Strip markdown for reading/highlighting
      const cleanText = stripMarkdown(text);
      const words = cleanText.split(/\s+/).filter(Boolean);
      console.log(cleanText)
      
      setState(prev => ({
        ...prev,
        isLoading: true,
        playingId: id,
        currentWordIndex: -1
      }));
      currentIdRef.current = id;

      // Fetch audio from backend
      const response = await fetch(TEXT_TO_SPEECH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: 'en-US-Standard-A',
          speed: 1.0
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (currentIdRef.current !== id) {
        URL.revokeObjectURL(audioUrl);
        return;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        if (currentIdRef.current === id) {
          setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));

          // Approximate timing
          const timePerWord = audio.duration / words.length;

          let index = 0;
          setState(prev => ({ ...prev, currentWordIndex: 0 }));

          highlightTimerRef.current = setInterval(() => {
            index++;
            if (index < words.length) {
              setState(prev => ({ ...prev, currentWordIndex: index }));
            } else {
              clearHighlightTimer();
            }
          }, timePerWord * 1000);
        }
      };

      audio.onended = () => {
        if (currentIdRef.current === id) {
          clearHighlightTimer();
          setState(prev => ({
            ...prev,
            isPlaying: false,
            playingId: null,
            currentWordIndex: -1
          }));
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          currentIdRef.current = null;
        }
      };

      audio.onerror = () => {
        if (currentIdRef.current === id) {
          clearHighlightTimer();
          setState(prev => ({
            ...prev,
            isPlaying: false,
            playingId: null,
            isLoading: false,
            currentWordIndex: -1
          }));
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          currentIdRef.current = null;
        }
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    clearHighlightTimer();
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      playingId: null,
      isLoading: false,
      currentWordIndex: -1
    }));
    currentIdRef.current = null;
  }, []);

  return {
    ...state,
    playAudio,
    stopAudio
  };
};
