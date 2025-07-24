/**
 * useEmotionDetection.js
 *
 * A React hook that:
 * 1. Opens a WebSocket connection to a FastAPI emotion‐detection backend at /ws/emotion * 2. Captures frames from the user’s webcam at a configurable interval.
 * 3. Sends base64‐encoded JPEG images (raw data URL) to the backend.
 * 4. Receives JSON payloads shaped as { emotion: "happy", score: 0.92 }.
 * 5. Exposes live emotion data and connection status to the UI.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURATION CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────
const DEFAULT_WS_URL =
  import.meta.env.VITE_EMOTION_WS_URL || // Vite (.env)
  'ws://localhost:8001/ws/emotion';      // Fallback

const FRAME_INTERVAL_MS = 2000; // Capture every 2 seconds
const JPEG_QUALITY = 0.8;       // Canvas JPEG quality (0–1)

// ───────────────────────────────────────────────────────────────────────────────
// HOOK
// ───────────────────────────────────────────────────────────────────────────────
export const useEmotionDetection = () => {
  // ─── Public state ───────────────────────────────────────────────────────────
  const [emotionData, setEmotionData] = useState({
    emotion: 'neutral',
    score: 0,
    timestamp: Date.now()
  });
  const [isEmotionActive, setIsEmotionActive] = useState(false);

  // ─── Internal refs ──────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalId = useRef(null);

  // ─── WebSocket setup via react-use-websocket ────────────────────────────────
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    DEFAULT_WS_URL,
    {
      onOpen: () => console.info('[EmotionWS] connected to', DEFAULT_WS_URL),
      onClose: () => console.warn('[EmotionWS] disconnected'),
      onError: (err) => console.error('[EmotionWS] error', err),
      shouldReconnect: () => true,
      reconnectAttempts: Infinity,
      reconnectInterval: 3000,
      retryOnError: true
    }
  );

  // ─── Parse inbound emotion JSON ────────────────────────────────────────────
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const { emotion, score } = JSON.parse(lastMessage.data);
      setEmotionData({
        emotion: emotion || 'neutral',
        score: typeof score === 'number' ? score : 0,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('[EmotionWS] JSON parse error', err);
    }
  }, [lastMessage]);

  // ─── Frame capture logic ────────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    if (
      readyState !== ReadyState.OPEN ||
      !videoRef.current ||
      !canvasRef.current
    ) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Sync canvas size to video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

    // Send raw data URL string
    sendMessage(dataUrl);
  }, [readyState, sendMessage]);

  // ─── Start detection ────────────────────────────────────────────────────────
  const startEmotionDetection = useCallback(async () => {
    if (isEmotionActive) return; // Prevent duplicates

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });

      // Create hidden video element
      if (!videoRef.current) {
        const vid = document.createElement('video');
        vid.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
        document.body.appendChild(vid);
        videoRef.current = vid;
      }

      // Create hidden canvas element
      if (!canvasRef.current) {
        const can = document.createElement('canvas');
        can.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
        document.body.appendChild(can);
        canvasRef.current = can;
      }

      // Attach stream and wait for metadata then play
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch((err) => {
          if (err.name !== 'AbortError')
            console.error('[Emotion] play() error', err);
        });
      };

      // Start periodic frame captures
      intervalId.current = setInterval(captureFrame, FRAME_INTERVAL_MS);
      setIsEmotionActive(true);
    } catch (err) {
      console.error('[Emotion] failed to start detection', err);
      setIsEmotionActive(false);
    }
  }, [captureFrame, isEmotionActive]);

  // ─── Stop detection ─────────────────────────────────────────────────────────
  const stopEmotionDetection = useCallback(() => {
    // Clear interval
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    // Stop video tracks
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsEmotionActive(false);
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopEmotionDetection();
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
      if (canvasRef.current && document.body.contains(canvasRef.current)) {
        document.body.removeChild(canvasRef.current);
      }
    };
  }, [stopEmotionDetection]);

  return {
    emotionData,         // { emotion, score, timestamp }
    isEmotionActive,     // boolean: whether detection is running
    startEmotionDetection,
    stopEmotionDetection,
    connectionState: readyState
  };
};
