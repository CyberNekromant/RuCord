import React, { useRef, useEffect } from 'react';
import { Maximize2, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { User } from '../types';

interface MiniPlayerProps {
  currentUser: User;
  voiceState: any;
  p2pUsers: Record<string, User>;
  onExpand: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
  currentUser, 
  voiceState, 
  p2pUsers, 
  onExpand, 
  onDisconnect,
  onToggleMute,
  onToggleCamera 
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Determine what to show in the main area of the mini player
  // Priority: 1. Remote Stream (if exists) 2. Local Screen Share (if exists)
  
  const remotePeerId = Object.keys(voiceState.remoteStreams)[0];
  const remoteStream = remotePeerId ? voiceState.remoteStreams[remotePeerId] : null;
  const remoteUser = remotePeerId ? p2pUsers[remotePeerId] : null;

  // Use local screen share as fallback content if no remote stream, or if we want to monitor our own share
  const activeStream = remoteStream || voiceState.localScreenStream;
  const isScreenShare = !!voiceState.localScreenStream && !remoteStream;

  useEffect(() => {
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = voiceState.localCameraStream || null;
        localVideoRef.current.volume = 0;
    }
  }, [voiceState.localCameraStream]);

  useEffect(() => {
    if (remoteVideoRef.current && activeStream) {
        remoteVideoRef.current.srcObject = activeStream;
        // Respect deafen state (mute remote audio, but never mute local screen share audio loopback if that were possible)
        remoteVideoRef.current.volume = voiceState.deafened ? 0 : 1;
    }
  }, [activeStream, voiceState.deafened]);

  return (
    <div className="fixed top-12 right-4 w-80 bg-gray-900 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-700 overflow-hidden z-[40] animate-fade-in cursor-move draggable-region">
      {/* Video Area */}
      <div className="relative h-48 bg-black group">
        {activeStream ? (
            <video 
                ref={remoteVideoRef} 
                autoPlay 
                className={`w-full h-full ${isScreenShare ? 'object-contain' : 'object-cover'}`} 
            />
        ) : (
             <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                 <img src={remoteUser?.avatarUrl || currentUser.avatarUrl} className="w-16 h-16 rounded-full border-2 border-gray-700" />
                 <span className="text-sm font-bold text-gray-300">{remoteUser ? 'В разговоре...' : 'Ожидание...'}</span>
             </div>
        )}

        {/* Local PIP (Camera) - Only show if camera is on */}
        {voiceState.cameraOn && (
            <div className="absolute bottom-2 right-2 w-24 h-16 bg-gray-800 rounded-lg overflow-hidden border border-gray-600 shadow-lg z-10">
                 <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>
        )}

        {/* Hover Controls */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-20">
             <button onClick={onExpand} className="p-2 bg-gray-800 rounded-full text-white hover:bg-blurple-500 transition-colors" title="Развернуть">
                 <Maximize2 size={20} />
             </button>
             <button onClick={onToggleMute} className={`p-2 rounded-full text-white transition-colors ${voiceState.muted ? 'bg-red-500' : 'bg-gray-800 hover:bg-gray-700'}`}>
                 <MicOff size={20} />
             </button>
             <button onClick={onDisconnect} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                 <PhoneOff size={20} />
             </button>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-300 truncate max-w-[150px]">
                  {remoteUser ? remoteUser.username : (voiceState.screenShareOn ? 'Демонстрация' : 'Конференция')}
              </span>
          </div>
          <span className="text-[10px] text-green-400 font-mono">LIVE</span>
      </div>
    </div>
  );
};

export default MiniPlayer;