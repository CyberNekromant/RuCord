
import React, { useState } from 'react';
import { User } from '../types';
import { X } from 'lucide-react';

interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Group by status or role (Mocking logic here)
  const onlineUsers = users.filter(u => u.status !== 'offline');
  const offlineUsers = users.filter(u => u.status === 'offline');

  const renderUser = (user: User) => (
    <div 
        key={user.id} 
        onClick={() => setSelectedUser(user)}
        className="flex items-center gap-3 p-2 hover:bg-gray-850 rounded-md cursor-pointer transition-colors group opacity-90 hover:opacity-100"
    >
      <div className="relative">
        <img src={user.avatarUrl} alt={user.username} className={`w-8 h-8 rounded-full object-cover ${user.status === 'offline' ? 'grayscale opacity-50' : ''}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[3px] border-gray-950 rounded-full
          ${user.status === 'online' ? 'bg-green-500' : 
            user.status === 'idle' ? 'bg-yellow-500' :
            user.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} 
        />
      </div>
      <div>
        <div className={`font-medium text-sm flex items-center gap-1 ${user.status === 'offline' ? 'text-gray-500' : 'text-gray-300 group-hover:text-gray-100'}`}>
          {user.username}
          {user.isBot && (
            <span className="bg-blurple-500 text-white text-[10px] px-1 rounded flex items-center h-4 leading-none">BOT</span>
          )}
        </div>
        {user.isBot && <div className="text-[10px] text-blurple-400">Gemini Powered</div>}
      </div>
    </div>
  );

  return (
    <>
        <div className="w-60 bg-gray-950 flex flex-col h-full shrink-0 p-3 overflow-y-auto custom-scrollbar hidden lg:flex border-l border-gray-900">
            <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">В сети — {onlineUsers.length}</h3>
                {onlineUsers.map(renderUser)}
            </div>
            
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Не в сети — {offlineUsers.length}</h3>
                {offlineUsers.map(renderUser)}
            </div>
        </div>

        {/* User Profile Popout Overlay */}
        {selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={() => setSelectedUser(null)}>
                <div className="bg-gray-950 w-80 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-800 scale-100 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                     {/* Banner */}
                    <div className="h-24 w-full relative" style={{backgroundColor: selectedUser.bannerColor || '#5865F2'}}>
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="px-4 pb-4 relative">
                        {/* Avatar */}
                        <div className="relative -mt-10 mb-3 inline-block">
                            <img src={selectedUser.avatarUrl} className="w-20 h-20 rounded-full border-[6px] border-gray-950 object-cover bg-gray-800" />
                            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[4px] border-gray-950 
                                ${selectedUser.status === 'online' ? 'bg-green-500' : 
                                selectedUser.status === 'idle' ? 'bg-yellow-500' :
                                selectedUser.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} 
                            />
                        </div>
                        
                        <div className="bg-gray-900/50 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xl font-bold text-white">{selectedUser.username}</span>
                                {selectedUser.isBot && <span className="bg-blurple-500 text-white text-[10px] px-1 rounded font-bold">BOT</span>}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mb-3">#{selectedUser.id.substring(0, 8)}</div>
                            
                            <div className="w-full h-[1px] bg-white/10 mb-3" />
                            
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">ОБО МНЕ</h4>
                            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed min-h-[40px]">
                                {selectedUser.aboutMe || <span className="italic opacity-40 text-xs">У пользователя нет описания.</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default UserList;
