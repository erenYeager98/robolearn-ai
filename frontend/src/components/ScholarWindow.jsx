import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Minimize2, ExternalLink, FileText } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';
import { ScholarTiles } from './ScholarTiles';

export const ScholarWindow = ({ windowId, content, isMinimized }) => {
  const { minimizeWindow } = useWindows();

  if (isMinimized) {
    return null; // Hidden when minimized
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed left-4 right-4 bottom-4 h-80 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-white/70" />
          <h3 className="text-white font-semibold text-lg">Academic Research</h3>
          <span className="text-white/50 text-sm">
            {content?.scholarData?.organic?.length || 0} papers found
          </span>
        </div>
        <button
          onClick={() => minimizeWindow(windowId)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Minimize2 className="w-4 h-4 text-white/70" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 h-full overflow-y-auto response-window-content">
        {content?.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-3/4 mb-3"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-white/15 rounded w-16"></div>
                  <div className="h-6 bg-white/15 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : content?.scholarData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.scholarData.organic?.slice(0, 6).map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
              >
                {/* Title */}
                <h5 className="text-white font-medium text-sm mb-2 line-clamp-2 leading-tight">
                  {paper.title}
                </h5>
                
                {/* Publication Info */}
                <p className="text-xs text-white/50 mb-2 line-clamp-1">
                  {paper.publicationInfo}
                </p>
                
                {/* Snippet */}
                <p className="text-xs text-white/70 mb-3 line-clamp-2 leading-relaxed">
                  {paper.snippet}
                </p>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <a
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </a>
                    
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-300 hover:text-green-200 transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                      </a>
                    )}
                  </div>
                  
                  {paper.citedBy && (
                    <span className="text-xs text-white/40">
                      {paper.citedBy}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No academic research available</p>
              <p className="text-white/40 text-sm mt-2">Try a different search query</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};