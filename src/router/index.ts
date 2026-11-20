/**
 * 경로(주소 ↔ 화면) 표와 가드 — 명세 B-2a 4-6 · 4-7.
 *
 * | 주소 | 화면 | 틀 | 누가 |
 * |---|---|---|---|
 * | /login | 로그인 | 빈 틀 | 로그인하지 않은 사람(로그인했으면 / 로) |
 * | /password/expired | 만료 비밀번호 변경 창 | 빈 틀 | 로그인 화면에서 PASSWORD_EXPIRED 로 넘어온 사람만 |
 * | / | 임시 첫 화면 | 기본 틀 | 로그인한 사람 |
 * | /mypage/password | 본인 비밀번호 변경 | 기본 틀 | 로그인한 사람 |
 * | /env-check | 환경 점검(B-1) | 없음 | 🔴 개발 서버에서만 등록한다 |
 * | 그 밖 | → / | | |
 *
 * 🔴 화면의 막기는 편의다(P8). 보호는 서버가 한다.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import BlankLayout from '@/layouts/BlankLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useAuthStore } from '@/stores/auth'
import ExpiredPasswordView from '@/views/ExpiredPasswordView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import OwnPasswordView from '@/views/OwnPasswordView.vue'

import { ROUTE } from './names'

/**
 * 경로마다 붙이는 표시(meta).
 * TypeScript 관용: vue-router 의 RouteMeta 타입에 우리 필드를 더한다(모듈 보강).
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 로그인해야 들어온다 */
    requiresAuth?: boolean
    /** 로그인하지 않은 사람만 — 로그인했으면 / 로 */
    guestOnly?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: BlankLayout,
    meta: { guestOnly: true },
    children: [{ path: '', name: ROUTE.LOGIN, component: LoginView }],
  },
  {
    path: '/password/expired',
    component: BlankLayout,
    meta: { guestOnly: true },
    children: [{ path: '', name: ROUTE.EXPIRED_PASSWORD, component: ExpiredPasswordView }],
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: ROUTE.HOME, component: HomeView },
      { path: 'mypage/password', name: ROUTE.OWN_PASSWORD, component: OwnPasswordView },
    ],
  },
]

// 🔴 환경 점검 화면은 개발 서버에서만 — 운영 빌드에서는 이 블록이 통째로 빠진다(import.meta.env.DEV 가 false 로 고정되어)
// `() => import(...)`: 그 경로를 처음 열 때 화면 파일을 따로 읽는다(운영 빌드에는 파일도 들어가지 않는다)
if (import.meta.env.DEV) {
  routes.push({
    path: '/env-check',
    name: ROUTE.ENV_CHECK,
    component: () => import('@/views/EnvCheckView.vue'),
  })
}

// 없는 주소는 / 로(로그인하지 않았으면 가드가 다시 /login 으로 보낸다)
routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })

const router = createRouter({
  // createWebHistory: 주소에 `#` 없이 `/path` 꼴을 쓴다
  history: createWebHistory(),
  routes,
})

/**
 * 가드 — 화면이 바뀌기 전에 매번 불린다.
 * 돌려주는 값: 없음(그대로 간다) · 다른 경로(그리로 보낸다).
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 첫 진입: 새로 고침 뒤라면 재발급용 토큰으로 로그인 상태를 되살린 다음 판정한다
  if (auth.status === 'unknown') {
    await auth.restore()
  }

  // to.matched: 이 주소에 걸린 경로들(부모 틀 포함) — 부모의 meta 도 본다
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (requiresAuth && auth.status !== 'authed') {
    // 가려던 곳을 redirect 로 붙인다(로그인 뒤 safeRedirect 로 검사하고 간다). 첫 화면이면 붙이지 않는다
    return to.fullPath === '/'
      ? { name: ROUTE.LOGIN }
      : { name: ROUTE.LOGIN, query: { redirect: to.fullPath } }
  }
  if (guestOnly && auth.status === 'authed') {
    return { path: '/' }
  }
  // 변경 창은 로그인 화면이 아이디를 넘겨줬을 때만(주소를 직접 쳤거나 새로 고침하면 아이디가 없다)
  if (to.name === ROUTE.EXPIRED_PASSWORD && auth.pendingExpiredUsername === null) {
    return { name: ROUTE.LOGIN }
  }
  return undefined
})

export { ROUTE }
export default router
