import { defineStore } from 'pinia';

interface AdminUser {
  adminUserId: string;
  roleId: string;
  name: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || '',
    user: null as AdminUser | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    setSession(token: string, user: AdminUser) {
      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('auth_token');
    },
  },
});
