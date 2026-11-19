/**
 * 역할 관리 Vuex 스토어 모듈
 * 
 * 이 모듈은 애플리케이션의 역할 관리 상태를 중앙집중식으로 관리합니다:
 * - 역할 목록 관리
 * - 현재 선택된 역할 정보
 * - 역할 통계 정보
 * - 로딩 상태 및 에러 관리
 * 
 * 모든 컴포넌트에서 $store.dispatch()와 $store.getters를 통해 
 * 역할 상태에 접근하고 조작할 수 있습니다.
 * 
 * 사용 예시:
 * - 역할 목록 조회: this.$store.dispatch('role/fetchRoles')
 * - 역할 목록 가져오기: this.$store.getters['role/roles']
 * - 활성 역할만 가져오기: this.$store.getters['role/activeRoles']
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-06
 */

/**
 * 초기 상태 정의
 * 
 * 애플리케이션 시작시의 기본 역할 관리 상태를 정의합니다.
 */
const initialState = {
  // 전체 역할 목록
  roles: [],
  
  // 현재 선택/조회된 역할 (상세 정보용)
  currentRole: null,
  
  // 역할 통계 정보
  statistics: null,
  
  // 로딩 상태 (API 호출 중 여부)
  isLoading: false,
  
  // 마지막 에러 메시지
  lastError: null
}

/**
 * Vuex 역할 관리 모듈 정의
 */
const roleModule = {
  // 네임스페이스 활성화 (모듈 이름으로 접근)
  namespaced: true,

  /**
   * 상태 (State)
   * 
   * 역할 관리와 관련된 모든 데이터를 저장하는 객체입니다.
   * 직접 수정할 수 없고 mutations를 통해서만 변경할 수 있습니다.
   */
  state: () => ({
    ...initialState
  }),

  /**
   * 변이 (Mutations)
   * 
   * 상태를 변경하는 동기 함수들입니다.
   * 각 mutation은 state를 첫 번째 인자로, 변경할 데이터를 두 번째 인자로 받습니다.
   */
  mutations: {
    /**
     * 역할 목록 설정
     * 
     * @param {Object} state - 현재 상태
     * @param {Array} roles - 역할 목록 배열
     */
    setRoles(state, roles) {
      state.roles = roles
    },

    /**
     * 현재 선택된 역할 설정
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} role - 역할 객체
     */
    setCurrentRole(state, role) {
      state.currentRole = role
    },

    /**
     * 통계 정보 설정
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} statistics - 통계 정보 객체
     */
    setStatistics(state, statistics) {
      state.statistics = statistics
    },

    /**
     * 로딩 상태 설정
     * 
     * @param {Object} state - 현재 상태
     * @param {boolean} isLoading - 로딩 여부
     */
    setLoading(state, isLoading) {
      state.isLoading = isLoading
    },

    /**
     * 에러 메시지 설정
     * 
     * @param {Object} state - 현재 상태
     * @param {string|null} error - 에러 메시지
     */
    setError(state, error) {
      state.lastError = error
    },

    /**
     * 역할 목록에 새 역할 추가
     * 역할 생성 후 목록을 갱신할 때 사용
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} role - 추가할 역할 객체
     */
    addRole(state, role) {
      state.roles.push(role)
      
      // 우선순위 순으로 정렬 (낮은 숫자가 먼저)
      state.roles.sort((a, b) => a.priority - b.priority)
    },

    /**
     * 역할 목록에서 역할 정보 업데이트
     * 역할 수정 후 목록의 해당 항목을 갱신할 때 사용
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} updatedRole - 수정된 역할 객체
     */
    updateRoleInList(state, updatedRole) {
      const index = state.roles.findIndex(r => r.roleId === updatedRole.roleId)
      if (index !== -1) {
        // Vue의 반응성을 유지하기 위해 splice 사용
        state.roles.splice(index, 1, updatedRole)
      }
    },

    /**
     * 역할 목록에서 역할 제거
     * 역할 삭제 후 목록에서 제거할 때 사용
     * 
     * @param {Object} state - 현재 상태
     * @param {number} roleId - 제거할 역할 ID
     */
    removeRole(state, roleId) {
      state.roles = state.roles.filter(r => r.roleId !== roleId)
    },

    /**
     * 모든 역할 관리 상태 초기화
     * 
     * @param {Object} state - 현재 상태
     */
    clearRoles(state) {
      Object.assign(state, {
        ...initialState
      })
    }
  },

  /**
   * 액션 (Actions)
   * 
   * 비동기 작업이나 여러 mutation을 조합한 복잡한 로직을 처리하는 함수들입니다.
   * API 호출, 에러 처리 등을 포함합니다.
   */
  actions: {
    /**
     * 역할 목록 조회 액션
     * 
     * roleService를 통해 백엔드에서 역할 목록을 가져옵니다.
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @returns {Promise<Object>} 조회 결과 { success, roles }
     */
    async fetchRoles({ commit }) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        // roleService를 동적으로 import하여 순환 참조 방지
        const roleService = (await import('@/services/roleService')).default
        const roles = await roleService.getAllRoles()
        
        commit('setRoles', roles)
        
        console.log('[Vuex Role] 역할 목록 조회 성공:', roles.length)
        
        return { success: true, roles }

      } catch (error) {
        const errorMessage = error.message || '역할 목록 조회에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 목록 조회 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    },

    /**
     * 특정 역할 상세 조회 액션
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @param {number} roleId - 조회할 역할 ID
     * @returns {Promise<Object>} 조회 결과 { success, role }
     */
    async fetchRoleById({ commit }, roleId) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        const role = await roleService.getRoleById(roleId)
        
        commit('setCurrentRole', role)
        
        console.log('[Vuex Role] 역할 상세 조회 성공:', role.displayName)
        
        return { success: true, role }

      } catch (error) {
        const errorMessage = error.message || '역할 정보 조회에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 상세 조회 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    },

    /**
     * 새 역할 생성 액션
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @param {Object} roleData - 생성할 역할 정보
     * @returns {Promise<Object>} 생성 결과 { success, role }
     */
    async createRole({ commit }, roleData) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        const newRole = await roleService.createRole(roleData)
        
        commit('addRole', newRole)
        
        console.log('[Vuex Role] 역할 생성 성공:', newRole.displayName)
        
        return { success: true, role: newRole }

      } catch (error) {
        const errorMessage = error.message || '역할 생성에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 생성 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    },

    /**
     * 역할 정보 수정 액션
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @param {Object} payload - 수정 정보
     * @param {number} payload.roleId - 수정할 역할 ID
     * @param {Object} payload.roleData - 수정할 역할 정보
     * @returns {Promise<Object>} 수정 결과 { success, role }
     */
    async updateRole({ commit }, { roleId, roleData }) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        const updatedRole = await roleService.updateRole(roleId, roleData)
        
        commit('updateRoleInList', updatedRole)
        
        console.log('[Vuex Role] 역할 수정 성공:', updatedRole.displayName)
        
        return { success: true, role: updatedRole }

      } catch (error) {
        const errorMessage = error.message || '역할 수정에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 수정 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    },

    /**
     * 역할 삭제 액션 (소프트 삭제)
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @param {number} roleId - 삭제할 역할 ID
     * @returns {Promise<Object>} 삭제 결과 { success }
     */
    async deleteRole({ commit }, roleId) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        await roleService.deleteRole(roleId)
        
        commit('removeRole', roleId)
        
        console.log('[Vuex Role] 역할 삭제 성공: ID', roleId)
        
        return { success: true }

      } catch (error) {
        const errorMessage = error.message || '역할 삭제에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 삭제 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    },

    /**
     * 역할 통계 조회 액션
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @returns {Promise<Object>} 조회 결과 { success, statistics }
     */
    async fetchStatistics({ commit }) {
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        const statistics = await roleService.getRoleStatistics()
        
        commit('setStatistics', statistics)
        
        console.log('[Vuex Role] 역할 통계 조회 성공')
        
        return { success: true, statistics }

      } catch (error) {
        const errorMessage = error.message || '통계 정보 조회에 실패했습니다.'
        
        console.error('[Vuex Role] 역할 통계 조회 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      }
    },

    /**
     * 활성 역할 목록 조회 액션
     * 
     * @param {Object} context - Vuex 컨텍스트 객체
     * @param {Function} context.commit - mutation 실행 함수
     * @returns {Promise<Object>} 조회 결과 { success, roles }
     */
    async fetchActiveRoles({ commit }) {
      commit('setLoading', true)
      commit('setError', null)

      try {
        const roleService = (await import('@/services/roleService')).default
        const roles = await roleService.getActiveRoles()
        
        commit('setRoles', roles)
        
        console.log('[Vuex Role] 활성 역할 목록 조회 성공:', roles.length)
        
        return { success: true, roles }

      } catch (error) {
        const errorMessage = error.message || '활성 역할 조회에 실패했습니다.'
        
        console.error('[Vuex Role] 활성 역할 조회 오류:', error)
        commit('setError', errorMessage)
        
        return { success: false, message: errorMessage }
      } finally {
        commit('setLoading', false)
      }
    }
  },

  /**
   * 게터 (Getters)
   * 
   * 상태에서 파생된 값들을 계산하여 반환하는 함수들입니다.
   * 컴포넌트에서 복잡한 로직 없이 필요한 값을 쉽게 가져올 수 있습니다.
   */
  getters: {
    /**
     * 전체 역할 목록 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {Array} 역할 목록
     */
    roles: (state) => state.roles,

    /**
     * 현재 선택된 역할 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {Object|null} 현재 역할 또는 null
     */
    currentRole: (state) => state.currentRole,

    /**
     * 통계 정보 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {Object|null} 통계 정보 또는 null
     */
    statistics: (state) => state.statistics,

    /**
     * 로딩 상태 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {boolean} 로딩 여부
     */
    isLoading: (state) => state.isLoading,

    /**
     * 마지막 에러 메시지 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {string|null} 에러 메시지
     */
    lastError: (state) => state.lastError,
    
    /**
     * 활성 역할만 필터링하여 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {Array} 활성 역할 목록
     */
    activeRoles: (state) => {
      return state.roles.filter(role => role.isActive === true)
    },
    
    /**
     * 시스템 역할만 필터링하여 반환
     * (삭제/수정 불가능한 기본 역할)
     * 
     * @param {Object} state - 현재 상태
     * @returns {Array} 시스템 역할 목록
     */
    systemRoles: (state) => {
      return state.roles.filter(role => role.isSystemRole === true)
    },
    
    /**
     * 사용자 정의 역할만 필터링하여 반환
     * (관리자가 생성한 커스텀 역할)
     * 
     * @param {Object} state - 현재 상태
     * @returns {Array} 사용자 정의 역할 목록
     */
    customRoles: (state) => {
      return state.roles.filter(role => role.isSystemRole === false)
    },

    /**
     * 역할 수 반환
     * 
     * @param {Object} state - 현재 상태
     * @returns {number} 전체 역할 수
     */
    roleCount: (state) => {
      return state.roles.length
    },

    /**
     * 우선순위 순으로 정렬된 역할 목록 반환
     * (낮은 숫자 = 높은 권한이 먼저)
     * 
     * @param {Object} state - 현재 상태
     * @returns {Array} 정렬된 역할 목록
     */
    sortedRoles: (state) => {
      return [...state.roles].sort((a, b) => a.priority - b.priority)
    },

    /**
     * 역할 ID로 역할 찾기 (헬퍼 함수)
     * 
     * @param {Object} state - 현재 상태
     * @returns {Function} roleId를 받아 역할을 반환하는 함수
     */
    getRoleById: (state) => (roleId) => {
      return state.roles.find(role => role.roleId === roleId)
    },

    /**
     * 역할명으로 역할 찾기 (헬퍼 함수)
     * 
     * @param {Object} state - 현재 상태
     * @returns {Function} roleName을 받아 역할을 반환하는 함수
     */
    getRoleByName: (state) => (roleName) => {
      return state.roles.find(role => role.roleName === roleName)
    }
  }
}

export default roleModule