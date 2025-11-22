import React from 'react';
import { User } from '../types';

interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  // Group by status or role (Mocking logic here)
  const onlineUsers = users.filter(u => u.status !== 'offline');
  const offlineUsers = users.filter(u => u.status === 'offline');

  const renderUser = (user: User) => (
    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-850 rounded-md cursor-pointer transition-colors group opacity-90 hover:opacity-100">
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
  );
};

export default UserList;