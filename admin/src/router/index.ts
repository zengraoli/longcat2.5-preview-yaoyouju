import { createRouter, createWebHistory } from 'vue-router';
import { getAdminToken } from '@/api/client';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/contents',
      name: 'contents',
      component: () => import('@/views/ContentsView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/contents/:id',
      name: 'content-detail',
      component: () => import('@/views/ContentDetailView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/evidence',
      name: 'evidence',
      component: () => import('@/views/EvidenceView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('@/views/FeedbackView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/safety',
      name: 'safety',
      component: () => import('@/views/SafetyView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/models',
      name: 'models',
      component: () => import('@/views/ModelsView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/models/eval',
      name: 'models-eval',
      component: () => import('@/views/ModelsEvalView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('@/views/AuditView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/cases',
      name: 'cases',
      component: () => import('@/views/CasesView.vue'),
      meta: { requiresAdmin: true },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !getAdminToken()) {
    return { name: 'login' };
  }
  return true;
});

export default router;
