
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
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

    // Simulate network delay for realism
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
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl p-8 backdrop-blur-xl animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
            <img 
              src={LOGO_URL} 
              alt="RuCord Logo" 
              className="w-24 h-24 mb-4 object-contain drop-shadow-[0_0_15px_rgba(88,101,242,0.5)] hover:scale-105 transition-transform duration-300"
            />
            <h1 className="text-3xl font-bold text-white mb-2">RuCord</h1>
            <p className="text-gray-400 text-center">
              {isLogin ? 'С возвращением! Мы так скучали.' : 'Создайте учетную запись и присоединяйтесь.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    Имя пользователя <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-950 border border-black rounded-md px-3 py-2.5 text-gray-200 focus:outline-none focus:border-blurple-500 transition-colors"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    Пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-950 border border-black rounded-md px-3 py-2.5 text-gray-200 focus:outline-none focus:border-blurple-500 transition-colors"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm font-medium text-center py-1">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blurple-500 hover:bg-blurple-400 text-white font-medium py-2.5 rounded-md transition-all duration-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="mt-6 text-sm text-gray-400 flex gap-1 justify-center">
            <span>{isLogin ? 'Нужен аккаунт?' : 'Уже есть аккаунт?'}</span>
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-blurple-400 hover:underline font-medium"
            >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
