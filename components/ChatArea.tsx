
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
    <div className="flex-1 flex flex-col bg-gray-750 h-full min-w-0 relative">
      <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
      
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-gray-900 shadow-sm shrink-0 bg-gray-750 z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          {isDM ? (
             <span className="text-gray-400 font-bold text-lg">@</span>
          ) : (
             <Hash className="text-gray-400 shrink-0" size={24} />
          )}
          
          <h3 className="font-bold text-white truncate">{isDM && otherUser ? otherUser.username : channel.name}</h3>
          
          {channel.name === 'ai-chat' && <span className="text-xs bg-blurple-500/20 text-blurple-400 px-2 py-0.5 rounded border border-blurple-500/30">AI Powered</span>}
          
          {isDM && otherUser?.isBot && <span className="bg-blurple-500 text-white text-[10px] px-1.5 rounded flex items-center h-4 leading-none uppercase font-bold">Bot</span>}
        </div>
        
        <div className="flex items-center gap-4">
            {isDM && !otherUser?.isBot && (
                <div className="flex items-center gap-2 mr-2 border-r border-gray-600 pr-4">
                    <button onClick={() => onStartCall(false)} className="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded-full transition-colors" title="Аудиозвонок">
                        <Phone size={20} />
                    </button>
                    <button onClick={() => onStartCall(true)} className="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded-full transition-colors" title="Видеозвонок">
                        <Video size={22} />
                    </button>
                </div>
            )}

            <button 
                onClick={handleSummarize}
                className="text-gray-400 hover:text-blurple-400 transition-colors flex items-center gap-1 text-sm font-medium"
                title="Summarize last messages"
            >
                <Sparkles size={18} />
                <span className="hidden sm:inline">Кратко</span>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar flex flex-col">
        {messages.length === 0 ? (
            <div className="mt-auto mb-6">
                {isDM && otherUser ? (
                    <div className="flex flex-col items-start">
                        <img src={otherUser.avatarUrl} className="w-20 h-20 rounded-full mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">{otherUser.username}</h1>
                        <p className="text-gray-400">Это начало вашей легендарной переписки с @{otherUser.username}.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Hash size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Добро пожаловать в #{channel.name}!</h1>
                        <p className="text-gray-400">Это начало легендарного канала.</p>
                    </>
                )}
            </div>
        ) : (
            <div className="mt-auto flex flex-col justify-end min-h-0 pb-2">
                {/* Summary Banner */}
                {summary && (
                    <div className="bg-gray-900/60 border border-blurple-500/30 rounded-xl p-4 mb-6 animate-fade-in backdrop-blur-sm relative group">
                        <div className="flex items-center gap-2 text-blurple-400 font-bold mb-2 text-sm uppercase tracking-wider">
                            <Sparkles size={16} />
                            AI Summary
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">{summary}</p>
                        <button onClick={() => setSummary(null)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={16} />
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
                          className={`group relative flex flex-col pr-4 hover:bg-black/5 -mx-4 px-4 ${showHeader ? 'mt-[17px]' : 'mt-[2px]'} py-0.5 transition-colors`}
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
                                          className="w-10 h-10 rounded-full object-cover hover:shadow-lg transition-shadow active:translate-y-0.5" 
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
                                          <span className={`font-medium hover:underline cursor-pointer ${isAI ? 'text-blurple-400' : 'text-white'}`}>
                                              {displayUser.username}
                                          </span>
                                          {displayUser.isBot && <span className="bg-blurple-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center h-4 leading-none uppercase font-bold">Bot</span>}
                                          <span className="text-xs text-gray-400 ml-1 font-medium">
                                              {format(msg.timestamp, 'dd.MM.yyyy HH:mm', { locale: ru })}
                                          </span>
                                      </div>
                                  )}

                                  {/* Content */}
                                  <div className={`text-gray-300 whitespace-pre-wrap leading-relaxed ${isAI ? 'text-gray-100' : ''} ${msg.isEdited ? 'text-gray-200' : ''}`}>
                                      {displayContent}
                                      {msg.isEdited && <span className="text-[10px] text-gray-500 ml-1">(изм.)</span>}
                                  </div>
                                  
                                  {/* Attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                          {msg.attachments.map((att, i) => (
                                              <div key={i} className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900 max-w-xs">
                                                  {att.type === 'image' ? (
                                                      <img src={att.url} alt={att.name} className="max-h-60 object-contain cursor-pointer" />
                                                  ) : (
                                                      <div className="flex items-center gap-3 p-3">
                                                          <FileIcon size={24} className="text-blurple-400" />
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
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                        <button 
                                          key={emoji}
                                          onClick={() => onAddReaction(msg.id, emoji)}
                                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-sm transition-all
                                            ${userIds.includes(currentUser.id) 
                                              ? 'bg-blurple-500/20 border-blurple-500/50 text-blurple-300' 
                                              : 'bg-gray-800 border-transparent hover:border-gray-600 text-gray-300'}`}
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
                            <div className={`absolute right-4 -top-2 bg-gray-900 border border-gray-800 rounded-md shadow-lg flex items-center p-0.5 transition-opacity duration-200 ${hoveredMessageId === msg.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                               <button onClick={() => onAddReaction(msg.id, '👍')} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded"><Smile size={18} /></button>
                               <button onClick={() => handleStartReply(msg)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"><Reply size={18} /></button>
                               {isMe && (
                                 <button onClick={() => handleStartEdit(msg)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"><Pencil size={18} /></button>
                               )}
                               <button onClick={() => handleExplain(msg)} className="p-1.5 text-gray-400 hover:text-blurple-400 hover:bg-gray-800 rounded" title="Ask AI to explain"><Sparkles size={18} /></button>
                               {isMe && (
                                 <button onClick={() => onDeleteMessage(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded"><Trash2 size={18} /></button>
                               )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        {/* Loading / Typing Indicators */}
        {(isTyping || loadingSummary) && (
           <div className="flex items-center gap-2 px-2 pb-2 text-gray-400 text-sm font-medium animate-pulse">
              <Bot size={16} />
              <span>{loadingSummary ? 'Gemini анализирует чат...' : 'Gemini печатает...'}</span>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0 relative">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-3 px-4 py-3 bg-gray-800/50 border-t border-l border-r border-gray-800 rounded-t-xl overflow-x-auto">
                {attachments.map((att, i) => (
                    <div key={i} className="relative group w-24 h-24 bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        {att.file.type.startsWith('image/') ? (
                            <img src={att.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                            <FileIcon className="text-gray-400" />
                        )}
                        <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={12} />
                        </button>
                        <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-white p-1 truncate">
                            {att.file.name}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Reply/Edit Banner */}
        {(replyingTo || editingMessageId) && (
          <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm text-gray-300 px-4 py-2 rounded-t-lg text-sm border-b border-black/20">
             <div className="flex items-center gap-2 overflow-hidden">
                {editingMessageId ? <Pencil size={14} /> : <CornerDownRight size={14} />}
                <span className="font-bold">{editingMessageId ? 'Редактирование:' : `Ответ ${users[replyingTo!.userId]?.username}:`}</span>
                <span className="truncate opacity-70 italic max-w-[300px]">
                   {editingMessageId ? messages.find(m => m.id === editingMessageId)?.content : replyingTo?.content.replace('[AI]:', '')}
                </span>
             </div>
             <button onClick={() => { setReplyingTo(null); setEditingMessageId(null); setInputValue(''); }} className="hover:text-white"><X size={16} /></button>
          </div>
        )}

        <div className={`bg-gray-850 flex items-center p-3 shadow-lg ring-1 ring-white/5 focus-within:ring-blurple-400/50 transition-all 
            ${replyingTo || editingMessageId ? 'rounded-b-2xl' : attachments.length > 0 ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-200 bg-gray-800 rounded-full mr-2 transition-colors"
          >
            <PlusCircle size={20} />
          </button>
          
          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={editingMessageId ? "Редактировать сообщение..." : `Написать в ${isDM && otherUser ? '@' + otherUser.username : '#' + channel.name}`}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none font-medium"
          />
          <div className="flex items-center gap-2 ml-2">
            <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
              <Gift size={20} />
            </button>
            
            <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-yellow-400 transition-colors">
                    <Smile size={20} />
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex bg-gray-900 border border-gray-800 p-1 rounded shadow-xl gap-1">
                    {POPULAR_REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => setInputValue(p => p + emoji)} className="hover:bg-gray-700 p-1 rounded">{emoji}</button>
                    ))}
                </div>
            </div>
            
            {(inputValue.length > 0 || editingMessageId || attachments.length > 0) && (
                <button onClick={handleSend} className="p-2 text-blurple-400 hover:text-blurple-300 transition-colors">
                    <SendHorizontal size={20} />
                </button>
            )}
          </div>
        </div>
        
        <div className="text-[10px] text-gray-600 text-right mt-1 px-2 font-mono">
            {editingMessageId ? 'Esc - отмена • Enter - сохранить' : 'Попробуйте /ai [вопрос] для вызова бота'}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
