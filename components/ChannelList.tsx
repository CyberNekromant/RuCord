
import React, { useState } from 'react';
import { Server, Channel, ChannelType, User } from '../types';
import { Hash, Volume2, Settings, Mic, Headphones, ChevronDown, Plus, Sparkles, Search, X, UserPlus, PhoneOff, Video, Monitor, MicOff, VideoOff, Signal, Link, Trash2 } from 'lucide-react';

interface ChannelListProps {
  activeServerId: string;
  server?: Server;
  dms: Channel[];
  users: Record<string, User>;
  activeChannelId: string;
  currentUser: User;
  voiceState: { 
    connected: boolean; 
    channelId: string | null; 
    muted: boolean; 
    deafened: boolean;
    cameraOn: boolean;
    screenShareOn: boolean;
  };
  connectedChannelName?: string;
  onSelectChannel: (channelId: string, type: ChannelType) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onChangeStatus: (status: 'online' | 'idle' | 'dnd' | 'offline') => void;
  onCreateDM: (userId: string) => void;
  onDeleteDM: (channelId: string) => void;
  onOpenSettings: () => void;
  onOpenConnectionManager: () => void;
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
  connectedChannelName,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onToggleCamera,
  onToggleScreenShare,
  onChangeStatus,
  onCreateDM,
  onDeleteDM,
  onOpenSettings,
  onOpenConnectionManager
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
        case 'idle': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]';
        case 'dnd': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
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
       <div className="w-64 bg-gray-900/60 backdrop-blur-md flex flex-col h-full shrink-0 border-r border-white/5">
          <div className="h-12 px-3 flex items-center justify-center shadow-sm z-10 mt-2 gap-2">
             <button 
                onClick={() => setIsSearching(true)}
                className="flex-1 bg-black/40 text-left text-gray-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-black/60 transition-all border border-white/5 hover:border-white/10"
             >
                <Search size={14} />
                Найти...
             </button>
             <button 
                onClick={onOpenConnectionManager}
                className="bg-blurple-500/20 hover:bg-blurple-500 text-blurple-400 hover:text-white p-2 rounded-lg transition-all border border-blurple-500/30"
                title="P2P Connect"
             >
                <Link size={14} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
            {/* Search UI Overlay */}
            {isSearching ? (
               <div className="space-y-1 animate-fade-in">
                 <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Поиск</span>
                    <button onClick={() => { setIsSearching(false); setDmSearchQuery(''); }} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                 </div>
                 <input 
                    autoFocus
                    type="text" 
                    placeholder="Имя пользователя..."
                    className="w-full bg-black/40 border border-blurple-500/50 text-gray-200 px-3 py-2 rounded-lg mb-2 text-sm focus:outline-none focus:ring-1 focus:ring-blurple-500"
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                 />
                 <div className="space-y-1 mt-2">
                    {filteredUsers.map(user => (
                        <button 
                           key={user.id}
                           onClick={() => { onCreateDM(user.id); setIsSearching(false); setDmSearchQuery(''); }}
                           className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                            <div className="relative">
                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${getStatusColor(user.status)}`}/>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-200">{user.username}</span>
                            </div>
                            <UserPlus size={16} className="ml-auto text-gray-500 opacity-0 group-hover:opacity-100 hover:text-green-500 transition-all" />
                        </button>
                    ))}
                 </div>
               </div>
            ) : (
               <>
                 <div className="flex items-center justify-between px-4 mb-2 mt-2 text-gray-400 group">
                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">Личные сообщения</span>
                    <Plus size={14} className="hover:text-white cursor-pointer transition-colors" onClick={() => setIsSearching(true)} />
                 </div>
                 <div className="space-y-1">
                    {dms.map(dm => {
                        // Use a fallback object instead of defaulting to 'gemini' if user data hasn't loaded
                        const otherUser = users[dm.dmUserId!] || { 
                          id: '?', 
                          username: 'Загрузка...', 
                          avatarUrl: '', 
                          status: 'offline' 
                        } as User;
                        
                        const isActive = activeChannelId === dm.id;
                        return (
                            <button
                                key={dm.id}
                                onClick={() => onSelectChannel(dm.id, ChannelType.DM)}
                                className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group gap-3 relative overflow-hidden
                                ${isActive 
                                    ? 'bg-white/10 text-white shadow-md backdrop-blur-sm border border-white/5' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blurple-500"></div>}
                                <div className="relative shrink-0">
                                    <img src={otherUser.avatarUrl} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(otherUser.status)}`}/>
                                </div>
                                <span className="font-medium truncate text-sm flex-1 text-left">{otherUser.username}</span>
                                
                                {dm.activeUsers && dm.activeUsers.length > 0 ? (
                                    <Volume2 size={14} className="ml-auto text-green-500 animate-pulse" />
                                ) : (
                                    <div 
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/40 rounded text-gray-400 hover:text-red-400"
                                      onClick={(e) => { e.stopPropagation(); onDeleteDM(dm.id); }}
                                      title="Удалить чат"
                                    >
                                       <Trash2 size={14} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                 </div>
               </>
            )}
          </div>
          
          <VoiceStatusPanel 
            voiceState={voiceState}
            channelName={connectedChannelName}
            onToggleMute={onToggleMute}
            onDisconnect={onDisconnect}
            onToggleCamera={onToggleCamera}
            onToggleScreenShare={onToggleScreenShare}
            onOpenOverlay={() => voiceState.channelId && onSelectChannel(voiceState.channelId, ChannelType.VOICE)}
          />

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
    <div className="w-64 bg-gray-900/60 backdrop-blur-md flex flex-col h-full shrink-0 border-r border-white/5">
      {/* Server Header */}
      <button className="h-12 px-4 flex items-center justify-between hover:bg-white/5 transition-colors shadow-sm z-10 border-b border-white/5">
        <h1 className="font-bold truncate text-white text-base">{server.name}</h1>
        <ChevronDown size={16} />
      </button>

      {/* Channels Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar px-2">
        
        {/* Text Channels */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1 text-gray-400 hover:text-gray-300 cursor-pointer group">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Текстовые</span>
            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-[2px]">
            {textChannels.map(channel => {
               const isActive = activeChannelId === channel.id;
               return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id, ChannelType.TEXT)}
                className={`w-full flex items-center px-2 py-1.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-blurple-500/10 text-white border border-blurple-500/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
              >
                {channel.name === 'ai-chat' ? <Sparkles size={18} className="mr-1.5 text-pink-400" /> : <Hash size={18} className="mr-1.5 opacity-60" />}
                <span className="font-medium truncate text-sm">{channel.name}</span>
              </button>
            )})}
          </div>
        </div>

        {/* Voice Channels */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1 text-gray-400 hover:text-gray-300 cursor-pointer group">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Голосовые</span>
            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-[2px]">
            {voiceChannels.map(channel => {
               const isConnected = voiceState.connected && voiceState.channelId === channel.id;
               return (
                <div key={channel.id} className="mb-1">
                  <button
                    onClick={() => onSelectChannel(channel.id, ChannelType.VOICE)}
                    className={`w-full flex items-center px-2 py-1.5 rounded-lg transition-all duration-200 group
                      ${isConnected
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                  >
                    <Volume2 size={18} className="mr-1.5 opacity-60" />
                    <span className="font-medium truncate text-sm">{channel.name}</span>
                  </button>
                  
                  {/* Connected Users (Mock) */}
                  {(channel.activeUsers || isConnected) && (
                    <div className="ml-6 pl-2 border-l border-white/10 mt-1 space-y-1">
                      {isConnected && (
                         <div className="flex items-center gap-2 bg-black/40 p-1 rounded-md border border-white/5">
                            <img src={currentUser.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                            <span className="text-xs font-semibold text-white truncate">{currentUser.username}</span>
                         </div>
                      )}
                      {channel.activeUsers?.map(uid => (
                        <div key={uid} className="flex items-center gap-2 px-1">
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

      <VoiceStatusPanel 
        voiceState={voiceState}
        channelName={connectedChannelName}
        onToggleMute={onToggleMute}
        onDisconnect={onDisconnect}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onOpenOverlay={() => voiceState.channelId && onSelectChannel(voiceState.channelId, ChannelType.VOICE)}
      />

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

const VoiceStatusPanel = ({ voiceState, channelName, onToggleMute, onDisconnect, onToggleCamera, onToggleScreenShare, onOpenOverlay }: any) => {
  if (!voiceState.connected) return null;

  return (
    <div className="bg-gray-950/80 backdrop-blur-md border-t border-white/5 p-2">
      <div 
        onClick={onOpenOverlay}
        className="bg-green-500/5 border border-green-500/20 rounded-xl p-2 cursor-pointer hover:bg-green-500/10 transition-colors"
      >
        <div className="flex items-center justify-between mb-2 px-1 pointer-events-none">
           <div className="flex items-center gap-2 overflow-hidden">
              <Signal size={14} className="text-green-500 shrink-0" />
              <div className="flex flex-col min-w-0">
                 <span className="text-green-500 text-[10px] font-bold uppercase tracking-wide leading-none">Подключено</span>
                 <span className="text-gray-200 text-xs font-bold truncate leading-tight">{channelName || 'Voice Channel'}</span>
              </div>
           </div>
        </div>
        
        <div className="flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onToggleMute} className={`flex-1 p-1.5 rounded-lg flex justify-center transition-colors ${voiceState.muted ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-gray-700'}`}>
                {voiceState.muted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button onClick={onToggleCamera} className={`flex-1 p-1.5 rounded-lg flex justify-center transition-colors ${voiceState.cameraOn ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-gray-700'}`}>
               {voiceState.cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
            <button onClick={onToggleScreenShare} className={`flex-1 p-1.5 rounded-lg flex justify-center transition-colors ${voiceState.screenShareOn ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-gray-700'}`}>
                <Monitor size={16} />
            </button>
            <button onClick={onDisconnect} className="flex-1 p-1.5 rounded-lg flex justify-center bg-black/40 text-gray-400 hover:bg-red-500 hover:text-white transition-colors">
                <PhoneOff size={16} />
            </button>
        </div>
      </div>
    </div>
  )
}

const UserControlPanel = ({ currentUser, voiceState, onToggleMute, onToggleDeafen, showStatusMenu, setShowStatusMenu, onChangeStatus, getStatusColor, onOpenSettings }: any) => (
    <div className="p-2 bg-black/40 backdrop-blur-xl border-t border-white/5 relative">
        {/* Status Popover */}
        {showStatusMenu && (
            <div className="absolute bottom-full left-2 mb-2 w-48 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl p-1 overflow-hidden animate-slide-up backdrop-blur-xl z-50">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">Менять статус</div>
                {[
                    { id: 'online', label: 'В сети', color: 'bg-green-500' },
                    { id: 'idle', label: 'Не активен', color: 'bg-yellow-500' },
                    { id: 'dnd', label: 'Не беспокоить', color: 'bg-red-500' },
                    { id: 'offline', label: 'Невидимка', color: 'bg-gray-500' },
                ].map((s) => (
                    <button 
                        key={s.id}
                        onClick={() => { onChangeStatus(s.id as any); setShowStatusMenu(false); }}
                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blurple-500 hover:text-white text-gray-300 text-sm transition-colors"
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
                        {s.label}
                    </button>
                ))}
            </div>
        )}

        <div className="flex items-center justify-between bg-white/5 rounded-xl p-1.5 border border-white/5 shadow-lg hover:border-white/10 transition-all">
            <div 
                className="flex items-center gap-2 cursor-pointer group min-w-0 mr-2 pl-1"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
                <div className="relative shrink-0">
                    <img src={currentUser.avatarUrl} alt="Me" className="w-8 h-8 rounded-full bg-gray-700 object-cover border border-black" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(currentUser.status)} border-2 border-gray-900 rounded-full`}></div>
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-white text-xs leading-tight truncate group-hover:text-blurple-300 transition-colors">{currentUser.username}</div>
                    <div className="text-[10px] text-gray-400 leading-tight font-mono">#{currentUser.id.substring(0, 4)}</div>
                </div>
            </div>
            
            <div className="flex items-center gap-0.5">
                <button onClick={onToggleMute} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${voiceState.muted ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white'}`}>
                    <Mic size={14} className={voiceState.muted ? "fill-current" : ""} />
                </button>
                <button onClick={onToggleDeafen} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${voiceState.deafened ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-white'}`}>
                    <Headphones size={14} className={voiceState.deafened ? "fill-current" : ""} />
                </button>
                <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <Settings size={14} />
                </button>
            </div>
        </div>
    </div>
);

export default ChannelList;
