// ==============================================
// 📁 src/main.js
// Vue 애플리케이션 진입점 - 3일차 최종 업데이트
// ==============================================

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Element Plus 관련
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ko from 'element-plus/dist/locale/ko.mjs'

// 글로벌 스타일
import '@/assets/css/global.scss'
import 'animate.css'
import 'nprogress/nprogress.css'

// 유틸리티 및 서비스
import constants from '@/utils/constants'
import api from '@/services/api'

// NProgress 설정 (페이지 로딩 진행률 표시)
import NProgress from 'nprogress'

/**
 * NProgress 설정
 * - 라우터 이동시 상단에 진행률 바 표시
 * - 부드러운 사용자 경험 제공
 */
NProgress.configure({
  showSpinner: false,    // 스피너 숨김
  minimum: 0.2,          // 최소 진행률
  speed: 500,            // 애니메이션 속도
  trickleSpeed: 200      // 자동 진행 속도
})

/**
 * Vue 애플리케이션 생성 및 설정
 */
const app = createApp(App)

// ==============================================
// Element Plus 설정
// ==============================================

app.use(ElementPlus, {
  // 한국어 로케일 설정
  locale: ko,
  
  // 기본 컴포넌트 크기
  size: 'default',
  
  // z-index 시작값 (모달, 드롭다운 등)
  zIndex: 3000,
  
  // 네임스페이스 (CSS 클래스 접두사)
  namespace: 'el'
})

// Element Plus 아이콘 전역 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ==============================================
// Vue Router 설정
// ==============================================

app.use(router)

// 라우터 네비게이션 가드에서 NProgress 연동
router.beforeEach((to, from, next) => {
  // 페이지 이동 시작시 진행률 바 표시
  NProgress.start()
  next()
})

router.afterEach(() => {
  // 페이지 이동 완료시 진행률 바 숨김
  NProgress.done()
})

// ==============================================
// Vuex Store 설정
// ==============================================

app.use(store)

// ==============================================
// 전역 속성 등록
// ==============================================

// 상수 객체 전역 등록
app.config.globalProperties.$constants = constants

// API 객체 전역 등록 (Composition API에서는 import 사용 권장)
app.config.globalProperties.$api = api

// 환경 변수 전역 등록
app.config.globalProperties.$env = {
  NODE_ENV: process.env.NODE_ENV,
  VUE_APP_API_BASE_URL: process.env.VUE_APP_API_BASE_URL,
  VUE_APP_VERSION: process.env.VUE_APP_VERSION || '1.0.0'
}

// 개발 도구 헬퍼 함수들 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  // 전역 윈도우 객체에 개발 도구 추가
  window.vueApp = app
  window.vueRouter = router
  window.vueStore = store
  
  // API 테스트 헬퍼 함수
  window.vueHelpers = {
    // API 테스트 함수
    async testApi() {
      try {
        console.log('🔍 API 테스트 시작...')
        const response = await api.get('/health')
        console.log('✅ API 테스트 성공:', response.data)
        return response.data
      } catch (error) {
        console.error('❌ API 테스트 실패:', error)
        return { error: error.message }
      }
    },
    
    // 상태 확인 함수
    checkAuthState() {
      const authState = store.state.auth
      console.log('🔐 인증 상태:', {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        roles: authState.roles
      })
      return authState
    },
    
    // 테마 토글 함수
    toggleTheme() {
      store.dispatch('toggleTheme')
      console.log(`🎨 테마 변경됨: ${store.getters.currentTheme}`)
    },
    
    // 테스트 알림 함수
    testNotification(type = 'info', message = '테스트 알림입니다.') {
      store.dispatch(`ui/show${type.charAt(0).toUpperCase() + type.slice(1)}`, message)
    },
    
    // 로컬 스토리지 정리 함수
    clearStorage() {
      localStorage.clear()
      sessionStorage.clear()
      console.log('🧹 스토리지 정리 완료')
    }
  }
  
  console.log(`
🚀 KM Portal 개발 환경 준비 완료!

개발 도구 사용법:
- window.vueHelpers.testApi()           // API 연결 테스트
- window.vueHelpers.checkAuthState()    // 인증 상태 확인
- window.vueHelpers.toggleTheme()       // 테마 토글
- window.vueHelpers.testNotification()  // 알림 테스트
- window.vueHelpers.clearStorage()      // 스토리지 정리

Vue 인스턴스:
- window.vueApp      // Vue 앱 인스턴스
- window.vueRouter   // Vue Router 인스턴스
- window.vueStore    // Vuex Store 인스턴스
  `)
}

// ==============================================
// 전역 에러 핸들링
// ==============================================

// Vue 내부 에러 핸들링
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 에러:', err)
  console.error('컴포넌트:', vm)
  console.error('에러 정보:', info)
  
  // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket 등 에러 모니터링 서비스 연동
    // Sentry.captureException(err, { extra: { info, componentTrace: vm } })
  }
  
  // 사용자에게 에러 알림 표시
  store.dispatch('ui/showError', '애플리케이션 오류가 발생했습니다.')
}

// 전역 경고 핸들링 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue 경고:', msg)
    console.warn('컴포넌트 트레이스:', trace)
  }
}

// ==============================================
// 성능 모니터링 (개발 환경)
// ==============================================

if (process.env.NODE_ENV === 'development') {
  // Vue DevTools 활성화
  app.config.devtools = true
  
  // 성능 추적 활성화
  app.config.performance = true
  
  // 컴포넌트 렌더링 시간 측정
  let renderStartTime = 0
  
  app.mixin({
    beforeCreate() {
      renderStartTime = performance.now()
    },
    mounted() {
      const renderTime = performance.now() - renderStartTime
      if (renderTime > 100) { // 100ms 이상 걸린 컴포넌트만 로깅
        console.warn(`⚠️ 느린 컴포넌트 감지: ${this.$options.name || 'Unknown'} (${renderTime.toFixed(2)}ms)`)
      }
    }
  })
}

// ==============================================
// 프로덕션 최적화
// ==============================================

if (process.env.NODE_ENV === 'production') {
  // 개발 도구 비활성화
  app.config.devtools = false
  app.config.performance = false
  
  // 콘솔 로그 제거 (webpack에서도 처리하지만 추가 보험)
  console.log = () => {}
  console.warn = () => {}
  console.info = () => {}
  
  // 단, 에러는 유지
  // console.error는 그대로 두어 중요한 에러 확인 가능
}

// ==============================================
// 앱 마운트
// ==============================================

// DOM이 완전히 로드된 후 앱 마운트
document.addEventListener('DOMContentLoaded', () => {
  const startTime = performance.now()
  
  // Vue 앱 마운트
  app.mount('#app')
  
  const mountTime = performance.now() - startTime
  console.log(`✅ KM Portal 마운트 완료 (${mountTime.toFixed(2)}ms)`)
  
  // 앱 로딩 완료 이벤트 발생 (필요시 다른 스크립트에서 감지 가능)
  window.dispatchEvent(new CustomEvent('km-portal-loaded', {
    detail: {
      mountTime,
      version: process.env.VUE_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    }
  }))
})

// ==============================================
// 서비스 워커 등록 (PWA - 향후 구현 예정)
// ==============================================

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW 등록 성공:', registration)
      })
      .catch(error => {
        console.log('SW 등록 실패:', error)
      })
  })
}

// ==============================================
// 브라우저 호환성 체크
// ==============================================

// 필수 API 지원 여부 확인
const requiredFeatures = [
  'fetch',
  'Promise',
  'localStorage',
  'sessionStorage'
]

const unsupportedFeatures = requiredFeatures.filter(feature => !(feature in window))

if (unsupportedFeatures.length > 0) {
  console.error('지원되지 않는 브라우저 기능:', unsupportedFeatures)
  
  // 구형 브라우저 안내 메시지 표시
  const warningDiv = document.createElement('div')
  warningDiv.innerHTML = `
    <div style="background: #f56c6c; color: white; padding: 16px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 10000;">
      <strong>브라우저 호환성 경고:</strong> 
      이 애플리케이션은 최신 브라우저에서 최적화되어 있습니다. 
      Chrome, Firefox, Safari, Edge의 최신 버전을 사용해주세요.
    </div>
  `
  document.body.appendChild(warningDiv)
}

export default app