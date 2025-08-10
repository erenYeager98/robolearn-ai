import React from 'react';
import { motion } from 'framer-motion';

export const ImageDisplayWindow = ({ imageUrl }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden p-6 flex items-center justify-center"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Dynamic Display"
          className="max-w-full max-h-[40rem] rounded-lg shadow-lg"
        />
      ) : (
        <p className="text-white/60">No image available</p>
      )}
    </motion.div>
  );
};
