
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  stats: { total: number, delivered: number };
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onUpdateUser, stats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const updated = await authService.updateUser(user.id, { name });
      onUpdateUser(updated);
      setIsEditing(false);
      showMessage('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return showMessage('As senhas não coincidem.', 'error');
    setIsLoading(true);
    try {
      await authService.changePassword(user.id, passData.current, passData.new);
      setIsChangingPass(false);
      setPassData({ current: '', new: '', confirm: '' });
      showMessage('Senha alterada com sucesso!', 'success');
    } catch (err: any) {
      showMessage(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="px-6 py-8 space-y-8 animate-fadeIn pb-24 relative">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest animate-slideDown ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      <header className="flex flex-col items-center gap-4 py-4">
        <div className="group relative">
          <div className="w-24 h-24 rounded-[2.5rem] gradient-primary shadow-2xl flex items-center justify-center text-white text-4xl font-black transition-transform group-hover:scale-105 active:scale-95 cursor-default">
            {user.role === UserRole.RESTAURANT ? '🍕' : '🏍️'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>

        <div className="text-center w-full">
          {isEditing ? (
            <div className="flex flex-col items-center gap-2 max-w-xs mx-auto animate-fadeIn">
              <input 
                type="text" 
                className="text-center w-full px-4 py-2 bg-slate-100 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateProfile} disabled={isLoading} className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50">Salvar</button>
                <button onClick={() => { setIsEditing(false); setName(user.name); }} className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-4 py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 group">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
              <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-300 hover:text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          )}
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{user.email}</p>
        </div>
      </header>

      {/* Stats Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <h3 className="text-xl font-black text-slate-900">{stats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Entregue</p>
          <h3 className="text-xl font-black text-emerald-600">{stats.delivered}</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Configurações</p>
          <div className="space-y-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex justify-between items-center py-3 border-b border-slate-200 group active:scale-[0.98] transition-all"
            >
              <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Editar Perfil</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300 group-hover:text-indigo-400"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button 
              onClick={() => setIsChangingPass(true)}
              className="w-full flex justify-between items-center py-3 group active:scale-[0.98] transition-all"
            >
              <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Segurança da Senha</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300 group-hover:text-indigo-400"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full p-5 bg-red-50 text-red-500 font-black rounded-[2rem] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          SAIR DA CONTA
        </button>
      </div>

      <div className="text-center opacity-40">
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Membro desde {new Date(user.createdAt).getFullYear()}</p>
      </div>

      {/* Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-fadeIn">
          <div className="w-full max-w-[500px] bg-white rounded-t-[3rem] p-8 space-y-6 shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Alterar Senha</h3>
              <button onClick={() => setIsChangingPass(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <input 
                type="password" 
                placeholder="Senha Atual" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500"
                value={passData.current}
                onChange={e => setPassData({...passData, current: e.target.value})}
                required
              />
              <div className="h-px bg-slate-100 my-2"></div>
              <input 
                type="password" 
                placeholder="Nova Senha" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500"
                value={passData.new}
                onChange={e => setPassData({...passData, new: e.target.value})}
                required
              />
              <input 
                type="password" 
                placeholder="Confirmar Nova Senha" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500"
                value={passData.confirm}
                onChange={e => setPassData({...passData, confirm: e.target.value})}
                required
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full gradient-primary text-white font-black py-5 rounded-[1.8rem] shadow-xl uppercase text-xs flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Atualizar Senha'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
