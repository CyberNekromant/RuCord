
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Video, Volume2, LogOut, User as UserIcon, Laptop, Play, Pencil, Camera } from 'lucide-react';
import { User } from '../types';
import { soundService } from '../services/soundService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogout: () => void;
  onUpdateProfile: (updates: Partial<User>) => void;
  // Device State
  selectedMicId: string;
  selectedCamId: string;
  selectedSpeakerId: string;
  onDeviceChange: (type: 'mic' | 'cam' | 'speaker', deviceId: string) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onUpdateProfile,
  selectedMicId,
  selectedCamId,
  selectedSpeakerId,
  onDeviceChange,
  volume,
  onVolumeChange
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'account'>('voice');
  const [devices, setDevices] = useState<{
    mics: MediaDeviceInfo[];
    cams: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({ mics: [], cams: [], speakers: [] });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        setDevices({
          mics: devs.filter(d => d.kind === 'audioinput'),
          cams: devs.filter(d => d.kind === 'videoinput'),
          speakers: devs.filter(d => d.kind === 'audiooutput'),
        });
      });
    }
  }, [isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 1024 * 1024 * 2) { // 2MB limit
              alert("Файл слишком большой. Пожалуйста, выберите изображение менее 2 МБ.");
              return;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  onUpdateProfile({ avatarUrl: reader.result });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-gray-850 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex overflow-hidden border border-gray-800 relative">
        
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 flex flex-col py-6 px-4 border-r border-gray-800">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 px-2">Настройки</h2>
          
          <button 
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm font-medium transition-colors
              ${activeTab === 'voice' ? 'bg-gray-750 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            <Mic size={18} />
            Голос и видео
          </button>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm font-medium transition-colors
              ${activeTab === 'account' ? 'bg-gray-750 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            <UserIcon size={18} />
            Учетная запись
          </button>

          <div className="mt-auto pt-4 border-t border-gray-800">
             <button 
                onClick={() => { onLogout(); onClose(); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md w-full text-left text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
             >
               <LogOut size={18} />
               Выйти
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative bg-gray-850">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} />
            <div className="text-[10px] text-center font-mono mt-1">ESC</div>
          </button>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {activeTab === 'voice' && (
              <div className="max-w-xl">
                 <h2 className="text-xl font-bold text-white mb-6">Настройки голоса и видео</h2>
                 
                 {/* Input Device */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Устройство ввода</label>
                    <div className="relative">
                        <select 
                           value={selectedMicId}
                           onChange={(e) => onDeviceChange('mic', e.target.value)}
                           className="w-full bg-gray-950 border border-black rounded px-3 py-2.5 text-gray-200 appearance-none focus:outline-none focus:border-blurple-500"
                        >
                           {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Микрофон ${d.deviceId.slice(0,5)}...`}</option>)}
                        </select>
                        <Mic className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
                    </div>
                 </div>

                 {/* Output Device */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Устройство вывода</label>
                    <div className="relative">
                        <select 
                           value={selectedSpeakerId}
                           onChange={(e) => onDeviceChange('speaker', e.target.value)}
                           className="w-full bg-gray-950 border border-black rounded px-3 py-2.5 text-gray-200 appearance-none focus:outline-none focus:border-blurple-500"
                        >
                           {devices.speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Динамики ${d.deviceId.slice(0,5)}...`}</option>)}
                        </select>
                        <Volume2 className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
                    </div>
                 </div>

                 {/* Volume Slider */}
                 <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Громкость звука ({Math.round(volume * 100)}%)</label>
                    <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volume}
                          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blurple-500"
                        />
                        <button 
                          onClick={() => soundService.play('message')} 
                          className="shrink-0 p-2 bg-gray-800 hover:bg-blurple-500 rounded-full transition-colors text-white"
                          title="Проверить звук"
                        >
                           <Play size={16} fill="currentColor" />
                        </button>
                    </div>
                 </div>

                 <div className="w-full h-[1px] bg-gray-700 mb-8" />

                 {/* Video Settings */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Камера</label>
                    <div className="relative mb-4">
                        <select 
                           value={selectedCamId}
                           onChange={(e) => onDeviceChange('cam', e.target.value)}
                           className="w-full bg-gray-950 border border-black rounded px-3 py-2.5 text-gray-200 appearance-none focus:outline-none focus:border-blurple-500"
                        >
                           {devices.cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Камера ${d.deviceId.slice(0,5)}...`}</option>)}
                        </select>
                        <Video className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
                    </div>
                    
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center border border-gray-800 relative overflow-hidden">
                       <div className="text-gray-500 flex flex-col items-center">
                          <Video size={48} className="mb-2 opacity-50" />
                          <span className="text-sm">Предпросмотр видео</span>
                       </div>
                       {/* We could technically attach a stream here for preview, but omitted for brevity/permissions complexity */}
                       <div className="absolute top-2 right-2 bg-blurple-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">PREVIEW</div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="max-w-xl">
                <h2 className="text-xl font-bold text-white mb-6">Моя учетная запись</h2>
                
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center gap-4 mb-6">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     <img src={currentUser.avatarUrl} className="w-20 h-20 rounded-full bg-gray-800 object-cover" alt="Avatar" />
                     <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-gray-900 
                        ${currentUser.status === 'online' ? 'bg-green-500' : 
                          currentUser.status === 'idle' ? 'bg-yellow-500' :
                          currentUser.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} 
                     />
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera size={24} className="text-white" />
                        <span className="text-[10px] text-white absolute bottom-3 font-bold">ИЗМЕНИТЬ</span>
                     </div>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        accept="image/*"
                        onChange={handleAvatarChange}
                     />
                   </div>

                   <div className="flex-1">
                      <div className="text-2xl font-bold text-white">{currentUser.username}</div>
                      <div className="text-gray-400 text-sm">#{currentUser.id.substring(0, 8)}</div>
                   </div>
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blurple-500 hover:bg-blurple-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                   >
                      Редактировать профиль
                   </button>
                </div>

                <div className="w-full h-[1px] bg-gray-700 mb-6" />

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                   <h3 className="text-gray-300 font-bold mb-2 text-sm uppercase">Управление аккаунтом</h3>
                   <p className="text-gray-400 text-xs mb-4">Отключение учетной записи приведет к выходу из системы на этом устройстве.</p>
                   
                   <div className="flex gap-3">
                      <button 
                        onClick={() => { onLogout(); onClose(); }}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
