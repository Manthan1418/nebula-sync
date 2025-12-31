import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Sparkles, Radio } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatPanelProps {
  compact?: boolean;
  roomCode?: string;
}

// Generate consistent color from username
const getAvatarColor = (name: string) => {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-indigo-500 to-violet-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ChatPanel = ({ compact = false, roomCode }: ChatPanelProps) => {
  const { sendMessage, room, connected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKey = `chat_${roomCode}`;

  // Load messages from sessionStorage
  useEffect(() => {
    if (!roomCode) return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) setMessages(JSON.parse(saved));
  }, [roomCode]);

  // Save messages to sessionStorage
  useEffect(() => {
    if (roomCode && messages.length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-100)));
    }
  }, [messages, roomCode]);

  // Listen for incoming messages directly from socket
  useEffect(() => {
    if (!connected) return;
    const socket = getSocket();
    const handler = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('chat:message', handler);
    return () => {
      socket.off('chat:message', handler);
    };
  }, [connected]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !connected) return;
    sendMessage(input.trim());
    setInput('');
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const socket = getSocket();
  const isOwnMessage = (msgUserId: string) => msgUserId === socket.id?.slice(0, 8);

  if (compact) {
    return (
      <div className="flex flex-col h-64">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <div className="relative">
                <Radio className="w-10 h-10 mb-2 text-violet-500/30" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-fuchsia-400 animate-pulse" />
              </div>
              <p className="text-xs font-medium">No transmissions yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Send the first signal!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`animate-in slide-in-from-bottom-2 duration-300 ${msg.isSystem ? 'text-center' : ''}`} style={{ animationDelay: `${idx * 30}ms` }}>
              {msg.isSystem ? (
                <span className="text-[10px] text-muted-foreground italic bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                  ✦ {msg.text}
                </span>
              ) : (
                <div className={`flex gap-2 ${isOwnMessage(msg.userId) ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(msg.userName)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-[10px] font-bold text-white">{msg.userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className={`max-w-[75%] ${isOwnMessage(msg.userId) ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl px-3 py-2 ${
                      isOwnMessage(msg.userId) 
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md' 
                        : 'bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-bl-md'
                    }`}>
                      {!isOwnMessage(msg.userId) && (
                        <p className="text-[10px] font-semibold text-violet-400 mb-0.5">{msg.userName}</p>
                      )}
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-[9px] text-muted-foreground/50 mt-0.5 ${isOwnMessage(msg.userId) ? 'text-right' : ''}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 p-3 border-t border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Transmit message..."
              className="w-full bg-background/60 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 ring-violet-500/40 border border-violet-500/20 transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full desktop version
  return (
    <div className="bg-gradient-to-b from-card/90 to-card/70 backdrop-blur-xl rounded-2xl border border-violet-500/20 h-96 flex flex-col shadow-2xl shadow-violet-500/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Transmissions</h3>
            <p className="text-[10px] text-muted-foreground/60">{messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-cyan-400 font-medium">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <Radio className="w-10 h-10 text-violet-500/40" />
              </div>
              <Sparkles className="w-5 h-5 absolute -top-1 right-0 text-fuchsia-400 animate-bounce" />
              <Sparkles className="w-4 h-4 absolute bottom-2 -left-2 text-violet-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">No transmissions yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Be the first to broadcast!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`animate-in slide-in-from-bottom-3 duration-300 ${msg.isSystem ? 'text-center' : ''}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {msg.isSystem ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                <span className="text-[11px] text-muted-foreground/70 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 font-medium">
                  ✦ {msg.text}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              </div>
            ) : (
              <div className={`flex gap-3 ${isOwnMessage(msg.userId) ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(msg.userName)} flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-background`}>
                  <span className="text-xs font-bold text-white">{msg.userName.charAt(0).toUpperCase()}</span>
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[70%] group ${isOwnMessage(msg.userId) ? 'items-end' : ''}`}>
                  <div className={`relative rounded-2xl px-4 py-3 transition-all duration-200 ${
                    isOwnMessage(msg.userId) 
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40' 
                      : 'bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-bl-md hover:border-violet-500/30'
                  }`}>
                    {!isOwnMessage(msg.userId) && (
                      <p className="text-xs font-semibold text-violet-400 mb-1">{msg.userName}</p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      isOwnMessage(msg.userId) ? 'bg-white/5' : 'bg-violet-500/5'
                    } pointer-events-none ${isOwnMessage(msg.userId) ? 'rounded-br-md' : 'rounded-bl-md'}`} />
                  </div>
                  <p className={`text-[10px] text-muted-foreground/40 mt-1.5 ${isOwnMessage(msg.userId) ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-violet-500/10 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative group">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Transmit message..."
              className="w-full bg-background/50 backdrop-blur-sm rounded-full px-5 py-3.5 text-sm outline-none border border-violet-500/20 transition-all focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 placeholder:text-muted-foreground/40"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl" />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-3.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all duration-200 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-110 group"
          >
            <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
