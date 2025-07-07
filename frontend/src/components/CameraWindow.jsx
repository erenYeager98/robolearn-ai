import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, X, Camera, ArrowRight } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';
import { useCamera } from '../hooks/useCamera';

export const CameraWindow = ({ windowId, isMinimized }) => {
  const { minimizeWindow, maximizeWindow, closeWindow, createWindow, findWindowByType } = useWindows();
  const { 
    isOpen, 
    capturedImage, 
    videoRef, 
    canvasRef, 
    openCamera, 
    closeCamera, 
    captureImage 
  } = useCamera();

  useEffect(() => {
    if (!isMinimized) {
      openCamera();
    }
    
    return () => {
      closeCamera();
    };
  }, [isMinimized, openCamera, closeCamera]);

  const handleSearchImage = () => {
    if (capturedImage) {
      // Check if image response window already exists
      const existingImageWindow = findWindowByType('image-response');
      
      if (existingImageWindow) {
        // Update existing window content and maximize it
        existingImageWindow.content = { 
          query: 'Image search', 
          response: 'This is a sample response for image search...',
          image: capturedImage,
          type: 'image'
        };
        maximizeWindow(existingImageWindow.id);
      } else {
        // Create new image response window
        createWindow({
          id: 'image-response',
          type: 'image-response',
          content: { 
            query: 'Image search', 
            response: 'This is a sample response for image search...',
            image: capturedImage,
            type: 'image'
          }
        });
      }
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
          <span className="text-white/80 text-sm truncate">Camera</span>
          <Camera className="w-4 h-4 text-white/60" />
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
        <h3 className="text-white font-medium">Camera</h3>
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
      
      <div className="p-6 min-h-96">
        <div className="relative bg-black/20 rounded-lg overflow-hidden">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-80 object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-80 object-cover"
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {!capturedImage ? (
              <button
                onClick={captureImage}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-lg transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={captureImage}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-lg transition-colors"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={handleSearchImage}
                  className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full backdrop-blur-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};