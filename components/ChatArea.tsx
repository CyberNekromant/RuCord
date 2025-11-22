import React, { useEffect, useRef, useState } from 'react';
import { Channel, Message, User, ChannelType } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Hash, Gift, Smile, PlusCircle, SendHorizontal, Sparkles, Bot, Pencil, Trash2, Reply, X, CornerDownRight, Paperclip, File as FileIcon, Phone, Video } from 'lucide-react';
import { generateAIResponse, summarizeChat, explainText } from '../services/geminiService';

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  users: Record<string, User>;
  currentUser: User;
  onSendMessage: (text: string, replyToId?: string, attachments?: { type: 'image' | 'file', url: string, name: string }[]) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onStartCall: (withVideo: boolean) => void;
}

const POPULAR_REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '🎉'];

const ChatArea: React.FC<ChatAreaProps> = ({ 
  channel, 
  messages, 
  users, 
  currentUser,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onStartCall
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // Message Actions State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  // Attachment State
  const [attachments, setAttachments] = useState<{file: File, previewUrl: string}[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, attachments.length]);

  useEffect(() => {
    // Clear UI states when switching channels
    setSummary(null);
    setReplyingTo(null);
    setEditingMessageId(null);
    setAttachments([]);
    setInputValue('');
  }, [channel.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      if (editingMessageId) setEditingMessageId(null);
      if (replyingTo) setReplyingTo(null);
      setInputValue('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setAttachments(prev => [...prev, { file, previewUrl: url }]);
    }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    
    if (editingMessageId) {
      onEditMessage(editingMessageId, inputValue);
      setEditingMessageId(null);
      setInputValue('');
      return;
    }

    const text = inputValue;
    const replyId = replyingTo?.id;
    const formattedAttachments = attachments.map(a => ({
        type: a.file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        url: a.previewUrl,
        name: a.file.name
    }));
    
    setInputValue('');
    setReplyingTo(null);
    setAttachments([]);
    
    onSendMessage(text, replyId, formattedAttachments);

    // AI Logic
    if (text.toLowerCase().startsWith('/ai ') || text.includes('@Gemini') || channel.name === 'ai-chat' || channel.dmUserId === 'gemini') {
      setIsTyping(true);
      const prompt = text.replace('/ai ', '').replace('@Gemini', '');
      const context = messages.slice(-5).map(m => `${users[m.userId]?.username}: ${m.content}`);
      
      const response = await generateAIResponse(prompt, context);
      
      setTimeout(() => {
        onSendMessage(`[AI]: ${response}`, undefined);
        setIsTyping(false);
      }, 600);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setInputValue(msg.content);
    setReplyingTo(null);
    const input = document.getElementById('chat-input');
    input?.focus();
  };

  const handleStartReply = (msg: Message) => {
    setReplyingTo(msg);
    setEditingMessageId(null);
    const input = document.getElementById('chat-input');
    input?.focus();
  };

  const handleExplain = async (msg: Message) => {
    setIsTyping(true);
    const explanation = await explainText(msg.content);
    onSendMessage(`[AI]: 🧠 Explanation for "${msg.content.substring(0, 20)}...":\n${explanation}`, msg.id);
    setIsTyping(false);
  };

  const handleSummarize = async () => {
      setLoadingSummary(true);
      const lastMessages = messages.slice(-20).map(m => `${users[m.userId]?.username}: ${m.content}`);
      const result = await summarizeChat(lastMessages);
      setSummary(result);
      setLoadingSummary(false);
  };

  // Dynamic Header Content
  const isDM = channel.type === ChannelType.DM;
  const otherUserId = isDM ? channel.dmUserId : null;
  const otherUser = otherUserId ? users[otherUserId] : null;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative bg-transparent">
      <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
      
      {/* Floating Header */}
      <div className="h-16 px-6 flex items-center justify-between shrink-0 z-10 glass-header">
        <div className="flex items-center gap-3 overflow-hidden">
          {isDM ? (
             <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold">@</div>
          ) : (
             <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400"><Hash size={18} /></div>
          )}
          
          <div className="flex flex-col">
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white truncate text-lg tracking-tight">
                      {isDM && otherUser ? otherUser.username : channel.name}
                  </h3>
                  {channel.name === 'ai-chat' && <span className="text-[10px] bg-gradient-to-r from-blurple-600 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold shadow-lg shadow-blurple-500/20">AI</span>}
                  {isDM && otherUser?.isBot && <span className="bg-blurple-500 text-white text-[10px] px-1.5 rounded flex items-center h-4 leading-none uppercase font-bold">Bot</span>}
              </div>
              <span className="text-xs text-gray-400 font-medium">{channel.name === 'ai-chat' ? 'Powered by Gemini 2.5 Flash' : 'Start of conversation'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {isDM && !otherUser?.isBot && (
                <div className="flex items-center gap-2 mr-2 bg-black/20 rounded-full p-1 border border-white/5">
                    <button onClick={() => onStartCall(false)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors" title="Аудиозвонок">
                        <Phone size={18} />
                    </button>
                    <button onClick={() => onStartCall(true)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors" title="Видеозвонок">
                        <Video size={18} />
                    </button>
                </div>
            )}

            <button 
                onClick={handleSummarize}
                className="text-gray-300 hover:text-white hover:bg-blurple-500/20 border border-transparent hover:border-blurple-500/50 transition-all rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm font-medium"
                title="Summarize last messages"
            >
                <Sparkles size={16} className="text-blurple-400" />
                <span className="hidden sm:inline">AI Summary</span>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar flex flex-col">
        {messages.length === 0 ? (
            <div className="mt-auto mb-8 mx-4">
                {isDM && otherUser ? (
                    <div className="flex flex-col items-start">
                        <div className="w-24 h-24 rounded-full mb-4 p-1 bg-gradient-to-br from-blurple-500 to-pink-500">
                            <img src={otherUser.avatarUrl} className="w-full h-full rounded-full border-4 border-gray-900" />
                        </div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">{otherUser.username}</h1>
                        <p className="text-gray-400 text-lg">Начало вашей легендарной истории с @{otherUser.username}.</p>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
                        <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <Hash size={40} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Welcome to #{channel.name}!</h1>
                        <p className="text-gray-400 text-lg">Это начало канала. Будьте вежливы и креативны.</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="mt-auto flex flex-col justify-end min-h-0 pb-4">
                {/* Summary Banner */}
                {summary && (
                    <div className="mx-4 bg-gradient-to-r from-blurple-900/40 to-purple-900/40 border border-blurple-500/30 rounded-2xl p-5 mb-6 animate-fade-in backdrop-blur-md relative group shadow-lg">
                        <div className="flex items-center gap-2 text-blurple-300 font-bold mb-3 text-xs uppercase tracking-widest">
                            <Sparkles size={14} />
                            AI Summary generated
                        </div>
                        <p className="text-gray-100 text-sm leading-relaxed font-medium">{summary}</p>
                        <button onClick={() => setSummary(null)} className="absolute top-3 right-3 p-1.5 bg-black/20 rounded-full text-gray-400 hover:text-white transition-colors">
                          <X size={14} />
                        </button>
                    </div>
                )}
                
                {messages.map((msg, idx) => {
                    const user = users[msg.userId] || { username: 'Unknown', avatarUrl: '', id: '?', status: 'offline', isBot: false } as User;
                    const isAdjacent = idx > 0 && messages[idx - 1].userId === msg.userId && (msg.timestamp.getTime() - messages[idx - 1].timestamp.getTime() < 300000);
                    const showHeader = !isAdjacent;
                    
                    const isAI = msg.content.startsWith('[AI]:');
                    const displayContent = isAI ? msg.content.replace('[AI]:', '') : msg.content;
                    const displayUser = isAI ? users['gemini'] : user;
                    const isMe = msg.userId === currentUser.id;

                    const replyMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
                    const replyUser = replyMsg ? users[replyMsg.userId] : null;

                    return (
                        <div 
                          key={msg.id} 
                          className={`group relative flex flex-col pr-4 hover:bg-black/10 rounded-lg -mx-2 px-4 ${showHeader ? 'mt-6' : 'mt-0.5'} py-1 transition-colors duration-200`}
                          onMouseEnter={() => setHoveredMessageId(msg.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                            {/* Reply Reference */}
                            {replyMsg && showHeader && (
                              <div className="flex items-center gap-2 mb-1 ml-[50px] text-xs text-gray-400">
                                <div className="w-8 h-3 border-l-2 border-t-2 border-gray-600 rounded-tl-md ml-[-26px] mt-2 opacity-40"></div>
                                <div className="flex items-center gap-1 opacity-80 hover:opacity-100 cursor-pointer">
                                   <img src={replyUser?.avatarUrl || ''} className="w-4 h-4 rounded-full" alt="" />
                                   <span className="font-semibold text-gray-300">@{replyUser?.username || 'Unknown'}</span>
                                   <span className="truncate max-w-[300px] italic">{replyMsg.content.replace('[AI]:', '')}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start">
                              {/* Avatar or Time */}
                              {showHeader ? (
                                  <div className="w-[50px] shrink-0 cursor-pointer mt-0.5">
                                      <img 
                                          src={displayUser.avatarUrl} 
                                          alt={displayUser.username} 
                                          className="w-10 h-10 rounded-full object-cover shadow-md transition-transform hover:scale-105" 
                                      />
                                  </div>
                              ) : (
                                  <div className="w-[50px] shrink-0 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 text-left pl-4 pt-1 select-none font-mono">
                                      {format(msg.timestamp, 'HH:mm')}
                                  </div>
                              )}

                              <div className="flex-1 min-w-0">
                                  {/* Username & Time Header */}
                                  {showHeader && (
                                      <div className="flex items-center gap-2">
                                          <span className={`font-bold hover:underline cursor-pointer tracking-tight ${isAI ? 'text-transparent bg-clip-text bg-gradient-to-r from-blurple-400 to-purple-400' : 'text-white'}`}>
                                              {displayUser.username}
                                          </span>
                                          {displayUser.isBot && <span className="bg-blurple-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center h-4 leading-none uppercase font-bold shadow-sm">Bot</span>}
                                          <span className="text-xs text-gray-500 ml-1 font-medium">
                                              {format(msg.timestamp, 'dd.MM.yyyy HH:mm', { locale: ru })}
                                          </span>
                                      </div>
                                  )}

                                  {/* Content */}
                                  <div className={`text-gray-300 whitespace-pre-wrap leading-relaxed ${isAI ? 'text-gray-100' : ''} ${msg.isEdited ? 'text-gray-200' : ''}`}>
                                      {displayContent}
                                      {msg.isEdited && <span className="text-[10px] text-gray-500 ml-1 select-none">(изм.)</span>}
                                  </div>
                                  
                                  {/* Attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-3 mt-3">
                                          {msg.attachments.map((att, i) => (
                                              <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/20 max-w-xs shadow-lg transition-transform hover:scale-[1.02]">
                                                  {att.type === 'image' ? (
                                                      <img src={att.url} alt={att.name} className="max-h-64 object-contain cursor-pointer" />
                                                  ) : (
                                                      <div className="flex items-center gap-3 p-4">
                                                          <div className="p-2 bg-blurple-500/20 rounded-lg">
                                                            <FileIcon size={24} className="text-blurple-400" />
                                                          </div>
                                                          <div className="text-sm truncate max-w-[150px]">
                                                              <div className="text-white font-medium truncate">{att.name}</div>
                                                              <div className="text-gray-500 text-xs">File</div>
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  {/* Reactions */}
                                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                        <button 
                                          key={emoji}
                                          onClick={() => onAddReaction(msg.id, emoji)}
                                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-sm transition-all shadow-sm
                                            ${userIds.includes(currentUser.id) 
                                              ? 'bg-blurple-500/20 border-blurple-500/50 text-blurple-300' 
                                              : 'bg-gray-800/50 border-transparent hover:border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                                        >
                                          <span>{emoji}</span>
                                          <span className="font-bold text-xs">{userIds.length}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Hover Actions Toolbar */}
                            <div className={`absolute right-4 -top-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex items-center p-1 transition-all duration-200 scale-95 ${hoveredMessageId === msg.id ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
                               <button onClick={() => onAddReaction(msg.id, '👍')} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded-md transition-colors"><Smile size={18} /></button>
                               <button onClick={() => handleStartReply(msg)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"><Reply size={18} /></button>
                               {isMe && (
                                 <button onClick={() => handleStartEdit(msg)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"><Pencil size={18} /></button>
                               )}
                               <button onClick={() => handleExplain(msg)} className="p-2 text-gray-400 hover:text-blurple-400 hover:bg-gray-800 rounded-md transition-colors" title="Ask AI to explain"><Sparkles size={18} /></button>
                               {isMe && (
                                 <button onClick={() => onDeleteMessage(msg.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-md transition-colors"><Trash2 size={18} /></button>
                               )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        {/* Loading / Typing Indicators */}
        {(isTyping || loadingSummary) && (
           <div className="flex items-center gap-2 px-6 pb-2 text-gray-400 text-xs font-bold uppercase tracking-wider animate-pulse">
              <Bot size={14} className="text-blurple-400" />
              <span>{loadingSummary ? 'Gemini анализирует контекст...' : 'Gemini печатает...'}</span>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0 relative z-20">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-3 px-4 py-3 bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-t-2xl overflow-x-auto mx-2 shadow-2xl">
                {attachments.map((att, i) => (
                    <div key={i} className="relative group w-24 h-24 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {att.file.type.startsWith('image/') ? (
                            <img src={att.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                            <FileIcon className="text-gray-400" />
                        )}
                        <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <X size={12} />
                        </button>
                        <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-white p-1 truncate text-center backdrop-blur-sm">
                            {att.file.name}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Reply/Edit Banner */}
        {(replyingTo || editingMessageId) && (
          <div className="flex items-center justify-between bg-gray-800/90 backdrop-blur-md text-gray-300 px-4 py-2 rounded-t-xl text-sm border-b border-white/5 mx-2 shadow-lg">
             <div className="flex items-center gap-2 overflow-hidden">
                {editingMessageId ? <Pencil size={14} className="text-blue-400" /> : <CornerDownRight size={14} className="text-gray-400" />}
                <span className="font-bold">{editingMessageId ? 'Редактирование:' : `Ответ ${users[replyingTo!.userId]?.username}:`}</span>
                <span className="truncate opacity-70 italic max-w-[300px]">
                   {editingMessageId ? messages.find(m => m.id === editingMessageId)?.content : replyingTo?.content.replace('[AI]:', '')}
                </span>
             </div>
             <button onClick={() => { setReplyingTo(null); setEditingMessageId(null); setInputValue(''); }} className="hover:text-white"><X size={16} /></button>
          </div>
        )}

        {/* Floating Input Bar */}
        <div className={`bg-gray-900/80 backdrop-blur-xl flex items-center p-2 shadow-2xl border transition-all duration-300 group focus-within:border-blurple-500/50 focus-within:shadow-blurple-500/10 focus-within:ring-1 focus-within:ring-blurple-500/30
            ${replyingTo || editingMessageId ? 'rounded-b-3xl mx-2 border-white/10' : attachments.length > 0 ? 'rounded-b-3xl mx-2 border-white/10' : 'rounded-[28px] border-white/10'}`}>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full mr-2 transition-colors"
          >
            <PlusCircle size={22} />
          </button>
          
          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={editingMessageId ? "Редактировать сообщение..." : `Написать в ${isDM && otherUser ? '@' + otherUser.username : '#' + channel.name}`}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none font-medium h-10"
          />
          <div className="flex items-center gap-1 ml-2">
            <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors rounded-full hover:bg-white/5">
              <Gift size={22} />
            </button>
            
            <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-full hover:bg-white/5">
                    <Smile size={22} />
                </button>
                <div className="absolute bottom-full right-0 mb-4 hidden group-hover:flex bg-gray-900 border border-white/10 p-2 rounded-xl shadow-2xl gap-1 backdrop-blur-xl animate-fade-in">
                    {POPULAR_REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => setInputValue(p => p + emoji)} className="hover:bg-white/10 p-2 rounded-lg text-lg transition-colors">{emoji}</button>
                    ))}
                </div>
            </div>
            
            {(inputValue.length > 0 || editingMessageId || attachments.length > 0) && (
                <button onClick={handleSend} className="p-2 bg-blurple-500 hover:bg-blurple-400 text-white rounded-full transition-all duration-200 shadow-lg shadow-blurple-500/30 hover:scale-105 ml-1">
                    <SendHorizontal size={20} />
                </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-between px-4 mt-2">
           <div className="text-[10px] text-gray-600 font-mono">
              AI Powered Chat
           </div>
           <div className="text-[10px] text-gray-600 font-mono">
              {editingMessageId ? 'Esc - отмена • Enter - сохранить' : '/ai [вопрос] для вызова бота'}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;