import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/login/LoginPage.vue'),
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../pages/dashboard/DashboardPage.vue'), meta: { permission: '*' } },
        { path: 'contents', name: 'contents', component: () => import('../pages/contents/ContentsPage.vue'), meta: { permission: 'content:edit' } },
        { path: 'contents/:id', name: 'content-detail', component: () => import('../pages/contents/ContentDetailPage.vue'), meta: { permission: 'content:edit' } },
        { path: 'evidence', name: 'evidence', component: () => import('../pages/evidence/EvidencePage.vue'), meta: { permission: '*' } },
        { path: 'feedback', name: 'feedback', component: () => import('../pages/feedback/FeedbackPage.vue'), meta: { permission: '*' } },
        { path: 'safety', name: 'safety', component: () => import('../pages/safety/SafetyPage.vue'), meta: { permission: 'safety:view' } },
        { path: 'models', name: 'models', component: () => import('../pages/models/ModelsPage.vue'), meta: { permission: '*' } },
        { path: 'eval', name: 'eval', component: () => import('../pages/eval/EvalSetsPage.vue'), meta: { permission: '*' } },
        { path: 'users', name: 'users', component: () => import('../pages/users/UsersPage.vue'), meta: { permission: '*' } },
        { path: 'audit', name: 'audit', component: () => import('../pages/audit/AuditPage.vue'), meta: { permission: 'audit:view' } },
        { path: 'cases', name: 'cases', component: () => import('../pages/cases/CasesPage.vue'), meta: { permission: '*' } },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore();
    if (!auth.isAuthenticated) {
      return next('/login');
    }
  }
  next();
});

export { router };
