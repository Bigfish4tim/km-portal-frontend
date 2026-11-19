/**
 * 역할 관리 API 서비스
 * 
 * 이 서비스는 백엔드의 역할 관리 API와 통신하는 모든 메서드를 제공합니다.
 * RBAC(Role-Based Access Control) 시스템의 프론트엔드 인터페이스입니다.
 * 
 * 주요 기능:
 * - 역할 CRUD (생성, 조회, 수정, 삭제)
 * - 역할 검색 및 필터링
 * - 역할 통계 조회
 * - 역할명 중복 확인
 * - 역할 활성화/비활성화
 * - 우선순위 업데이트
 * 
 * 사용법:
 * import roleService from '@/services/roleService'
 * 
 * const roles = await roleService.getAllRoles()
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-06
 */

import api from './api'

/**
 * 역할 관리 서비스 클래스
 * 
 * 모든 역할 관련 API 호출을 담당하는 클래스입니다.
 * 싱글톤 패턴으로 구현되어 애플리케이션 전체에서 동일한 인스턴스를 사용합니다.
 */
class RoleService {
  
  // ================================
  // 조회 메서드
  // ================================
  
  /**
   * 전체 역할 목록 조회
   * 
   * 모든 활성 역할을 우선순위 순으로 조회합니다.
   * 관리자(ADMIN) 권한이 필요합니다.
   * 
   * API: GET /api/roles
   * 
   * @returns {Promise<Array>} 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async getAllRoles() {
    try {
      console.log('[RoleService] 전체 역할 목록 조회 요청')
      
      const response = await api.get('/roles')
      const roles = response.data
      
      console.log(`[RoleService] 역할 목록 조회 성공: ${roles.length}개`)
      
      return roles
      
    } catch (error) {
      console.error('[RoleService] 역할 목록 조회 오류:', error)
      
      // 에러 메시지 추출
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || '역할 목록을 불러오는데 실패했습니다.'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 활성 역할만 조회
   * 
   * 사용자에게 할당 가능한 활성화된 역할만 조회합니다.
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/active
   * 
   * @returns {Promise<Array>} 활성 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async getActiveRoles() {
    try {
      console.log('[RoleService] 활성 역할 목록 조회 요청')
      
      const response = await api.get('/roles/active')
      const roles = response.data
      
      console.log(`[RoleService] 활성 역할 조회 성공: ${roles.length}개`)
      
      return roles
      
    } catch (error) {
      console.error('[RoleService] 활성 역할 조회 오류:', error)
      throw new Error(error.response?.data?.message || '활성 역할 조회에 실패했습니다.')
    }
  }

  /**
   * 시스템 역할만 조회
   * 
   * 삭제/수정 불가능한 시스템 기본 역할만 조회합니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: GET /api/roles/system
   * 
   * @returns {Promise<Array>} 시스템 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async getSystemRoles() {
    try {
      console.log('[RoleService] 시스템 역할 목록 조회 요청')
      
      const response = await api.get('/roles/system')
      const roles = response.data
      
      console.log(`[RoleService] 시스템 역할 조회 성공: ${roles.length}개`)
      
      return roles
      
    } catch (error) {
      console.error('[RoleService] 시스템 역할 조회 오류:', error)
      throw new Error(error.response?.data?.message || '시스템 역할 조회에 실패했습니다.')
    }
  }

  /**
   * 사용자 정의 역할만 조회
   * 
   * 관리자가 생성한 커스텀 역할만 조회합니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: GET /api/roles/custom
   * 
   * @returns {Promise<Array>} 사용자 정의 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async getCustomRoles() {
    try {
      console.log('[RoleService] 사용자 정의 역할 목록 조회 요청')
      
      const response = await api.get('/roles/custom')
      const roles = response.data
      
      console.log(`[RoleService] 사용자 정의 역할 조회 성공: ${roles.length}개`)
      
      return roles
      
    } catch (error) {
      console.error('[RoleService] 사용자 정의 역할 조회 오류:', error)
      throw new Error(error.response?.data?.message || '사용자 정의 역할 조회에 실패했습니다.')
    }
  }

  /**
   * 역할 상세 정보 조회
   * 
   * 특정 역할의 상세 정보를 조회합니다.
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/{id}
   * 
   * @param {number} roleId - 역할 ID
   * @returns {Promise<Object>} 역할 상세 정보
   * @throws {Error} API 호출 실패시
   */
  async getRoleById(roleId) {
    try {
      console.log(`[RoleService] 역할 상세 조회 요청: ID=${roleId}`)
      
      const response = await api.get(`/roles/${roleId}`)
      const role = response.data
      
      console.log(`[RoleService] 역할 상세 조회 성공:`, role.displayName)
      
      return role
      
    } catch (error) {
      console.error(`[RoleService] 역할 상세 조회 오류 (ID=${roleId}):`, error)
      throw new Error(error.response?.data?.message || '역할 정보를 불러오는데 실패했습니다.')
    }
  }

  /**
   * 역할명으로 역할 조회
   * 
   * 역할명(예: ROLE_ADMIN)으로 역할을 조회합니다.
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/name/{roleName}
   * 
   * @param {string} roleName - 역할명 (예: "ROLE_ADMIN")
   * @returns {Promise<Object>} 역할 정보
   * @throws {Error} API 호출 실패시
   */
  async getRoleByName(roleName) {
    try {
      console.log(`[RoleService] 역할명으로 조회 요청: ${roleName}`)
      
      const response = await api.get(`/roles/name/${roleName}`)
      const role = response.data
      
      console.log(`[RoleService] 역할명으로 조회 성공:`, role.displayName)
      
      return role
      
    } catch (error) {
      console.error(`[RoleService] 역할명으로 조회 오류 (${roleName}):`, error)
      throw new Error(error.response?.data?.message || '역할을 찾을 수 없습니다.')
    }
  }

  // ================================
  // 검색 및 필터링 메서드
  // ================================

  /**
   * 역할 검색
   * 
   * 표시명을 기준으로 역할을 검색합니다. (대소문자 구분 없음)
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/search?keyword={keyword}
   * 
   * @param {string} keyword - 검색 키워드
   * @returns {Promise<Array>} 검색 결과 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async searchRoles(keyword) {
    try {
      console.log(`[RoleService] 역할 검색 요청: "${keyword}"`)
      
      const response = await api.get('/roles/search', {
        params: { keyword }
      })
      const roles = response.data
      
      console.log(`[RoleService] 역할 검색 완료: ${roles.length}개 발견`)
      
      return roles
      
    } catch (error) {
      console.error(`[RoleService] 역할 검색 오류 (키워드: ${keyword}):`, error)
      throw new Error(error.response?.data?.message || '역할 검색에 실패했습니다.')
    }
  }

  /**
   * 우선순위 범위로 역할 조회
   * 
   * 특정 우선순위 범위 내의 역할들을 조회합니다.
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/priority-range?min={min}&max={max}
   * 
   * @param {number} minPriority - 최소 우선순위
   * @param {number} maxPriority - 최대 우선순위
   * @returns {Promise<Array>} 해당 범위의 역할 목록
   * @throws {Error} API 호출 실패시
   */
  async getRolesByPriorityRange(minPriority, maxPriority) {
    try {
      console.log(`[RoleService] 우선순위 범위 조회: ${minPriority}-${maxPriority}`)
      
      const response = await api.get('/roles/priority-range', {
        params: { 
          min: minPriority, 
          max: maxPriority 
        }
      })
      const roles = response.data
      
      console.log(`[RoleService] 우선순위 범위 조회 성공: ${roles.length}개`)
      
      return roles
      
    } catch (error) {
      console.error('[RoleService] 우선순위 범위 조회 오류:', error)
      throw new Error(error.response?.data?.message || '역할 조회에 실패했습니다.')
    }
  }

  // ================================
  // 생성 및 수정 메서드
  // ================================

  /**
   * 새 역할 생성
   * 
   * 새로운 사용자 정의 역할을 생성합니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: POST /api/roles
   * 
   * @param {Object} roleData - 역할 정보
   * @param {string} roleData.roleName - 역할명 (ROLE_로 시작, 대문자)
   * @param {string} roleData.displayName - 표시명 (한글)
   * @param {string} roleData.description - 역할 설명
   * @param {number} roleData.priority - 우선순위 (1-999, 낮을수록 높은 권한)
   * @param {boolean} roleData.isActive - 활성화 여부
   * @returns {Promise<Object>} 생성된 역할 정보
   * @throws {Error} API 호출 실패시
   */
  async createRole(roleData) {
    try {
      console.log('[RoleService] 역할 생성 요청:', roleData)
      
      // 입력값 검증
      if (!roleData.roleName || !roleData.displayName) {
        throw new Error('역할명과 표시명은 필수 입력 항목입니다.')
      }
      
      // 역할명 형식 검증
      if (!/^ROLE_[A-Z][A-Z_]*$/.test(roleData.roleName)) {
        throw new Error('역할명은 ROLE_로 시작하고 대문자와 언더스코어만 사용할 수 있습니다.')
      }
      
      // 우선순위 검증
      if (roleData.priority < 1 || roleData.priority > 999) {
        throw new Error('우선순위는 1-999 사이의 값이어야 합니다.')
      }
      
      const response = await api.post('/roles', roleData)
      const newRole = response.data
      
      console.log('[RoleService] 역할 생성 성공:', newRole.displayName)
      
      return newRole
      
    } catch (error) {
      console.error('[RoleService] 역할 생성 오류:', error)
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || '역할 생성에 실패했습니다.'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 역할 정보 수정
   * 
   * 기존 역할의 정보를 수정합니다.
   * 시스템 역할은 수정할 수 없습니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: PUT /api/roles/{id}
   * 
   * @param {number} roleId - 역할 ID
   * @param {Object} roleData - 수정할 역할 정보
   * @returns {Promise<Object>} 수정된 역할 정보
   * @throws {Error} API 호출 실패시
   */
  async updateRole(roleId, roleData) {
    try {
      console.log(`[RoleService] 역할 수정 요청: ID=${roleId}`, roleData)
      
      const response = await api.put(`/roles/${roleId}`, roleData)
      const updatedRole = response.data
      
      console.log('[RoleService] 역할 수정 성공:', updatedRole.displayName)
      
      return updatedRole
      
    } catch (error) {
      console.error(`[RoleService] 역할 수정 오류 (ID=${roleId}):`, error)
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || '역할 수정에 실패했습니다.'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 역할 우선순위 수정
   * 
   * 역할의 우선순위만 수정합니다.
   * 우선순위는 권한 레벨을 결정합니다 (낮을수록 높은 권한).
   * 관리자 권한이 필요합니다.
   * 
   * API: PATCH /api/roles/{id}/priority
   * 
   * @param {number} roleId - 역할 ID
   * @param {number} priority - 새로운 우선순위 (1-999)
   * @returns {Promise<Object>} 업데이트 결과
   * @throws {Error} API 호출 실패시
   */
  async updateRolePriority(roleId, priority) {
    try {
      console.log(`[RoleService] 역할 우선순위 수정: ID=${roleId}, 우선순위=${priority}`)
      
      // 우선순위 검증
      if (priority < 1 || priority > 999) {
        throw new Error('우선순위는 1-999 사이의 값이어야 합니다.')
      }
      
      const response = await api.patch(`/roles/${roleId}/priority`, {
        priority: priority
      })
      const result = response.data
      
      console.log('[RoleService] 역할 우선순위 수정 성공')
      
      return result
      
    } catch (error) {
      console.error(`[RoleService] 역할 우선순위 수정 오류 (ID=${roleId}):`, error)
      throw new Error(error.response?.data?.message || '우선순위 수정에 실패했습니다.')
    }
  }

  // ================================
  // 삭제 및 상태 변경 메서드
  // ================================

  /**
   * 역할 삭제 (소프트 삭제)
   * 
   * 역할을 비활성화합니다 (실제 삭제는 아님).
   * 시스템 역할은 삭제할 수 없습니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: DELETE /api/roles/{id}
   * 
   * @param {number} roleId - 역할 ID
   * @returns {Promise<Object>} 삭제 결과
   * @throws {Error} API 호출 실패시
   */
  async deleteRole(roleId) {
    try {
      console.log(`[RoleService] 역할 삭제 요청: ID=${roleId}`)
      
      const response = await api.delete(`/roles/${roleId}`)
      const result = response.data
      
      console.log('[RoleService] 역할 삭제 성공')
      
      return result
      
    } catch (error) {
      console.error(`[RoleService] 역할 삭제 오류 (ID=${roleId}):`, error)
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || '역할 삭제에 실패했습니다.'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 역할 활성화
   * 
   * 비활성화된 역할을 다시 활성화합니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: POST /api/roles/{id}/activate
   * 
   * @param {number} roleId - 역할 ID
   * @returns {Promise<Object>} 활성화 결과
   * @throws {Error} API 호출 실패시
   */
  async activateRole(roleId) {
    try {
      console.log(`[RoleService] 역할 활성화 요청: ID=${roleId}`)
      
      const response = await api.post(`/roles/${roleId}/activate`)
      const result = response.data
      
      console.log('[RoleService] 역할 활성화 성공')
      
      return result
      
    } catch (error) {
      console.error(`[RoleService] 역할 활성화 오류 (ID=${roleId}):`, error)
      throw new Error(error.response?.data?.message || '역할 활성화에 실패했습니다.')
    }
  }

  // ================================
  // 통계 및 유틸리티 메서드
  // ================================

  /**
   * 역할 통계 정보 조회
   * 
   * 역할 관련 모든 통계 정보를 조회합니다.
   * - 전체 역할 수
   * - 활성/비활성 역할 수
   * - 시스템/사용자정의 역할 수
   * - 역할별 사용자 수
   * - 사용자가 없는 역할 목록
   * 
   * 관리자 권한이 필요합니다.
   * 
   * API: GET /api/roles/statistics
   * 
   * @returns {Promise<Object>} 역할 통계 정보
   * @throws {Error} API 호출 실패시
   */
  async getRoleStatistics() {
    try {
      console.log('[RoleService] 역할 통계 조회 요청')
      
      const response = await api.get('/roles/statistics')
      const statistics = response.data
      
      console.log('[RoleService] 역할 통계 조회 성공:', statistics)
      
      return statistics
      
    } catch (error) {
      console.error('[RoleService] 역할 통계 조회 오류:', error)
      throw new Error(error.response?.data?.message || '통계 정보 조회에 실패했습니다.')
    }
  }

  /**
   * 특정 역할의 사용자 수 조회
   * 
   * 해당 역할을 가진 사용자 수를 조회합니다.
   * 관리자 또는 매니저 권한이 필요합니다.
   * 
   * API: GET /api/roles/{id}/user-count
   * 
   * @param {number} roleId - 역할 ID
   * @returns {Promise<Object>} 사용자 수 정보
   * @throws {Error} API 호출 실패시
   */
  async getRoleUserCount(roleId) {
    try {
      console.log(`[RoleService] 역할별 사용자 수 조회: ID=${roleId}`)
      
      const response = await api.get(`/roles/${roleId}/user-count`)
      const result = response.data
      
      console.log(`[RoleService] 사용자 수 조회 성공: ${result.userCount}명`)
      
      return result
      
    } catch (error) {
      console.error(`[RoleService] 사용자 수 조회 오류 (ID=${roleId}):`, error)
      throw new Error(error.response?.data?.message || '사용자 수 조회에 실패했습니다.')
    }
  }

  /**
   * 역할명 중복 확인
   * 
   * 새로운 역할 생성 시 역할명이 이미 존재하는지 확인합니다.
   * 관리자 권한이 필요합니다.
   * 
   * API: GET /api/roles/check-name?roleName={roleName}
   * 
   * @param {string} roleName - 확인할 역할명
   * @returns {Promise<Object>} 중복 여부 정보 { exists, available }
   * @throws {Error} API 호출 실패시
   */
  async checkRoleName(roleName) {
    try {
      console.log(`[RoleService] 역할명 중복 확인: ${roleName}`)
      
      const response = await api.get('/roles/check-name', {
        params: { roleName }
      })
      const result = response.data
      
      console.log(`[RoleService] 역할명 중복 확인 완료: 사용가능=${result.available}`)
      
      return result
      
    } catch (error) {
      console.error(`[RoleService] 역할명 중복 확인 오류 (${roleName}):`, error)
      throw new Error(error.response?.data?.message || '역할명 확인에 실패했습니다.')
    }
  }
}

/**
 * 싱글톤 인스턴스 생성 및 export
 * 
 * 애플리케이션 전체에서 동일한 RoleService 인스턴스를 사용합니다.
 */
const roleService = new RoleService()

export default roleService