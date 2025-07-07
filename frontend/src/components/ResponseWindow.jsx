import React from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Maximize2, X, FileText, Image, Upload } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';

export const ResponseWindow = ({ windowId, content, isMinimized }) => {
  const { minimizeWindow, maximizeWindow, closeWindow } = useWindows();

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
      className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h3 className="text-white font-medium">{getWindowTitle()}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => minimizeWindow(windowId)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => closeWindow(windowId)}
            className="p-2 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>
      
      <div className="p-6 min-h-96 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Query: {content.query}</h4>
            <p className="text-white/80 leading-relaxed">
              {content.response}
            </p>
          </div>

          {/* Show captured image if it exists */}
          {content.image && (
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Captured Image</h4>
              <img 
                src={content.image} 
                alt="Captured" 
                className="w-full max-w-md rounded-lg"
              />
            </div>
          )}

          {/* Show file info if it's an upload */}
          {content.file && (
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">File Information</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">File Name</span>
                  <span className="text-white/80">{content.file.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">File Size</span>
                  <span className="text-white/80">{(content.file.size / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">File Type</span>
                  <span className="text-white/80">{content.file.type || 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Additional Information</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Response Time</span>
                <span className="text-white/80">0.34s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Sources</span>
                <span className="text-white/80">3 found</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Type</span>
                <span className="text-white/80 capitalize">{content?.type || 'text'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};