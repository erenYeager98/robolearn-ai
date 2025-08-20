# RoboLearn AI – Interactive Learning & Image Search Assistant

RoboLearn AI is a **voice-enabled, emotion-aware learning assistant** that runs on a Raspberry Pi.  
It combines **text-to-speech (TTS)**, **speech-to-text (STT)**, **LLM-powered responses**, **keyword-based image search**, and **real-time word highlighting** to deliver an interactive, multimedia learning experience.

---

## Features

- **Natural Language Q&A** – Ask questions, get detailed, teacher-like explanations from a local or remote LLM.
- **Emotion-Aware Responses** – Tailors explanations based on detected user mood.
- **Real-Time Voice Reading** – Text is read aloud using **Piper TTS** with synchronized word highlighting.
- **Keyword-Based Image Search** – Uses **KeyBERT** to extract keywords and fetch relevant images from the web.
- **Side-by-Side Display** – Text responses on the left, image results on the right.
- **Markdown & Math Support** – Fully supports equations via KaTeX.
- **Raspberry Pi Ready** – Optimized to run on Pi hardware.

---

## Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Framer Motion (UI animations)
- React Markdown + KaTeX
- Custom Hooks (`useTextToSpeech`, etc.)

**Backend:**
- FastAPI (Python)
- HuggingFace Transformers (LLM inference)
- KeyBERT (keyword extraction)
- Serper.dev API (image search)
- Piper TTS (local speech synthesis)
- Whisper (speech-to-text)
- FFmpeg (audio format conversion)

---

## Installation

### Clone the Repository
```bash
git clone https://github.com/your-username/robolearn-ai.git
cd robolearn-ai
