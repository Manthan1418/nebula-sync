"use client"

import { Send, Users, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNebula } from "@/lib/context"

function getInitials(name: string) {
  return name.charAt(0).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-primary text-white",
    "bg-secondary text-surface-container-lowest",
    "bg-primary/60 text-white",
    "bg-secondary/60 text-surface-container-lowest",
    "bg-on-surface-variant text-white",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function RoomView({ onClose }: { onClose?: () => void }) {
  const { roomId, users, messages, sendMessage, isHost, roomName, userId } = useNebula()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput("")
  }

  return (
    <div className="w-full flex-1 bg-surface-container-high/60 backdrop-blur-3xl md:rounded-3xl rounded-t-3xl flex flex-col border-t md:border border-outline/20 shadow-2xl mt-4 md:mt-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-secondary/5 blur-[100px] -z-10" />

      <div className="p-4 border-b border-outline/10 flex items-center justify-between bg-surface-container-highest/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Users size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">
              {roomId ? roomName || `Room ${roomId}` : "Not in a Room"}
            </h3>
            <p className="text-[10px] text-secondary font-medium">
              {users.length > 0 ? `${users.length} listening now` : "No one here yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((u) => (
              <div key={u.id}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-surface-container-high ${getAvatarColor(u.name)}`}
                title={u.name}>
                {getInitials(u.name)}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-surface-container-high bg-surface-container-lowest text-on-surface">
                +{users.length - 5}
              </div>
            )}
          </div>
          {onClose && (
            <button onClick={onClose}
              className="md:hidden p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col justify-end">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-on-surface-variant py-8">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.user_id === userId ? "items-end" : "items-start"}`}>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                {msg.user_name}
              </span>
              <div className={`px-4 py-2 text-sm rounded-2xl shadow-md backdrop-blur-md max-w-[85%] ${
                msg.user_id === userId
                  ? "bg-primary/90 text-white rounded-tr-sm"
                  : "bg-surface-container-highest/80 text-on-surface rounded-tl-sm border border-outline/10"
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-surface-container-highest/30">
        <div className="relative flex items-center">
          <input type="text" placeholder={roomId ? "Vibe check..." : "Join a room to chat"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!roomId}
            className="w-full bg-surface-container/80 border border-outline/20 rounded-full py-2.5 pl-4 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner disabled:opacity-50" />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!roomId}
            className="absolute right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 disabled:opacity-50">
            <Send size={14} className="-ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
