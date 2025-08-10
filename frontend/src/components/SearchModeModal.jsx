import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, HardDrive, X } from 'lucide-react';

export const SearchModeModal = ({ isOpen, onClose, onSelectMode, query }) => {
  const handleModeSelect = (mode) => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-xl">Choose Learning Mode</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            
            <p className="text-white/70 mb-8 text-center">
              How would you like to learn about "<span className="text-white font-medium">{query}</span>"?
            </p>
            
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect('local')}
                className="w-full p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-500/30 rounded-full group-hover:bg-purple-500/40 transition-colors">
                    <HardDrive className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium text-lg">Local Learning</h4>
                    <p className="text-white/60 text-sm">Learn from curated local content</p>
                  </div>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect('global')}
                className="w-full p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 hover:from-green-500/30 hover:to-teal-500/30 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/30 rounded-full group-hover:bg-green-500/40 transition-colors">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium text-lg">Global Learning</h4>
                    <p className="text-white/60 text-sm">Learn from online resources</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};