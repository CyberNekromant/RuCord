
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Video, Volume2, LogOut, User as UserIcon, Play, Camera, Save, Palette } from 'lucide-react';
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

  // Local Profile State for Editing
  const [draftUser, setDraftUser] = useState<Partial<User>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Reset draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftUser({
        username: currentUser.username,
        aboutMe: currentUser.aboutMe || '',
        bannerColor: currentUser.bannerColor || '#5865F2',
      });
      setPreviewAvatar(currentUser.avatarUrl);
      setHasChanges(false);
      
      navigator.mediaDevices.enumerateDevices().then(devs => {
        setDevices({
          mics: devs.filter(d => d.kind === 'audioinput'),
          cams: devs.filter(d => d.kind === 'videoinput'),
          speakers: devs.filter(d => d.kind === 'audiooutput'),
        });
      });
    }
  }, [isOpen, currentUser]);

  // Check for changes
  useEffect(() => {
    const isChanged = 
      draftUser.username !== currentUser.username ||
      draftUser.aboutMe !== (currentUser.aboutMe || '') ||
      draftUser.bannerColor !== (currentUser.bannerColor || '#5865F2') ||
      previewAvatar !== currentUser.avatarUrl;
    
    setHasChanges(isChanged);
  }, [draftUser, previewAvatar, currentUser]);


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 1024 * 1024 * 5) { // 5MB limit
              alert("Файл слишком большой (макс. 5 МБ).");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  setPreviewAvatar(reader.result);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const saveChanges = () => {
      onUpdateProfile({
          ...draftUser,
          avatarUrl: previewAvatar || currentUser.avatarUrl
      });
      setHasChanges(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-gray-850 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex overflow-hidden border border-gray-800 relative">
        
        {/* Sidebar */}
        <div className="w-60 bg-gray-900 flex flex-col py-6 px-3 border-r border-gray-800 shrink-0">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 px-3">Настройки</h2>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm font-medium transition-colors
              ${activeTab === 'account' ? 'bg-gray-750 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            <UserIcon size={18} />
            Профиль
          </button>

          <button 
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm font-medium transition-colors
              ${activeTab === 'voice' ? 'bg-gray-750 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
          >
            <Mic size={18} />
            Голос и видео
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
        <div className="flex-1 flex flex-col relative bg-gray-850 min-w-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-full transition-colors z-20"
          >
            <X size={24} />
            <div className="text-[10px] text-center font-mono mt-1">ESC</div>
          </button>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'voice' && (
              <div className="max-w-2xl">
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
                 </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="h-full flex flex-col">
                <h2 className="text-xl font-bold text-white mb-2">Профиль пользователя</h2>
                
                <div className="flex flex-col lg:flex-row gap-8 h-full overflow-y-auto pb-20">
                    {/* EDITOR COLUMN */}
                    <div className="flex-1 space-y-6">
                         {/* Banner Color Picker */}
                         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-gray-400 uppercase">Цвет баннера</label>
                                <div className="relative">
                                    <button 
                                        onClick={() => colorInputRef.current?.click()}
                                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-xs text-white transition-colors"
                                    >
                                        <Palette size={14} />
                                        <div className="w-4 h-4 rounded border border-white/20" style={{backgroundColor: draftUser.bannerColor}} />
                                        Выбрать
                                    </button>
                                    <input 
                                        ref={colorInputRef}
                                        type="color" 
                                        className="absolute opacity-0 w-0 h-0"
                                        value={draftUser.bannerColor}
                                        onChange={(e) => setDraftUser(p => ({...p, bannerColor: e.target.value}))}
                                    />
                                </div>
                            </div>
                         </div>

                         {/* Avatar Upload */}
                         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex items-center gap-4">
                             <div className="relative shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                 <img src={previewAvatar || ''} className="w-20 h-20 rounded-full bg-gray-800 object-cover border-2 border-gray-700" alt="Preview" />
                                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Camera size={24} className="text-white" />
                                 </div>
                             </div>
                             <div>
                                 <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="bg-blurple-500 hover:bg-blurple-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors mb-1"
                                 >
                                    Сменить аватар
                                 </button>
                                 <div className="text-xs text-gray-400">Максимальный размер 5 МБ</div>
                                 <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                             </div>
                         </div>

                         <div className="w-full h-[1px] bg-gray-800" />

                         {/* Text Fields */}
                         <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Отображаемое имя</label>
                                <input 
                                    type="text" 
                                    value={draftUser.username}
                                    onChange={(e) => setDraftUser(p => ({...p, username: e.target.value}))}
                                    className="w-full bg-gray-950 border border-gray-700 rounded p-2.5 text-gray-200 focus:outline-none focus:border-blurple-500 transition-colors"
                                />
                             </div>
                             
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">О себе</label>
                                <textarea 
                                    value={draftUser.aboutMe}
                                    onChange={(e) => setDraftUser(p => ({...p, aboutMe: e.target.value}))}
                                    className="w-full bg-gray-950 border border-gray-700 rounded p-2.5 text-gray-200 focus:outline-none focus:border-blurple-500 transition-colors h-24 resize-none"
                                    placeholder="Расскажите немного о себе..."
                                    maxLength={190}
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {(draftUser.aboutMe || '').length}/190
                                </div>
                             </div>
                         </div>
                    </div>

                    {/* PREVIEW COLUMN */}
                    <div className="w-full lg:w-80 shrink-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Предпросмотр профиля</h3>
                        
                        {/* Profile Card Component */}
                        <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-900 relative group">
                            {/* Banner */}
                            <div className="h-28 w-full" style={{backgroundColor: draftUser.bannerColor}} />
                            
                            <div className="px-4 pb-4">
                                {/* Avatar */}
                                <div className="relative -mt-10 mb-3 inline-block">
                                    <img src={previewAvatar || ''} className="w-20 h-20 rounded-full border-[6px] border-gray-950 object-cover bg-gray-800" />
                                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[4px] border-gray-950 
                                        ${currentUser.status === 'online' ? 'bg-green-500' : 
                                          currentUser.status === 'idle' ? 'bg-yellow-500' :
                                          currentUser.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'}`} 
                                    />
                                </div>
                                
                                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <div className="text-xl font-bold text-white mb-1">{draftUser.username}</div>
                                    <div className="text-xs text-gray-400 font-mono mb-3">#{currentUser.id.substring(0, 8)}</div>
                                    
                                    <div className="w-full h-[1px] bg-white/10 mb-3" />
                                    
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">ОБО МНЕ</h4>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {draftUser.aboutMe || <span className="italic opacity-50">Пользователь не добавил описание.</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Bar (Floating) */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 p-4 flex items-center justify-between border-t border-gray-800 transform transition-transform duration-300 ${hasChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                    <span className="text-white font-medium">У вас есть несохраненные изменения</span>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setDraftUser({
                                    username: currentUser.username,
                                    aboutMe: currentUser.aboutMe || '',
                                    bannerColor: currentUser.bannerColor || '#5865F2',
                                });
                                setPreviewAvatar(currentUser.avatarUrl);
                                setHasChanges(false);
                            }}
                            className="px-4 py-2 hover:underline text-gray-300"
                        >
                            Сбросить
                        </button>
                        <button 
                            onClick={saveChanges}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            Сохранить
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
