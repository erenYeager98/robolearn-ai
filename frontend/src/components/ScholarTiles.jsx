import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, Quote, Calendar, Users } from 'lucide-react';

export const ScholarTiles = ({ scholarData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Academic Research
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

  return (
    <div className="bg-white/10 rounded-lg p-4">
      <h4 className="text-white font-medium mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Academic Research ({scholarData.organic.length} papers found)
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scholarData.organic.map((paper, index) => (
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
            <div className="flex items-center text-xs text-white/60 mb-2">
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
            <p className="text-xs text-white/50 mb-3 line-clamp-1">
              {paper.publicationInfo}
            </p>
            
            {/* Snippet */}
            <p className="text-xs text-white/70 mb-3 line-clamp-3 leading-relaxed">
              {paper.snippet}
            </p>
            
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
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
                  {paper.citedBy} citations
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {scholarData.searchParameters && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-white/40">
            Search: "{scholarData.searchParameters.q}" • 
            Engine: {scholarData.searchParameters.engine} • 
            Credits used: {scholarData.credits || 1}
          </p>
        </div>
      )}
    </div>
  );
};