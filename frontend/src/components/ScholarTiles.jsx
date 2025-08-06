import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, Quote, Calendar, Users, Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useWindows } from '../contexts/WindowContext';
import { useSummarizeAndSpeak } from '../hooks/useSummarizeAndSpeak';

export const ScholarTiles = ({ scholarData, isLoading }) => {
  const { playingId, isPlaying, playAudio, stopAudio } = useTextToSpeech();
  const { createWindow, maximizeWindow, findWindowByType } = useWindows();
  const { summarizeAndSpeak, isSummaryLoading, isSummaryPlaying } = useSummarizeAndSpeak();


  // Check if we should show loading (either isLoading prop or scholarLoading from content)
  const showLoading = isLoading;

  if (showLoading) {
    return (
      <div className="bg-white/10 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Academic Research (Loading...)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!scholarData?.organic?.length) {
    return null;
  }

  const handleReadAloud = async (paper) => {
    if (playingId === paper.id && isPlaying) {
      stopAudio();
    } else {
      // Use abstract if available, otherwise fall back to snippet
      const textToRead = paper.abstract || paper.snippet || paper.title;
      await playAudio(paper.id, textToRead);
    }
  };

  const handleViewClick = (paper, type = 'web') => {
    const windowId = `scholar-${type}-${paper.id}`;
    const existingWindow = findWindowByType(`scholar-${type}`);
    
    if (existingWindow) {
      // Update existing window content and maximize it
      updateWindowContent(existingWindow.id, {
        title: paper.title,
        url: type === 'pdf' ? paper.pdfUrl : paper.link,
        type: type,
        paper: paper,
        isLoading: true
      });
      maximizeWindow(existingWindow.id);
    } else {
      // Create new scholar view window
      createWindow({
        id: windowId,
        type: `scholar-${type}`,
        content: {
          title: paper.title,
          url: type === 'pdf' ? paper.pdfUrl : paper.link,
          type: type,
          paper: paper,
          isLoading: true
        }
      });
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-6">
      <h4 className="text-white font-medium mb-6 flex items-center text-lg">
        <FileText className="w-5 h-5 mr-2" />
        Academic Research ({scholarData.organic.length} papers found)
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scholarData.organic.map((paper, index) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white/5 rounded-lg p-5 hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20 overflow-hidden ${
              playingId === paper.id && isPlaying ? 'ring-2 ring-blue-400/50' : ''
            }`}
          >
            {/* Audio playing effect */}
            {playingId === paper.id && isPlaying && (
              <>
                {/* Glowing bubble effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-400/30 rounded-full animate-ping" />
                  <div className="absolute top-6 right-6 w-4 h-4 bg-blue-400/50 rounded-full animate-pulse" />
                </div>
                
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse pointer-events-none" />
                
                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-bounce"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '2s'
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Read aloud button */}
            <button 
            // disabled={isSummaryLoading || isSummaryPlaying}
              onClick={() => summarizeAndSpeak({
                    title: paper.title,
                    snippet: paper.snippet,
                    author: "Vaswani et al."
                  })}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 ${
                playingId === paper.id && isPlaying
                  ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/20 hover:bg-white/30 text-white/70 hover:text-white'
              }`}
              title={playingId === paper.id && isPlaying ? 'Stop reading' : 'Read aloud'}
            >
              {playingId === paper.id && isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Title */}
            <h5 className="text-white font-medium text-base mb-3 line-clamp-2 leading-tight">
              {paper.title}
            </h5>
            
            {/* Publication Info */}
            <div className="flex items-center text-sm text-white/60 mb-3">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="mr-3">{paper.year}</span>
              {paper.citedBy && (
                <>
                  <Quote className="w-3 h-3 mr-1" />
                  <span>Cited by {paper.citedBy}</span>
                </>
              )}
            </div>
            
            {/* Authors/Publication */}
            <p className="text-sm text-white/50 mb-4 line-clamp-1">
              {paper.publicationInfo}
            </p>
            
            {/* Snippet */}
            <p className="text-sm text-white/70 mb-4 line-clamp-3 leading-relaxed">
              {paper.snippet}
            </p>
            
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleViewClick(paper, 'web');
                  }}
                  href="#"
                  className="inline-flex items-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </a>
                
                {paper.pdfUrl && (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewClick(paper, 'pdf');
                    }}
                    href="#"
                    className="inline-flex items-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded text-sm text-green-300 hover:text-green-200 transition-colors"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    PDF
                  </a>
                )}
              </div>
              
              {paper.citedBy && (
                <span className="text-sm text-white/40">
                  {paper.citedBy} citations
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      
    </div>
  );
};