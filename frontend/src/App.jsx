import { useEffect, useRef, useState } from 'react';
import { Camera, Mic } from 'lucide-react';
import './index.css';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Stars } from '@react-three/drei';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';


function Background() {
  return (
    <div className="background-canvas">
      <Canvas>
        <Suspense fallback={null}>
          <Stars radius={100} depth={10} count={5000} factor={4} saturation={1} fade speed={5} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function App() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const ws = useRef(null);
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.29.67:8000/ws/audio');
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setText((prev) => prev + ' ' + msg.text);
    };
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const media = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recordedChunks.current = [];
    mediaRecorder.current = media;

    media.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    media.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
      blob.arrayBuffer().then((buffer) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(buffer);
        }
      });
    };

    media.start();
    setListening(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setListening(false);
  };

  const fetchResearch = async () => {
  setShowResult(true);
  setResultText('Thinking...');
  try {
    const res = await fetch('http://localhost:8000/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text }) // key changed to "question"
    });

    const data = await res.json();
    const content = data.answer || 'No result found.';

    // Typing animation
    setResultText('');
    for (let i = 0; i < content.length; i++) {
      setResultText((prev) => prev + content[i]);
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  } catch (error) {
    setResultText('Error fetching response.');
  }
};

  return (
   <>
      <Background />
      <div className="header">robolearn</div>
      <div className={`search-container ${listening ? 'listening' : ''}`}>
        <input
          className="search-input"
          placeholder="Speak or type your query..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="icon-container">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className="mic-button"
          >
            <Mic size={32} />
          </button>
          <button className="mic-button">
            <Camera size={32} />
          </button>
        </div>
        {text.trim() && (
          <button className="research-button" onClick={fetchResearch}>
            Research
          </button>
        )}
      </div>
      {showResult && (
  <div className="result-box">
    <ReactMarkdown
      children={resultText}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeKatex]}
    />
  </div>
)}

    </>
  );
}
