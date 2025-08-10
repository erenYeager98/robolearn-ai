import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Minimize2 } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const LearningResponseWindow = ({ windowId, content, isMinimized, onImageChange }) => {
  const { minimizeWindow } = useWindows();
  const { playingId, isPlaying, isLoading: ttsLoading, playAudio, stopAudio } = useTextToSpeech();
  const contentRef = useRef(null);

  const handleReadAloud = async () => {
    if (playingId === windowId && isPlaying) {
      stopAudio();
    } else {
      const textToRead = content?.response || 'No content available to read';
      await playAudio(windowId, textToRead, {
        onWordHighlight: (word, index) => {
          highlightWord(index);
          // Check if word should trigger image change
          if (content?.imageKeywords && content.imageKeywords[word.toLowerCase()]) {
            onImageChange?.(content.imageKeywords[word.toLowerCase()]);
          }
        }
      });
    }
  };

  const highlightWord = (index) => {
    if (contentRef.current) {
      const words = contentRef.current.querySelectorAll('.word');
      words.forEach((word, i) => {
        if (i === index) {
          word.classList.add('highlighted');
        } else {
          word.classList.remove('highlighted');
        }
      });
    }
  };

  const renderContentWithWords = (text) => {
    if (!text) return '';
    return text.split(' ').map((word, index) => (
      <span key={index} className="word transition-all duration-200">
        {word}{' '}
      </span>
    ));
  };

  if (isMinimized) {
    return null; // Hidden when minimized
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="fixed left-4 top-28 bottom-4 w-[48%] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-4">
          <h3 className="text-white font-semibold text-xl">Learning Content</h3>
          {!content?.isLoading && content?.response && (
            <button
              onClick={handleReadAloud}
              className={`p-3 rounded-full transition-all duration-200 ${
                playingId === windowId && isPlaying
                  ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/20 hover:bg-white/30 text-white/70 hover:text-white'
              } ${ttsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={playingId === windowId && isPlaying ? 'Stop reading' : 'Read aloud'}
              disabled={ttsLoading}
            >
              {playingId === windowId && isPlaying ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        <button
          onClick={() => minimizeWindow(windowId)}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Minimize2 className="w-5 h-5 text-white/70" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-8 h-full overflow-y-auto response-window-content">
        {content?.isLoading ? (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-4 w-1/2"></div>
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-white/15 rounded" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-4 w-1/3"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-white/15 rounded" style={{ width: `${Math.random() * 30 + 70}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`bg-white/10 rounded-lg p-6 relative ${
              playingId === windowId && isPlaying ? 'ring-2 ring-blue-400/50' : ''
            }`}>
              {/* Audio playing effect */}
              {playingId === windowId && isPlaying && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse pointer-events-none rounded-lg" />
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-bounce"
                        style={{
                          left: `${10 + i * 8}%`,
                          top: `${15 + (i % 5) * 15}%`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '1.8s'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <h4 className="text-white font-semibold mb-4 text-lg relative z-10">
                Learning: {content?.query}
              </h4>
              <div 
                ref={contentRef}
                className="text-white/90 leading-relaxed text-base whitespace-pre-wrap relative z-10"
              >
                {renderContentWithWords(content?.response)}
              </div>
            </div>
            
            {/* Additional learning sections */}
            {content?.sections && content.sections.map((section, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-6">
                <h5 className="text-white font-medium mb-3 text-lg">{section.title}</h5>
                <div className="text-white/80 leading-relaxed">
                  {renderContentWithWords(section.content)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .word.highlighted {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.4));
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </motion.div>
  );
};