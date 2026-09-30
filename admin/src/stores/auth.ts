import { defineStore } from 'pinia';
import { api, setAdminToken, getAdminToken } from '@/api/client';

export interface AdminSession {
  token: string;
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

const TOKEN_KEY = 'yaoyouju_admin_token';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as AdminSession | null,
  }),
  actions: {
    async login(name: string, password: string, totp: string) {
      const result = await api.post<AdminSession>('/admin/login', { name, password, totp });
      this.session = result;
      setAdminToken(result.token);
      return result;
    },
    logout() {
      this.session = null;
      setAdminToken(null);
    },
    isLoggedIn() {
      return !!this.session || !!getAdminToken();
    },
  },
});
