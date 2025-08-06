import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useCamera } from '../hooks/useCamera';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { searchScholar } from '../services/scholarApi';
import { searchResearch } from '../services/researchApi';
import { input } from 'framer-motion/client';

export const SearchBar = ({ isMinimized, onSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef(null);
  
  // Existing hooks
  const { createWindow, maximizeWindow, minimizeWindow, windows, findWindowByType, updateWindowContent } = useWindows();
const { isRecording, startRecording, stopRecording } = useAudioRecording((newTranscript) => {
  setQuery(newTranscript);
  handleSearch(newTranscript)
});  const { openCamera } = useCamera();
  
  // New emotion detection hook
  const { emotionData, isEmotionActive, startEmotionDetection, stopEmotionDetection } = useEmotionDetection();

  // Emotion helper functions
  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fearful: '😨',
      disgusted: '🤢',
      d: '🤗',
      calm: '😌'
    };
    return emojiMap[emotion?.toLowerCase()] || '😐';
  };

  const getEmotionColor = (emotion, score) => {
    const baseColors = {
      happy: '#10B981',    // Green
      excited: '#F59E0B',  // Yellow
      surprised: '#8B5CF6', // Purple
      calm: '#06B6D4',     // Cyan
      neutral: '#6B7280',  // Gray
      sad: '#3B82F6',      // Blue
      angry: '#EF4444',    // Red
      fearful: '#F97316',  // Orange
      disgusted: '#84CC16' // Lime
    };
    
    const color = baseColors[emotion?.toLowerCase()] || '#6B7280';
    const opacity = Math.max(0.3, (score || 0.5));
    return { color, opacity };
  };

  // Start emotion detection when camera is opened
  useEffect(() => {
    const existingCameraWindow = findWindowByType('camera');
    if (existingCameraWindow && existingCameraWindow.isMaximized) {
      stopEmotionDetection();
    } else {
      startEmotionDetection();
    }
  }, [windows, startEmotionDetection, stopEmotionDetection]);

  
  const handleSearch = async (inputQuery) => {
    if (inputQuery== ''){
    const query = inputQuery ; 
    }
    if (query.trim()) {
      setIsSearching(true);
      onSearch?.(query);
      
      // Check if text response window already exists
      const existingResponseWindow = findWindowByType('response');
      
      if (existingResponseWindow) {
        // Update existing window content and maximize it
        existingResponseWindow.content = {
          query, 
          response: '',
          type: 'text',
          isLoading: true
        };
        maximizeWindow(existingResponseWindow.id);
      } else {
        // Create new response window
        createWindow({
          id: 'text-response',
          type: 'response',
          content: {
            query, 
            response: '',
            type: 'text',
            isLoading: true
          }
        });
      }

      try {
        // Fetch research data from your model (main content)
        const researchData = await searchResearch(query.trim(),emotionData?.emotion);
        
        // Update with main research data immediately
        updateWindowContent('text-response', {
          query,
          response: researchData.response || researchData.answer || 'No response received from model',
          type: 'text',
          researchData: researchData,
          isLoading: false,
          scholarLoading: true // Keep scholar section loading
        });

        // Fetch scholar data in background (non-blocking)
        searchScholar(query.trim()).then(scholarData => {
          // Update with scholar data when it arrives
          updateWindowContent('text-response', {
            query,
            response: researchData.response || researchData.answer || 'No response received from model',
            type: 'text',
            researchData: researchData,
            scholarData: scholarData,
            isLoading: false,
            scholarLoading: false
          });
        }).catch(scholarError => {
          console.error('Error fetching scholar data:', scholarError);
          // Update to show that scholar data failed but keep main content
          updateWindowContent('text-response', {
            query,
            response: researchData.response || researchData.answer || 'No response received from model',
            type: 'text',
            researchData: researchData,
            isLoading: false,
            scholarLoading: false,
            scholarError: 'Failed to load academic results'
          });
        });

      } catch (error) {
        console.error('Error during search:', error);
        
        // Fallback to scholar data only if research API fails
        updateWindowContent('text-response', {
          query, 
          response: 'Error connecting to research model. Showing academic results only.',
          type: 'text',
          isLoading: false,
          scholarLoading: true
        });

        // Still try to fetch scholar data in background
        searchScholar(query.trim()).then(scholarData => {
          updateWindowContent('text-response', {
            query, 
            response: 'Error connecting to research model. Showing academic results only.',
            type: 'text',
            scholarData: scholarData,
            isLoading: false,
            scholarLoading: false
          });
        }).catch(() => {
          updateWindowContent('text-response', {
            query, 
            response: 'Error connecting to research model and academic sources.',
            type: 'text',
            isLoading: false,
            scholarLoading: false,
            scholarError: 'Failed to load academic results'
          });
        });
      }
      
      setIsSearching(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleCameraClick = () => {
    // Check if camera window already exists
    const existingCameraWindow = findWindowByType('camera');
    
    if (existingCameraWindow) {
      // Just maximize the existing camera window
      maximizeWindow(existingCameraWindow.id);
    } else {
      // Create new camera window
      createWindow({
        id: 'camera-window',
        type: 'camera'
      });
    }
    openCamera();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if upload response window already exists
      const existingUploadWindow = findWindowByType('upload');
      
      if (existingUploadWindow) {
        // Update existing window content and maximize it
        updateWindowContent(existingUploadWindow.id, { 
          query: `File upload: ${file.name}`, 
          response: `Processing uploaded file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          type: 'upload',
          file: file
        });
        maximizeWindow(existingUploadWindow.id);
      } else {
        // Create new upload response window
        createWindow({
          id: 'upload-response',
          type: 'upload',
          content: { 
            query: `File upload: ${file.name}`, 
            response: `Processing uploaded file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
            type: 'upload',
            file: file
          }
        });
      }
    }
    // Reset file input
    event.target.value = '';
  };

  const handleSearchBarClick = () => {
  window.electron.ipcRenderer.send('launch-onboard');

    if (isMinimized) {
      // Close all maximized windows to center the search bar
      const maximizedWindows = windows.filter(w => w.isMaximized && w.type !== 'search');
      maximizedWindows.forEach(w => minimizeWindow(w.id));
    }
  };


  // Calculate dynamic width based on content (increased to accommodate emotion circle)
  const hasSearchButton = query.trim().length > 0;
  const baseWidth = isMinimized ? 450 : 850;
  const expandedWidth = hasSearchButton ? (isMinimized ? 570 : 970) : baseWidth;

  return (
    <motion.div
      layout
      className="relative flex-shrink-0"
      style={{ 
        width: isMinimized ? `${expandedWidth}px` : '100%',
        maxWidth: isMinimized ? `${expandedWidth}px` : '64rem'
      }}
      animate={{
        scale: isMinimized ? 0.9 : 1,
        width: isMinimized ? expandedWidth : '100%'
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut",
        layout: { duration: 0.3 }
      }}
      onClick={handleSearchBarClick}
    >
      <div className={`relative ${isRecording ? 'recording-glow' : ''}`}>
        <motion.div 
          className="relative backdrop-blur-xl bg-white/20 rounded-full border border-white/30 shadow-2xl"
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center px-6 py-4">
            {/* Emotion Indicator Circle */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isEmotionActive ? 1 : 0.3, 
                  scale: isEmotionActive ? 1 : 0.8 
                }}
                className="flex-shrink-0 mr-3"
              >
                <div 
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                    isMinimized ? 'w-8 h-8 text-base' : 'w-10 h-10 text-lg'
                  }`}
                  style={{
                    backgroundColor: isEmotionActive 
                      ? `${getEmotionColor(emotionData?.emotion, emotionData?.score).color}${Math.round(getEmotionColor(emotionData?.emotion, emotionData?.score).opacity * 255).toString(16).padStart(2, '0')}`
                      : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isEmotionActive 
                      ? `0 0 20px ${getEmotionColor(emotionData?.emotion, emotionData?.score).color}40`
                      : 'none',
                    border: `2px solid ${isEmotionActive ? getEmotionColor(emotionData?.emotion, emotionData?.score).color : 'rgba(255, 255, 255, 0.3)'}`
                  }}
                >
                  <motion.span
                    key={emotionData?.emotion} // This will trigger re-animation when emotion changes
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "backOut" }}
                  >
                    {getEmotionEmoji(emotionData?.emotion)}
                  </motion.span>
                </div>
              </motion.div>
            </AnimatePresence>

            <Search className="w-6 h-6 text-white/70 mr-4 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
              if (window?.electronAPI?.launchOnboard) {
                window.electronAPI.launchOnboard();
              }
              }}
              placeholder="What do you wanna know ? . . ."
              className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none ${
                isMinimized ? 'text-base' : 'text-xl'
              } min-w-0`}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
              <AnimatePresence>
                {hasSearchButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      width: isMinimized ? '36px' : '44px',
                      height: isMinimized ? '36px' : '44px'
                    }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearch();
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-purple-500/25"
                    style={{
                      minWidth: isMinimized ? '36px' : '44px',
                      minHeight: isMinimized ? '36px' : '44px',
                      maxWidth: isMinimized ? '36px' : '44px',
                      maxHeight: isMinimized ? '36px' : '44px'
                    }}
                  >
                    <Search className={`${isMinimized ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                  </motion.button>
                )}
              </AnimatePresence>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMicClick();
                }}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/20 hover:bg-white/30 text-white/70'
                } ${isMinimized ? 'p-2' : 'p-3'}`}
              >
                <Mic className={isMinimized ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCameraClick();
                }}
                className={`rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0 ${isMinimized ? 'p-2' : 'p-3'}`}
              >
                <Camera className={isMinimized ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick();
                }}
                className={`rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0 ${isMinimized ? 'p-2' : 'p-3'}`}
              >
                <Upload className={isMinimized ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />
        
        {isRecording && (
          <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400/20 blur-xl -z-10" />
        )}
      </div>
      
      <style jsx>{`
        .recording-glow {
          animation: recordingGlow 2s ease-in-out infinite;
        }
        
        @keyframes recordingGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)); }
        }
      `}</style>
    </motion.div>
  );
};
