import { useState, useRef, useCallback } from "react";

export const useAudioRecording = (onTranscript) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [transcription, setTranscription] = useState("");
  const audioChunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("Microphone access granted. Starting recording...");
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped. Preparing to send via HTTP POST...");

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const response = await fetch("https://api.erenyeager-dk.live/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const { transcription, prompt } = await response.json();

          console.log("Prompt:", prompt);
          console.log("Transcription:", transcription);
          onTranscript(transcription);
          setTranscription(transcription); 
        } catch (err) {
          console.error("Failed to send audio via HTTP:", err);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcription

  };
};
