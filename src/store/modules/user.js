// ==============================================
// 📁 src/store/modules/user.js
// 사용자 관리 모듈
// ==============================================

import { api } from '@/services/api'

/**
 * 사용자 관리 상태 모듈
 * - 사용자 목록 관리
 * - 사용자 CRUD 작업
 * - 권한 관리
 */
const user = {
  namespaced: true,

  // ========================================
  // 상태 정의
  // ========================================
  state: {
    // 사용자 목록
    users: [],
    totalUsers: 0,
    
    // 현재 선택된 사용자
    selectedUser: null,
    
    // 로딩 상태
    loading: false,
    
    // 검색 및 필터
    searchKeyword: '',
    filters: {
      department: '',
      role: '',
      status: 'all' // all, active, inactive, locked
    },
    
    // 페이징
    pagination: {
      page: 1,
      size: 20,
      sort: 'createdAt',
      order: 'desc'
    },
    
    // 에러 상태
    error: null
  },

  // ========================================
  // 게터 정의
  // ========================================
  getters: {
    /**
     * 전체 사용자 목록
     */
    allUsers: (state) => state.users,
    
    /**
     * 활성화된 사용자만
     */
    activeUsers: (state) => state.users.filter(user => user.isActive),
    
    /**
     * 잠긴 사용자만
     */
    lockedUsers: (state) => state.users.filter(user => user.isLocked),
    
    /**
     * 부서별 사용자 그룹핑
     */
    usersByDepartment: (state) => {
      return state.users.reduce((groups, user) => {
        const dept = user.department || '미지정'
        if (!groups[dept]) {
          groups[dept] = []
        }
        groups[dept].push(user)
        return groups
      }, {})
    },
    
    /**
     * 현재 선택된 사용자
     */
    selectedUser: (state) => state.selectedUser,
    
    /**
     * 로딩 상태
     */
    isLoading: (state) => state.loading,
    
    /**
     * 검색 키워드
     */
    searchKeyword: (state) => state.searchKeyword,
    
    /**
     * 현재 필터
     */
    currentFilters: (state) => state.filters,
    
    /**
     * 페이징 정보
     */
    pagination: (state) => state.pagination,
    
    /**
     * 총 사용자 수
     */
    totalUsers: (state) => state.totalUsers
  },

  // ========================================
  // 뮤테이션 정의
  // ========================================
  mutations: {
    /**
     * 로딩 상태 설정
     */
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    /**
     * 사용자 목록 설정
     */
    SET_USERS(state, { users, total }) {
      state.users = users
      state.totalUsers = total
    },

    /**
     * 사용자 추가
     */
    ADD_USER(state, user) {
      state.users.unshift(user)
      state.totalUsers++
    },

    /**
     * 사용자 업데이트
     */
    UPDATE_USER(state, updatedUser) {
      const index = state.users.findIndex(user => user.userId === updatedUser.userId)
      if (index !== -1) {
        state.users.splice(index, 1, updatedUser)
      }
      
      // 선택된 사용자도 업데이트
      if (state.selectedUser && state.selectedUser.userId === updatedUser.userId) {
        state.selectedUser = updatedUser
      }
    },

    /**
     * 사용자 삭제
     */
    REMOVE_USER(state, userId) {
      state.users = state.users.filter(user => user.userId !== userId)
      state.totalUsers--
      
      // 선택된 사용자가 삭제된 경우 선택 해제
      if (state.selectedUser && state.selectedUser.userId === userId) {
        state.selectedUser = null
      }
    },

    /**
     * 선택된 사용자 설정
     */
    SET_SELECTED_USER(state, user) {
      state.selectedUser = user
    },

    /**
     * 검색 키워드 설정
     */
    SET_SEARCH_KEYWORD(state, keyword) {
      state.searchKeyword = keyword
    },

    /**
     * 필터 설정
     */
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    },

    /**
     * 페이징 설정
     */
    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination }
    },

    /**
     * 에러 설정
     */
    SET_ERROR(state, error) {
      state.error = error
    }
  },

  // ========================================
  // 액션 정의
  // ========================================
  actions: {
    /**
     * 사용자 목록 조회
     */
    async fetchUsers({ commit, state }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const params = {
          page: state.pagination.page - 1, // 백엔드는 0부터 시작
          size: state.pagination.size,
          sort: `${state.pagination.sort},${state.pagination.order}`,
          search: state.searchKeyword,
          ...state.filters
        }
        
        const response = await api.get('/admin/users', { params })
        const { content, totalElements } = response.data.data
        
        commit('SET_USERS', { users: content, total: totalElements })
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '사용자 목록 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 사용자 상세 조회
     */
    async fetchUser({ commit }, userId) {
      commit('SET_LOADING', true)
      
      try {
        const response = await api.get(`/admin/users/${userId}`)
        const user = response.data.data
        
        commit('SET_SELECTED_USER', user)
        
        return { success: true, user }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '사용자 정보 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 사용자 생성
     */
    async createUser({ commit }, userData) {
      commit('SET_LOADING', true)
      
      try {
        const response = await api.post('/admin/users', userData)
        const newUser = response.data.data
        
        commit('ADD_USER', newUser)
        
        return { success: true, user: newUser }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '사용자 생성에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 사용자 정보 수정
     */
    async updateUser({ commit }, { userId, userData }) {
      commit('SET_LOADING', true)
      
      try {
        const response = await api.put(`/admin/users/${userId}`, userData)
        const updatedUser = response.data.data
        
        commit('UPDATE_USER', updatedUser)
        
        return { success: true, user: updatedUser }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '사용자 정보 수정에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 사용자 삭제
     */
    async deleteUser({ commit }, userId) {
      commit('SET_LOADING', true)
      
      try {
        await api.delete(`/admin/users/${userId}`)
        
        commit('REMOVE_USER', userId)
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '사용자 삭제에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 사용자 계정 잠금/해제
     */
    async toggleUserLock({ commit }, { userId, locked }) {
      try {
        const response = await api.patch(`/admin/users/${userId}/lock`, { locked })
        const updatedUser = response.data.data
        
        commit('UPDATE_USER', updatedUser)
        
        return { success: true, user: updatedUser }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '계정 상태 변경에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      }
    },

    /**
     * 검색어 설정 및 검색 실행
     */
    async search({ commit, dispatch }, keyword) {
      commit('SET_SEARCH_KEYWORD', keyword)
      commit('SET_PAGINATION', { page: 1 }) // 검색시 첫 페이지로
      
      await dispatch('fetchUsers')
    },

    /**
     * 필터 적용
     */
    async applyFilters({ commit, dispatch }, filters) {
      commit('SET_FILTERS', filters)
      commit('SET_PAGINATION', { page: 1 }) // 필터 적용시 첫 페이지로
      
      await dispatch('fetchUsers')
    },

    /**
     * 페이지 변경
     */
    async changePage({ commit, dispatch }, page) {
      commit('SET_PAGINATION', { page })
      
      await dispatch('fetchUsers')
    },

    /**
     * 정렬 변경
     */
    async changeSort({ commit, dispatch }, { sort, order }) {
      commit('SET_PAGINATION', { sort, order, page: 1 })
      
      await dispatch('fetchUsers')
    }
  }
}

export default user