import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useCamera } from '../hooks/useCamera';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { SearchModeModal } from './SearchModeModal';
import { searchScholar } from '../services/scholarApi';
import { searchGlobalLLM } from '../services/globalApi';
import { searchLocalLLM } from '../services/localApi';
import { OnScreenKeyboard } from "./OnScreenKeyboard"; // import the component


export const SearchBar = ({ isMinimized, onSearch }) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  const fileInputRef = useRef(null);

  const { createWindow, maximizeWindow, minimizeWindow, windows, findWindowByType, updateWindowContent } = useWindows();
  const { isRecording, startRecording, stopRecording } = useAudioRecording((newTranscript) => {
    setQuery(newTranscript);
    handleSearchClick(newTranscript);
  });
  const { openCamera } = useCamera();
  const { emotionData } = useEmotionDetection();

  // When pressing search button
  const handleSearchClick = (inputQuery) => {
    const q = inputQuery || query.trim();
    if (!q) return;
    setPendingQuery(q);

    // ✅ minimize the search bar before showing modal
    const searchWindow = findWindowByType('search');
    if (searchWindow && !searchWindow.isMinimized) {
      minimizeWindow(searchWindow.id);
    }

    setShowModeModal(true);
  };

  const handleKeyPress = (char) => {
    if (char === "BACKSPACE") {
      setQuery((prev) => prev.slice(0, -1));
    } else {
      setQuery((prev) => prev + char);
    }
  };
  
  // When user chooses Local or Global in modal
  const handleModeSelect = async (mode) => {
    setIsSearching(true);
    const llmFunction = mode === 'local' ? searchLocalLLM : searchGlobalLLM;
    const windowId = mode === 'local' ? 'local-response' : 'text-response';

    const existingWindow = findWindowByType(windowId);

    if (existingWindow) {
      updateWindowContent(windowId, {
        query: pendingQuery,
        response: '',
        type: mode,
        isLoading: true
      });
      maximizeWindow(existingWindow.id);
    } else {
      createWindow({
        id: windowId,
        type: 'response',
        content: {
          query: pendingQuery,
          response: '',
          type: mode,
          isLoading: true
        }
      });
    }

    try {
      const llmData = await llmFunction(pendingQuery, emotionData?.emotion);

      updateWindowContent(windowId, {
        query: pendingQuery,
        response: llmData.answer || 'No response received',
        image: llmData.imageUrl || null,
        type: mode,
        isLoading: false,
        scholarLoading: true
      });

      // Fetch scholar data in background
      searchScholar(pendingQuery)
        .then(scholarData => {
          updateWindowContent(windowId, {
            response: llmData.answer || 'No response received',
            scholarData,
            scholarLoading: false
          });
        })
        .catch(() => {
          updateWindowContent(windowId, {
            scholarError: 'Failed to load academic results',
            scholarLoading: false
          });
        });

    } catch (error) {
      updateWindowContent(windowId, {
        query: pendingQuery,
        response: `Error connecting to ${mode} model`,
        isLoading: false
      });
    }

    setIsSearching(false);
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleCameraClick = () => {
    const existingCameraWindow = findWindowByType('camera');
    if (existingCameraWindow) {
      maximizeWindow(existingCameraWindow.id);
    } else {
      createWindow({ id: 'camera-window', type: 'camera' });
    }
    openCamera();
  };

  return (
    <>
      <motion.div
        layout
        className="relative flex-shrink-0"
        style={{
          width: isMinimized ? '570px' : '100%',
          maxWidth: isMinimized ? '570px' : '64rem'
        }}
        animate={{
          scale: isMinimized ? 0.9 : 1,
          width: isMinimized ? 570 : '100%'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className={`relative ${isRecording ? 'recording-glow' : ''}`}>
          <motion.div
            className="relative backdrop-blur-xl bg-white/20 rounded-full border border-white/30 shadow-2xl"
            layout
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="flex items-center px-6 py-4">
              <Search className="w-6 h-6 text-white/70 mr-4 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you wanna know ? . . ."
                onFocus={() => setShowKeyboard(true)} // show on click

                className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none ${
                  isMinimized ? 'text-base' : 'text-xl'
                } min-w-0`}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
              />

              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                {query.trim().length > 0 && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchClick();
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-purple-500/25"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <Search className="w-5 h-5 text-white" />
                  </motion.button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMicClick();
                  }}
                  className={`p-3 rounded-full transition-all flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white/70'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraClick();
                  }}
                  className="rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0 p-3"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showKeyboard && (
          <OnScreenKeyboard
            onKeyPress={handleKeyPress}
            onClose={() => setShowKeyboard(false)}
          />
        )}
      </AnimatePresence>
      {/* Modal */}
      <SearchModeModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleModeSelect}
        query={pendingQuery}
      />
    </>
  );
};
