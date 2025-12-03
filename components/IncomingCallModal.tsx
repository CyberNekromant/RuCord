
import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { User } from '../types';

interface IncomingCallModalProps {
  caller: User;
  onAccept: (video: boolean) => void;
  onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ caller, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center">
        {/* Avatar with pulsing rings */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-[-20px] bg-green-500/20 rounded-full animate-pulse"></div>
          <img 
            src={caller.avatarUrl} 
            alt={caller.username} 
            className="w-32 h-32 rounded-full border-4 border-gray-900 relative z-10 object-cover shadow-2xl"
          />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">{caller.username}</h2>
        <p className="text-gray-400 mb-12 text-lg animate-pulse">Входящий звонок...</p>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={onDecline}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-red-500/30"
            >
              <PhoneOff size={32} />
            </button>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Отклонить</span>
          </div>

          <div className="flex flex-col items-center gap-2">
             <button 
              onClick={() => onAccept(false)}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg shadow-green-500/30"
            >
              <Phone size={32} />
            </button>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Аудио</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => onAccept(true)}
              className="w-16 h-16 bg-gray-700 hover:bg-blurple-500 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 shadow-lg"
            >
              <Video size={32} />
            </button>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Видео</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
