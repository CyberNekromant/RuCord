
import { Server, User, ChannelType, Message, Channel } from './types';

// Логотип приложения: Векторный Неоновый Кот (RuCord Logo)
// SVG код иконки
const svgString = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="32" y="32" width="448" height="448" rx="120" fill="url(#grad)" stroke="white" stroke-width="8" stroke-opacity="0.1"/>
  <path d="M120 360C100 360 90 340 100 310L140 150C145 130 170 120 190 135L256 180L322 135C342 120 367 130 372 150L412 310C422 340 412 360 392 360H120Z" fill="white" fill-opacity="0.95"/>
  <circle cx="190" cy="260" r="35" fill="#1e1b4b"/>
  <circle cx="322" cy="260" r="35" fill="#1e1b4b"/>
  <circle cx="190" cy="260" r="15" fill="#06b6d4"/>
  <circle cx="322" cy="260" r="15" fill="#ec4899"/>
  <path d="M236 320 Q 256 340 276 320" stroke="#1e1b4b" stroke-width="8" stroke-linecap="round"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
</svg>
`;

// Функция для кодирования в Base64
const b64 = btoa(unescape(encodeURIComponent(svgString)));
export const LOGO_URL = `data:image/svg+xml;base64,${b64}`;

export const CURRENT_USER: User = {
  id: 'me',
  username: 'RuUser',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  status: 'online',
  aboutMe: 'Люблю кодить и пить кофе ☕',
  bannerColor: '#5865F2',
};

export const GEMINI_BOT: User = {
  id: 'gemini',
  username: 'Gemini AI',
  avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  status: 'online',
  isBot: true,
  aboutMe: 'Я искусственный интеллект, созданный Google. Готов помочь!',
  bannerColor: '#4752C4',
};

export const MOCK_USERS: Record<string, User> = {
  'me': CURRENT_USER,
  'gemini': GEMINI_BOT,
  'u1': { id: 'u1', username: 'Alex', avatarUrl: 'https://picsum.photos/id/1005/200/200', status: 'online', aboutMe: 'Gamer 4 Life 🎮', bannerColor: '#10B981' },
  'u2': { id: 'u2', username: 'Sarah', avatarUrl: 'https://picsum.photos/id/1011/200/200', status: 'idle', aboutMe: 'Designing the future.', bannerColor: '#EC4899' },
  'u3': { id: 'u3', username: 'Dmitry', avatarUrl: 'https://picsum.photos/id/1012/200/200', status: 'dnd', aboutMe: 'Do not disturb, coding.', bannerColor: '#EF4444' },
  'u4': { id: 'u4', username: 'Elena', avatarUrl: 'https://picsum.photos/id/1027/200/200', status: 'offline', aboutMe: 'Just passing by.', bannerColor: '#6B7280' },
  'u5': { id: 'u5', username: 'Mike', avatarUrl: 'https://picsum.photos/id/1025/200/200', status: 'online', aboutMe: 'Music is life 🎵', bannerColor: '#F59E0B' },
};

export const INITIAL_SERVERS: Server[] = [
  {
    id: 's1',
    name: 'RuCord Hub',
    iconUrl: LOGO_URL, // Используем наш новый логотип
    channels: [
      { id: 'c1', serverId: 's1', name: 'general', type: ChannelType.TEXT },
      { id: 'c2', serverId: 's1', name: 'ai-chat', type: ChannelType.TEXT },
      { id: 'c3', serverId: 's1', name: 'memes', type: ChannelType.TEXT },
      { id: 'vc1', serverId: 's1', name: 'Lounge', type: ChannelType.VOICE, activeUsers: ['u1', 'u2'] },
    ],
  },
  {
    id: 's2',
    name: 'Gaming Squad',
    iconUrl: 'https://picsum.photos/id/1070/200/200',
    channels: [
      { id: 'c4', serverId: 's2', name: 'lfg', type: ChannelType.TEXT },
      { id: 'c5', serverId: 's2', name: 'clips', type: ChannelType.TEXT },
      { id: 'vc2', serverId: 's2', name: 'Raid 1', type: ChannelType.VOICE },
    ],
  },
  {
    id: 's3',
    name: 'Dev Talk',
    iconUrl: 'https://picsum.photos/id/1080/200/200',
    channels: [
      { id: 'c6', serverId: 's3', name: 'react', type: ChannelType.TEXT },
      { id: 'c7', serverId: 's3', name: 'typescript', type: ChannelType.TEXT },
    ],
  },
];

export const INITIAL_DMS: Channel[] = [
  { id: 'dm1', serverId: 'home', name: 'Gemini AI', type: ChannelType.DM, dmUserId: 'gemini' },
  { id: 'dm2', serverId: 'home', name: 'Alex', type: ChannelType.DM, dmUserId: 'u1' },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'c1': [
    { id: 'm1', channelId: 'c1', userId: 'u1', content: 'Привет всем! Как вам новый интерфейс?', timestamp: new Date(Date.now() - 10000000) },
    { id: 'm2', channelId: 'c1', userId: 'u2', content: 'Выглядит супер, очень современно.', timestamp: new Date(Date.now() - 9000000) },
    { id: 'm3', channelId: 'c1', userId: 'gemini', content: 'Я готов помочь вам с любыми вопросами! Просто упомяните меня.', timestamp: new Date(Date.now() - 8000000), isSystem: false },
  ],
  'c2': [
    { id: 'm4', channelId: 'c2', userId: 'me', content: 'Gemini, что ты умеешь?', timestamp: new Date(Date.now() - 60000) },
    { id: 'm5', channelId: 'c2', userId: 'gemini', content: 'Я могу отвечать на вопросы, писать код, генерировать идеи и многое другое. Использую модель gemini-2.5-flash для быстрых ответов!', timestamp: new Date(Date.now() - 30000) },
  ],
  'dm1': [
     { id: 'md1', channelId: 'dm1', userId: 'gemini', content: 'Привет! Это личный чат. Чем могу помочь?', timestamp: new Date(Date.now() - 120000) }
  ],
  'dm2': [
     { id: 'md2', channelId: 'dm2', userId: 'u1', content: 'Йо, скинь тот файл', timestamp: new Date(Date.now() - 500000) }
  ]
};
