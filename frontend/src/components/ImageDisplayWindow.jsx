
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for the loading indicator
const loadingContainerVariants = {
  start: {
    transition: {
      staggerChildren: 0.2,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const loadingDotVariants = {
  start: {
    y: '0%',
  },
  end: {
    y: '-100%',
  },
};

const loadingDotTransition = {
  duration: 0.5,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

export const ImageDisplayWindow = ({ imageUrls }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // This effect handles the image cycling
  useEffect(() => {
    if (!imageUrls || imageUrls.length <= 1) {
      return;
    }
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, imageUrls]);

  // Loading state: Show a creative loader if imageUrls is null/undefined
  if (imageUrls === null || typeof imageUrls === 'undefined' || imageUrls.length === 0) {
    return (
      <motion.div className="w-full h-[40rem] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center p-6">
        <motion.div
          className="flex space-x-2"
          variants={loadingContainerVariants}
          initial="start"
          animate="end"
        >
          <motion.span
            className="block w-3 h-3 bg-white/50 rounded-full"
            variants={loadingDotVariants}
            transition={loadingDotTransition}
          />
          <motion.span
            className="block w-3 h-3 bg-white/50 rounded-full"
            variants={loadingDotVariants}
            transition={loadingDotTransition}
          />
          <motion.span
            className="block w-3 h-3 bg-white/50 rounded-full"
            variants={loadingDotVariants}
            transition={loadingDotTransition}
          />
        </motion.div>
      </motion.div>
    );
  }

  // Empty state: If imageUrls is an empty array, display the message
  // if (imageUrls.length === 0) {
  //   return (
  //     <motion.div className="w-full h-[40rem] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center p-6">
  //       <p className="text-white/60">No image to display.</p>
  //     </motion.div>
  //   );
  // }

  // Content state: Display the image carousel
  return (
    <motion.div
      layout
      className="w-full h-[40rem] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.img
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