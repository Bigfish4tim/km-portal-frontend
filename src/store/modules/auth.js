// ==============================================
// 📁 src/store/modules/auth.js
// 인증/인가 모듈
// ==============================================

import { api } from '@/services/api'
import router from '@/router'

/**
 * 인증 상태 관리 모듈
 * - 로그인/로그아웃 처리
 * - JWT 토큰 관리
 * - 사용자 정보 및 권한 관리
 */
const auth = {
  namespaced: true,  // 네임스페이스 사용

  // ========================================
  // 상태 정의
  // ========================================
  state: {
    // 인증 상태
    isAuthenticated: false,
    
    // 사용자 정보
    user: null,
    
    // JWT 토큰
    token: null,
    refreshToken: null,
    
    // 권한 정보
    roles: [],
    permissions: [],
    
    // 로그인 상태
    loginLoading: false,
    loginError: null,
    
    // 마지막 활동 시간
    lastActivity: null
  },

  // ========================================
  // 게터 정의
  // ========================================
  getters: {
    /**
     * 인증 상태 확인
     */
    isAuthenticated: (state) => state.isAuthenticated,
    
    /**
     * 현재 사용자 정보
     */
    currentUser: (state) => state.user,
    
    /**
     * 사용자 역할 목록
     */
    userRoles: (state) => state.roles,
    
    /**
     * 사용자 권한 목록
     */
    userPermissions: (state) => state.permissions,
    
    /**
     * JWT 토큰
     */
    accessToken: (state) => state.token,
    
    /**
     * 로그인 로딩 상태
     */
    isLoginLoading: (state) => state.loginLoading,
    
    /**
     * 로그인 에러
     */
    loginError: (state) => state.loginError,
    
    /**
     * 특정 역할 보유 확인
     */
    hasRole: (state) => (roleName) => {
      return state.roles.includes(roleName)
    },
    
    /**
     * 관리자 권한 확인
     */
    isAdmin: (state) => {
      return state.roles.includes('ROLE_ADMIN')
    },
    
    /**
     * 매니저 권한 확인 (관리자 포함)
     */
    isManager: (state) => {
      return state.roles.includes('ROLE_ADMIN') || state.roles.includes('ROLE_MANAGER')
    }
  },

  // ========================================
  // 뮤테이션 정의
  // ========================================
  mutations: {
    /**
     * 로그인 시작
     */
    LOGIN_START(state) {
      state.loginLoading = true
      state.loginError = null
    },

    /**
     * 로그인 성공
     */
    LOGIN_SUCCESS(state, { user, token, refreshToken }) {
      state.isAuthenticated = true
      state.user = user
      state.token = token
      state.refreshToken = refreshToken
      state.roles = user.roles || []
      state.permissions = user.permissions || []
      state.loginLoading = false
      state.loginError = null
      state.lastActivity = new Date().toISOString()
    },

    /**
     * 로그인 실패
     */
    LOGIN_FAILURE(state, error) {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.refreshToken = null
      state.roles = []
      state.permissions = []
      state.loginLoading = false
      state.loginError = error
    },

    /**
     * 로그아웃
     */
    LOGOUT(state) {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.refreshToken = null
      state.roles = []
      state.permissions = []
      state.loginLoading = false
      state.loginError = null
      state.lastActivity = null
    },

    /**
     * 사용자 정보 업데이트
     */
    UPDATE_USER(state, user) {
      state.user = { ...state.user, ...user }
    },

    /**
     * 토큰 갱신
     */
    REFRESH_TOKEN(state, { token, refreshToken }) {
      state.token = token
      if (refreshToken) {
        state.refreshToken = refreshToken
      }
    },

    /**
     * 마지막 활동 시간 업데이트
     */
    UPDATE_LAST_ACTIVITY(state) {
      state.lastActivity = new Date().toISOString()
    }
  },

  // ========================================
  // 액션 정의
  // ========================================
  actions: {
    /**
     * 로그인 처리
     */
    async login({ commit }, credentials) {
      commit('LOGIN_START')
      
      try {
        // API 호출로 로그인 요청
        const response = await api.post('/auth/login', credentials)
        
        const { user, token, refreshToken } = response.data.data
        
        // 토큰을 localStorage에 저장
        localStorage.setItem('km_portal_token', token)
        if (refreshToken) {
          localStorage.setItem('km_portal_refresh_token', refreshToken)
        }
        
        // 상태 업데이트
        commit('LOGIN_SUCCESS', { user, token, refreshToken })
        
        console.log('✅ 로그인 성공:', user.username)
        
        return { success: true, user }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.'
        commit('LOGIN_FAILURE', errorMessage)
        
        console.error('❌ 로그인 실패:', errorMessage)
        
        return { success: false, error: errorMessage }
      }
    },

    /**
     * 로그아웃 처리
     */
    async logout({ commit, state }) {
      try {
        // 서버에 로그아웃 요청 (선택적)
        if (state.token) {
          await api.post('/auth/logout')
        }
      } catch (error) {
        console.warn('로그아웃 API 호출 실패:', error)
      } finally {
        // 로컬 스토리지에서 토큰 제거
        localStorage.removeItem('km_portal_token')
        localStorage.removeItem('km_portal_refresh_token')
        
        // 상태 초기화
        commit('LOGOUT')
        
        // 로그인 페이지로 리다이렉트
        router.push({ name: 'Login' })
        
        console.log('✅ 로그아웃 완료')
      }
    },

    /**
     * 인증 상태 확인
     */
    async checkAuthStatus({ commit }) {
      const token = localStorage.getItem('km_portal_token')
      
      if (!token) {
        return false
      }
      
      try {
        // 토큰으로 사용자 정보 조회
        const response = await api.get('/auth/me')
        const user = response.data.data
        
        commit('LOGIN_SUCCESS', { 
          user, 
          token, 
          refreshToken: localStorage.getItem('km_portal_refresh_token')
        })
        
        console.log('✅ 인증 상태 확인 완료:', user.username)
        return true
        
      } catch (error) {
        console.warn('❌ 인증 상태 확인 실패:', error)
        
        // 유효하지 않은 토큰 제거
        localStorage.removeItem('km_portal_token')
        localStorage.removeItem('km_portal_refresh_token')
        
        return false
      }
    },

    /**
     * 토큰 갱신
     */
    async refreshAuthToken({ commit, state }) {
      const refreshToken = state.refreshToken || localStorage.getItem('km_portal_refresh_token')
      
      if (!refreshToken) {
        throw new Error('Refresh token not found')
      }
      
      try {
        const response = await api.post('/auth/refresh', { refreshToken })
        const { token, refreshToken: newRefreshToken } = response.data.data
        
        localStorage.setItem('km_portal_token', token)
        if (newRefreshToken) {
          localStorage.setItem('km_portal_refresh_token', newRefreshToken)
        }
        
        commit('REFRESH_TOKEN', { token, refreshToken: newRefreshToken })
        
        return token
        
      } catch (error) {
        console.error('토큰 갱신 실패:', error)
        
        // 갱신 실패시 로그아웃 처리
        await this.dispatch('auth/logout')
        
        throw error
      }
    },

    /**
     * 사용자 정보 업데이트
     */
    async updateUserInfo({ commit }, userData) {
      try {
        const response = await api.put('/auth/profile', userData)
        const updatedUser = response.data.data
        
        commit('UPDATE_USER', updatedUser)
        
        return { success: true, user: updatedUser }
        
      } catch (error) {
        console.error('사용자 정보 업데이트 실패:', error)
        return { success: false, error: error.response?.data?.message }
      }
    },

    /**
     * 활동 시간 업데이트
     */
    updateActivity({ commit }) {
      commit('UPDATE_LAST_ACTIVITY')
    }
  }
}

export default auth