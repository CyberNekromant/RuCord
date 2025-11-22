
import { Server, User, ChannelType, Message, Channel } from './types';

// Логотип приложения (Векторная версия Neon Cat RuCord)
// Используем Data URI, чтобы логотип работал без внешнего хостинга
export const LOGO_URL = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZGVmcz><bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZWE1ZTk7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjMyIiB5PSIzMiIgd2lkdGg9NDQ4IiBoZWlnaHQ9NDQ4IiByeD0iMTIwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjwhLS0gQ2F0IEZhY2UgLS0+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyMCAzMjAgTDE1MCAxNzAgTDIxMCAyMzAgTDMwMiAyMzAgMzYyIDE3MCAzOTIgMzIwIEM0MTAgMzYwIDQxMCA0MjAgMzYwIDQ1MCBDMzIwIDQ5MCAxOTIgNDkwIDE1MiA0NTAgQzEwMiA0MjAgMTAyIDM2MCAxMjAgMzIwIFoiIC8+PCEtLSBFeWVzIC0tPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjMzMCIgcj0iMjUiIGZpbGw9IiMzYjgyZjYiIC8+PGNpcmNsZSBjeD0iMzEyIiBjeT0iMzMwIiByPSIyNSIgZmlsbD0iIzNiODJmNiIgLz48cGF0aCBkPSJNMjQ1IDM4MCBRMjU2IDM5MCAyNjcgMzgwIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=`;

export const CURRENT_USER: User = {
  id: 'me',
  username: 'RuUser',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  status: 'online',
};

export const GEMINI_BOT: User = {
  id: 'gemini',
  username: 'Gemini AI',
  avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  status: 'online',
  isBot: true,
};

export const MOCK_USERS: Record<string, User> = {
  'me': CURRENT_USER,
  'gemini': GEMINI_BOT,
  'u1': { id: 'u1', username: 'Alex', avatarUrl: 'https://picsum.photos/id/1005/200/200', status: 'online' },
  'u2': { id: 'u2', username: 'Sarah', avatarUrl: 'https://picsum.photos/id/1011/200/200', status: 'idle' },
  'u3': { id: 'u3', username: 'Dmitry', avatarUrl: 'https://picsum.photos/id/1012/200/200', status: 'dnd' },
  'u4': { id: 'u4', username: 'Elena', avatarUrl: 'https://picsum.photos/id/1027/200/200', status: 'offline' },
  'u5': { id: 'u5', username: 'Mike', avatarUrl: 'https://picsum.photos/id/1025/200/200', status: 'online' },
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
