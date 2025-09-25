/**
 * Vue Router 설정 및 라우터 가드 구현 (5일차 최소 버전)
 * 
 * 5일차 JWT 인증 시스템 테스트를 위한 최소한의 라우터 설정입니다.
 * 향후 사용자 관리, 파일 관리, 게시판 등의 페이지는 단계별로 추가됩니다.
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-24
 */

import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import authService from '@/services/authService'

/**
 * 라우트 정의 (5일차 기본 버전)
 * 
 * 현재는 로그인과 대시보드만 구현되어 있습니다.
 * 나머지 페이지들은 향후 단계별로 추가됩니다.
 */
const routes = [
  // ===== 공개 페이지 =====
  
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '로그인',
      requiresAuth: false,
      hideForAuth: true,
      layout: 'blank'
    }
  },

  // ===== 인증 필요 페이지 =====
  
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '대시보드',
      requiresAuth: true,
      icon: 'el-icon-odometer'
    }
  },

  // ===== 에러 페이지 =====
  
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/ForbiddenView.vue'),
    meta: {
      title: '접근 금지',
      requiresAuth: false,
      hideInMenu: true,
      layout: 'blank'
    }
  },
  
  {
    path: '/404',
    name: 'NotFound', 
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: {
      title: '페이지를 찾을 수 없음',
      requiresAuth: false,
      hideInMenu: true,
      layout: 'blank'
    }
  },

  // ===== 개발 중 페이지 (임시) =====
  
  {
    path: '/coming-soon',
    name: 'ComingSoon',
    component: () => import('@/views/ComingSoon.vue'),
    meta: {
      title: '준비 중',
      requiresAuth: true,
      hideInMenu: true
    }
  },

  // ===== 404 리디렉션 =====
  
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

/**
 * Vue Router 인스턴스 생성
 */
const router = createRouter({
  // HTML5 History API 사용
  history: createWebHistory(process.env.BASE_URL),
  routes,
  
  // 라우트 변경시 스크롤 위치 제어
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      // 뒤로가기시 이전 스크롤 위치로 복원
      return savedPosition
    } else {
      // 새 페이지는 맨 위로 스크롤
      return { top: 0 }
    }
  }
})

/**
 * 전역 라우터 가드 - 페이지 진입 전 실행
 * 
 * 모든 라우트 변경시 실행되어 다음 사항들을 확인합니다:
 * - 사용자 인증 상태
 * - 페이지 접근 권한
 * - 페이지 타이틀 설정
 * - 필요시 로그인 페이지로 리디렉션
 */
router.beforeEach(async (to, from, next) => {
  try {
    // 로딩 상태 표시 (필요시)
    if (store.state.app) {
      store.commit('app/setLoading', true)
    }

    console.log(`[Router] 페이지 이동: ${from.path} → ${to.path}`)

    // 1. 페이지 타이틀 설정
    updatePageTitle(to.meta.title)

    // 2. 인증이 필요하지 않은 페이지는 바로 통과
    if (!to.meta.requiresAuth) {
      // 이미 로그인된 사용자가 로그인 페이지 접근시 대시보드로 리디렉션
      if (to.meta.hideForAuth && authService.isAuthenticated()) {
        console.log('[Router] 이미 인증된 사용자, 대시보드로 리디렉션')
        next('/')
        return
      }
      
      next()
      return
    }

    // 3. 인증 상태 확인
    if (!authService.isAuthenticated()) {
      console.warn('[Router] 미인증 사용자, 로그인 페이지로 리디렉션')
      
      // 현재 경로를 쿼리 파라미터로 저장하여 로그인 후 원래 페이지로 돌아갈 수 있도록 함
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 4. 권한 확인 (특정 권한이 필요한 페이지)
    if (to.meta.roles && to.meta.roles.length > 0) {
      const hasRequiredRole = authService.hasAnyRole(to.meta.roles)
      
      if (!hasRequiredRole) {
        console.warn('[Router] 권한 부족, 접근 금지 페이지로 리디렉션')
        console.warn(`[Router] 필요 권한: ${to.meta.roles.join(', ')}`)
        
        const currentUser = authService.getCurrentUser()
        console.warn(`[Router] 현재 권한: ${currentUser?.roles?.join(', ') || '없음'}`)
        
        next('/403')
        return
      }
    }

    // 5. 모든 검증 통과, 페이지 진입 허용
    console.log('[Router] 페이지 접근 허용')
    next()

  } catch (error) {
    console.error('[Router] 라우터 가드 실행 중 오류:', error)
    
    // 오류 발생시 로그인 페이지로 안전하게 리디렉션
    if (to.path !== '/login') {
      next('/login')
    } else {
      next()
    }
  }
})

/**
 * 전역 라우터 가드 - 페이지 진입 후 실행
 * 
 * 페이지 이동이 완료된 후 후처리 작업을 수행합니다.
 */
router.afterEach((to, from) => {
  // 로딩 상태 해제
  if (store.state.app) {
    store.commit('app/setLoading', false)
  }

  // 페이지 이동 로그
  console.log(`[Router] 페이지 이동 완료: ${to.path}`)
  
  // Google Analytics 등 추적 도구 연동 (필요시)
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: to.path
    })
  }
})

/**
 * 라우터 에러 핸들링
 * 
 * 라우팅 중 발생하는 에러를 처리합니다.
 */
router.onError((error) => {
  console.error('[Router] 라우팅 오류:', error)
  
  // 404 페이지로 리디렉션
  if (error.message.includes('Failed to resolve component')) {
    router.push('/404')
  }
})

/**
 * 페이지 타이틀을 업데이트하는 헬퍼 함수
 * 
 * @param {string} title - 설정할 페이지 타이틀
 */
function updatePageTitle(title) {
  const baseTitle = 'KM 포털'
  
  if (title) {
    document.title = `${title} - ${baseTitle}`
  } else {
    document.title = baseTitle
  }
}

/**
 * 권한별 접근 가능한 라우트를 필터링하는 헬퍼 함수
 * 
 * 사이드바 메뉴 생성시 사용자의 권한에 따라 표시할 메뉴를 결정할 때 사용합니다.
 * 
 * @param {Array} routes - 전체 라우트 배열
 * @param {Array} userRoles - 현재 사용자의 권한 배열
 * @returns {Array} 접근 가능한 라우트 배열
 */
export function getAccessibleRoutes(routes, userRoles) {
  return routes.filter(route => {
    // 메뉴에서 숨겨진 라우트는 제외
    if (route.meta?.hideInMenu) {
      return false
    }
    
    // 인증이 필요하지 않은 라우트는 포함
    if (!route.meta?.requiresAuth) {
      return true
    }
    
    // 특정 권한이 필요하지 않은 인증된 사용자용 라우트는 포함
    if (!route.meta?.roles || route.meta.roles.length === 0) {
      return true
    }
    
    // 사용자가 필요 권한 중 하나라도 가지고 있으면 포함
    return route.meta.roles.some(role => userRoles.includes(role))
  })
}

/**
 * 현재 사용자가 특정 라우트에 접근할 수 있는지 확인하는 헬퍼 함수
 * 
 * @param {Object} route - 확인할 라우트 객체
 * @param {Array} userRoles - 현재 사용자의 권한 배열
 * @returns {boolean} 접근 가능하면 true, 불가능하면 false
 */
export function canAccessRoute(route, userRoles) {
  // 인증이 필요하지 않은 라우트는 모두 접근 가능
  if (!route.meta?.requiresAuth) {
    return true
  }
  
  // 사용자가 인증되지 않은 경우
  if (!authService.isAuthenticated()) {
    return false
  }
  
  // 특정 권한이 필요하지 않은 경우 (인증만 필요)
  if (!route.meta?.roles || route.meta.roles.length === 0) {
    return true
  }
  
  // 사용자가 필요 권한 중 하나라도 가지고 있는지 확인
  return route.meta.roles.some(role => userRoles.includes(role))
}

export default router