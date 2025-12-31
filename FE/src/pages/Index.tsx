import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { useSocket } from '@/context/SocketContext';
import { getRoomSession } from '@/lib/sessionStorage';

const Index = () => {
  const navigate = useNavigate();
  const { room } = useSocket();

  // Auto-navigate to room if session exists
  useEffect(() => {
    if (room) {
      const savedSession = getRoomSession();
      if (savedSession) {
        const { roomId, roomName, isHost } = savedSession;
        navigate(`/room/${roomId}`, { 
          state: { roomName, isHost },
          replace: true 
        });
      }
    }
  }, [room, navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <Navigation />
      <HeroSection />
    </div>
  );
};

export default Index;
