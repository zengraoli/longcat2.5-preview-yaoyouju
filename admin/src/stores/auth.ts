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

  async function logout() {
    // 先通知服务端销毁会话（令牌立即失效），再清除本地状态
    try {
      await api.post('/admin/logout', {});
    } catch {
      // 服务端销毁失败也继续清除本地
    }
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
