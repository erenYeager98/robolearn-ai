import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, FileText, FilePieChart, ArrowLeft, ArrowRight, X, Loader2, AlertTriangle } from 'lucide-react';
import { useWindows } from '../contexts/WindowContext';

const API_BASE_URL = 'http://localhost:8000';

export const TopicBrowserWindow = ({ windowId }) => {
  const { closeWindow, createWindow } = useWindows();
  const [history, setHistory] = useState(['/']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [isLoading, setIsLoading] = useState(true);

  // --- ADDED STATE for loading and error handling ---
  const [convertingFile, setConvertingFile] = useState(null); // Tracks the name of the file being converted
  const [error, setError] = useState(null); // Stores any error message

  const currentPath = history[currentIndex];

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors on navigation
      try {
        const url = `${API_BASE_URL}/api/topics?path=${encodeURIComponent(currentPath)}`;
        const response = await fetch(url);
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.detail || 'Failed to fetch directory contents.');
        }
        const data = await response.json();
        setContents(data);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [currentPath]);

  const navigateTo = (folderName) => {
    if (convertingFile) return; // Prevent navigation while converting
    const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newPath);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const goForward = () => {
    if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
  };

  // --- UPDATED to handle loading and error states ---
  const handleFileClick = async (file) => {
    if (!file.name.endsWith('.pptx') || convertingFile) return;

    setConvertingFile(file.name);
    setError(null);

    try {
      const relativePath = `${currentPath}/${file.name}`.replace(/^\/+/, '');
      const apiUrl = `${API_BASE_URL}/api/convert-ppt?path=${encodeURIComponent(relativePath)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to convert PPTX");
      }
      const data = await response.json();

      createWindow({
        id: `ppt-viewer-${file.name}-${Date.now()}`,
        type: 'presentation-viewer',
        content: { slides: data.slides, title: file.name }
      });

      closeWindow(windowId);
    } catch (err) {
      console.error("Error opening PPTX:", err);
      setError(err.message);
    } finally {
      setConvertingFile(null); // Clear loading state regardless of outcome
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pptx')) return <FilePieChart className="w-8 h-8 text-orange-400" />;
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  const isInteractive = (file) => file.name.endsWith('.pptx');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full h-[85vh] bg-black/30 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button onClick={goBack} disabled={currentIndex === 0 || convertingFile} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <button onClick={goForward} disabled={currentIndex >= history.length - 1 || convertingFile} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"><ArrowRight className="w-5 h-5 text-white" /></button>
          <p className="bg-white/10 px-4 py-2 rounded-md text-white/80 font-mono text-sm">{currentPath}</p>
        </div>
        <h3 className="text-white font-medium text-lg">Learn by Topic</h3>
        <button onClick={() => closeWindow(windowId)} className="p-3 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"><X className="w-5 h-5 text-white/70" /></button>
      </header>
      <main className="p-8 overflow-y-auto flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 text-white/50 animate-spin" /></div>
        ) : error ? ( // --- ADDED: Error display ---
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <p className="font-semibold">An Error Occurred</p>
            <p className="text-sm text-white/60">{error}</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {contents.folders.map(folder => (
              <motion.div 
                key={folder.name} 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                onClick={() => navigateTo(folder.name)} 
                className={`flex flex-col items-center justify-center p-4 aspect-square bg-white/5 rounded-lg border-transparent transition-colors ${convertingFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20 cursor-pointer'}`}
              >
                <Folder className="w-16 h-16 text-yellow-400" />
                <p className="text-white/90 text-center mt-2 break-all">{folder.name}</p>
              </motion.div>
            ))}
            {contents.files.map(file => {
              const isProcessing = convertingFile === file.name;
              const canInteract = isInteractive(file);
              return (
                <motion.div 
                  key={file.name} 
                  layout 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  onClick={() => handleFileClick(file)}
                  className={`relative flex flex-col items-center justify-center p-4 aspect-square bg-white/5 rounded-lg border-transparent transition-all 
                    ${!canInteract && 'opacity-60'}
                    ${canInteract && !convertingFile && 'hover:bg-white/10 hover:border-white/20 cursor-pointer'}
                    ${convertingFile && !isProcessing && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? ( // --- ADDED: Loading spinner on the specific item ---
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    getFileIcon(file.name)
                  )}
                  <p className="text-white/80 text-center mt-2 text-sm break-all">{file.name}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};