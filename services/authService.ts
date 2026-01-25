
import { User, UserRole, AuthSession } from '../types';

const USERS_DB_KEY = 'telego_users_db';

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) throw new Error('E-mail já cadastrado.');

    const newUser: User = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      createdAt: Date.now()
    };

    users.push({ ...newUser, password });
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    return { user: newUser, token: `jwt-${newUser.id}` };
  },

  login: async (email: string, password: string): Promise<AuthSession> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userMatch = users.find((u: any) => u.email === email && u.password === password);
    if (!userMatch) throw new Error('Credenciais inválidas.');
    const { password: _, ...user } = userMatch;
    return { user: user as User, token: `jwt-${user.id}` };
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index === -1) throw new Error('Usuário não encontrado.');
    
    users[index] = { ...users[index], ...data };
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    const { password: _, ...user } = users[index];
    return user as User;
  },

  changePassword: async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    
    if (index === -1) throw new Error('Usuário não encontrado.');
    if (users[index].password !== currentPass) throw new Error('Senha atual incorreta.');
    
    users[index].password = newPass;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }
};
