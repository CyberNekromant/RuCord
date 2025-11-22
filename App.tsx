
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ServerList from './components/ServerList';
import ChannelList from './components/ChannelList';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import AuthScreen from './components/AuthScreen';
import SettingsModal from './components/SettingsModal';
import ConnectionManager from './components/ConnectionManager';
import { INITIAL_SERVERS, INITIAL_MESSAGES, MOCK_USERS, CURRENT_USER, GEMINI_BOT, INITIAL_DMS } from './constants';
import { ChannelType, Message, User, Channel, ConnectionState } from './types';
import { Mic, Video, Monitor, PhoneOff, MicOff, VideoOff, ScreenShare, LayoutGrid, Maximize2, Wifi, Signal } from 'lucide-react';
import { soundService } from './services/soundService';
import { Peer, DataConnection, MediaConnection } from 'peerjs';

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

  // --- P2P State ---
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
  // Multi-peer references
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const callsRef = useRef<Map<string, MediaConnection>>(new Map());
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

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
    remoteStreams: {} as Record<string, MediaStream>, // Map peerId -> Stream
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

  // --- P2P Logic Initialization ---
  useEffect(() => {
    if (isAuthenticated && !peerRef.current) {
       const peer = new Peer();
       
       peer.on('open', (id) => {
           console.log('My Peer ID:', id);
           setMyPeerId(id);
       });

       peer.on('connection', (conn) => {
           console.log('Incoming connection from:', conn.peer);
           handleIncomingConnection(conn);
       });

       peer.on('call', (call) => {
           console.log('Incoming call from:', call.peer);
           handleIncomingCall(call);
       });

       peerRef.current = peer;
    }
  }, [isAuthenticated]);

  const handleConnectPeer = (peerId: string) => {
      if (!peerRef.current) return;
      if (connectionsRef.current.has(peerId)) return; // Already connected

      setConnectionStatus(ConnectionState.CONNECTING);
      const conn = peerRef.current.connect(peerId);
      handleIncomingConnection(conn);
  };

  const handleIncomingConnection = (conn: DataConnection) => {
      conn.on('open', () => {
          connectionsRef.current.set(conn.peer, conn);
          setConnectedPeers(prev => [...prev, conn.peer]);
          setConnectionStatus(ConnectionState.CONNECTED);
          
          // Send handshake
          conn.send({ type: 'handshake', user: currentUser });

          // If we are already in a call, try to call this new peer immediately?
          if (voiceState.connected && voiceState.localCameraStream) {
             callPeer(conn.peer, voiceState.localCameraStream);
          }
      });

      conn.on('data', (data: any) => {
          if (data.type === 'message') {
              receiveP2PMessage(data.message);
          } else if (data.type === 'handshake') {
              console.log('Handshake received:', data.user);
          }
      });

      conn.on('close', () => {
          connectionsRef.current.delete(conn.peer);
          setConnectedPeers(prev => prev.filter(p => p !== conn.peer));
          
          // Remove stream if exists
          setVoiceState(prev => {
              const newStreams = { ...prev.remoteStreams };
              delete newStreams[conn.peer];
              return { ...prev, remoteStreams: newStreams };
          });

          if (connectionsRef.current.size === 0) {
              setConnectionStatus(ConnectionState.DISCONNECTED);
          }
      });
      
      conn.on('error', (err) => {
          console.error('Connection Error:', err);
          connectionsRef.current.delete(conn.peer);
          setConnectedPeers(prev => prev.filter(p => p !== conn.peer));
      });
  };

  const broadcastMessage = (msg: Message) => {
      connectionsRef.current.forEach(conn => {
          if (conn.open) {
              conn.send({ type: 'message', message: msg });
          }
      });
  };

  const handleIncomingCall = (call: MediaConnection) => {
      callsRef.current.set(call.peer, call);
      
      // Answer automatically with local stream if available
      const streamToAnswer = voiceState.localCameraStream || undefined;
      
      call.answer(streamToAnswer);
      
      // If we didn't have a stream, we just answered to receive theirs.
      // But if we answered with a stream, we should update state connected.
      if (!voiceState.connected) {
          setVoiceState(prev => ({
             ...prev,
             connected: true,
             channelId: activeChannelId, // Assume P2P call is in current channel
          }));
      }

      call.on('stream', (remoteStream) => {
          setVoiceState(prev => ({
              ...prev,
              remoteStreams: { ...prev.remoteStreams, [call.peer]: remoteStream }
          }));
      });
      
      call.on('close', () => {
           setVoiceState(prev => {
              const newStreams = { ...prev.remoteStreams };
              delete newStreams[call.peer];
              return { ...prev, remoteStreams: newStreams };
          });
          callsRef.current.delete(call.peer);
      });
  };
  
  const callPeer = (peerId: string, stream: MediaStream) => {
      if (!peerRef.current) return;
      const call = peerRef.current.call(peerId, stream);
      callsRef.current.set(peerId, call);
      
      call.on('stream', (remoteStream) => {
          setVoiceState(prev => ({
              ...prev,
              remoteStreams: { ...prev.remoteStreams, [peerId]: remoteStream }
          }));
      });
  };

  const receiveP2PMessage = (msg: Message) => {
      soundService.play('message');
      setMessages(prev => ({
          ...prev,
          [msg.channelId]: [...(prev[msg.channelId] || []), msg]
      }));
  };


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

  const handleUpdateProfile = (updates: Partial<User>) => {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);

      // Update in local storage users list
      const users = JSON.parse(localStorage.getItem('rucord_users') || '[]');
      const updatedUsers = users.map((u: User) => u.id === currentUser.id ? updatedUser : u);
      localStorage.setItem('rucord_users', JSON.stringify(updatedUsers));
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
      // Voice Channel Logic
      setActiveChannelId(id);
      
      if (!voiceState.connected || voiceState.channelId !== id) {
        handleStartCall(false, id);
      }
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
    soundService.play('message'); 
    
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

    // Broadcast P2P to ALL connected peers
    broadcastMessage(newMessage);
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
  const stopStreamTracks = (stream?: MediaStream) => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
  };

  useEffect(() => {
      return () => {
          stopStreamTracks(voiceState.localCameraStream);
          stopStreamTracks(voiceState.localScreenStream);
          Object.values(voiceState.remoteStreams).forEach(s => stopStreamTracks(s));
      };
  }, []);

  // Update video elements
  useEffect(() => {
      if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = voiceState.localCameraStream || null;
          cameraVideoRef.current.volume = 0;
      }
  }, [voiceState.localCameraStream]);

  useEffect(() => {
      if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = voiceState.localScreenStream || null;
          screenVideoRef.current.volume = 0;
      }
  }, [voiceState.localScreenStream]);


  const handleStartCall = async (withVideo: boolean, targetChannelId?: string) => {
      const channelToJoin = targetChannelId || activeChannel.id;
      
      // If already connected, switch camera state
      if (voiceState.connected && voiceState.channelId === channelToJoin) {
          if (withVideo && !voiceState.cameraOn) toggleCamera();
          return;
      }

      stopStreamTracks(voiceState.localCameraStream);
      stopStreamTracks(voiceState.localScreenStream);

      try {
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
              screenShareOn: false,
              localScreenStream: undefined
          }));

          // Call ALL connected peers
          connectionsRef.current.forEach((conn, peerId) => {
               callPeer(peerId, stream);
          });

      } catch (e) {
          console.error("Failed to get media", e);
          if (withVideo) handleStartCall(false, channelToJoin);
      }
  };

  const toggleCamera = async () => {
      if (voiceState.cameraOn) {
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
           try {
            const constraints: MediaStreamConstraints = {
                audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
                video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stopStreamTracks(voiceState.localCameraStream);
            setVoiceState(prev => ({ ...prev, cameraOn: true, localCameraStream: stream }));
            
            // In a real app, we need to replaceTracks in active peer calls here
            // callRef.current.peerConnection.getSenders()...
          } catch (e) { console.error(e); }
      }
  };

  const toggleScreenShare = async () => {
      if (voiceState.screenShareOn) {
          stopStreamTracks(voiceState.localScreenStream);
          setVoiceState(prev => ({ ...prev, screenShareOn: false, localScreenStream: undefined }));
      } else {
          try {
              const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
              displayStream.getVideoTracks()[0].onended = () => {
                   setVoiceState(prev => ({ ...prev, screenShareOn: false, localScreenStream: undefined }));
              };
              setVoiceState(prev => ({ 
                  ...prev, 
                  screenShareOn: true, 
                  localScreenStream: displayStream 
              }));
              
              // Note: Need to add screen stream to peer connection in real implementation
          } catch (e) {
              console.error("Screen share cancelled", e);
          }
      }
  };

   const handleDisconnectVoice = () => {
      stopStreamTracks(voiceState.localCameraStream);
      stopStreamTracks(voiceState.localScreenStream);
      
      // Close all calls
      callsRef.current.forEach(call => call.close());
      callsRef.current.clear();
      
      setVoiceState(prev => ({ 
          ...prev, 
          connected: false, 
          channelId: null, 
          cameraOn: false, 
          screenShareOn: false, 
          localCameraStream: undefined,
          localScreenStream: undefined,
          remoteStreams: {}
      }));
  };
  
  const handleDeviceChange = (type: 'mic' | 'cam' | 'speaker', deviceId: string) => {
     if (type === 'mic') setSelectedMicId(deviceId);
     if (type === 'cam') setSelectedCamId(deviceId);
     if (type === 'speaker') setSelectedSpeakerId(deviceId);
  };

  if (!isAuthenticated) {
      return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const showCallOverlay = voiceState.connected && voiceState.channelId === activeChannel.id;
  
  let connectedChannelName = '';
  if (voiceState.connected && voiceState.channelId) {
      const inCurrentServer = activeServer?.channels.find(c => c.id === voiceState.channelId);
      if (inCurrentServer) connectedChannelName = inCurrentServer.name;
      else {
          for (const s of INITIAL_SERVERS) {
              const ch = s.channels.find(c => c.id === voiceState.channelId);
              if (ch) { connectedChannelName = `${ch.name} / ${s.name}`; break; }
          }
      }
  }

  return (
    <div className="flex w-full h-screen font-sans text-gray-100 selection:bg-blurple-500 selection:text-white relative z-0" onClick={() => soundService.resumeContext()}>
      <div className="absolute inset-0 z-0 pointer-events-none bg-black/10" />

      <nav className="shrink-0 h-full relative z-20">
        <ServerList servers={INITIAL_SERVERS} activeServerId={activeServerId} onSelectServer={handleServerSelect} />
      </nav>

      <div className="flex flex-1 min-w-0 bg-gray-900/40 backdrop-blur-md rounded-tl-[32px] overflow-hidden shadow-2xl my-2 mr-2 border border-white/5 relative z-10">
        <ChannelList 
          activeServerId={activeServerId}
          server={activeServer} 
          dms={dms}
          users={usersRecord}
          activeChannelId={activeChannelId} 
          onSelectChannel={handleChannelSelect}
          currentUser={currentUser}
          voiceState={voiceState}
          connectedChannelName={connectedChannelName}
          onToggleMute={() => setVoiceState(p => ({...p, muted: !p.muted}))}
          onToggleDeafen={() => setVoiceState(p => ({...p, deafened: !p.deafened}))}
          onDisconnect={handleDisconnectVoice}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onChangeStatus={(s) => setCurrentUser(p => ({...p, status: s}))}
          onCreateDM={handleCreateDM}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenConnectionManager={() => setIsConnectionManagerOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 relative bg-white/5 min-h-0 overflow-hidden">
          {showCallOverlay ? (
              <div className="flex-1 bg-black relative flex flex-col p-0 overflow-hidden">
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                     <Signal size={14} className="text-green-500" />
                     <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Connected: {activeChannel.name}</span>
                  </div>
                  <button onClick={() => toggleCamera()} className="absolute top-4 right-4 z-20 bg-black/60 text-white px-3 py-1.5 rounded-full border border-white/10 hover:bg-gray-800 transition-colors text-xs font-medium">
                      <MinimizeUI />
                  </button>

                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex items-center justify-center">
                      <div className={`grid gap-4 w-full max-w-7xl transition-all duration-300
                          ${voiceState.screenShareOn 
                             ? 'grid-cols-1 lg:grid-cols-[3fr_1fr] h-full' 
                             : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(200px,1fr)]'
                          }
                      `}>
                          
                          {voiceState.screenShareOn && (
                              <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-blurple-500/50 shadow-2xl group col-span-1 lg:row-span-2 h-full">
                                   <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-contain bg-black" />
                                   <div className="absolute top-4 left-4 bg-blurple-600 px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-lg border border-white/10 z-10">
                                       <ScreenShare size={14} />
                                       LIVE SCREEN
                                   </div>
                              </div>
                          )}

                          {/* Local User */}
                          <div className={`relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg flex flex-col group
                               ${voiceState.screenShareOn ? 'h-[250px]' : 'min-h-[250px]'}
                          `}>
                               {voiceState.cameraOn ? (
                                   <video ref={cameraVideoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center bg-gray-800 relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                                        <img src={currentUser.avatarUrl} className="w-24 h-24 rounded-full border-4 border-gray-700 shadow-xl z-10" />
                                   </div>
                               )}
                               <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-bold backdrop-blur-md flex items-center gap-2 border border-white/10 z-10">
                                   {currentUser.username} (You)
                               </div>
                               <div className={`absolute inset-0 border-4 ${voiceState.muted ? 'border-transparent' : 'border-green-500/50'} rounded-2xl pointer-events-none transition-colors duration-300`} />
                          </div>

                          {/* Remote Users List */}
                          {Object.entries(voiceState.remoteStreams).map(([peerId, stream]) => (
                               <RemoteVideoCard key={peerId} stream={stream} peerId={peerId} volume={volume} />
                          ))}

                          {/* Placeholder if no remote users */}
                          {Object.keys(voiceState.remoteStreams).length === 0 && (
                            <div className={`relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg flex flex-col group
                                 ${voiceState.screenShareOn ? 'h-[250px]' : 'min-h-[250px]'} opacity-50
                            `}>
                                 <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                      <div className="text-center text-gray-500 p-4">
                                          <Wifi size={32} className="mx-auto mb-2 opacity-50" />
                                          <p>Waiting for peers...</p>
                                      </div>
                                 </div>
                            </div>
                          )}
                      </div>
                  </div>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-2xl bg-gray-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 transition-all hover:scale-105 hover:bg-gray-900/90">
                      <button onClick={() => setVoiceState(p => ({...p, muted: !p.muted}))} className={`p-3.5 rounded-xl transition-all ${voiceState.muted ? 'bg-white text-black shadow-lg hover:bg-gray-200' : 'bg-gray-800/50 hover:bg-gray-700 text-white'}`}>
                           {voiceState.muted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button onClick={toggleCamera} className={`p-3.5 rounded-xl transition-all ${!voiceState.cameraOn ? 'bg-gray-800/50 hover:bg-gray-700 text-white' : 'bg-white text-black shadow-lg hover:bg-gray-200'}`}>
                           {voiceState.cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                      </button>
                      <button onClick={toggleScreenShare} className={`p-3.5 rounded-xl transition-all ${voiceState.screenShareOn ? 'bg-blurple-500 text-white shadow-lg shadow-blurple-500/20 hover:bg-blurple-600' : 'bg-gray-800/50 hover:bg-gray-700 text-white'}`}>
                           <ScreenShare size={20} />
                      </button>
                      <div className="w-[1px] h-8 bg-white/10 mx-1" />
                      <button onClick={handleDisconnectVoice} className="p-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-colors">
                           <PhoneOff size={20} />
                      </button>
                  </div>
              </div>
          ) : (
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
          )}
        </div>
        {activeServerId !== 'home' && <UserList users={allUsers} />}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        selectedMicId={selectedMicId}
        selectedCamId={selectedCamId}
        selectedSpeakerId={selectedSpeakerId}
        onDeviceChange={handleDeviceChange}
        volume={volume}
        onVolumeChange={setVolume}
      />

      <ConnectionManager 
         isOpen={isConnectionManagerOpen}
         onClose={() => setIsConnectionManagerOpen(false)}
         myPeerId={myPeerId}
         onConnect={handleConnectPeer}
         connectionStatus={connectionStatus}
         connectedPeers={connectedPeers}
      />
    </div>
  );
};

const RemoteVideoCard = ({ stream, peerId, volume }: { stream: MediaStream, peerId: string, volume: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.volume = volume;
        }
    }, [stream, volume]);

    return (
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-lg flex flex-col group min-h-[250px]">
            <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-bold backdrop-blur-md flex items-center gap-2 border border-white/10 z-10">
                User: {peerId.substring(0,5)}
            </div>
            <div className="absolute top-4 right-4 bg-green-500/20 p-1.5 rounded-md backdrop-blur-sm text-green-400 border border-green-500/30">
                <Signal size={14} />
            </div>
        </div>
    );
};

const MinimizeUI = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
);

export default App;
