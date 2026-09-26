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
      component: () => import('../layouts/MainLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../pages/dashboard/DashboardPage.vue') },
        { path: 'analysis/:id', name: 'analysis', component: () => import('../pages/analysis/AnalysisPage.vue') },
        { path: 'qa', name: 'qa', component: () => import('../pages/qa/QaPage.vue') },
        { path: 'timeline', name: 'timeline', component: () => import('../pages/timeline/TimelinePage.vue') },
        { path: 'followup', name: 'followup', component: () => import('../pages/followup/FollowupPage.vue') },
        { path: 'content', name: 'content', component: () => import('../pages/content/ContentPage.vue') },
        { path: 'account', name: 'account', component: () => import('../pages/account/AccountPage.vue') },
      ],
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  if (to.matched.some((r) => r.meta.requiresAuth)) {
    const auth = useAuthStore();
    if (!auth.isAuthenticated) {
      return next('/login');
    }
  }
  next();
});

export { router };
