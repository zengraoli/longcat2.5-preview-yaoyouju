import { createRouter, createWebHistory } from 'vue-router';
import { getAdminToken } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

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
      meta: { requiresAdmin: true, permission: 'content:read' },
    },
    {
      path: '/contents/:id',
      name: 'content-detail',
      component: () => import('@/views/ContentDetailView.vue'),
      meta: { requiresAdmin: true, permission: 'content:read' },
    },
    {
      path: '/evidence',
      name: 'evidence',
      component: () => import('@/views/EvidenceView.vue'),
      meta: { requiresAdmin: true, anyOf: ['evidence:create', 'evidence:review'] },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('@/views/FeedbackView.vue'),
      meta: { requiresAdmin: true, anyOf: ['feedback:triage', 'feedback:review'] },
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
      meta: { requiresAdmin: true, permission: 'model:read' },
    },
    {
      path: '/models/eval',
      name: 'models-eval',
      component: () => import('@/views/ModelsEvalView.vue'),
      meta: { requiresAdmin: true, permission: 'eval:read' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { requiresAdmin: true, permission: 'member:read' },
    },
    {
      path: '/audit',
      name: 'audit',
      component: () => import('@/views/AuditView.vue'),
      meta: { requiresAdmin: true, permission: 'audit:read' },
    },
    {
      path: '/cases',
      name: 'cases',
      component: () => import('@/views/CasesView.vue'),
      meta: { requiresAdmin: true, permission: 'case:review' },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !getAdminToken()) {
    return { name: 'login' };
  }
  // 权限点校验：无权限时进入 403 页，不再显示页面外壳
  const auth = useAuthStore();
  const permissions = auth.session?.permissions ?? [];
  const anyOf = to.meta.anyOf as string[] | undefined;
  if (anyOf && !anyOf.some((p) => permissions.includes(p))) {
    return { name: 'forbidden' };
  }
  const permission = to.meta.permission as string | undefined;
  if (permission && !permissions.includes(permission)) {
    return { name: 'forbidden' };
  }
  return true;
});

export default router;
