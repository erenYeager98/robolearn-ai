import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, FileText } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';

export const ScholarViewWindow = ({ windowId, content, isMinimized }) => {
  const { minimizeWindow, maximizeWindow, closeWindow } = useWindows();


  const getWindowIcon = () => {
    return content?.type === 'pdf' ? 
      <FileText className="w-4 h-4 text-white/60" /> : 
      <ExternalLink className="w-4 h-4 text-white/60" />;
  };

  const getWindowTitle = (
  ) => {
    return content?.type === 'pdf' ? 'PDF Viewer' : 'Web Viewer';
  };

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
      className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          {getWindowIcon()}
          <div>
            <h3 className="text-white font-medium text-lg">{getWindowTitle()}</h3>
            <p className="text-white/60 text-sm truncate max-w-md">{content?.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={content?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5 text-white/70" />
          </a>
          <button
            onClick={() => closeWindow(windowId)}
            className="p-3 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>
      
      <div className="h-[40rem] bg-white/5">
        {content?.url ? (
          <img
            src={`https://api.erenyeager-dk.live/screenshot?url=${content.url}`}
            alt="Website preview"
            className="w-full h-full object-cover"
          />

        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No URL available</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};