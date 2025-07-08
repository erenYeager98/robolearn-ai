import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useCamera } from '../hooks/useCamera';
import { searchScholar } from '../services/scholarApi';

export const SearchBar = ({ isMinimized, onSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef(null);
  const { createWindow, maximizeWindow, minimizeWindow, windows, findWindowByType } = useWindows();
  const { isRecording, startRecording, stopRecording, transcript } = useAudioRecording();
  const { openCamera } = useCamera();

  const handleSearch = async () => {
    if (query.trim()) {
      setIsSearching(true);
      onSearch?.(query);
      
      // Fetch scholar data
      const scholarData = await searchScholar(query.trim());
      
      // Check if text response window already exists
      const existingResponseWindow = findWindowByType('response');
      
      if (existingResponseWindow) {
        // Update existing window content and maximize it
        existingResponseWindow.content = { 
          query, 
          response: 'This is a sample response...',
          type: 'text',
          scholarData: scholarData
        };
        maximizeWindow(existingResponseWindow.id);
      } else {
        // Create new response window
        createWindow({
          id: 'text-response',
          type: 'response',
          content: { 
            query, 
            response: 'This is a sample response...',
            type: 'text',
            scholarData: scholarData
          }
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
        existingUploadWindow.content = { 
          query: `File upload: ${file.name}`, 
          response: `Processing uploaded file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          type: 'upload',
          file: file
        };
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
    if (isMinimized) {
      // Close all maximized windows to center the search bar
      const maximizedWindows = windows.filter(w => w.isMaximized && w.type !== 'search');
      maximizedWindows.forEach(w => minimizeWindow(w.id));
    }
  };

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  // Calculate dynamic width based on content
  const hasSearchButton = query.trim().length > 0;
  const baseWidth = isMinimized ? 320 : 640;
  const expandedWidth = hasSearchButton ? (isMinimized ? 420 : 740) : baseWidth;

  return (
    <motion.div
      layout
      className="relative flex-shrink-0"
      style={{ 
        width: isMinimized ? `${expandedWidth}px` : '100%',
        maxWidth: isMinimized ? `${expandedWidth}px` : '48rem'
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
          <div className="flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-white/70 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything..."
              className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none ${
                isMinimized ? 'text-sm' : 'text-lg'
              } min-w-0`}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
              <AnimatePresence>
                {hasSearchButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearch();
                    }}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Search className="w-4 h-4 text-white" />
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
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCameraClick();
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick();
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0"
              >
                <Upload className="w-4 h-4" />
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