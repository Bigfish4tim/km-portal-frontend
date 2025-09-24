// ==============================================
// 📁 src/store/modules/ui.js
// UI 상태 관리 모듈
// ==============================================

/**
 * UI 관련 상태 관리
 * - 로딩 상태
 * - 알림 메시지
 * - 모달/다이얼로그 상태
 * - 사이드바 상태
 */
const ui = {
  namespaced: true,

  // ========================================
  // 상태 정의
  // ========================================
  state: {
    // 로딩 상태
    loading: false,
    loadingMessage: '',
    
    // 알림 상태
    notifications: [],
    
    // 사이드바 상태
    sidebarCollapsed: false,
    sidebarMobile: false,
    
    // 모달 상태
    modals: {},
    
    // 에러 상태
    globalError: null,
    
    // 브레드크럼
    breadcrumbs: []
  },

  // ========================================
  // 게터 정의
  // ========================================
  getters: {
    isLoading: (state) => state.loading,
    loadingMessage: (state) => state.loadingMessage,
    notifications: (state) => state.notifications,
    unreadNotificationCount: (state) => state.notifications.filter(n => !n.read).length,
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    isMobile: (state) => state.sidebarMobile,
    globalError: (state) => state.globalError,
    breadcrumbs: (state) => state.breadcrumbs
  },

  // ========================================
  // 뮤테이션 정의
  // ========================================
  mutations: {
    SET_LOADING(state, { loading, message = '' }) {
      state.loading = loading
      state.loadingMessage = message
    },

    ADD_NOTIFICATION(state, notification) {
      state.notifications.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      })
    },

    REMOVE_NOTIFICATION(state, notificationId) {
      state.notifications = state.notifications.filter(n => n.id !== notificationId)
    },

    MARK_NOTIFICATION_READ(state, notificationId) {
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },

    TOGGLE_SIDEBAR(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    SET_SIDEBAR_COLLAPSED(state, collapsed) {
      state.sidebarCollapsed = collapsed
    },

    SET_MOBILE_MODE(state, isMobile) {
      state.sidebarMobile = isMobile
    },

    SET_MODAL(state, { name, visible, data = null }) {
      state.modals = {
        ...state.modals,
        [name]: { visible, data }
      }
    },

    SET_GLOBAL_ERROR(state, error) {
      state.globalError = error
    },

    SET_BREADCRUMBS(state, breadcrumbs) {
      state.breadcrumbs = breadcrumbs
    }
  },

  // ========================================
  // 액션 정의
  // ========================================
  actions: {
    /**
     * UI 초기화
     */
    initialize({ commit }) {
      // 화면 크기에 따른 모바일 모드 설정
      const checkMobile = () => {
        const isMobile = window.innerWidth < 768
        commit('SET_MOBILE_MODE', isMobile)
        
        if (isMobile) {
          commit('SET_SIDEBAR_COLLAPSED', true)
        }
      }
      
      checkMobile()
      
      // 윈도우 리사이즈 이벤트 리스너 등록
      window.addEventListener('resize', checkMobile)
    },

    /**
     * 로딩 상태 설정
     */
    setLoading({ commit }, loading, message = '') {
      commit('SET_LOADING', { loading, message })
    },

    /**
     * 알림 추가
     */
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification)
      
      // 자동 제거 (duration이 설정된 경우)
      if (notification.duration) {
        setTimeout(() => {
          commit('REMOVE_NOTIFICATION', notification.id)
        }, notification.duration)
      }
    },

    /**
     * 성공 알림
     */
    showSuccess({ dispatch }, message) {
      dispatch('addNotification', {
        type: 'success',
        title: '성공',
        message,
        duration: 3000
      })
    },

    /**
     * 에러 알림
     */
    showError({ dispatch }, message) {
      dispatch('addNotification', {
        type: 'error',
        title: '오류',
        message,
        duration: 5000
      })
    },

    /**
     * 경고 알림
     */
    showWarning({ dispatch }, message) {
      dispatch('addNotification', {
        type: 'warning',
        title: '경고',
        message,
        duration: 4000
      })
    },

    /**
     * 정보 알림
     */
    showInfo({ dispatch }, message) {
      dispatch('addNotification', {
        type: 'info',
        title: '정보',
        message,
        duration: 3000
      })
    }
  }
}

export default ui