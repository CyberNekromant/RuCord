
import React, { useState } from 'react';
import { X, Copy, Check, Link, ArrowRight, Loader2, Share2, Users, Trash2 } from 'lucide-react';
import { ConnectionState } from '../types';

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  myPeerId: string | null;
  onConnect: (peerId: string) => void;
  connectionStatus: ConnectionState;
  connectedPeers: string[];
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({ 
  isOpen, 
  onClose, 
  myPeerId, 
  onConnect, 
  connectionStatus,
  connectedPeers
}) => {
  const [friendId, setFriendId] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyId = () => {
    if (myPeerId) {
      navigator.clipboard.writeText(myPeerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-gray-850 px-6 py-4 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
               <Share2 className="text-blurple-400" size={20} />
               <h2 className="text-lg font-bold text-white">P2P Mesh Network</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-6">
           {/* My ID Section */}
           <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ваш ID (Отправьте друзьям)</label>
               <div className="flex gap-2">
                   <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-gray-200 font-mono text-sm truncate">
                       {myPeerId || 'Generating...'}
                   </div>
                   <button 
                      onClick={copyId}
                      disabled={!myPeerId}
                      className="bg-blurple-500 hover:bg-blurple-600 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center min-w-[44px]"
                   >
                       {copied ? <Check size={18} /> : <Copy size={18} />}
                   </button>
               </div>
           </div>

           <div className="relative flex items-center py-2">
               <div className="flex-grow border-t border-white/10"></div>
               <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase">Подключить друга</span>
               <div className="flex-grow border-t border-white/10"></div>
           </div>

           {/* Connect Section */}
           <div>
               <div className="space-y-3">
                   <input 
                      type="text"
                      value={friendId}
                      onChange={(e) => setFriendId(e.target.value)}
                      placeholder="Вставьте ID друга..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-blurple-500/50 focus:ring-1 focus:ring-blurple-500/50 transition-all font-mono text-sm"
                   />
                   <button 
                      onClick={() => { onConnect(friendId); setFriendId(''); }}
                      disabled={!friendId || connectionStatus === ConnectionState.CONNECTING}
                      className="w-full bg-gray-100 hover:bg-white text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       {connectionStatus === ConnectionState.CONNECTING ? <Loader2 className="animate-spin" /> : 'Подключить'}
                   </button>
               </div>
           </div>

           {/* Active Connections List */}
           {connectedPeers.length > 0 && (
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                      <Users size={14} />
                      Активные подключения ({connectedPeers.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {connectedPeers.map(peer => (
                          <div key={peer} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-xs font-mono text-gray-300">
                              <span className="truncate max-w-[200px]">{peer}</span>
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                          </div>
                      ))}
                  </div>
              </div>
           )}
        </div>
        
        <div className="bg-black/20 px-6 py-3 border-t border-white/5 text-[10px] text-gray-500 text-center">
           Вы можете подключить несколько друзей, чтобы создать групповой чат и звонок.
        </div>
      </div>
    </div>
  );
};

export default ConnectionManager;
