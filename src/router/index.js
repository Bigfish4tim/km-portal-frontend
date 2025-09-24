// ==============================================
// 📁 src/router/index.js
// Vue Router 설정 - 3일차 업데이트
// ==============================================

import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

// ========================================
// 페이지 컴포넌트 Lazy Loading 방식 import
// - 성능 최적화를 위해 필요할 때만 컴포넌트 로드
// - 번들 크기 감소 및 초기 로딩 속도 개선
// ========================================

// 기본 레이아웃
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// 인증 관련 페이지
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')

// 메인 페이지들
const HomeView = () => import('@/views/HomeView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')

// 사용자 관리 페이지 (관리자용)
const UserManagementView = () => import('@/views/admin/UserManagementView.vue')
const RoleManagementView = () => import('@/views/admin/RoleManagementView.vue')

// 게시판 페이지
const BoardListView = () => import('@/views/board/BoardListView.vue')
const BoardDetailView = () => import('@/views/board/BoardDetailView.vue')
const BoardCreateView = () => import('@/views/board/BoardCreateView.vue')

// 파일 관리 페이지
const FileManagementView = () => import('@/views/file/FileManagementView.vue')

// 마이페이지
const MyPageView = () => import('@/views/mypage/MyPageView.vue')

// 에러 페이지
const NotFoundView = () => import('@/views/error/NotFoundView.vue')
const ForbiddenView = () => import('@/views/error/ForbiddenView.vue')

/**
 * 라우트 정의
 * - path: URL 경로
 * - name: 라우트 이름 (프로그램에서 참조용)
 * - component: 연결될 Vue 컴포넌트
 * - meta: 라우트 메타데이터 (인증, 권한, 제목 등)
 */
const routes = [
  // ========================================
  // 인증 관련 라우트 (AuthLayout 사용)
  // ========================================
  {
    path: '/auth',
    component: AuthLayout,  // 인증 전용 레이아웃
    children: [
      {
        path: 'login',
        name: 'Login',
        component: LoginView,
        meta: {
          title: '로그인',
          requiresAuth: false,  // 인증 불필요
          hideForAuth: true,    // 이미 로그인한 사용자는 접근 차단
          description: 'KM 포털 시스템에 로그인하세요'
        }
      },
      {
        path: 'register',
        name: 'Register', 
        component: RegisterView,
        meta: {
          title: '회원가입',
          requiresAuth: false,
          hideForAuth: true,
          description: '새로운 계정을 생성하세요'
        }
      }
    ]
  },

  // ========================================
  // 메인 애플리케이션 라우트 (DefaultLayout 사용)
  // ========================================
  {
    path: '/',
    component: DefaultLayout,  // 기본 레이아웃 (헤더, 사이드바 포함)
    children: [
      // 홈페이지 (리다이렉트)
      {
        path: '',
        name: 'Home',
        component: HomeView,
        meta: {
          title: 'KM 포털',
          requiresAuth: true,  // 로그인 필요
          description: 'KM 포털 시스템 메인 페이지'
        }
      },

      // 대시보드
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: {
          title: '대시보드',
          requiresAuth: true,
          roles: ['ROLE_USER'],  // 일반 사용자 이상 권한 필요
          description: '시스템 현황 및 통계 정보'
        }
      },

      // ========================================
      // 관리자 전용 페이지
      // ========================================
      {
        path: '/admin',
        meta: {
          title: '관리자 메뉴',
          requiresAuth: true,
          roles: ['ROLE_ADMIN', 'ROLE_MANAGER']  // 관리자 또는 매니저 권한 필요
        },
        children: [
          {
            path: 'users',
            name: 'UserManagement',
            component: UserManagementView,
            meta: {
              title: '사용자 관리',
              requiresAuth: true,
              roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
              description: '사용자 계정 관리 및 권한 설정'
            }
          },
          {
            path: 'roles',
            name: 'RoleManagement', 
            component: RoleManagementView,
            meta: {
              title: '역할 관리',
              requiresAuth: true,
              roles: ['ROLE_ADMIN'],  // 시스템 관리자만 접근 가능
              description: '시스템 역할 및 권한 관리'
            }
          }
        ]
      },

      // ========================================
      // 게시판 페이지
      // ========================================
      {
        path: '/board',
        meta: {
          title: '게시판',
          requiresAuth: true,
          roles: ['ROLE_USER']
        },
        children: [
          {
            path: '',
            name: 'BoardList',
            component: BoardListView,
            meta: {
              title: '게시글 목록',
              requiresAuth: true,
              roles: ['ROLE_USER'],
              description: '게시글 목록 및 검색'
            }
          },
          {
            path: 'create',
            name: 'BoardCreate',
            component: BoardCreateView,
            meta: {
              title: '게시글 작성',
              requiresAuth: true,
              roles: ['ROLE_USER'],
              description: '새로운 게시글 작성'
            }
          },
          {
            path: ':id',
            name: 'BoardDetail',
            component: BoardDetailView,
            props: true,  // route params를 props로 전달
            meta: {
              title: '게시글 상세',
              requiresAuth: true,
              roles: ['ROLE_USER'],
              description: '게시글 상세 내용 및 댓글'
            }
          }
        ]
      },

      // ========================================
      // 파일 관리 페이지
      // ========================================
      {
        path: '/files',
        name: 'FileManagement',
        component: FileManagementView,
        meta: {
          title: '파일 관리',
          requiresAuth: true,
          roles: ['ROLE_USER'],
          description: '파일 업로드, 다운로드 및 관리'
        }
      },

      // ========================================
      // 마이페이지
      // ========================================
      {
        path: '/mypage',
        name: 'MyPage',
        component: MyPageView,
        meta: {
          title: '마이페이지',
          requiresAuth: true,
          roles: ['ROLE_USER'],
          description: '개인정보 수정 및 계정 설정'
        }
      }
    ]
  },

  // ========================================
  // 에러 페이지 (레이아웃 없음)
  // ========================================
  {
    path: '/403',
    name: 'Forbidden',
    component: ForbiddenView,
    meta: {
      title: '접근 권한 없음',
      requiresAuth: false,
      description: '페이지에 접근할 권한이 없습니다'
    }
  },

  // ========================================
  // 404 에러 (모든 정의되지 않은 경로)
  // ========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: {
      title: '페이지를 찾을 수 없음',
      requiresAuth: false,
      description: '요청하신 페이지를 찾을 수 없습니다'
    }
  }
]

/**
 * Vue Router 인스턴스 생성
 * - history 모드 사용 (URL에 # 없이 깔끔한 주소)
 * - base URL은 환경변수로 설정 가능
 */
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  
  // 스크롤 동작 설정
  scrollBehavior(to, from, savedPosition) {
    // 뒤로가기/앞으로가기 시 이전 스크롤 위치로 복원
    if (savedPosition) {
      return savedPosition
    }
    // 새 페이지로 이동 시 맨 위로 스크롤
    return { top: 0 }
  }
})

// ========================================
// 라우터 가드 (Navigation Guards)
// ========================================

/**
 * 전역 네비게이션 가드 (before each route)
 * - 모든 라우트 이동 전에 실행되는 훅
 * - 인증 및 권한 검사 수행
 */
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 라우터 이동: ${from.path} → ${to.path}`)
  
  // 페이지 제목 설정
  document.title = to.meta.title ? `${to.meta.title} - KM Portal` : 'KM Portal'
  
  // 메타 description 설정 (SEO용)
  if (to.meta.description) {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', to.meta.description)
    }
  }

  // 사용자 인증 상태 확인
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const userRoles = store.getters['auth/userRoles']
  
  console.log(`🔐 인증 상태: ${isAuthenticated}, 사용자 역할:`, userRoles)

  // 1. 인증이 필요한 페이지인지 확인
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      console.log('❌ 인증되지 않은 사용자 → 로그인 페이지로 리다이렉트')
      // 로그인 후 원래 페이지로 돌아갈 수 있도록 redirect 파라미터 추가
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 2. 역할 기반 권한 확인
    if (to.meta.roles && to.meta.roles.length > 0) {
      const hasRequiredRole = to.meta.roles.some(role => userRoles.includes(role))
      
      if (!hasRequiredRole) {
        console.log('❌ 권한 부족 → 403 페이지로 리다이렉트')
        next({ name: 'Forbidden' })
        return
      }
    }
  }

  // 3. 이미 로그인한 사용자가 인증 페이지 접근 시 홈으로 리다이렉트
  if (to.meta.hideForAuth && isAuthenticated) {
    console.log('✅ 이미 인증된 사용자 → 홈페이지로 리다이렉트')
    next({ name: 'Home' })
    return
  }

  // 모든 조건을 통과하면 정상 진행
  console.log('✅ 라우터 가드 통과 → 페이지 이동 허용')
  next()
})

/**
 * 전역 네비게이션 가드 (after each route)
 * - 라우트 이동 완료 후 실행되는 훅
 * - 로딩 상태 해제, 분석 데이터 전송 등에 사용
 */
router.afterEach((to, from) => {
  console.log(`✅ 라우터 이동 완료: ${to.path}`)
  
  // 로딩 상태 해제 (NProgress 등 사용시)
  store.dispatch('ui/setLoading', false)
  
  // 페이지 방문 분석 (Google Analytics 등 연동시 사용)
  // gtag('config', 'GA_TRACKING_ID', {
  //   page_path: to.path
  // })
})

/**
 * 라우터 에러 핸들링
 * - 라우터 처리 중 발생하는 에러 처리
 */
router.onError((error) => {
  console.error('🔥 라우터 에러 발생:', error)
  
  // 에러를 store에 저장하여 에러 페이지에서 표시
  store.dispatch('ui/setError', {
    message: '페이지 로딩 중 오류가 발생했습니다.',
    details: error.message
  })
})

// ========================================
// 라우터 헬퍼 함수들
// ========================================

/**
 * 권한 확인 헬퍼 함수
 * - 컴포넌트에서 특정 권한 확인시 사용
 * 
 * @param {Array} requiredRoles 필요한 역할 배열
 * @returns {Boolean} 권한 보유 여부
 */
export const hasPermission = (requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  
  const userRoles = store.getters['auth/userRoles']
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * 안전한 라우터 푸시 함수
 * - 에러 처리를 포함한 라우터 이동
 * 
 * @param {String|Object} to 이동할 경로
 */
export const safeRouterPush = async (to) => {
  try {
    await router.push(to)
  } catch (error) {
    // NavigationDuplicated 에러는 무시 (같은 페이지로 이동시 발생)
    if (error.name !== 'NavigationDuplicated') {
      console.error('라우터 이동 에러:', error)
    }
  }
}

/**
 * 브레드크럼 생성 함수
 * - 현재 경로를 기반으로 네비게이션 경로 생성
 * 
 * @param {Object} route 현재 라우트 객체
 * @returns {Array} 브레드크럼 배열
 */
export const generateBreadcrumbs = (route) => {
  const breadcrumbs = []
  const pathArray = route.path.split('/').filter(path => path)
  
  let currentPath = ''
  pathArray.forEach(path => {
    currentPath += `/${path}`
    const matchedRoute = router.resolve(currentPath).matched[0]
    
    if (matchedRoute && matchedRoute.meta.title) {
      breadcrumbs.push({
        text: matchedRoute.meta.title,
        path: currentPath,
        disabled: currentPath === route.path
      })
    }
  })
  
  return breadcrumbs
}

export default router