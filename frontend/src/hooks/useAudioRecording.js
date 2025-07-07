import { useState, useRef, useCallback } from 'react';

export const useAudioRecording = () => {
  const [state, setState] = useState({
    isRecording: false
  });
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setState(prev => ({ ...prev, audioBlob, isRecording: false }));
        
        // Send to websocket endpoint (implement your existing method here)
        await sendAudioToWebSocket(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const sendAudioToWebSocket = async (audioBlob) => {
    // Implement your existing WebSocket audio sending logic here
    // This is a placeholder for the actual implementation
    console.log('Sending audio to WebSocket:', audioBlob);
    
    // Simulate API response
    setTimeout(() => {
      setState(prev => ({ ...prev, transcript: 'Sample transcribed text' }));
    }, 1000);
  };

  return {
    ...state,
    startRecording,
    stopRecording
  };
};