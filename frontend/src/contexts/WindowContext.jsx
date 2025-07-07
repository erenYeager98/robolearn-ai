import React, { createContext, useContext, useReducer } from 'react';

const WindowContext = createContext(undefined);

const windowReducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_WINDOW':
      return [...state, action.payload];
    case 'UPDATE_WINDOW_CONTENT':
      return state.map(window => 
        window.id === action.payload.id 
          ? { ...window, content: action.payload.content }
          : window
      );
    case 'MAXIMIZE_WINDOW':
      return state.map(window => ({
        ...window,
        isMaximized: window.id === action.payload,
        isMinimized: window.id !== action.payload ? true : false
      }));
    case 'MINIMIZE_WINDOW':
      return state.map(window => 
        window.id === action.payload 
          ? { ...window, isMinimized: true, isMaximized: false }
          : window
      );
    case 'CLOSE_WINDOW':
      return state.filter(window => window.id !== action.payload);
    default:
      return state;
  }
};

export const WindowProvider = ({ children }) => {
  const [windows, dispatch] = useReducer(windowReducer, [
    { id: 'search', type: 'search', isMinimized: false, isMaximized: true }
  ]);
  
  const activeWindow = windows.find(w => w.isMaximized)?.id || null;

  const maximizeWindow = (id) => {
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: id });
    dispatch({ type: 'SET_ACTIVE_WINDOW', payload: id });
  };

  const minimizeWindow = (id) => {
    dispatch({ type: 'MINIMIZE_WINDOW', payload: id });
    if (activeWindow === id) {
      dispatch({ type: 'SET_ACTIVE_WINDOW', payload: null });
    }
  };

  const createWindow = (window) => {
    const newWindow = {
      ...window,
      isMinimized: false,
      isMaximized: true
    };
    dispatch({ type: 'CREATE_WINDOW', payload: newWindow });
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: window.id });
  };

  const updateWindowContent = (id, content) => {
    dispatch({ type: 'UPDATE_WINDOW_CONTENT', payload: { id, content } });
  };

  const closeWindow = (id) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: id });
  };

  const findWindowByType = (type) => {
    return windows.find(window => window.type === type);
  };

  return (
    <WindowContext.Provider value={{
      windows,
      activeWindow,
      dispatch,
      maximizeWindow,
      minimizeWindow,
      createWindow,
      updateWindowContent,
      closeWindow,
      findWindowByType
    }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindows = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowProvider');
  }
  return context;
};