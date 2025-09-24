// ==============================================
// 📁 src/store/index.js
// Vuex Store 메인 설정 - 3일차 업데이트
// ==============================================

import { createStore } from 'vuex'

// Store 모듈들 import
import auth from './modules/auth'
import ui from './modules/ui'
import user from './modules/user'
import board from './modules/board'
import file from './modules/file'

/**
 * Vuex Store 생성
 * - 모듈화된 상태 관리
 * - 엄격 모드 활성화 (개발환경)
 * - Vue DevTools 지원
 */
const store = createStore({
  // ========================================
  // 전역 상태 (Global State)
  // ========================================
  state: {
    // 애플리케이션 정보
    appInfo: {
      name: 'KM Portal',
      version: '1.0.0',
      description: 'Knowledge Management Portal System'
    },
    
    // 시스템 설정
    settings: {
      theme: 'light',              // light, dark
      language: 'ko',              // ko, en
      timezone: 'Asia/Seoul',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss'
    }
  },

  // ========================================
  // 전역 게터 (Global Getters)
  // ========================================
  getters: {
    /**
     * 애플리케이션 정보 조회
     */
    appInfo: (state) => state.appInfo,
    
    /**
     * 현재 테마 조회
     */
    currentTheme: (state) => state.settings.theme,
    
    /**
     * 현재 언어 조회
     */
    currentLanguage: (state) => state.settings.language,
    
    /**
     * 전체 설정 조회
     */
    settings: (state) => state.settings,
    
    /**
     * 다크모드 여부 확인
     */
    isDarkMode: (state) => state.settings.theme === 'dark'
  },

  // ========================================
  // 전역 뮤테이션 (Global Mutations)
  // ========================================
  mutations: {
    /**
     * 테마 변경
     * @param {Object} state 상태 객체
     * @param {String} theme 테마명 (light/dark)
     */
    SET_THEME(state, theme) {
      state.settings.theme = theme
      
      // localStorage에 테마 설정 저장
      localStorage.setItem('km_portal_theme', theme)
      
      // HTML 클래스 적용 (CSS 변수 활용)
      document.documentElement.setAttribute('data-theme', theme)
    },

    /**
     * 언어 변경
     * @param {Object} state 상태 객체
     * @param {String} language 언어 코드 (ko/en)
     */
    SET_LANGUAGE(state, language) {
      state.settings.language = language
      localStorage.setItem('km_portal_language', language)
    },

    /**
     * 전체 설정 업데이트
     * @param {Object} state 상태 객체
     * @param {Object} settings 새로운 설정 객체
     */
    UPDATE_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
    }
  },

  // ========================================
  // 전역 액션 (Global Actions)
  // ========================================
  actions: {
    /**
     * 애플리케이션 초기화
     * - 로컬 스토리지에서 설정 복원
     * - 사용자 세션 확인
     */
    async initializeApp({ commit, dispatch }) {
      console.log('🚀 애플리케이션 초기화 시작')
      
      try {
        // 1. 저장된 설정 복원
        await dispatch('restoreSettings')
        
        // 2. 사용자 인증 상태 확인
        await dispatch('auth/checkAuthStatus')
        
        // 3. UI 초기화
        await dispatch('ui/initialize')
        
        console.log('✅ 애플리케이션 초기화 완료')
        
      } catch (error) {
        console.error('❌ 애플리케이션 초기화 실패:', error)
        
        // 초기화 실패시 기본 설정 적용
        commit('SET_THEME', 'light')
        commit('SET_LANGUAGE', 'ko')
      }
    },

    /**
     * 로컬 스토리지에서 설정 복원
     */
    restoreSettings({ commit }) {
      try {
        // 테마 설정 복원
        const savedTheme = localStorage.getItem('km_portal_theme')
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          commit('SET_THEME', savedTheme)
        }
        
        // 언어 설정 복원
        const savedLanguage = localStorage.getItem('km_portal_language')
        if (savedLanguage && ['ko', 'en'].includes(savedLanguage)) {
          commit('SET_LANGUAGE', savedLanguage)
        }
        
        console.log('📋 설정 복원 완료')
        
      } catch (error) {
        console.error('❌ 설정 복원 실패:', error)
      }
    },

    /**
     * 테마 토글 (라이트 ↔ 다크)
     */
    toggleTheme({ state, commit }) {
      const newTheme = state.settings.theme === 'light' ? 'dark' : 'light'
      commit('SET_THEME', newTheme)
    },

    /**
     * 언어 변경
     */
    changeLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
      
      // 페이지 새로고침 (i18n 적용을 위해)
      // window.location.reload()
    }
  },

  // ========================================
  // 모듈 등록
  // ========================================
  modules: {
    auth,    // 인증/인가 모듈
    ui,      // UI 상태 모듈  
    user,    // 사용자 관리 모듈
    board,   // 게시판 모듈
    file     // 파일 관리 모듈
  },

  // ========================================
  // Store 옵션
  // ========================================
  
  // 엄격 모드 (개발환경에서만 활성화)
  // - 뮤테이션 외부에서 상태 변경 시 에러 발생
  strict: process.env.NODE_ENV !== 'production',

  // 플러그인 (개발도구, 퍼시스턴스 등)
  plugins: process.env.NODE_ENV === 'development' ? [
    // 개발환경에서 상태 변화 로깅
    (store) => {
      store.subscribe((mutation, state) => {
        console.log(`🔄 Mutation: ${mutation.type}`, mutation.payload)
      })
    }
  ] : []
})

export default store