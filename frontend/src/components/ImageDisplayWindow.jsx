// ImageDisplayWindow.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ImageDisplayWindow = ({ imageUrls }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // This effect handles the image cycling
  useEffect(() => {
    // Do nothing if there are no images or only one image
    if (!imageUrls || imageUrls.length <= 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }, 10000); // 10 seconds

    // Clean up the timer when the component unmounts or imageUrls change
    return () => clearTimeout(timer);
  }, [currentIndex, imageUrls]);

  // If there are no image URLs, display a message
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <motion.div
        className="w-full h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center p-6"
      >
        <p className="text-white/60">No image to display.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="w-full h-[40rem] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.img
          // Use the currentIndex as a key to trigger the animation on change
          key={currentIndex}
          src={imageUrls[currentIndex]}
          alt={`Display ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
      </AnimatePresence>
    </motion.div>
  );
};