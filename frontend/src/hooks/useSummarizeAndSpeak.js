import { useState, useRef, useCallback } from 'react';

const SUMMARIZE_API = 'https://api.erenyeager-dk.live/api/summarize'; // Change if needed
const TTS_API = 'https://api.erenyeager-dk.live/api/text-to-speech';

export const useSummarizeAndSpeak = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    setIsPlaying(false);
  }, []);

  const summarizeAndSpeak = useCallback(async ({ title, snippet, author }) => {
    setIsLoading(true);
    setError(null);
    stop();

    try {
      // 1. Send paper info to /summarize
      const combinedText = `Title: ${title}\nAuthor: ${author}\nSnippet: ${snippet}`;

      const res = await fetch(SUMMARIZE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: combinedText })
      });

      if (!res.ok) throw new Error(`Summarize failed: ${res.status}`);
      const summary = await res.json(); // Assume API returns { summary }
      console.log('[📄] Summary:', summary.answer);

      // 2. Call TTS endpoint
      const ttsRes = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summary.answer,
          voice: 'en-US-Standard-A', // Adjust based on your TTS service
          speed: 1.0
        })
      });

      if (!ttsRes.ok) throw new Error(`TTS failed: ${ttsRes.status}`);
      const blob = await ttsRes.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadeddata = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Audio playback failed");
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      console.error('[❌] Error:', err);
      setError(err.message);

      // Fallback to browser TTS
      const fallback = new SpeechSynthesisUtterance(err?.summary || 'Sorry, something went wrong.');
      fallback.rate = 1;
      fallback.pitch = 1;
      fallback.volume = 0.8;

      fallback.onstart = () => setIsPlaying(true);
      fallback.onend = () => setIsPlaying(false);
      fallback.onerror = () => setIsPlaying(false);

      speechSynthesis.speak(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  return {
    summarizeAndSpeak,
    stop,
    isLoading,
    isPlaying,
    error
  };
};
