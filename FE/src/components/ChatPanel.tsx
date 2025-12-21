import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
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

export const ChatPanel = ({ compact = false, roomCode }: ChatPanelProps) => {
  const { sendMessage, room, connected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
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

  if (compact) {
    return (
      <div className="flex flex-col h-60">
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No messages yet</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`text-xs ${msg.isSystem ? 'text-center text-muted-foreground italic' : ''}`}>
              {!msg.isSystem && (
                <span className="font-medium text-primary">{msg.userName}: </span>
              )}
              <span className={msg.isSystem ? '' : 'text-foreground'}>{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 p-2 border-t border-border">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Message..."
            className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full desktop version
  return (
    <div className="bg-card rounded-xl border border-border h-96 flex flex-col">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-base">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-base text-muted-foreground py-8">No messages yet</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={msg.isSystem ? 'text-center' : ''}>
            {msg.isSystem ? (
              <span className="text-sm text-muted-foreground italic">{msg.text}</span>
            ) : (
              <div className="bg-muted/30 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-primary truncate">{msg.userName}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-base break-words">{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-3 p-4 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-muted/50 rounded-lg px-4 py-3 text-base outline-none focus:ring-2 ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          className="p-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
