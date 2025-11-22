
import React from 'react';
import { Server } from '../types';
import { Plus, Compass } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface ServerListProps {
  servers: Server[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
}

const ServerList: React.FC<ServerListProps> = ({ servers, activeServerId, onSelectServer }) => {
  return (
    <div className="w-[72px] h-full flex flex-col items-center py-3 gap-3 overflow-y-auto shrink-0 z-20 scrollbar-hide bg-black/20 backdrop-blur-md border-r border-white/5">
      {/* Home Button (Direct Messages) */}
      <div className="relative w-full flex justify-center group">
          <div 
             className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-300 ease-out
             ${activeServerId === 'home' ? 'h-10' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} 
          />
          <button 
            className={`group relative w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-300 ease-out shadow-lg
              ${activeServerId === 'home' ? 'bg-blurple-500 rounded-[16px] shadow-blurple-500/30' : 'bg-gray-800/80 hover:bg-blurple-500'}`}
            onClick={() => onSelectServer('home')}
          >
            <Compass size={28} className="text-gray-100 transition-transform duration-300 group-hover:scale-110" />
          </button>
      </div>

      <div className="w-8 h-[2px] bg-white/10 rounded-lg my-1" />

      {/* Servers */}
      {servers.map((server) => {
        const isActive = activeServerId === server.id;
        return (
          <div key={server.id} className="relative w-full flex justify-center group">
            {/* Active Indicator */}
            <div 
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-300 ease-out
              ${isActive ? 'h-10' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} 
            />

            <button
              onClick={() => onSelectServer(server.id)}
              className={`relative w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 ease-out overflow-hidden border-2 border-transparent
              ${isActive ? 'rounded-[16px] border-blurple-500 shadow-lg shadow-blurple-500/20' : 'hover:shadow-lg hover:shadow-black/40'}`}
            >
              <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                 {server.name}
              </div>
            </button>
          </div>
        );
      })}

      {/* Add Server Button */}
      <button className="group w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-300 bg-gray-800/50 hover:bg-green-600 text-green-500 hover:text-white mt-2 border border-dashed border-green-500/30 hover:border-transparent">
        <Plus size={24} />
      </button>
    </div>
  );
};

export default ServerList;
