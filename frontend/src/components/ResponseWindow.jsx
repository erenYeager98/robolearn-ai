import React from 'react';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Image, Upload, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ScholarTiles } from './ScholarTiles';
import { ImageSearchTiles } from './ImageSearchTiles';

// --- MOCK COMPONENTS AND HOOKS ---
// These are placeholders for your actual components to allow this file to be self-contained.
const useWindows = () => ({
  minimizeWindow: (id) => console.log(`Minimize window: ${id}`),
  maximizeWindow: (id) => console.log(`Maximize window: ${id}`),
  closeWindow: (id) => console.log(`Close window: ${id}`),
});

// --- MAIN COMPONENT ---
export const ResponseWindow = ({ windowId, content, isMinimized }) => {
  const { minimizeWindow, maximizeWindow, closeWindow } = useWindows();
  const { playingId, isPlaying, isLoading: ttsLoading, playAudio, stopAudio } = useTextToSpeech();
  const scrollContainerRef = useRef(null);
  
  // --- LOGIC FOR SEQUENTIAL PLAYBACK ---
  const [isSequencing, setIsSequencing] = useState(false);
  const sequencingRef = useRef(isSequencing);
  useEffect(() => {
    sequencingRef.current = isSequencing;
  }, [isSequencing]);

  const didInitPlayRef = useRef(false);
  const responseRef = useRef(null);

  const paragraphs = useMemo(() => {
    if (!content?.response) return [];
    return content.response.split(/\n\s*\n/).filter(p => p.trim() !== '');
  }, [content?.response]);

  const playParagraphSequentially = useCallback((index) => {
    if (index >= paragraphs.length) {
      setIsSequencing(false);
      return;
    }
    const paragraphText = paragraphs[index];
    const uniqueParagraphId = `${windowId}-${index}`;
    playAudio(uniqueParagraphId, paragraphText, {
      onEnd: () => {
        if (sequencingRef.current) {
          playParagraphSequentially(index + 1);
        }
      },
    });
  }, [paragraphs, windowId, playAudio]);

  useEffect(() => {
    if (content.response !== responseRef.current) {
      responseRef.current = content.response;
      didInitPlayRef.current = false;
      setIsSequencing(false);
      stopAudio();
    }
    if (!content.isLoading && paragraphs.length > 0 && !didInitPlayRef.current) {
      didInitPlayRef.current = true;
      setIsSequencing(true);
      playParagraphSequentially(0);
    }
  }, [content.isLoading, content.response, paragraphs, stopAudio, playParagraphSequentially]);

  const handleReadAloud = async (paragraphText, paragraphIndex) => {
    const uniqueParagraphId = `${windowId}-${paragraphIndex}`;
    if (playingId === uniqueParagraphId && isPlaying) {
      stopAudio();
      setIsSequencing(false);
    } else {
      setIsSequencing(false);
      await playAudio(uniqueParagraphId, paragraphText, { onEnd: null });
    }
  };
  // --- END OF PLAYBACK LOGIC ---

  const getWindowIcon = () => {
    switch (content?.type) {
      case 'image': return <Image className="w-4 h-4 text-white/60" />;
      case 'upload': return <Upload className="w-4 h-4 text-white/60" />;
      default: return <FileText className="w-4 h-4 text-white/60" />;
    }
  };

  const getWindowTitle = () => {
    switch (content?.type) {
      case 'image': return "Let's learn";
      case 'upload': return 'File Upload';
      default: return "Let's learn";
    }
  };

  useEffect(() => {
    const scrollableDiv = scrollContainerRef.current;
    if (isPlaying && playingId?.startsWith(windowId) && scrollableDiv) {
      const scrollSpeed = 1;
      const scrollIntervalTime = 90;
      const scrollInterval = setInterval(() => {
        if (scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight) {
          scrollableDiv.scrollTop += scrollSpeed;
        } else {
          clearInterval(scrollInterval);
        }
      }, scrollIntervalTime);
      return () => clearInterval(scrollInterval);
    }
  }, [isPlaying, playingId, windowId]);

  if (isMinimized) {
    return (
      <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/20 backdrop-blur-xl rounded-lg border border-white/30 p-3 cursor-pointer hover:bg-white/30 transition-all" onClick={() => maximizeWindow(windowId)}>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm truncate">{getWindowTitle()}</span>
          {getWindowIcon()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-4">
          <h3 className="text-white font-medium text-lg">{getWindowTitle()}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => closeWindow(windowId)} className="p-3 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="p-8 min-h-[32rem] max-h-[40rem] overflow-y-auto response-window-content">
        {content.isLoading ? (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-3 w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/15 rounded w-full"></div>
                <div className="h-4 bg-white/15 rounded w-5/6"></div>
              </div>
            </div>
            <ScholarTiles scholarData={null} isLoading={true} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`bg-white/10 rounded-lg p-6 relative`}>
              <div className="text-white/80 leading-relaxed text-base whitespace-pre-wrap relative z-10 space-y-6">
                {paragraphs.map((p, index) => {
                  const uniqueParagraphId = `${windowId}-${index}`;
                  const isThisParagraphPlaying = playingId === uniqueParagraphId && isPlaying;
                  return (
                    <div key={index} className="group relative pr-12">
                      <div className={`transition-all duration-300 ${isThisParagraphPlaying ? 'text-white font-medium ring-2 ring-blue-500/30 p-2 rounded-md' : 'text-white/70'}`}>
                        <ReactMarkdown>{p}</ReactMarkdown>
                      </div>
                      <button onClick={() => handleReadAloud(p, index)} className={`absolute top-0 right-0 p-2 rounded-full transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 ${isThisParagraphPlaying ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg opacity-100 scale-100' : 'bg-white/20 hover:bg-white/30 text-white/70 opacity-0 scale-75'} ${ttsLoading && playingId !== uniqueParagraphId ? 'opacity-50 cursor-not-allowed' : ''}`} title={isThisParagraphPlaying ? 'Stop reading' : 'Read this paragraph'} disabled={ttsLoading && playingId !== uniqueParagraphId}>
                        {isThisParagraphPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {(content.scholarData || content.scholarLoading) && (
              <ScholarTiles 
                scholarData={content.scholarData} 
                isLoading={content.scholarLoading || false}
              />
            )}
            {content.scholarError && !content.scholarLoading && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-300 font-medium mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Academic Research Error
                </h4>
                <p className="text-red-200/80">{content.scholarError}</p>
              </div>
            )}
            {content.imageSearchData && (
              <ImageSearchTiles 
                imageSearchData={content.imageSearchData} 
                isLoading={false}
              />
            )}
            {content.researchData && (
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-white font-medium mb-3 text-lg">AI Analysis</h4>
                <p className="text-white/80 whitespace-pre-wrap">{content.researchData.response}</p>
              </div>
            )}
            {content.image && (
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-white font-medium mb-3 text-lg">Captured Image</h4>
                <img 
                  src={content.image} 
                  alt="Captured" 
                  className="w-full max-w-lg rounded-lg"
                />
              </div>
            )}
            {content.file && (
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-white font-medium mb-3 text-lg">File Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-white/60">File Name</span>
                    <span className="text-white/80">{content.file.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="text-white/60">File Size</span>
                    <span className="text-white/80">{(content.file.size / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="text-white/60">File Type</span>
                    <span className="text-white/80">{content.file.type || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

