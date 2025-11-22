import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, password: string) => Promise<boolean>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const success = isLogin 
        ? await onLogin(username, password)
        : await onRegister(username, password);
      
      if (!success) {
        setError(isLogin ? 'Неверное имя пользователя или пароль' : 'Пользователь уже существует');
      }
    } catch (e) {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated background elements */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blurple-600/30 rounded-full blur-[128px] animate-pulse-slow"></div>
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative w-full max-w-[420px] perspective-1000">
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 animate-fade-in-up overflow-hidden group">
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 relative z-10">
              <div className="relative w-28 h-28 mb-6">
                <div className="absolute inset-0 bg-blurple-500/30 rounded-full blur-xl animate-pulse" />
                <img 
                  src={LOGO_URL} 
                  alt="RuCord Logo" 
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(88,101,242,0.5)] relative z-10 transition-transform hover:scale-110 duration-300"
                />
              </div>
              
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 tracking-tight">
                RuCord
              </h1>
              <p className="text-gray-400 text-center text-sm font-medium flex items-center gap-2">
                <Sparkles size={14} className="text-blurple-400" />
                {isLogin ? 'С возвращением в будущее.' : 'Начни своё путешествие.'}
              </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="group/input">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest group-focus-within/input:text-blurple-400 transition-colors">
                      Имя пользователя
                  </label>
                  <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-blurple-500/50 focus:ring-2 focus:ring-blurple-500/20 transition-all placeholder-gray-600"
                      placeholder="cyber_user_2077"
                  />
              </div>

              <div className="group/input">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest group-focus-within/input:text-blurple-400 transition-colors">
                      Пароль
                  </label>
                  <div className="relative">
                      <input 
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:border-blurple-500/50 focus:ring-2 focus:ring-blurple-500/20 transition-all placeholder-gray-600"
                          placeholder="••••••••"
                      />
                      <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
              </div>

              {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="text-red-400 text-xs font-bold text-center">
                          {error}
                      </div>
                  </div>
              )}

              <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blurple-600 to-blurple-500 hover:from-blurple-500 hover:to-blurple-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-blurple-600/20 hover:shadow-blurple-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                  {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                      <>
                          {isLogin ? 'Войти в систему' : 'Создать аккаунт'}
                          <ArrowRight size={18} />
                      </>
                  )}
              </button>
          </form>

          <div className="mt-8 text-sm text-gray-400 flex gap-1 justify-center">
              <span>{isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}</span>
              <button 
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="text-blurple-400 hover:text-blurple-300 font-bold hover:underline transition-colors"
              >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
          </div>
        </div>
        
        <div className="text-center mt-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
             RuCord System v2.5.0 • Secure Connection
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;