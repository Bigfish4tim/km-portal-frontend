/**
 * Vue.js 애플리케이션의 인증 관련 비즈니스 로직을 담당하는 서비스
 * 
 * 이 서비스는 사용자 인증과 관련된 모든 클라이언트 측 로직을 처리합니다:
 * - 로그인/로그아웃 처리
 * - 토큰 관리 (localStorage 저장/삭제)
 * - 사용자 정보 관리
 * - 인증 상태 확인
 * - 권한 검증
 * 
 * Vuex 스토어와 연동되어 전역 상태를 관리하며,
 * Vue Router와 함께 라우트 가드 기능을 제공합니다.
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-24
 */

import api, { extractData } from './api'
import store from '@/store'
import router from '@/router'

/**
 * 로컬 스토리지 키 상수 정의
 * 토큰과 사용자 정보를 저장할 때 사용되는 키들입니다.
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'km_portal_access_token',
  REFRESH_TOKEN: 'km_portal_refresh_token', 
  USER_INFO: 'km_portal_user_info',
  LOGIN_TIME: 'km_portal_login_time'
}

/**
 * 인증 서비스 클래스
 * 
 * 모든 인증 관련 기능을 제공하는 중앙화된 서비스입니다.
 * 싱글톤 패턴으로 구현되어 애플리케이션 전체에서 동일한 인스턴스를 사용합니다.
 */
class AuthService {
  constructor() {
    // 애플리케이션 시작시 로컬 스토리지에서 인증 정보 복원
    this.initializeFromStorage()
  }

  /**
   * 로컬 스토리지에서 인증 정보를 복원하는 메서드
   * 
   * 브라우저를 새로고침하거나 다시 열었을 때 
   * 이전 로그인 상태를 유지하기 위해 사용됩니다.
   */
  initializeFromStorage() {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO)
      const loginTime = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME)
      
      // 모든 필수 정보가 존재하는 경우에만 복원
      if (accessToken && refreshToken && userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        
        // Vuex 스토어에 인증 정보 복원
        store.commit('auth/setTokens', {
          accessToken,
          refreshToken
        })
        store.commit('auth/setUser', userInfo)
        store.commit('auth/setLoginTime', loginTime)
        
        console.log('[Auth] 로그인 상태 복원됨:', userInfo.username)
      }
    } catch (error) {
      console.error('[Auth] 인증 정보 복원 실패:', error)
      // 복원 실패시 저장된 정보 정리
      this.clearStorage()
    }
  }

  /**
   * 사용자 로그인을 처리하는 메서드
   * 
   * 입력받은 사용자명과 비밀번호로 백엔드 인증 API를 호출하고,
   * 성공시 토큰과 사용자 정보를 저장합니다.
   * 
   * @param {string} username - 사용자명
   * @param {string} password - 비밀번호
   * @returns {Promise<Object>} 로그인 결과 { success: boolean, message?: string, userInfo?: Object }
   */
  async login(username, password) {
    try {
      // 입력값 검증
      if (!username || !password) {
        return {
          success: false,
          message: '사용자명과 비밀번호를 모두 입력해주세요.'
        }
      }

      // 로그인 요청 데이터 준비
      const loginData = {
        username: username.trim(),
        password: password
      }

      console.log('[Auth] 로그인 시도:', username)

      // 백엔드 로그인 API 호출
      const response = await extractData(
        api.post('/auth/login', loginData)
      )

      // 로그인 실패 처리
      if (!response.success) {
        return {
          success: false,
          message: response.message || '로그인에 실패했습니다.'
        }
      }

      // 로그인 성공 처리
      const { accessToken, refreshToken, userInfo } = response
      const loginTime = new Date().toISOString()

      // Vuex 스토어에 인증 정보 저장
      store.commit('auth/setTokens', {
        accessToken,
        refreshToken
      })
      store.commit('auth/setUser', userInfo)
      store.commit('auth/setLoginTime', loginTime)

      // 로컬 스토리지에 인증 정보 저장 (브라우저 재시작시 복원용)
      this.saveToStorage({
        accessToken,
        refreshToken,
        userInfo,
        loginTime
      })

      console.log('[Auth] 로그인 성공:', userInfo.username)

      return {
        success: true,
        userInfo: userInfo
      }

    } catch (error) {
      console.error('[Auth] 로그인 오류:', error)
      
      // API 응답에서 구체적인 에러 메시지 추출
      const errorMessage = error.response?.data?.message 
        || error.message 
        || '로그인 중 오류가 발생했습니다.'

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  /**
   * 사용자 로그아웃을 처리하는 메서드
   * 
   * 백엔드 로그아웃 API를 호출하고, 클라이언트의 모든 인증 정보를 제거합니다.
   * API 호출 실패 여부와 관계없이 클라이언트 측 정보는 항상 제거됩니다.
   */
  async logout() {
    try {
      const currentUser = store.getters['auth/user']
      
      if (currentUser) {
        console.log('[Auth] 로그아웃 시도:', currentUser.username)
      }

      // 백엔드 로그아웃 API 호출 (선택사항)
      // JWT 특성상 서버에서 토큰을 무효화할 수 없지만, 
      // 로그아웃 이벤트를 서버에 알리기 위해 호출
      try {
        await api.post('/auth/logout')
      } catch (error) {
        // 로그아웃 API 실패는 무시 (클라이언트 측 정리는 계속 진행)
        console.warn('[Auth] 로그아웃 API 호출 실패:', error.message)
      }

      // 클라이언트 측 인증 정보 모두 제거
      this.clearAuthData()
      
      console.log('[Auth] 로그아웃 완료')

      // 로그인 페이지로 리디렉션
      if (router.currentRoute.path !== '/login') {
        await router.push('/login')
      }

    } catch (error) {
      console.error('[Auth] 로그아웃 처리 오류:', error)
      
      // 오류가 발생해도 클라이언트 정보는 제거
      this.clearAuthData()
      
      if (router.currentRoute.path !== '/login') {
        await router.push('/login')
      }
    }
  }

  /**
   * 현재 사용자의 인증 상태를 확인하는 메서드
   * 
   * @returns {boolean} 인증된 사용자인 경우 true, 아니면 false
   */
  isAuthenticated() {
    const accessToken = store.getters['auth/accessToken']
    const user = store.getters['auth/user']
    
    return !!(accessToken && user)
  }

  /**
   * 현재 사용자 정보를 반환하는 메서드
   * 
   * @returns {Object|null} 사용자 정보 객체 또는 null
   */
  getCurrentUser() {
    return store.getters['auth/user']
  }

  /**
   * 현재 사용자가 특정 권한을 가지고 있는지 확인하는 메서드
   * 
   * @param {string} requiredRole - 확인할 권한 (예: 'ROLE_ADMIN', 'ROLE_USER')
   * @returns {boolean} 권한이 있으면 true, 없으면 false
   */
  hasRole(requiredRole) {
    const user = this.getCurrentUser()
    
    if (!user || !user.roles) {
      return false
    }

    return user.roles.includes(requiredRole)
  }

  /**
   * 현재 사용자가 여러 권한 중 하나라도 가지고 있는지 확인하는 메서드
   * 
   * @param {string[]} requiredRoles - 확인할 권한 목록
   * @returns {boolean} 권한 중 하나라도 있으면 true, 없으면 false
   */
  hasAnyRole(requiredRoles) {
    const user = this.getCurrentUser()
    
    if (!user || !user.roles) {
      return false
    }

    return requiredRoles.some(role => user.roles.includes(role))
  }

  /**
   * 현재 사용자가 모든 권한을 가지고 있는지 확인하는 메서드
   * 
   * @param {string[]} requiredRoles - 확인할 권한 목록
   * @returns {boolean} 모든 권한이 있으면 true, 없으면 false
   */
  hasAllRoles(requiredRoles) {
    const user = this.getCurrentUser()
    
    if (!user || !user.roles) {
      return false
    }

    return requiredRoles.every(role => user.roles.includes(role))
  }

  /**
   * 현재 사용자가 관리자 권한을 가지고 있는지 확인하는 메서드
   * 
   * @returns {boolean} 관리자 권한이 있으면 true, 없으면 false
   */
  isAdmin() {
    return this.hasRole('ROLE_ADMIN')
  }

  /**
   * 현재 사용자가 매니저 권한을 가지고 있는지 확인하는 메서드
   * 
   * @returns {boolean} 매니저 권한이 있으면 true, 없으면 false
   */
  isManager() {
    return this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER'])
  }

  /**
   * 로컬 스토리지에 인증 정보를 저장하는 내부 메서드
   * 
   * @param {Object} authData - 저장할 인증 정보
   * @param {string} authData.accessToken - 액세스 토큰
   * @param {string} authData.refreshToken - 리프레시 토큰
   * @param {Object} authData.userInfo - 사용자 정보
   * @param {string} authData.loginTime - 로그인 시간
   */
  saveToStorage({ accessToken, refreshToken, userInfo, loginTime }) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
      localStorage.setItem(STORAGE_KEYS.LOGIN_TIME, loginTime)
    } catch (error) {
      console.error('[Auth] 로컬 스토리지 저장 실패:', error)
    }
  }

  /**
   * 로컬 스토리지에서 인증 정보를 제거하는 내부 메서드
   */
  clearStorage() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('[Auth] 로컬 스토리지 정리 실패:', error)
    }
  }

  /**
   * Vuex 스토어와 로컬 스토리지의 모든 인증 정보를 제거하는 내부 메서드
   */
  clearAuthData() {
    // Vuex 스토어 정리
    store.commit('auth/clearAuth')
    
    // 로컬 스토리지 정리  
    this.clearStorage()
  }

  /**
   * 로그인 경과 시간을 반환하는 메서드
   * 
   * @returns {number|null} 로그인 후 경과 시간(분) 또는 null
   */
  getLoginDuration() {
    const loginTime = store.getters['auth/loginTime']
    
    if (!loginTime) {
      return null
    }

    const loginDate = new Date(loginTime)
    const now = new Date()
    const durationMs = now - loginDate
    
    return Math.floor(durationMs / (1000 * 60)) // 분 단위 반환
  }
}

// 싱글톤 인스턴스 생성 및 export
const authService = new AuthService()

export default authService