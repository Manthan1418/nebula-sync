"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Send, X } from "lucide-react";
import { useState } from "react";

export function RoomView({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    { user: "Alice", text: "This track is fire! 🔥" },
    { user: "Bob", text: "Yesss, transitions are so smooth." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { user: "You", text: input }]);
    setInput("");
  };

  return (
    <motion.div 
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 w-80 h-full bg-surface-container-high/95 backdrop-blur-2xl border-l border-outline/20 z-40 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-outline/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={20} className="text-secondary" />
          <h2 className="font-bold text-on-surface">Listening Room</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
          <X size={20} />
        </button>
      </div>

      {/* Members */}
      <div className="p-4 border-b border-outline/10 flex space-x-2 overflow-x-auto scrollbar-hide">
        {["Alice", "Bob", "Charlie", "You"].map((name, idx) => (
          <div key={idx} className="flex flex-col items-center min-w-[50px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${name === "You" ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface"}`}>
              {name.charAt(0)}
            </div>
            <span className="text-[10px] text-on-surface-variant mt-1 truncate w-full text-center">{name}</span>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.user === "You" ? "items-end" : "items-start"}`}>
            <span className="text-[10px] text-on-surface-variant mb-1 ml-1">{msg.user}</span>
            <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
              msg.user === "You" 
                ? "bg-primary text-on-primary rounded-tr-sm" 
                : "bg-surface-container-highest text-on-surface rounded-tl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-outline/20 bg-surface-container">
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Say something..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full bg-surface-bright border border-outline/30 rounded-full py-2 pl-4 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 p-1.5 rounded-full bg-primary text-on-primary hover:bg-secondary transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
