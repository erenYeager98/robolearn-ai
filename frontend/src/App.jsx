import React from 'react';
import { WindowProvider } from './contexts/WindowContext';
import { ThreeBackground } from './components/ThreeBackground';
import { WindowManager } from './components/WindowManager';

function App() {
  return (
    <WindowProvider>
      <div className="relative overflow-x-hidden">
        <ThreeBackground />
        <WindowManager />
        
      </div>
    </WindowProvider>
  );
}

export default App;