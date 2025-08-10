import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export const OnScreenKeyboard = ({ onKeyPress, onClose }) => {
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const [size, setSize] = useState({ width: 500, height: 260 });
  const isResizing = useRef(false);

  // Start resizing
  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // While resizing
  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    setSize((prev) => ({
      width: Math.max(300, prev.width + e.movementX),
      height: Math.max(200, prev.height + e.movementY),
    }));
  };

  // Stop resizing
  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <motion.div
      drag
      dragConstraints={{ top: -500, bottom: 500, left: -500, right: 500 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed z-50 bg-white/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl cursor-move"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "20px",
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 cursor-move">
        <h2 className="text-gray-800 font-semibold">Keyboard</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Keys */}
      <div className="flex flex-wrap gap-2 justify-center overflow-auto h-[calc(100%-40px)]">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="px-4 py-2 bg-gray-100 hover:bg-purple-500 hover:text-white rounded-lg shadow-sm transition text-lg font-medium"
          >
            {key}
          </button>
        ))}
        <button
          onClick={() => onKeyPress(" ")}
          className="px-6 py-2 bg-gray-300 hover:bg-purple-500 hover:text-white rounded-lg shadow-sm transition font-medium"
        >
          Space
        </button>
        <button
          onClick={() => onKeyPress("BACKSPACE")}
          className="px-6 py-2 bg-red-400 hover:bg-red-500 text-white rounded-lg shadow-sm transition font-medium"
        >
          ←
        </button>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-1 right-1 w-4 h-4 bg-gray-400 rounded-sm cursor-se-resize"
      ></div>
    </motion.div>
  );
};
