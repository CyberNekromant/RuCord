
export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
  DM = 'dm',
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isBot?: boolean;
  password?: string; // Added for auth simulation
  aboutMe?: string; // New field for bio
  bannerColor?: string; // New field for profile banner color (hex)
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
  attachments?: { type: 'image' | 'file', url: string, name: string }[];
  replyToId?: string;
  isEdited?: boolean;
  reactions?: Record<string, string[]>;
}

export interface Channel {
  id: string;
  serverId: string; // 'dm' for direct messages
  name: string; // For DMs, this is usually the other user's name
  type: ChannelType;
  unreadCount?: number;
  activeUsers?: string[];
  dmUserId?: string; // Specific for DMs to identify the other user
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string;
  channels: Channel[];
}

export interface AppState {
  currentUser: User;
  servers: Server[];
  dms: Channel[]; // List of DM channels
  users: Record<string, User>;
  friends: string[]; // List of user IDs
  messages: Record<string, Message[]>;
  activeServerId: string; // 'home' or serverId
  activeChannelId: string;
  voiceState: {
    connected: boolean;
    channelId: string | null;
    muted: boolean;
    deafened: boolean;
    cameraOn: boolean;
    screenShareOn: boolean;
    localCameraStream?: MediaStream; // Microphone + Camera
    localScreenStream?: MediaStream; // Screen Share + System Audio
  };
}
