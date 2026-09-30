import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, setAdminToken, getAdminToken } from '@/api/client';

export interface AdminSession {
  token: string;
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

const SESSION_KEY = 'yaoyouju_admin_session';

function loadSession(): AdminSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AdminSession | null>(loadSession());
  const isLoggedIn = computed(() => !!session.value);

  function setSession(s: AdminSession) {
    session.value = s;
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setAdminToken(s.token);
  }

  async function login(name: string, password: string, totp: string) {
    const result = await api.post<AdminSession>('/admin/login', { name, password, totp });
    setSession(result);
    return result;
  }

  function logout() {
    session.value = null;
    localStorage.removeItem(SESSION_KEY);
    setAdminToken(null);
  }

  // 初始化时恢复令牌
  if (session.value) {
    setAdminToken(session.value.token);
  }

  return { session, isLoggedIn, login, logout, setSession };
});
