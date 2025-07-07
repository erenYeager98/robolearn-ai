import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { SearchBar } from './SearchBar';
import { ResponseWindow } from './ResponseWindow';
import { CameraWindow } from './CameraWindow';

export const WindowManager = () => {
  const { windows, activeWindow } = useWindows();

  const searchWindow = windows.find(w => w.type === 'search');
  const otherWindows = windows.filter(w => w.type !== 'search');
  const maximizedWindow = windows.find(w => w.isMaximized && w.type !== 'search');
  const minimizedWindows = otherWindows.filter(w => w.isMinimized);

  // Search bar should be in center when no other window is maximized
  const isSearchCentered = !maximizedWindow;

  return (
    <div className="min-h-screen relative">
      {/* Top bar - always visible */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4 max-w-full overflow-x-auto">
            {/* Search bar at top when not centered */}
            <AnimatePresence>
              {!isSearchCentered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0"
                >
                  <SearchBar 
                    isMinimized={true}
                    onSearch={(query) => console.log('Search:', query)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Minimized windows - always visible when they exist */}
            <AnimatePresence>
              {minimizedWindows.map(window => (
                <motion.div
                  key={window.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0"
                >
                  {(window.type === 'response' || window.type === 'image-response' || window.type === 'upload') && (
                    <ResponseWindow 
                      windowId={window.id}
                      content={window.content}
                      isMinimized={true}
                    />
                  )}
                  {window.type === 'camera' && (
                    <CameraWindow 
                      windowId={window.id}
                      isMinimized={true}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="pt-24 px-4 pb-8">
        <div className="flex items-center justify-center min-h-screen">
          <AnimatePresence mode="wait">
            {isSearchCentered ? (
              <motion.div
                key="search-centered"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl"
              >
                <SearchBar 
                  isMinimized={false}
                  onSearch={(query) => console.log('Search:', query)} 
                />
              </motion.div>
            ) : maximizedWindow ? (
              <motion.div
                key={maximizedWindow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                {(maximizedWindow.type === 'response' || maximizedWindow.type === 'image-response' || maximizedWindow.type === 'upload') && (
                  <ResponseWindow 
                    windowId={maximizedWindow.id}
                    content={maximizedWindow.content}
                  />
                )}
                {maximizedWindow.type === 'camera' && (
                  <CameraWindow 
                    windowId={maximizedWindow.id}
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll content for demonstration */}
      <div className="h-screen bg-transparent" />
    </div>
  );
};