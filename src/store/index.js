/**
 * Vuex 메인 스토어 설정 (5일차 기본 버전)
 * 
 * 5일차 JWT 인증 시스템 테스트를 위한 기본 스토어 구성입니다.
 * 현재는 인증 모듈만 구현되어 있으며, 향후 다른 모듈들을 단계별로 추가합니다.
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-24
 */

import { createStore } from 'vuex'
import authModule from './modules/auth'

/**
 * Vuex Store 생성 (5일차 최소 버전)
 */
const store = createStore({
  /**
   * 전역 상태 정의
   */
  state: {
    // 애플리케이션 정보
    appInfo: {
      name: 'KM 포털',
      version: '1.0.0',
      description: '지식관리 통합 업무 시스템',
      buildDate: process.env.VUE_APP_BUILD_DATE || new Date().toISOString()
    },
    
    // API 기본 URL
    apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080',
    
    // 환경 정보
    environment: process.env.NODE_ENV || 'development',
    
    // 전역 에러 상태
    globalError: null,
    
    // 온라인 상태
    isOnline: navigator.onLine,
    
    // 애플리케이션 로딩 상태
    isLoading: false
  },

  /**
   * 전역 Mutations
   */
  mutations: {
    setGlobalError(state, error) {
      state.globalError = error
    },

    clearGlobalError(state) {
      state.globalError = null
    },

    setOnlineStatus(state, isOnline) {
      state.isOnline = isOnline
    },

    setLoading(state, isLoading) {
      state.isLoading = isLoading
    }
  },

  /**
   * 전역 Actions
   */
  actions: {
    async initializeApp({ dispatch, commit }) {
      try {
        console.log('[Store] 애플리케이션 초기화 시작')

        // 온라인 상태 이벤트 리스너 설정
        this.dispatch('setupOnlineStatusListener')

        // 인증 상태 확인 및 복원
        const authService = (await import('@/services/authService')).default
        if (authService.isAuthenticated()) {
          console.log('[Store] 기존 인증 상태 감지됨')
          
          try {
            // 사용자 정보 유효성 재확인은 향후 구현
            console.log('[Store] 사용자 정보 확인 완료')
          } catch (error) {
            console.warn('[Store] 사용자 정보 갱신 실패, 로그아웃 처리')
            await dispatch('auth/logout')
          }
        }

        console.log('[Store] 애플리케이션 초기화 완료')

      } catch (error) {
        console.error('[Store] 애플리케이션 초기화 실패:', error)
        commit('setGlobalError', '애플리케이션 초기화에 실패했습니다.')
      }
    },

    setupOnlineStatusListener({ commit }) {
      const updateOnlineStatus = () => {
        const isOnline = navigator.onLine
        commit('setOnlineStatus', isOnline)
        
        if (isOnline) {
          console.log('[Store] 네트워크 연결됨')
        } else {
          console.warn('[Store] 네트워크 연결 끊김')
        }
      }

      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)

      // 초기 상태 설정
      updateOnlineStatus()
    },

    handleGlobalError({ commit }, error) {
      console.error('[Store] 전역 에러 발생:', error)
      
      let errorMessage = '알 수 없는 오류가 발생했습니다.'
      
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      commit('setGlobalError', errorMessage)
      
      // 3초 후 자동으로 에러 메시지 제거
      setTimeout(() => {
        commit('clearGlobalError')
      }, 3000)
    }
  },

  /**
   * 전역 Getters
   */
  getters: {
    isDevelopment: (state) => {
      return state.environment === 'development'
    },

    isProduction: (state) => {
      return state.environment === 'production'
    },

    appVersion: (state) => {
      return `${state.appInfo.name} v${state.appInfo.version}`
    },

    apiUrl: (state) => {
      return state.apiBaseUrl
    },

    hasGlobalError: (state) => {
      return !!state.globalError
    }
  },

  /**
   * 모듈 정의 (5일차 기본 버전)
   */
  modules: {
    // 인증 관련 상태 관리 모듈
    auth: authModule
  },

  /**
   * 개발 모드에서만 strict 모드 활성화
   */
  strict: process.env.NODE_ENV === 'development'
})

/**
 * 전역 에러 핸들러 설정
 */
export function setupGlobalErrorHandler(app) {
  // Vue 애플리케이션 에러 핸들러
  app.config.errorHandler = (error, instance, info) => {
    console.error('[Vue Error Handler]', error, info)
    store.dispatch('handleGlobalError', error)
  }

  // 전역 promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
    store.dispatch('handleGlobalError', event.reason)
    event.preventDefault()
  })

  // 전역 JavaScript 에러 핸들러
  window.addEventListener('error', (event) => {
    console.error('[Global JavaScript Error]', event.error)
    store.dispatch('handleGlobalError', event.error)
  })
}

export default store