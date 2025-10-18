import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../contexts/WindowContext';
import { SearchBar } from './SearchBar';
import { ResponseWindow } from './ResponseWindow';
import { CameraWindow } from './CameraWindow';
import { ScholarViewWindow } from './ScholarViewWindow';
import { ImageDisplayWindow } from './ImageDisplayWindow';
import { TopicBrowserWindow } from './TopicBrowserWindow';
import { PresentationWindow } from './PresentationWindow';
import { RotateCcw , Power } from "lucide-react";

export const WindowManager = () => {
  const { windows } = useWindows();

  const otherWindows = windows.filter(w => w.type !== 'search');
  const maximizedWindow = windows.find(w => w.isMaximized && w.type !== 'search');
  const minimizedWindows = otherWindows.filter(w => w.isMinimized);

  // Search bar is centered only when no other window is maximized
  const isSearchCentered = !maximizedWindow;

  return (
    <div className="min-h-screen relative">
      {/* Top bar - always visible */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 ">
        <div className="flex items-center justify-center w-full gap-x-4">

          {/* Left: Reload Button */}
          <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
            title="Reload App"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>

          {/* Center: Power Button */}
          <button
            onClick={() => console.log('Power button clicked')}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
            title="Power"
          >
            <Power className="w-5 h-5 text-white" />
          </button>

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
                  {(window.type === 'scholar-web' || window.type === 'scholar-pdf') && (
                    <ScholarViewWindow 
                      windowId={window.id}
                      content={window.content}
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
      <div className="pt-28 px-6 pb-12">
        <div className="flex items-center justify-center min-h-screen">
          <AnimatePresence mode="wait">
            {isSearchCentered ? (
              <motion.div
                key="search-centered"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
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
                {/* Response Window with Image Display (2-column layout) */}
                {(maximizedWindow.type === 'response' || maximizedWindow.type === 'image-response' || maximizedWindow.type === 'upload') && (
                  <div className="grid grid-cols-2 gap-6">
                    <ResponseWindow 
                      windowId={maximizedWindow.id}
                      content={maximizedWindow.content}
                    />
                    <div className="flex items-center justify-center">
                      <ImageDisplayWindow imageUrls={maximizedWindow.content?.imageUrls || []} />
                    </div>
                  </div>
                )}

                {/* Camera Window (full-width layout) */}
                {maximizedWindow.type === 'camera' && (
                  <CameraWindow 
                    windowId={maximizedWindow.id}
                  />
                )}
                
                {/* Scholar Window (full-width layout) */}
                {(maximizedWindow.type === 'scholar-web' || maximizedWindow.type === 'scholar-pdf') && (
                  <ScholarViewWindow 
                    windowId={maximizedWindow.id}
                    content={maximizedWindow.content}
                  />
                )}

                {/* NEW: Topic Browser Window (full-width layout) */}
                {maximizedWindow.type === 'topic-browser' && (
                  <TopicBrowserWindow 
                    windowId={maximizedWindow.id}
                  />
                )}

                {/* NEW: Presentation Viewer Window (full-width layout) */}
                {maximizedWindow.type === 'presentation-viewer' && (
                  <PresentationWindow 
                    windowId={maximizedWindow.id}
                    content={maximizedWindow.content}
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