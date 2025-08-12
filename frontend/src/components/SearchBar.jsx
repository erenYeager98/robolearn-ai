import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, Camera, Layers, BrainCircuit, X, Timer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useCamera } from '../hooks/useCamera';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { SearchModeModal } from './SearchModeModal';
import { searchScholar } from '../services/scholarApi';
import { searchGlobalLLM } from '../services/globalApi';
import { searchLocalLLM } from '../services/localApi';
import { OnScreenKeyboard } from "./OnScreenKeyboard";

// --- START: New Modal Components for Learning Session ---

const BreakModal = ({ isOpen, onClose, onSelect }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-xl flex items-center"><Timer className="w-6 h-6 mr-3 text-blue-300"/>Time for a breather?</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"><X className="w-5 h-5 text-white/70" /></button>
          </div>
          <p className="text-white/70 mb-8 text-center">A short break can boost your focus and learning.</p>
          <div className="flex justify-center space-x-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect(false)} className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all">No, I'm good</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect(true)} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25">Yes (3 mins)</motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const DeeperModal = ({ isOpen, onClose, onSelect }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-xl flex items-center"><Zap className="w-6 h-6 mr-3 text-yellow-300"/>Continue your journey?</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"><X className="w-5 h-5 text-white/70" /></button>
          </div>
          <p className="text-white/70 mb-8 text-center">Would you like to explore this topic at a more advanced level?</p>
          <div className="flex justify-center space-x-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect(false)} className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all">No, I'm done</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect(true)} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-bold transition-all shadow-lg hover:shadow-purple-500/25">Yes, go deeper!</motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- END: New Modal Components ---


export const SearchBar = ({ isMinimized, onSearch }) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');

  // --- START: State for Learning Level and Session ---
  const [learningLevel, setLearningLevel] = useState(1);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [session, setSession] = useState({ isActive: false, query: '', mode: '', level: 1 });
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showDeeperModal, setShowDeeperModal] = useState(false);
  const levelButtonRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const learningLevels = { 1: "Introductory", 2: "Intermediary", 3: "Deep Dive" };
  // --- END: State for Learning Level and Session ---

  const fileInputRef = useRef(null);

  const { createWindow, maximizeWindow, minimizeWindow, windows, findWindowByType, updateWindowContent } = useWindows();
  const { isRecording, startRecording, stopRecording } = useAudioRecording((newTranscript) => {
    setQuery(newTranscript);
    handleSearchClick(newTranscript);
  });
  const { openCamera } = useCamera();
  const { emotionData } = useEmotionDetection();

  const clearTimers = () => {
    clearTimeout(sessionTimerRef.current);
    clearTimeout(breakTimerRef.current);
  };
  
  // Effect to clean up timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Effect for the main 5-minute learning session timer
  useEffect(() => {
    clearTimeout(sessionTimerRef.current);
    if (session.isActive && session.level < 3) {
      sessionTimerRef.current = setTimeout(() => {
        setSession(prev => ({ ...prev, isActive: false })); // Pause session
        setShowBreakModal(true); // Ask for a break
      }, 5 * 60 * 1000); // 5 minutes
    }
  }, [session.isActive, session.level]);


  const executeSearch = async (searchQuery, searchMode, level) => {
    setIsSearching(true);
    const llmFunction = searchMode === 'local' ? searchLocalLLM : searchGlobalLLM;
    const windowId = searchMode === 'local' ? 'local-response' : 'text-response';

    const existingWindow = findWindowByType('response');
    if (existingWindow) {
      updateWindowContent(existingWindow.id, { query: searchQuery, response: '', type: searchMode, isLoading: true });
      maximizeWindow(existingWindow.id);
    } else {
      createWindow({ id: windowId, type: 'response', content: { query: searchQuery, response: '', type: searchMode, isLoading: true }});
    }

    try { 
      const llmData = await llmFunction(searchQuery, emotionData?.emotion, level);
      const imgRes = await fetch("https://api.erenyeager-dk.live/api/gen_keywords", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: searchQuery, emotion: emotionData?.emotion || "" })
      });
      const imgData = await imgRes.json();
      
      updateWindowContent(windowId, {
        query: searchQuery,
        response: llmData.answer || 'No response received',
        imageUrls: imgData.answer || ["https://uprodemy.com/wp-content/uploads/2023/04/rpa-concept-with-blurry-hand-touching-screen.jpg"],
        type: searchMode, isLoading: false, scholarLoading: true
      });
      
      searchScholar(searchQuery).then(scholarData => {
        updateWindowContent(windowId, {
          imageUrls: imgData.answer,
          response: llmData.answer,
           scholarData,
          scholarLoading: false });
      }).catch(() => {
        updateWindowContent(windowId, { scholarError: 'Failed to load academic results', scholarLoading: false });
      });

    } catch (error) {
      updateWindowContent(windowId, { query: searchQuery, response: `Error connecting to ${searchMode} model`, isLoading: false });
    }
    setIsSearching(false);
  };


  const handleSearchClick = (inputQuery) => {
    const q = inputQuery || query.trim();
    if (!q) return;
    setPendingQuery(q);
    const searchWindow = findWindowByType('search');
    if (searchWindow && !searchWindow.isMinimized) {
      minimizeWindow(searchWindow.id);
    }
    setShowModeModal(true);
  };

  const handleKeyPress = (char) => {
    if (char === "BACKSPACE") setQuery((prev) => prev.slice(0, -1));
    else setQuery((prev) => prev + char);
  };

  const handleModeSelect = async (mode) => {
    setShowModeModal(false);
    clearTimers(); // A new search always resets the session
    await executeSearch(pendingQuery, mode, learningLevel);
    // Start the session after the initial search
    if (learningLevel < 3) {
      setSession({ isActive: true, query: pendingQuery, mode: mode, level: learningLevel });
    }
  };

  // --- START: Handlers for Session Modals ---
  const handleBreakResponse = (doBreak) => {
    setShowBreakModal(false);
    if (doBreak) {
      breakTimerRef.current = setTimeout(() => {
        setShowBreakModal(true); // After 3 mins, ask again
      }, 3 * 60 * 1000); // 3 minutes
    } else {
      clearTimeout(breakTimerRef.current);
      setShowDeeperModal(true); // Ask to go deeper
    }
  };

  const handleDeeperResponse = async (goDeeper) => {
    setShowDeeperModal(false);
    if (goDeeper && session.level < 3) {
      const nextLevel = session.level + 1;
      await executeSearch(session.query, session.mode, nextLevel);
      // Continue session at the new level
      setSession(prev => ({ ...prev, level: nextLevel, isActive: true }));
    } else {
      // End session
      setSession({ isActive: false, query: '', mode: '', level: 1 });
      clearTimers();
    }
  };
  // --- END: Handlers for Session Modals ---


  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleCameraClick = () => {
    const existingCameraWindow = findWindowByType('camera');
    if (existingCameraWindow) maximizeWindow(existingCameraWindow.id);
    else createWindow({ id: 'camera-window', type: 'camera' });
    openCamera();
  };

  return (
    <>
      <motion.div
        layout
        className="relative flex-shrink-0"
        style={{ width: isMinimized ? '570px' : '100%', maxWidth: isMinimized ? '570px' : '64rem' }}
        animate={{ scale: isMinimized ? 0.9 : 1, width: isMinimized ? 570 : '100%' }}
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
              
              {/* --- START: Learning Level Selector --- */}
              <div className="relative mr-4">
                <button
                  ref={levelButtonRef}
                  onClick={() => setShowLevelSelector(prev => !prev)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center"
                  title={`Learning Level: ${learningLevels[learningLevel]}`}
                >
                  <Layers className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 font-semibold text-sm ml-2">{learningLevel}</span>
                </button>
                <AnimatePresence>
                  {showLevelSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 w-48 bg-gray-900/50 backdrop-blur-lg border border-white/20 rounded-lg p-2 z-10"
                    >
                      {[1, 2, 3].map(level => (
                        <button
                          key={level}
                          onClick={() => { setLearningLevel(level); setShowLevelSelector(false); }}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${learningLevel === level ? 'bg-purple-500/50 text-white' : 'text-white/80 hover:bg-white/10'}`}
                        >
                          Level {level}: {learningLevels[level]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* --- END: Learning Level Selector --- */}

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you wanna know?..."
                onFocus={() => setShowKeyboard(true)}
                className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none ${isMinimized ? 'text-base' : 'text-xl'} min-w-0`}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
              />

              <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                 {query.trim().length > 0 && (
                  <motion.button
                    onClick={() => handleSearchClick()}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-purple-500/25"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <Search className="w-5 h-5 text-white" />
                  </motion.button>
                )}
                <button
                  onClick={handleMicClick}
                  className={`p-3 rounded-full transition-all flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white/70'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCameraClick}
                  className="rounded-full bg-white/20 hover:bg-white/30 text-white/70 transition-all flex-shrink-0 p-3"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      <style jsx>{`
        .recording-glow { animation: recordingGlow 2s ease-in-out infinite; }
        @keyframes recordingGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)); }
        }
      `}</style>

      <AnimatePresence>
        {showKeyboard && (<OnScreenKeyboard onKeyPress={handleKeyPress} onClose={() => setShowKeyboard(false)} />)}
      </AnimatePresence>
      
      <SearchModeModal isOpen={showModeModal} onClose={() => setShowModeModal(false)} onSelectMode={handleModeSelect} query={pendingQuery} />
      
      {/* --- Render Session Modals --- */}
      <BreakModal isOpen={showBreakModal} onSelect={handleBreakResponse} onClose={() => setShowBreakModal(false)}/>
      <DeeperModal isOpen={showDeeperModal} onSelect={handleDeeperResponse} onClose={() => setShowDeeperModal(false)}/>
    </>
  );
};