import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Image, Eye } from 'lucide-react';

export const ImageSearchTiles = ({ imageSearchData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Visual Search Results
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-32 bg-white/20 rounded mb-3"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!imageSearchData?.organic?.length) {
    return null;
  }

  // Show only first 5 results
  const results = imageSearchData.organic.slice(0, 5);

  return (
    <div className="bg-white/10 rounded-lg p-6">
      <h4 className="text-white font-medium mb-6 flex items-center text-lg">
        <Image className="w-5 h-5 mr-2" />
        Visual Search Results ({results.length} similar images found)
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <motion.div
            key={`${result.link}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
          >
            {/* Image */}
            <div className="relative h-40 bg-black/20">
              <img
                src={result.thumbnailUrl || result.imageUrl}
                alt={result.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                  {result.source}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h5 className="text-white font-medium text-base mb-3 line-clamp-2 leading-tight">
                {result.title}
              </h5>
              
              {/* Source */}
              <p className="text-sm text-white/60 mb-4">
                Source: {result.source}
              </p>
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </a>
                  
                  {result.imageUrl && (
                    <a
                      href={result.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded text-sm text-green-300 hover:text-green-200 transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Full
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {imageSearchData.searchParameters && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-sm text-white/40">
            Search URL: {imageSearchData.searchParameters.url} • 
            Engine: {imageSearchData.searchParameters.engine} • 
            Credits used: {imageSearchData.credits || 1}
          </p>
        </div>
      )}
    </div>
  );
};