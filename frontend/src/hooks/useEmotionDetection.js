import { useState, useRef, useCallback, useEffect } from 'react';

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURATION CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────
const DEFAULT_HTTP_URL = 'https://api.erenyeager-dk.live/api/detect-emotion';                          // Fallback to the new HTTP endpoint

const FRAME_INTERVAL_MS = 5000; // Capture every 2 seconds
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

  // ─── Frame capture and sending logic ───────────────────────────────────────
  const captureAndSendFrame = useCallback(async () => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to Blob (binary JPEG)
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');

    try {
      const response = await fetch(DEFAULT_HTTP_URL, {
        method: 'POST',
        body: formData, // Automatically sets correct multipart/form-data headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { emotion, score } = await response.json();
      setEmotionData({
        emotion: emotion || 'neutral',
        score: typeof score === 'number' ? score : 0,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('[EmotionHTTP] Failed to send frame:', err);
    }
  }, 'image/jpeg', JPEG_QUALITY); // <- JPEG blob
}, []);

  // ─── Start detection ────────────────────────────────────────────────────────
  const startEmotionDetection = useCallback(async () => {
    if (isEmotionActive) return; // Prevent duplicates

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
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
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') console.error('[Emotion] play() error', err);
          });
          resolve();
        };
      });

      // Start periodic frame captures
      intervalId.current = setInterval(captureAndSendFrame, FRAME_INTERVAL_MS);
      setIsEmotionActive(true);
    } catch (err) {
      console.error('[Emotion] failed to start detection', err);
      setIsEmotionActive(false);
    }
  }, [captureAndSendFrame, isEmotionActive]);

  // ─── Stop detection ─────────────────────────────────────────────────────────
  const stopEmotionDetection = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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

  // connectionState is no longer relevant in an HTTP polling model
  return {
    emotionData,
    isEmotionActive,
    startEmotionDetection,
    stopEmotionDetection,
  };
};