import { defineStore } from 'pinia';
import { api, setAuthToken, getAuthToken } from '@/api/client';

export interface ConsentView {
  scope: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getAuthToken() as string | null,
    consents: [] as ConsentView[],
  }),
  actions: {
    async sendSmsCode(phone: string) {
      return api.post<{ sent: boolean }>('/auth/sms-code', { phone });
    },
    async login(phone: string, code: string, agreedScopes?: string[]) {
      const result = await api.post<{ token: string; consents: ConsentView[] }>(
        '/auth/login',
        { phone, code, agreedScopes },
      );
      this.token = result.token;
      this.consents = result.consents;
      setAuthToken(result.token);
      return result;
    },
    async fetchConsents() {
      this.consents = await api.get<ConsentView[]>('/auth/consents');
      return this.consents;
    },
    async setConsent(scope: string, granted: boolean) {
      this.consents = await api.post<ConsentView[]>('/auth/consents', {
        scope,
        granted: String(granted),
      });
    },
    logout() {
      this.token = null;
      this.consents = [];
      setAuthToken(null);
    },
  },
});
