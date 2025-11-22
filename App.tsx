
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ServerList from './components/ServerList';
import ChannelList from './components/ChannelList';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import AuthScreen from './components/AuthScreen';
import SettingsModal from './components/SettingsModal';
import { INITIAL_SERVERS, INITIAL_MESSAGES, MOCK_USERS, CURRENT_USER, GEMINI_BOT, INITIAL_DMS } from './constants';
import { ChannelType, Message, User, Channel } from './types';
import { Mic, Video, Monitor, PhoneOff, MicOff, VideoOff, ScreenShare } from 'lucide-react';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  
  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');
  const [volume, setVolume] = useState(1.0);

  // --- Persistence Helpers ---
  const loadMessagesFromStorage = (): Record<string, Message[]> => {
    try {
      const saved = localStorage.getItem('rucord_messages');
      if (!saved) return INITIAL_MESSAGES;
      
      const parsed = JSON.parse(saved);
      // Revive Date objects from ISO strings
      Object.keys(parsed).forEach(channelId => {
        parsed[channelId].forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
      });
      return parsed;
    } catch (e) {
      console.error("Failed to load messages", e);
      return INITIAL_MESSAGES;
    }
  };

  const loadDMsFromStorage = (): Channel[] => {
    try {
      const saved = localStorage.getItem('rucord_dms');
      return saved ? JSON.parse(saved) : INITIAL_DMS;
    } catch (e) {
      return INITIAL_DMS;
    }
  };

  // State initialization
  const [activeServerId, setActiveServerId] = useState<string>(INITIAL_SERVERS[0].id);
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_SERVERS[0].channels[0].id);
  
  // Initialize state from LocalStorage
  const [messages, setMessages] = useState<Record<string, Message[]>>(loadMessagesFromStorage);
  const [dms, setDms] = useState<Channel[]>(loadDMsFromStorage);
  
  const [voiceState, setVoiceState] = useState({
    connected: false,
    channelId: null as string | null,
    muted: false,
    deafened: false,
    cameraOn: false,
    screenShareOn: false,
    localCameraStream: undefined as MediaStream | undefined,
    localScreenStream: undefined as MediaStream | undefined,
  });
  
  // Refs for media
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // --- Sound Service Init ---
  useEffect(() => {
    const handleInteraction = () => {
        soundService.resumeContext();
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    soundService.setVolume(volume);
  }, [volume]);

  // --- Auth Logic ---
  useEffect(() => {
    // Check for persisted session
    const savedUserId = localStorage.getItem('rucord_current_user_id');
    if (savedUserId) {
        const users = JSON.parse(localStorage.getItem('rucord_users') || '[]');
        const foundUser = users.find((u: User) => u.id === savedUserId);
        if (foundUser) {
            setCurrentUser(foundUser);
            setIsAuthenticated(true);
        }
    }
  }, []);

  // --- Persistence Effects ---
  // Save messages whenever they change
  useEffect(() => {
    localStorage.setItem('rucord_messages', JSON.stringify(messages));
  }, [messages]);

  // Save DMs whenever they change
  useEffect(() => {
    localStorage.setItem('rucord_dms', JSON.stringify(dms));
  }, [dms]);

  // --- Sound Effects Logic ---
  // Track previous voice state to play sounds on change
  const prevVoiceState = useRef(voiceState);

  useEffect(() => {
    // Connected
    if (voiceState.connected && !prevVoiceState.current.connected) {
        soundService.play('join');
    }
    // Disconnected
    if (!voiceState.connected && prevVoiceState.current.connected) {
        soundService.play('leave');
    }
    // Mute Toggle
    if (voiceState.muted !== prevVoiceState.current.muted) {
        soundService.play(voiceState.muted ? 'mute' : 'unmute');
    }
    // Deafen Toggle
    if (voiceState.deafened !== prevVoiceState.current.deafened) {
        soundService.play(voiceState.deafened ? 'deafen' : 'undeafen');
    }

    prevVoiceState.current = voiceState;
  }, [voiceState]);


  const handleRegister = async (username: string, password: string): Promise<boolean> => {
      const users = JSON.parse(localStorage.getItem('rucord_users') || '[]');
      if (users.find((u: User) => u.username === username)) {
          return false;
      }

      const newUser: User = {
          id: Date.now().toString(),
          username: username,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          status: 'online',
          password: password // In a real app, NEVER store passwords like this.
      };

      users.push(newUser);
      localStorage.setItem('rucord_users', JSON.stringify(users));
      localStorage.setItem('rucord_current_user_id', newUser.id);
      
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      return true;
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
      const users = JSON.parse(localStorage.getItem('rucord_users') || '[]');
      const foundUser = users.find((u: User) => u.username === username && u.password === password);
      
      if (foundUser) {
          localStorage.setItem('rucord_current_user_id', foundUser.id);
          setCurrentUser(foundUser);
          setIsAuthenticated(true);
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      localStorage.removeItem('rucord_current_user_id');
      setIsAuthenticated(false);
      handleDisconnectVoice();
      setActiveServerId(INITIAL_SERVERS[0].id);
  };


  // Derived state
  const activeServer = useMemo(() => 
    INITIAL_SERVERS.find(s => s.id === activeServerId), 
  [activeServerId]);

  const activeChannel = useMemo(() => {
    if (activeServerId === 'home') {
        return dms.find(c => c.id === activeChannelId) || dms[0];
    }
    return activeServer?.channels.find(c => c.id === activeChannelId) || activeServer?.channels[0] || dms[0];
  }, [activeServer, activeChannelId, activeServerId, dms]);

  const currentMessages = messages[activeChannel?.id] || [];

  const allUsers = useMemo(() => {
     // Combine Mock users with our authenticated user if needed, though for this demo we just inject currentUser
     // Also maybe pull other registered users from localStorage for "realism"
     const storedUsers = JSON.parse(localStorage.getItem('rucord_users') || '[]');
     const otherStoredUsers = storedUsers.filter((u: User) => u.id !== currentUser.id);

     return [currentUser, GEMINI_BOT, ...Object.values(MOCK_USERS).filter(u => u.id !== 'me' && u.id !== 'gemini'), ...otherStoredUsers];
  }, [currentUser]);

  const usersRecord = useMemo(() => {
      const rec: Record<string, User> = {};
      allUsers.forEach(u => rec[u.id] = u);
      return rec;
  }, [allUsers]);


  // Handlers
  const handleServerSelect = (id: string) => {
    setActiveServerId(id);
    if (id === 'home') {
        // Default DM
        if (dms.length > 0) {
            setActiveChannelId(dms[0].id);
        }
    } else {
        const server = INITIAL_SERVERS.find(s => s.id === id);
        if (server) {
            const defaultChannel = server.channels.find(c => c.type === ChannelType.TEXT);
            if (defaultChannel) setActiveChannelId(defaultChannel.id);
        }
    }
  };

  const handleChannelSelect = (id: string, type: ChannelType) => {
    if (type === ChannelType.TEXT || type === ChannelType.DM) {
      setActiveChannelId(id);
    } else {
      // Handle Voice logic
      if (voiceState.connected && voiceState.channelId === id) {
        return; 
      }
      handleStartCall(false, id);
    }
  };

  const handleCreateDM = (userId: string) => {
      const existingDM = dms.find(d => d.dmUserId === userId);
      if (existingDM) {
          setActiveChannelId(existingDM.id);
      } else {
          const targetUser = usersRecord[userId];
          const newDM: Channel = {
              id: `dm-${Date.now()}`,
              serverId: 'home',
              name: targetUser.username,
              type: ChannelType.DM,
              dmUserId: userId
          };
          setDms(prev => [newDM, ...prev]);
          setActiveChannelId(newDM.id);
          setMessages(prev => ({ ...prev, [newDM.id]: [] }));
      }
  };

  const handleSendMessage = (text: string, replyToId?: string, attachments?: { type: 'image' | 'file', url: string, name: string }[]) => {
    soundService.play('message'); // Play sound on send/receive
    
    const isAI = text.startsWith('[AI]:');
    const content = isAI ? text : text;
    const userId = isAI ? 'gemini' : currentUser.id;

    const newMessage: Message = {
      id: Date.now().toString(),
      channelId: activeChannel.id,
      userId: userId,
      content: content,
      timestamp: new Date(),
      replyToId: replyToId,
      attachments: attachments
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMessage]
    }));
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    setMessages(prev => {
        const channelMsgs = prev[activeChannel.id] || [];
        const updated = channelMsgs.map(msg => 
            msg.id === messageId ? { ...msg, content: newText, isEdited: true } : msg
        );
        return { ...prev, [activeChannel.id]: updated };
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => {
        const channelMsgs = prev[activeChannel.id] || [];
        const updated = channelMsgs.filter(msg => msg.id !== messageId);
        return { ...prev, [activeChannel.id]: updated };
    });
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => {
        const channelMsgs = prev[activeChannel.id] || [];
        const updated = channelMsgs.map(msg => {
            if (msg.id !== messageId) return msg;
            const currentReactions = msg.reactions || {};
            const users = currentReactions[emoji] || [];
            let newUsers;
            if (users.includes(currentUser.id)) {
                newUsers = users.filter(uid => uid !== currentUser.id);
            } else {
                newUsers = [...users, currentUser.id];
            }
            const newReactions = { ...currentReactions };
            if (newUsers.length === 0) {
                delete newReactions[emoji];
            } else {
                newReactions[emoji] = newUsers;
            }
            return { ...msg, reactions: newReactions };
        });
        return { ...prev, [activeChannel.id]: updated };
    });
  };

  // --- Media Handling ---

  // Helper to stop tracks in a specific stream
  const stopStreamTracks = (stream?: MediaStream) => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          stopStreamTracks(voiceState.localCameraStream);
          stopStreamTracks(voiceState.localScreenStream);
      };
  }, []);

  // Update video elements when streams change
  useEffect(() => {
      if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = voiceState.localCameraStream || null;
          if (cameraVideoRef.current && typeof (cameraVideoRef.current as any).setSinkId === 'function' && selectedSpeakerId) {
            (cameraVideoRef.current as any).setSinkId(selectedSpeakerId).catch((e: any) => console.warn("Sink ID error", e));
          }
          cameraVideoRef.current.volume = volume;
      }
  }, [voiceState.localCameraStream, selectedSpeakerId, volume]);

  useEffect(() => {
      if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = voiceState.localScreenStream || null;
          if (screenVideoRef.current && typeof (screenVideoRef.current as any).setSinkId === 'function' && selectedSpeakerId) {
             (screenVideoRef.current as any).setSinkId(selectedSpeakerId).catch((e: any) => console.warn("Sink ID error", e));
          }
          screenVideoRef.current.volume = volume;
      }
  }, [voiceState.localScreenStream, selectedSpeakerId, volume]);


  const handleStartCall = async (withVideo: boolean, targetChannelId?: string) => {
      const channelToJoin = targetChannelId || activeChannel.id;
      
      // If already connected, just return (or we could handle switching channels gracefully)
      if (voiceState.connected && voiceState.channelId === channelToJoin) {
          if (withVideo && !voiceState.cameraOn) toggleCamera();
          return;
      }

      // Clean up previous if any
      stopStreamTracks(voiceState.localCameraStream);
      stopStreamTracks(voiceState.localScreenStream);

      try {
          // Always get audio (Mic) with selected device if possible
          const constraints: MediaStreamConstraints = {
             audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
             video: withVideo ? (selectedCamId ? { deviceId: { exact: selectedCamId } } : true) : false
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          setVoiceState(prev => ({ 
              ...prev, 
              connected: true, 
              channelId: channelToJoin, 
              cameraOn: withVideo,
              localCameraStream: stream,
              // Reset screen share on new call
              screenShareOn: false,
              localScreenStream: undefined
          }));
      } catch (e) {
          console.error("Failed to get media", e);
          // Try audio only fallback
          if (withVideo) {
              handleStartCall(false, channelToJoin);
          }
      }
  };

  const toggleCamera = async () => {
      // This function toggles VIDEO track on the localCameraStream
      // It ensures we always have Audio (Mic)
      
      if (voiceState.cameraOn) {
          // Turn Camera OFF, Keep Mic
          stopStreamTracks(voiceState.localCameraStream);
           try {
            const constraints: MediaStreamConstraints = {
                audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
                video: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setVoiceState(prev => ({ ...prev, cameraOn: false, localCameraStream: stream }));
          } catch (e) { console.error(e); }
      } else {
          // Turn Camera ON, Keep Mic
           try {
            const constraints: MediaStreamConstraints = {
                audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
                video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Stop old audio-only stream
            stopStreamTracks(voiceState.localCameraStream);
            
            setVoiceState(prev => ({ ...prev, cameraOn: true, localCameraStream: stream }));
          } catch (e) { console.error(e); }
      }
  };

  const toggleScreenShare = async () => {
      if (voiceState.screenShareOn) {
          // Turn OFF
          stopStreamTracks(voiceState.localScreenStream);
          setVoiceState(prev => ({ ...prev, screenShareOn: false, localScreenStream: undefined }));
      } else {
          // Turn ON
          try {
              // Request Screen Share + System Audio
              const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
              
              // Handle "Stop Sharing" system button
              displayStream.getVideoTracks()[0].onended = () => {
                   setVoiceState(prev => ({ ...prev, screenShareOn: false, localScreenStream: undefined }));
              };

              setVoiceState(prev => ({ 
                  ...prev, 
                  screenShareOn: true, 
                  localScreenStream: displayStream 
              }));
          } catch (e) {
              console.error("Screen share cancelled or failed", e);
              if (e instanceof DOMException && e.name === 'NotAllowedError') {
                  alert("Для демонстрации экрана необходимо разрешение.");
              }
          }
      }
  };

   const handleDisconnectVoice = () => {
      stopStreamTracks(voiceState.localCameraStream);
      stopStreamTracks(voiceState.localScreenStream);
      setVoiceState(prev => ({ 
          ...prev, 
          connected: false, 
          channelId: null, 
          cameraOn: false, 
          screenShareOn: false, 
          localCameraStream: undefined,
          localScreenStream: undefined
      }));
  };
  
  const handleDeviceChange = (type: 'mic' | 'cam' | 'speaker', deviceId: string) => {
     if (type === 'mic') setSelectedMicId(deviceId);
     if (type === 'cam') setSelectedCamId(deviceId);
     if (type === 'speaker') setSelectedSpeakerId(deviceId);
     
     // If connected, we might want to restart the stream to apply changes immediately.
     // For simplicity in this demo, changes apply on next call/toggle.
     // Ideally, we would renegotiate the stream here.
  };

  // --- Render Auth Screen if not logged in ---
  if (!isAuthenticated) {
      return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // --- UI Grid Logic ---
  // Determine what to show in the video grid
  const showCallOverlay = voiceState.connected && voiceState.channelId === activeChannel.id && (voiceState.cameraOn || voiceState.screenShareOn);
  
  return (
    <div className="flex w-full h-screen bg-gray-950 overflow-hidden font-sans text-gray-100 selection:bg-blurple-500 selection:text-white" onClick={() => soundService.resumeContext()}>
      
      <nav className="shrink-0 h-full">
        <ServerList 
          servers={INITIAL_SERVERS} 
          activeServerId={activeServerId} 
          onSelectServer={handleServerSelect} 
        />
      </nav>

      <div className="flex flex-1 min-w-0 bg-gray-850 rounded-tl-3xl overflow-hidden shadow-2xl my-0 border-t border-l border-white/5 relative">
        
        <ChannelList 
          activeServerId={activeServerId}
          server={activeServer} 
          dms={dms}
          users={usersRecord}
          activeChannelId={activeChannelId} 
          onSelectChannel={handleChannelSelect}
          currentUser={currentUser}
          voiceState={voiceState}
          onToggleMute={() => setVoiceState(p => ({...p, muted: !p.muted}))}
          onToggleDeafen={() => setVoiceState(p => ({...p, deafened: !p.deafened}))}
          onChangeStatus={(s) => setCurrentUser(p => ({...p, status: s}))}
          onCreateDM={handleCreateDM}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* CALL OVERLAY */}
          {showCallOverlay ? (
              <div className="flex-1 bg-black relative flex flex-col p-4">
                  {/* Dynamic Video Grid */}
                  <div className={`flex-1 grid gap-4 items-center justify-center p-4 
                      ${(voiceState.cameraOn && voiceState.screenShareOn) ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                      
                      {/* 1. Screen Share Window (Priority) */}
                      {voiceState.screenShareOn && (
                          <div className="relative w-full h-full min-h-[200px] bg-gray-800 rounded-xl overflow-hidden border border-blurple-500 shadow-2xl flex flex-col">
                               <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-contain bg-black" />
                               <div className="absolute top-4 left-4 bg-blurple-600 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                                   <ScreenShare size={14} />
                                   ВАШ ЭКРАН
                               </div>
                          </div>
                      )}

                      {/* 2. Camera Window */}
                      <div className="relative w-full h-full min-h-[200px] bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col">
                           {voiceState.cameraOn ? (
                               <video ref={cameraVideoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <img src={currentUser.avatarUrl} className="w-24 h-24 rounded-full opacity-50" />
                               </div>
                           )}
                           <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm font-bold backdrop-blur-md flex items-center gap-2">
                               <img src={currentUser.avatarUrl} className="w-5 h-5 rounded-full"/>
                               {currentUser.username} (Вы)
                               {voiceState.muted && <MicOff size={14} className="text-red-500" />}
                           </div>
                      </div>

                      {/* 3. Mock Other User Window */}
                      <div className="relative w-full h-full min-h-[200px] bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
                           <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center animate-pulse">
                               <span className="text-2xl">👤</span>
                           </div>
                           <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm font-bold backdrop-blur-md">
                               Собеседник
                           </div>
                      </div>
                  </div>
                  
                  {/* Call Controls */}
                  <div className="h-20 flex items-center justify-center gap-4 mt-auto shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent pb-4">
                      <button onClick={() => setVoiceState(p => ({...p, muted: !p.muted}))} className={`p-4 rounded-full transition-all shadow-lg ${voiceState.muted ? 'bg-white text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>
                           {voiceState.muted ? <MicOff /> : <Mic />}
                      </button>
                      <button onClick={toggleCamera} className={`p-4 rounded-full transition-all shadow-lg ${!voiceState.cameraOn ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white text-black'}`}>
                           {voiceState.cameraOn ? <Video /> : <VideoOff />}
                      </button>
                      <button onClick={toggleScreenShare} className={`p-4 rounded-full transition-all shadow-lg ${voiceState.screenShareOn ? 'bg-blurple-500 text-white hover:bg-blurple-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                           <ScreenShare />
                      </button>
                      <button onClick={handleDisconnectVoice} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white px-8 font-bold shadow-lg">
                           <PhoneOff />
                      </button>
                  </div>
                  
                  <button 
                     onClick={() => toggleCamera()} // Quick way to collapse video if user wants
                     className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded hover:bg-black/70 z-10"
                  >
                      Свернуть видео
                  </button>
              </div>
          ) : (
             <>
                <ChatArea 
                    channel={activeChannel}
                    messages={currentMessages}
                    users={usersRecord}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onAddReaction={handleAddReaction}
                    onStartCall={(video) => handleStartCall(video)}
                />
                
                {/* Mini Floating Voice Overlay (Audio Only or Collapsed) */}
                {voiceState.connected && (
                    <div className="absolute top-4 right-4 w-64 bg-black/90 backdrop-blur-xl rounded-xl border border-green-500/30 p-3 shadow-2xl animate-fade-in z-50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">В голосовом канале</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div className="text-white font-bold truncate mb-3">
                            {activeChannel.type === ChannelType.DM ? activeChannel.name : activeChannel.name}
                        </div>
                        
                        <div className="flex justify-center gap-3">
                            <button className={`p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${voiceState.muted ? 'text-red-500 bg-white/10' : ''}`} onClick={() => setVoiceState(p => ({...p, muted: !p.muted}))}>
                                {voiceState.muted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button onClick={toggleCamera} className={`p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${voiceState.cameraOn ? 'text-green-400' : ''}`}>
                                <Video size={18} />
                            </button>
                            <button onClick={toggleScreenShare} className={`p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors ${voiceState.screenShareOn ? 'text-blurple-400' : ''}`}>
                                <Monitor size={18} />
                            </button>
                            <button onClick={handleDisconnectVoice} className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white">
                                <PhoneOff size={18} />
                            </button>
                        </div>
                    </div>
                )}
             </>
          )}
        </div>

        {activeServerId !== 'home' && <UserList users={allUsers} />}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        selectedMicId={selectedMicId}
        selectedCamId={selectedCamId}
        selectedSpeakerId={selectedSpeakerId}
        onDeviceChange={handleDeviceChange}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
};

export default App;
