"use client";

import { Send, Users, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function RoomView({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState([
    { user: "Alice", text: "This drop is insane! 🚀" },
    { user: "Bob", text: "Wait for the synth solo..." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { user: "You", text: input }]);
    setInput("");
  };

  return (
    <div className="w-full flex-1 bg-surface-container-high/60 backdrop-blur-3xl md:rounded-3xl rounded-t-3xl flex flex-col border-t md:border border-outline/20 shadow-2xl mt-4 md:mt-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-secondary/5 blur-[100px] -z-10" />

      {/* Header */}
      <div className="p-4 border-b border-outline/10 flex items-center justify-between bg-surface-container-highest/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Users size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">Neon Nights Room</h3>
            <p className="text-[10px] text-secondary font-medium">3 listening now</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex -space-x-2">
            {["A", "B", "Y"].map((initial, i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-surface-container-high ${initial === "Y" ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface"}`}>
                {initial}
              </div>
            ))}
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col justify-end">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex flex-col ${msg.user === "You" ? "items-end" : "items-start"}`}
          >
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">{msg.user}</span>
            <div className={`px-4 py-2 text-sm rounded-2xl shadow-md backdrop-blur-md ${
              msg.user === "You" 
                ? "bg-primary/90 text-white rounded-tr-sm" 
                : "bg-surface-container-highest/80 text-on-surface rounded-tl-sm border border-outline/10"
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-surface-container-highest/30">
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Vibe check..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full bg-surface-container/80 border border-outline/20 rounded-full py-2.5 pl-4 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
          />
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="absolute right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30"
          >
            <Send size={14} className="-ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
