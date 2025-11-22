
import React from 'react';
import { Server } from '../types';
import { Plus } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface ServerListProps {
  servers: Server[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
}

const ServerList: React.FC<ServerListProps> = ({ servers, activeServerId, onSelectServer }) => {
  return (
    <div className="w-[72px] bg-gray-950 flex flex-col items-center py-3 gap-2 overflow-y-auto h-full shrink-0 z-20 scrollbar-hide">
      {/* Home Button */}
      <div className="relative w-full flex justify-center">
          <div 
             className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 
             ${activeServerId === 'home' ? 'h-10' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} 
          />
          <button 
            className={`group relative w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-200 overflow-hidden
              ${activeServerId === 'home' ? 'bg-blurple-500 rounded-[16px]' : 'bg-gray-850 hover:bg-blurple-500'}`}
            onClick={() => onSelectServer('home')}
          >
            <img src={LOGO_URL} alt="Home" className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110" />
          </button>
      </div>

      <div className="w-8 h-[2px] bg-gray-850 rounded-lg my-1 opacity-50" />

      {/* Servers */}
      {servers.map((server) => {
        const isActive = activeServerId === server.id;
        return (
          <div key={server.id} className="relative w-full flex justify-center group">
            {/* Active Indicator */}
            <div 
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 
              ${isActive ? 'h-10' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} 
            />

            <button
              onClick={() => onSelectServer(server.id)}
              className={`relative w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 overflow-hidden ${isActive ? 'rounded-[16px] ring-2 ring-blurple-500 ring-offset-2 ring-offset-gray-900' : ''}`}
            >
              <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-sm font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity duration-200">
                 {server.name}
                 <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
              </div>
            </button>
          </div>
        );
      })}

      {/* Add Server Button */}
      <button className="group w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-200 bg-gray-850 hover:bg-green-600 text-green-500 hover:text-white mt-2">
        <Plus size={24} />
      </button>
    </div>
  );
};

export default ServerList;
