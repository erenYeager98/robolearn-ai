import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';

export const PresentationWindow = ({ windowId, content }) => {
  const { closeWindow } = useWindows();
  const { slides = [], title } = content;

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full h-[85vh] bg-gray-800/80 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
        <h3 className="text-white font-medium text-lg truncate" title={title}>
          {title}
        </h3>
        <button
          onClick={() => closeWindow(windowId)}
          className="p-3 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      </header>

      {/* --- MODIFIED MAIN CONTENT --- */}
      {/* We make the main area a flex column so we can control its children */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {slides.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-red-400 text-center">
              No slides available for this presentation.
            </p>
          </div>
        ) : (
          <>
            {/* 1. This is the flexible image container */}
            {/* It will grow to fill available space. min-h-0 is a crucial fix for flexbox overflow. */}
            <div className="flex-grow w-full flex items-center justify-center min-h-0 p-4">
              <img
                src={`http://localhost:8000${slides[currentSlide]}`}
                alt={`Slide ${currentSlide + 1}`}
                // `object-contain` ensures the image scales properly within the div
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
            
            {/* 2. This is the fixed controls container */}
            {/* `flex-shrink-0` prevents this div from shrinking or being pushed away. */}
            <div className="flex-shrink-0 flex justify-center items-center space-x-4 py-4">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <span className="text-white font-medium tabular-nums">
                {currentSlide + 1} / {slides.length}
              </span>
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
              >
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        )}
      </main>
    </motion.div>
  );
};