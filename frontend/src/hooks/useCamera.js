import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [state, setState] = useState({
    isOpen: false,
    isCapturing: false
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setState(prev => ({ ...prev, isOpen: true }));
    } catch (error) {
      console.error('Error opening camera:', error);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState(prev => ({ ...prev, isOpen: false, capturedImage: undefined }));
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setState(prev => ({ ...prev, capturedImage: imageData }));
      }
    }
  }, []);

  const resetCamera = useCallback(() => {
    setState(prev => ({ ...prev, capturedImage: undefined }));
    // Restart the camera stream if it was stopped
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else {
      // If no stream exists, open camera again
      openCamera();
    }
  }, []);
  return {
    ...state,
    videoRef,
    canvasRef,
    openCamera,
    closeCamera,
    captureImage,
    resetCamera
  };
};