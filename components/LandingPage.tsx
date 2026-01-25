
import React, { useState } from 'react';
import { UserRole, AuthSession, User } from '../types';
import { authService } from '../services/authService';

interface LandingPageProps {
  onAuthSuccess: (session: AuthSession) => void;
}

const BigLogoIcon = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
    <path d="M10 50H90M90 50L60 20M90 50L60 80" stroke="#8ecbff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="30" cy="50" r="12" fill="#8ecbff" opacity="0.3" />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.RESTAURANT);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const session = await authService.register(name, email, password, role);
        onAuthSuccess(session);
      } else {
        const session = await authService.login(email, password);
        onAuthSuccess(session);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fadeIn bg-white overflow-y-auto no-scrollbar">
      <div className="mb-12 text-center">
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-[#8ecbff] blur-[70px] opacity-25 rounded-full"></div>
          <div className="relative bg-[#0f1419] p-12 rounded-[4.5rem] shadow-2xl border border-slate-800 rotate-[-5deg]">
             <BigLogoIcon />
          </div>
        </div>
        <h1 className="text-5xl font-[900] text-slate-900 tracking-tighter">
          Tele<span className="text-[#8ecbff]">Go</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Logística Inteligente</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] p-10 border border-slate-50">
        <div className="flex p-2 bg-slate-100 rounded-[2.8rem] mb-10">
          <button 
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-4 text-[10px] font-black rounded-[2.5rem] transition-all tracking-widest ${!isRegister ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-4 text-[10px] font-black rounded-[2.5rem] transition-all tracking-widest ${isRegister ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
          >
            CADASTRO
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-500 text-[10px] font-black rounded-2xl border border-red-100 text-center animate-shake uppercase tracking-tighter leading-tight">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <>
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl mb-2">
                <button 
                  type="button"
                  onClick={() => setRole(UserRole.RESTAURANT)}
                  className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all ${role === UserRole.RESTAURANT ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}
                >
                  RESTAURANTE
                </button>
                <button 
                  type="button"
                  onClick={() => setRole(UserRole.COURIER)}
                  className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all ${role === UserRole.COURIER ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}
                >
                  MOTOBOY
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Nome Completo / Loja"
                className="w-full px-7 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-bold outline-none border border-transparent focus:border-[#8ecbff] transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <input 
            type="email" 
            placeholder="E-mail"
            className="w-full px-7 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-bold outline-none border border-transparent focus:border-[#8ecbff] transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input 
            type="password" 
            placeholder="Senha"
            className="w-full px-7 py-5 bg-slate-50 rounded-[1.8rem] text-sm font-bold outline-none border border-transparent focus:border-[#8ecbff] transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0f1419] text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-6 tracking-[0.2em] text-[10px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isRegister ? 'CRIAR MINHA CONTA' : 'ACESSAR AGORA'
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">© 2024 TeleGo! Logística Express</p>
      </div>
    </div>
  );
};
