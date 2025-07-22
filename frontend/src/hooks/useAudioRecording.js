import { useState, useRef, useCallback } from "react";

export const useAudioRecording = (onTranscript) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("Microphone access granted. Starting recording...");
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Received audio chunk:", event.data.size, "bytes");
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped. Preparing to send audio...");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await audioBlob.arrayBuffer();

        console.log("Opening WebSocket...");
        websocketRef.current = new WebSocket("ws://192.168.29.38:5000/ws/audio");

        websocketRef.current.onopen = () => {
          console.log("WebSocket connected. Sending audio...");
          websocketRef.current.send(arrayBuffer);
        };

        websocketRef.current.onmessage = (event) => {
          console.log("Message received from server:", event.data);
          try {
            const { text, error } = JSON.parse(event.data);
            if (error) {
              console.error("Transcription error:", error);
            } else if (onTranscript) {
              console.log("Transcription received:", text);
              onTranscript(text); // <- CALLS YOUR `setText(...)` FROM SearchBar.jsx or App.jsx
            }
          } catch (err) {
            console.error("JSON parsing error:", err);
          }

          websocketRef.current.close();
        };

        websocketRef.current.onerror = (err) => {
          console.error("WebSocket error:", err);
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      console.log(" Recording started...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording...");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    
    isRecording,
    startRecording,
    stopRecording,
  };
};
