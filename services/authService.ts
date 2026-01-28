
import { User, UserRole, AuthSession } from '../types';
import { apiService } from './api';

export const authService = {
  register: async (name: string, email: string, password: string, role: UserRole): Promise<AuthSession> => {
    const data = await apiService.post('/register', {
      body: { name, email, password, role }
    });
    return {
      user: data.user,
      token: data.access_token
    };
  },

  login: async (email: string, password: string): Promise<AuthSession> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data = await apiService.post('/token', {
      body: formData,
      isFormData: true
    });
    return {
      user: data.user,
      token: data.access_token
    };
  },

  updateUser: async (userId: string | number, data: Partial<User>): Promise<User> => {
    console.warn('Update user not implemented in backend');
    return data as User;
  },

  changePassword: async (userId: string | number, currentPass: string, newPass: string): Promise<void> => {
    console.warn('Change password not implemented in backend');
  }
};
