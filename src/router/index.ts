import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/database'

const routes: RouteRecordRaw[] = [
  // ----- Public -----
  {
    path: '/',
    name: 'landing',
    component: () => import('@/pages/public/LandingPage.vue'),
    meta: { publicOnly: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/auth-debug',
    name: 'auth-debug',
    component: () => import('@/pages/public/AuthDebugPage.vue'),
  },

  // ----- Authenticated (any role) -----
  {
    path: '/app',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => {
          // Arahkan ke dashboard sesuai role
          return { name: 'dashboard-default' }
        },
      },
      {
        path: 'dashboard',
        name: 'dashboard-default',
        component: () => import('@/pages/DashboardRouter.vue'),
      },
      // Penitip routes
      {
        path: 'penitip/dashboard',
        name: 'penitip-dashboard',
        component: () => import('@/pages/penitip/PenitipDashboard.vue'),
        meta: { roles: ['penitip', 'admin'] },
      },
      {
        path: 'penitip/pendoa',
        name: 'penitip-pendoa-list',
        component: () => import('@/pages/penitip/PendoaListPage.vue'),
        meta: { roles: ['penitip', 'admin'] },
      },
      {
        path: 'penitip/pendoa/:id',
        name: 'penitip-pendoa-detail',
        component: () => import('@/pages/penitip/PendoaDetailPage.vue'),
        meta: { roles: ['penitip', 'admin'] },
        props: true,
      },
      {
        path: 'penitip/titipan',
        name: 'penitip-prayers',
        component: () => import('@/pages/penitip/MyPrayersPage.vue'),
        meta: { roles: ['penitip', 'admin'] },
      },
      // Pendoa routes
      {
        path: 'pendoa/dashboard',
        name: 'pendoa-dashboard',
        component: () => import('@/pages/pendoa/PendoaDashboard.vue'),
        meta: { roles: ['pendoa', 'admin'] },
      },
      {
        path: 'pendoa/perjalanan',
        name: 'pendoa-pilgrimages',
        component: () => import('@/pages/pendoa/PilgrimageListPage.vue'),
        meta: { roles: ['pendoa', 'admin'] },
      },
      {
        path: 'pendoa/perjalanan/new',
        name: 'pendoa-pilgrimage-new',
        component: () => import('@/pages/pendoa/PilgrimageEditPage.vue'),
        meta: { roles: ['pendoa', 'admin'] },
      },
      {
        path: 'pendoa/perjalanan/:id/edit',
        name: 'pendoa-pilgrimage-edit',
        component: () => import('@/pages/pendoa/PilgrimageEditPage.vue'),
        meta: { roles: ['pendoa', 'admin'] },
        props: true,
      },
      {
        path: 'pendoa/titipan',
        name: 'pendoa-prayers',
        component: () => import('@/pages/pendoa/IncomingPrayersPage.vue'),
        meta: { roles: ['pendoa', 'admin'] },
      },
      // Shared
      {
        path: 'profile',
        name: 'profile-edit',
        component: () => import('@/pages/ProfileEditPage.vue'),
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('@/pages/NotificationsPage.vue'),
      },
      // Admin routes
      {
        path: 'admin/dashboard',
        name: 'admin-dashboard',
        component: () => import('@/pages/admin/AdminDashboard.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('@/pages/admin/AdminUsersPage.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'admin/pilgrimages',
        name: 'admin-pilgrimages',
        component: () => import('@/pages/admin/AdminPilgrimagesPage.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'admin/prayers',
        name: 'admin-prayers',
        component: () => import('@/pages/admin/AdminPrayersPage.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'admin/notifications',
        name: 'admin-notifications',
        component: () => import('@/pages/admin/AdminNotificationsPage.vue'),
        meta: { roles: ['admin'] },
      },
    ],
  },

  // ----- 404 -----
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/public/NotFoundPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard-default' }
  }

  if (to.meta.publicOnly && auth.isAuthenticated) {
    return { name: 'dashboard-default' }
  }

  const allowedRoles = to.meta.roles as UserRole[] | undefined
  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return { name: 'dashboard-default' }
  }

  return true
})

export default router
