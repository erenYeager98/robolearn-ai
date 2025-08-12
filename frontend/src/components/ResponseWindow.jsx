import React from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Maximize2, X, FileText, Image, Upload, Volume2, VolumeX } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { ScholarTiles } from './ScholarTiles';
import { ImageSearchTiles } from './ImageSearchTiles';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';




export const ResponseWindow = ({ windowId, content, isMinimized }) => {

  const { minimizeWindow, maximizeWindow, closeWindow } = useWindows();
  const { playingId, isPlaying, isLoading: ttsLoading, playAudio, stopAudio, currentWordIndex } = useTextToSpeech();

  const getWindowIcon = () => {
    switch (content?.type) {
      case 'image':
        return <Image className="w-4 h-4 text-white/60" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-white/60" />;
      default:
        return <FileText className="w-4 h-4 text-white/60" />;
    }
  };

  const getWindowTitle = () => {
    switch (content?.type) {
      case 'image':
        return 'Image Results';
      case 'upload':
        return 'File Upload';
      default:
        return 'Search Results';
    }
  };


  const handleReadAloud = async () => {
    if (playingId === windowId && isPlaying) {
      stopAudio();
    } else {
      // Use the main response content for read aloud
      const textToRead = content?.response || 'No content available to read';
      await playAudio(windowId, textToRead);
    }
  };
    useEffect(() => {
  if (!isMinimized && content?.response) {
    handleReadAloud();
  }
  }, [content?.response]);

  if (isMinimized) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/20 backdrop-blur-xl rounded-lg border border-white/30 p-3 cursor-pointer hover:bg-white/30 transition-all"
        onClick={() => maximizeWindow(windowId)}
      >
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm truncate">{getWindowTitle()}</span>
          {getWindowIcon()}
        </div>
      </motion.div>
    );
  }
  

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-4">
          <h3 className="text-white font-medium text-lg">{getWindowTitle()}</h3>
          {!content?.isLoading && content?.response && (
            <button
              onClick={handleReadAloud}
              className={`p-2 rounded-full transition-all duration-200 ${
                playingId === windowId && isPlaying
                  ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/20 hover:bg-white/30 text-white/70 hover:text-white'
              } ${ttsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={playingId === windowId && isPlaying ? 'Stop reading' : 'Read aloud'}
              disabled={ttsLoading}
            >
              {playingId === windowId && isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => minimizeWindow(windowId)}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-white/70" />
          </button>
          <button
            onClick={() => closeWindow(windowId)}
            className="p-3 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div className="p-8 min-h-[32rem] max-h-[40rem] overflow-y-auto response-window-content">
        {content.isLoading ? (
          <div className="space-y-4">
            {/* Main response skeleton */}
            <div className="bg-white/10 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-3 w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-white/15 rounded w-full"></div>
                <div className="h-4 bg-white/15 rounded w-5/6"></div>
                <div className="h-4 bg-white/15 rounded w-4/5"></div>
                <div className="h-4 bg-white/15 rounded w-3/4"></div>
                <div className="h-4 bg-white/15 rounded w-5/6"></div>
                <div className="h-4 bg-white/15 rounded w-2/3"></div>
              </div>
            </div>

            {/* Scholar results skeleton */}
            <ScholarTiles 
              scholarData={null} 
              isLoading={true}
            />

            {/* Image search skeleton if it's an image search */}
            {content?.type === 'image' && (
              <ImageSearchTiles 
                imageSearchData={null} 
                isLoading={true}
              />
            )}

            {/* Additional info skeleton */}
            <div className="bg-white/10 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-3 w-1/2"></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-white/15 rounded w-1/3"></div>
                  <div className="h-4 bg-white/15 rounded w-1/4"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-white/15 rounded w-1/4"></div>
                  <div className="h-4 bg-white/15 rounded w-1/5"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-white/15 rounded w-1/6"></div>
                  <div className="h-4 bg-white/15 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`bg-white/10 rounded-lg p-6 relative ${
              playingId === windowId && isPlaying ? 'ring-2 ring-blue-400/50' : ''
            }`}>
              {/* Audio playing effect */}
              {playingId === windowId && isPlaying && (
                <>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse pointer-events-none rounded-lg" />

                  {/* Floating particles effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-bounce"
                        style={{
                          left: `${15 + i * 10}%`,
                          top: `${20 + (i % 4) * 20}%`,
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: '2s'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="text-white/80 leading-relaxed text-base whitespace-pre-wrap relative z-10">
                
                <div>
    {content.response.split(" ").map((word, i) => {
  const isSpoken = i <= currentWordIndex;
  const isCurrent = i === currentWordIndex;

return (
    <span
      key={i}
      className={`
        relative /* Ensures proper stacking */
        transition-all duration-300 ease-in-out /* Smooths all transitions */
        ${isCurrent
          // ✨ The currently spoken word: an animated, shining gradient text
          ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-500 text-shadow-glow animate-text-shine scale-105'
          // A word that has already been spoken: a bright, but non-animated color
          : isSpoken
            ? 'text-purple-300/90'
            // A word that has not been spoken yet: dimmed to recede into the background
            : 'text-white/50'
        }
      `}
    >
      {word}{" "}
    </span>
  );
})}

  </div>

              </div>
            </div>

            {/* Scholar Research Results */}
            {(content.scholarData || content.scholarLoading) && (
              <ScholarTiles 
                scholarData={content.scholarData} 
                isLoading={content.scholarLoading || false}
              />
            )}

            {/* Show scholar error if it failed */}
            {content.scholarError && !content.scholarLoading && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-300 font-medium mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Academic Research Error
                </h4>
                <p className="text-red-200/80">{content.scholarError}</p>
              </div>
            )}

            {/* Image Search Results */}
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
              {/* Or display multiple fields if your API returns more */}
            </div>
          )}


            {/* Show captured image if it exists */}
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

            {/* Show file info if it's an upload */}
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

            <div className="bg-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-3 text-lg">Additional Information</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-base">
                  <span className="text-white/60">Response Time</span>
                  <span className="text-white/80">0.34s</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-white/60">Sources</span>
                  <span className="text-white/80">3 found</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-white/60">Type</span>
                  <span className="text-white/80 capitalize">{content?.type || 'text'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};