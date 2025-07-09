import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, X, Camera, ArrowRight, RotateCcw } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';
import { useCamera } from '../hooks/useCamera';
import { uploadImage } from '../services/imageUploadApi';
import { searchByImage } from '../services/imageSearchApi';

export const CameraWindow = ({ windowId, isMinimized }) => {
  const { minimizeWindow, maximizeWindow, closeWindow, createWindow, findWindowByType } = useWindows();
  const { 
    isOpen, 
    capturedImage, 
    videoRef, 
    canvasRef, 
    openCamera, 
    closeCamera, 
    captureImage,
    resetCamera
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
      handleImageSearch();
    }
  };

  const handleRetake = () => {
    resetCamera();
  };
  const handleImageSearch = async () => {
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Upload image to get public URL
      const imageUrl = await uploadImage(blob);
      
      // Search for similar images
      const imageSearchData = await searchByImage(imageUrl);
      
      // Check if image response window already exists
      const existingImageWindow = findWindowByType('image-response');
      
      if (existingImageWindow) {
        // Update existing window content and maximize it
        existingImageWindow.content = { 
          query: 'Image search', 
          response: 'Visual search results for your captured image',
          image: capturedImage,
          imageUrl: imageUrl,
          imageSearchData: imageSearchData,
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
            response: 'Visual search results for your captured image',
            image: capturedImage,
            imageUrl: imageUrl,
            imageSearchData: imageSearchData,
            type: 'image'
          }
        });
      }
    } catch (error) {
      console.error('Error processing image search:', error);
      // Fallback to basic image display
      const existingImageWindow = findWindowByType('image-response');
      
      if (existingImageWindow) {
        existingImageWindow.content = { 
          query: 'Image search', 
          response: 'Error processing image search. Please try again.',
          image: capturedImage,
          type: 'image'
        };
        maximizeWindow(existingImageWindow.id);
      } else {
        createWindow({
          id: 'image-response',
          type: 'image-response',
          content: { 
            query: 'Image search', 
            response: 'Error processing image search. Please try again.',
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
      className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <h3 className="text-white font-medium text-lg">Camera</h3>
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
      
      <div className="p-8 min-h-[32rem]">
        <div className="relative bg-black/20 rounded-lg overflow-hidden">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-96 object-contain bg-black/40"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-96 object-contain bg-black/40"
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {!capturedImage ? (
              <button
                onClick={captureImage}
                className="p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-lg transition-colors"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleRetake}
                  className="p-4 bg-orange-500/80 hover:bg-orange-600 rounded-full backdrop-blur-lg transition-colors"
                >
                  <RotateCcw className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={captureImage}
                  className="p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-lg transition-colors"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleSearchImage}
                  className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full backdrop-blur-lg transition-colors"
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};