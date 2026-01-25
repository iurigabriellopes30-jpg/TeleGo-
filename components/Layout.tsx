
import React from 'react';
import { UserRole, AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onLogout: () => void;
}

const LogoIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Minimalist Speed/Arrow Logo */}
    <path d="M20 50H80M80 50L60 30M80 50L60 70" stroke="#8ecbff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="35" cy="50" r="10" fill="#8ecbff" opacity="0.4" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children, role, activeTab, onNavigate, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-[500px] mx-auto bg-white shadow-2xl relative">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#0f1419] p-2 rounded-xl">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-[900] tracking-tighter text-slate-900 leading-none">
              Tele<span className="text-[#8ecbff]">Go</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mt-0.5">Logística</p>
          </div>
        </div>
        
        {role !== UserRole.UNSELECTED && (
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {children}
      </main>

      {role !== UserRole.UNSELECTED && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 py-5 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => onNavigate(AppTab.HOME)}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === AppTab.HOME ? 'text-[#8ecbff] scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-[9px] font-black uppercase tracking-wider">Início</span>
          </button>
          <button 
            onClick={() => onNavigate(AppTab.HISTORY)}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === AppTab.HISTORY ? 'text-[#8ecbff] scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span className="text-[9px] font-black uppercase tracking-wider">Histórico</span>
          </button>
          <button 
            onClick={() => onNavigate(AppTab.PROFILE)}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === AppTab.PROFILE ? 'text-[#8ecbff] scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-[9px] font-black uppercase tracking-wider">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
};
