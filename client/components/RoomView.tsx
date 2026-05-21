"use client"

import { Send, Users, X, Crown, Disc3 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNebula } from "@/lib/context"

function getAvatarColor(name: string) {
  const colors = [
    "from-primary to-primary-hover",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-emerald-500 to-teal-500",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTimestamp(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return "now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export function RoomView({ onClose }: { onClose?: () => void }) {
  const { roomId, users, messages, sendMessage, isHost, userId, roomName, connected } = useNebula()
  const [input, setInput] = useState("")
  const [tab, setTab] = useState<"chat" | "crew">("chat")
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput("")
  }

  return (
    <div className="h-full w-full bg-surface-container-high flex flex-col">
      <div className="p-4 border-b border-outline/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-primary" : "bg-error"} shadow-lg ${connected ? "shadow-primary/30" : ""}`} />
          <div>
            <h3 className="text-sm font-bold text-on-surface">
              {roomId ? roomName || `Room ${roomId}` : "Room"}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-medium">
              {connected ? `${users.length} connected` : "Disconnected"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onClose && (
            <button onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-outline/10">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === "chat"
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}>
          Chat
        </button>
        <button
          onClick={() => setTab("crew")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            tab === "crew"
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}>
          Crew ({users.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "chat" ? (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-12">
                  <Disc3 size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1 opacity-60">Say something to the crew</p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.user_id === userId ? "items-end" : "items-start"}`}>
                    <div className="flex items-center space-x-1.5 mb-1">
                      {msg.user_id !== userId && (
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                          {msg.user_name}
                        </span>
                      )}
                      <span className="text-[9px] text-on-surface-variant/50">
                        {mounted ? formatTimestamp(msg.timestamp) : ""}
                      </span>
                    </div>
                    <div className={`px-3 py-2 text-[13px] rounded-2xl shadow-sm max-w-[90%] leading-relaxed ${
                      msg.user_id === userId
                        ? "bg-primary text-black rounded-tr-sm"
                        : "bg-surface-container text-on-surface rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-outline/10">
              <div className="relative flex items-center">
                <input type="text" placeholder="Message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={!roomId}
                  className="w-full bg-surface-container border border-outline/20 rounded-full py-2 pl-4 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all disabled:opacity-40" />
                <button
                  onClick={handleSend}
                  disabled={!roomId || !input.trim()}
                  className="absolute right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-black disabled:opacity-40 transition-all hover:bg-primary-hover">
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="crew" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-12">
                <Users size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No users yet</p>
              </div>
            ) : (
              users.map((u) => (
                <div key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(u.name)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-medium text-on-surface truncate">{u.name}</span>
                        {u.is_host && <Crown size={12} className="text-primary flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {u.is_host ? "Host" : "Listener"}
                      </span>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-sm shadow-primary/30" />
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
