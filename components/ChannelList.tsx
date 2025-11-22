
import React, { useState } from 'react';
import { Server, Channel, ChannelType, User } from '../types';
import { Hash, Volume2, Settings, Mic, Headphones, ChevronDown, Plus, Sparkles, Search, X, UserPlus, MessageSquare } from 'lucide-react';

interface ChannelListProps {
  activeServerId: string;
  server?: Server;
  dms: Channel[];
  users: Record<string, User>;
  activeChannelId: string;
  currentUser: User;
  voiceState: { connected: boolean; channelId: string | null; muted: boolean; deafened: boolean };
  onSelectChannel: (channelId: string, type: ChannelType) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onChangeStatus: (status: 'online' | 'idle' | 'dnd' | 'offline') => void;
  onCreateDM: (userId: string) => void;
  onOpenSettings: () => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  activeServerId,
  server, 
  dms,
  users,
  activeChannelId, 
  onSelectChannel,
  currentUser,
  voiceState,
  onToggleMute,
  onToggleDeafen,
  onChangeStatus,
  onCreateDM,
  onOpenSettings
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'online': return 'bg-green-500';
        case 'idle': return 'bg-yellow-500';
        case 'dnd': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
  };

  // --- DM View Logic ---
  if (activeServerId === 'home') {
    const filteredUsers = Object.values(users).filter(u => 
      u.id !== currentUser.id && 
      u.username.toLowerCase().includes(dmSearchQuery.toLowerCase())
    );

    return (
       <div className="w-64 bg-gray-850 flex flex-col h-full shrink-0 border-r border-gray-950/50">
          <div className="h-12 px-4 flex items-center justify-center border-b border-black/10 shadow-sm z-10">
             <button 
                onClick={() => setIsSearching(true)}
                className="w-full bg-gray-950 text-left text-gray-400 text-xs px-2 py-1.5 rounded flex items-center gap-2 hover:bg-gray-900 transition-colors"
             >
                <Search size={14} />
                Найти или начать беседу
             </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            {/* Search UI Overlay */}
            {isSearching ? (
               <div className="px-2 space-y-1">
                 <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Поиск людей</span>
                    <button onClick={() => { setIsSearching(false); setDmSearchQuery(''); }} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                 </div>
                 <input 
                    autoFocus
                    type="text" 
                    placeholder="Имя пользователя..."
                    className="w-full bg-gray-950 text-gray-200 px-3 py-2 rounded mb-2 text-sm focus:outline-none focus:ring-1 focus:ring-blurple-500"
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                 />
                 <div className="space-y-1 mt-2">
                    {filteredUsers.map(user => (
                        <button 
                           key={user.id}
                           onClick={() => { onCreateDM(user.id); setIsSearching(false); setDmSearchQuery(''); }}
                           className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-800 transition-colors group"
                        >
                            <div className="relative">
                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-850 ${getStatusColor(user.status)}`}/>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-200">{user.username}</span>
                                <span className="text-xs text-gray-500">Нажмите для чата</span>
                            </div>
                            <UserPlus size={16} className="ml-auto text-gray-500 opacity-0 group-hover:opacity-100 hover:text-green-500" />
                        </button>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="text-center text-gray-500 text-xs py-4">Никого не найдено</div>
                    )}
                 </div>
               </div>
            ) : (
               <>
                 <div className="flex items-center justify-between px-4 mb-1 text-gray-400 group">
                    <span className="text-xs font-bold uppercase tracking-wide">Личные сообщения</span>
                    <Plus size={14} className="hover:text-gray-200 cursor-pointer" onClick={() => setIsSearching(true)} />
                 </div>
                 <div className="px-2 space-y-[2px]">
                    {dms.map(dm => {
                        const otherUser = users[dm.dmUserId!] || users['gemini'];
                        return (
                            <button
                                key={dm.id}
                                onClick={() => onSelectChannel(dm.id, ChannelType.DM)}
                                className={`w-full flex items-center px-2 py-2 rounded-md transition-all duration-200 group gap-3
                                ${activeChannelId === dm.id 
                                    ? 'bg-gray-750 text-white' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                            >
                                <div className="relative">
                                    <img src={otherUser.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-850 ${getStatusColor(otherUser.status)}`}/>
                                </div>
                                <span className="font-medium truncate text-sm">{otherUser.username}</span>
                                {dm.activeUsers && dm.activeUsers.length > 0 && (
                                    <Volume2 size={14} className="ml-auto text-green-500" />
                                )}
                            </button>
                        );
                    })}
                 </div>
               </>
            )}
          </div>

          <UserControlPanel 
             currentUser={currentUser} 
             voiceState={voiceState} 
             onToggleMute={onToggleMute} 
             onToggleDeafen={onToggleDeafen} 
             showStatusMenu={showStatusMenu}
             setShowStatusMenu={setShowStatusMenu}
             onChangeStatus={onChangeStatus}
             getStatusColor={getStatusColor}
             onOpenSettings={onOpenSettings}
          />
       </div>
    );
  }

  // --- Server View Logic ---
  if (!server) return null;

  const textChannels = server.channels.filter(c => c.type === ChannelType.TEXT);
  const voiceChannels = server.channels.filter(c => c.type === ChannelType.VOICE);

  return (
    <div className="w-64 bg-gray-850 flex flex-col h-full shrink-0 border-r border-gray-950/50">
      {/* Server Header */}
      <button className="h-12 px-4 flex items-center justify-between hover:bg-gray-750 transition-colors shadow-sm z-10">
        <h1 className="font-bold truncate text-white">{server.name}</h1>
        <ChevronDown size={16} />
      </button>

      {/* Channels Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-6 custom-scrollbar">
        
        {/* Text Channels */}
        <div>
          <div className="flex items-center justify-between px-4 mb-1 text-gray-400 hover:text-gray-300 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-wide">Текстовые каналы</span>
            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="px-2 space-y-[2px]">
            {textChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id, ChannelType.TEXT)}
                className={`w-full flex items-center px-2 py-[6px] rounded-md transition-all duration-200 group
                  ${activeChannelId === channel.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:bg-gray-750 hover:text-gray-200'
                  }`}
              >
                {channel.name === 'ai-chat' ? <Sparkles size={18} className="mr-1.5 text-pink-400" /> : <Hash size={18} className="mr-1.5 text-gray-500" />}
                <span className="font-medium truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Channels */}
        <div>
          <div className="flex items-center justify-between px-4 mb-1 text-gray-400 hover:text-gray-300 cursor-pointer group">
            <span className="text-xs font-bold uppercase tracking-wide">Голосовые каналы</span>
            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="px-2 space-y-[2px]">
            {voiceChannels.map(channel => {
               const isConnected = voiceState.connected && voiceState.channelId === channel.id;
               return (
                <div key={channel.id} className="mb-1">
                  <button
                    onClick={() => onSelectChannel(channel.id, ChannelType.VOICE)}
                    className={`w-full flex items-center px-2 py-[6px] rounded-md transition-all duration-200 group
                      ${isConnected
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:bg-gray-750 hover:text-gray-200'
                      }`}
                  >
                    <Volume2 size={18} className="mr-1.5 text-gray-500" />
                    <span className="font-medium truncate">{channel.name}</span>
                  </button>
                  
                  {/* Connected Users (Mock) */}
                  {(channel.activeUsers || isConnected) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {isConnected && (
                         <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-md border border-green-500/30">
                            <img src={currentUser.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                            <span className="text-xs font-semibold text-white truncate">{currentUser.username}</span>
                         </div>
                      )}
                      {channel.activeUsers?.map(uid => (
                        <div key={uid} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-600" />
                          <span className="text-xs text-gray-400">User {uid}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <UserControlPanel 
         currentUser={currentUser} 
         voiceState={voiceState} 
         onToggleMute={onToggleMute} 
         onToggleDeafen={onToggleDeafen} 
         showStatusMenu={showStatusMenu}
         setShowStatusMenu={setShowStatusMenu}
         onChangeStatus={onChangeStatus}
         getStatusColor={getStatusColor}
         onOpenSettings={onOpenSettings}
      />
    </div>
  );
};

const UserControlPanel = ({ currentUser, voiceState, onToggleMute, onToggleDeafen, showStatusMenu, setShowStatusMenu, onChangeStatus, getStatusColor, onOpenSettings }: any) => (
    <div className="bg-gray-900/80 backdrop-blur-md p-2 flex items-center justify-between border-t border-white/5 relative z-20">
        {/* Status Popover */}
        {showStatusMenu && (
            <div className="absolute bottom-full left-2 mb-2 w-48 bg-gray-950 border border-gray-800 rounded-lg shadow-2xl p-1 overflow-hidden">
                <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase mb-1">Менять статус</div>
                {[
                    { id: 'online', label: 'В сети', color: 'bg-green-500' },
                    { id: 'idle', label: 'Не активен', color: 'bg-yellow-500' },
                    { id: 'dnd', label: 'Не беспокоить', color: 'bg-red-500' },
                    { id: 'offline', label: 'Невидимка', color: 'bg-gray-500' },
                ].map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => { onChangeStatus(s.id as any); setShowStatusMenu(false); }}
                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blurple-500 hover:text-white text-gray-300 text-sm"
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
                        {s.label}
                    </button>
                ))}
            </div>
        )}

        <div 
            className="flex items-center gap-2 hover:bg-white/5 p-1 rounded cursor-pointer transition-colors flex-1 min-w-0"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
        >
          <div className="relative">
            <img src={currentUser.avatarUrl} alt="Me" className="w-8 h-8 rounded-full bg-gray-700 object-cover" />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(currentUser.status)} border-2 border-gray-900 rounded-full`}></div>
          </div>
          <div className="text-sm truncate">
            <div className="font-bold text-white leading-tight truncate">{currentUser.username}</div>
            <div className="text-xs text-gray-400 leading-tight">#{currentUser.id.substring(0, 4)}</div>
          </div>
        </div>
        
        <div className="flex items-center shrink-0">
          <button onClick={onToggleMute} className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${voiceState.muted ? 'text-red-500' : 'text-gray-200'}`}>
            <Mic size={18} className={voiceState.muted ? "fill-current" : ""} />
          </button>
          <button onClick={onToggleDeafen} className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${voiceState.deafened ? 'text-red-500' : 'text-gray-200'}`}>
            <Headphones size={18} className={voiceState.deafened ? "fill-current" : ""} />
          </button>
          <button onClick={onOpenSettings} className="p-1.5 rounded hover:bg-gray-700 text-gray-200 hover:text-gray-100 transition-colors" title="Настройки">
            <Settings size={18} />
          </button>
        </div>
      </div>
);

export default ChannelList;
