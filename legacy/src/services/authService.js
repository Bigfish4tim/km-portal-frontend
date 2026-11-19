/**
 * =============================================================================
 * 📁 authService.js - 인증 서비스 (2일차 수정 버전)
 * =============================================================================
 *
 * 사용자 인증 관련 API 호출을 처리하는 서비스입니다.
 *
 * 【2일차 수정 내역】
 * - register() 메서드에 roleName 파라미터 추가
 * - 12개 Role 시스템 반영
 *
 * ■ 제공 메서드:
 *   - login(username, password): 로그인
 *   - register(userData): 회원가입 【2일차 수정】
 *   - logout(): 로그아웃
 *   - refreshToken(): 토큰 갱신
 *   - getMe(): 내 정보 조회
 *   - isAuthenticated(): 인증 여부 확인
 *   - getAccessToken(): 액세스 토큰 조회
 *
 * @author KM Portal Team
 * @version 2.0 (2일차 Role 시스템 수정)
 * @since 2025-09-24
 * @modified 2026-01-30 - 12개 Role 시스템 반영
 */
import api from './api'
import store from '@/store'

// ============================================================================
// 토큰 저장소 키
// ============================================================================
const TOKEN_KEY = 'km_access_token'
const REFRESH_TOKEN_KEY = 'km_refresh_token'
const USER_KEY = 'km_user'

// ============================================================================
// 인증 서비스 객체
// ============================================================================
const authService = {
    // ==========================================================================
    // 로그인
    // ==========================================================================

    /**
     * 로그인 처리
     *
     * @param {string} username - 사용자명
     * @param {string} password - 비밀번호
     * @returns {Promise<Object>} 로그인 결과 (success, data, message)
     */
    async login(username, password) {
        try {
            const response = await api.post('/api/auth/login', {
                username,
                password,
            })

            // 응답 데이터 추출
            const { data } = response.data

            // 토큰 저장
            if (data.accessToken) {
                localStorage.setItem(TOKEN_KEY, data.accessToken)
            }
            if (data.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
            }

            // 사용자 정보 저장
            if (data.user) {
                localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            }

            // Vuex 스토어 업데이트
            await store.dispatch('auth/setAuth', {
                user: data.user,
                token: data.accessToken,
            })

            return {
                success: true,
                data: data,
                message: '로그인 성공',
            }
        } catch (error) {
            console.error('로그인 실패:', error)

            // 에러 메시지 추출
            const message = error.response?.data?.message || error.message || '로그인에 실패했습니다.'

            return {
                success: false,
                message: message,
            }
        }
    },

    // ==========================================================================
    // 회원가입 【2일차 수정】
    // ==========================================================================

    /**
     * 회원가입 처리
     *
     * 【2일차 수정】 roleName 파라미터 추가
     *
     * @param {Object} userData - 사용자 데이터
     * @param {string} userData.username - 사용자명 (필수)
     * @param {string} userData.email - 이메일 (필수)
     * @param {string} userData.password - 비밀번호 (필수)
     * @param {string} userData.fullName - 실명 (필수)
     * @param {string} [userData.department] - 부서 (선택)
     * @param {string} [userData.position] - 직급 (선택)
     * @param {string} [userData.phoneNumber] - 전화번호 (선택)
     * @param {string} [userData.roleName] - 역할 (선택, 기본값: ROLE_EMPLOYEE) 【2일차 추가】
     *
     * @returns {Promise<Object>} 회원가입 결과 (success, data, message)
     *
     * @example
     * // 기본 회원가입 (일반사원)
     * const result = await authService.register({
     *   username: 'newuser',
     *   email: 'newuser@example.com',
     *   password: 'password123!',
     *   fullName: '홍길동',
     *   department: '1종팀',
     *   position: '사원'
     * })
     *
     * @example
     * // 역할 지정 회원가입 【2일차 추가】
     * const result = await authService.register({
     *   username: 'investigator01',
     *   email: 'invest01@example.com',
     *   password: 'password123!',
     *   fullName: '김조사',
     *   department: '4종팀',
     *   position: '대리',
     *   roleName: 'ROLE_INVESTIGATOR_TYPE4'  // 4종 조사자
     * })
     */
    async register(userData) {
        try {
            // 【2일차 수정】 roleName을 포함하여 API 호출
            // roleName이 없으면 백엔드에서 ROLE_EMPLOYEE로 기본 설정됨
            const response = await api.post('/api/auth/register', {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                department: userData.department || null,
                position: userData.position || null,
                phoneNumber: userData.phoneNumber || null,
                // 【2일차 추가】 역할 전송 (선택사항)
                roleName: userData.roleName || null,
            })

            // 응답 데이터 추출
            const { data, message } = response.data

            console.log('회원가입 성공:', {
                username: data.username,
                roleName: data.roleName,
                roleDisplayName: data.roleDisplayName,
            })

            return {
                success: true,
                data: data,
                message: message || '회원가입이 완료되었습니다.',
            }
        } catch (error) {
            console.error('회원가입 실패:', error)

            // 에러 메시지 추출
            const message = error.response?.data?.message || error.message || '회원가입에 실패했습니다.'

            return {
                success: false,
                message: message,
            }
        }
    },

    // ==========================================================================
    // 로그아웃
    // ==========================================================================

    /**
     * 로그아웃 처리
     *
     * @returns {Promise<Object>} 로그아웃 결과
     */
    async logout() {
        try {
            // 서버에 로그아웃 요청
            await api.post('/api/auth/logout')
        } catch (error) {
            console.warn('서버 로그아웃 요청 실패 (무시):', error)
        } finally {
            // 로컬 스토리지 클리어
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            localStorage.removeItem(USER_KEY)

            // Vuex 스토어 클리어
            await store.dispatch('auth/clearAuth')
        }

        return {
            success: true,
            message: '로그아웃 되었습니다.',
        }
    },

    // ==========================================================================
    // 토큰 갱신
    // ==========================================================================

    /**
     * 액세스 토큰 갱신
     *
     * @returns {Promise<Object>} 갱신 결과
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

            if (!refreshToken) {
                throw new Error('리프레시 토큰이 없습니다.')
            }

            const response = await api.post('/api/auth/refresh', {
                refreshToken: refreshToken,
            })

            const { data } = response.data

            // 새 액세스 토큰 저장
            if (data.accessToken) {
                localStorage.setItem(TOKEN_KEY, data.accessToken)

                // Vuex 스토어 업데이트
                await store.dispatch('auth/updateToken', data.accessToken)
            }

            return {
                success: true,
                data: data,
                message: '토큰 갱신 성공',
            }
        } catch (error) {
            console.error('토큰 갱신 실패:', error)

            // 갱신 실패 시 로그아웃 처리
            await this.logout()

            return {
                success: false,
                message: '세션이 만료되었습니다. 다시 로그인해주세요.',
            }
        }
    },

    // ==========================================================================
    // 내 정보 조회
    // ==========================================================================

    /**
     * 현재 로그인한 사용자 정보 조회
     *
     * @returns {Promise<Object>} 사용자 정보
     */
    async getMe() {
        try {
            const response = await api.get('/api/auth/me')
            const { data } = response.data

            // 로컬 스토리지 업데이트
            localStorage.setItem(USER_KEY, JSON.stringify(data))

            // Vuex 스토어 업데이트
            await store.dispatch('auth/setUser', data)

            return {
                success: true,
                data: data,
            }
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error)

            return {
                success: false,
                message: error.response?.data?.message || '사용자 정보 조회에 실패했습니다.',
            }
        }
    },

    // ==========================================================================
    // 유틸리티 메서드
    // ==========================================================================

    /**
     * 인증 여부 확인
     *
     * @returns {boolean} 인증 여부
     */
    isAuthenticated() {
        const token = localStorage.getItem(TOKEN_KEY)
        return !!token
    },

    /**
     * 액세스 토큰 조회
     *
     * @returns {string|null} 액세스 토큰
     */
    getAccessToken() {
        return localStorage.getItem(TOKEN_KEY)
    },

    /**
     * 리프레시 토큰 조회
     *
     * @returns {string|null} 리프레시 토큰
     */
    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY)
    },

    /**
     * 저장된 사용자 정보 조회
     *
     * @returns {Object|null} 사용자 정보
     */
    getStoredUser() {
        const userJson = localStorage.getItem(USER_KEY)
        if (userJson) {
            try {
                return JSON.parse(userJson)
            } catch (e) {
                console.error('사용자 정보 파싱 실패:', e)
                return null
            }
        }
        return null
    },

    /**
     * 토큰 유효성 확인 (간단한 만료 체크)
     *
     * @returns {boolean} 토큰 유효 여부
     */
    isTokenValid() {
        const token = this.getAccessToken()
        if (!token) return false

        try {
            // JWT 토큰 디코딩 (페이로드 추출)
            const payload = JSON.parse(atob(token.split('.')[1]))
            const exp = payload.exp * 1000 // 밀리초 변환

            // 만료 시간 확인 (5분 여유)
            return Date.now() < exp - 5 * 60 * 1000
        } catch (e) {
            console.error('토큰 유효성 확인 실패:', e)
            return false
        }
    },

    // ==========================================================================
    // 【2일차 추가】 역할 관련 유틸리티 메서드
    // ==========================================================================

    /**
     * 【2일차 추가】 현재 사용자의 역할 목록 조회
     *
     * @returns {Array<string>} 역할 이름 배열 (예: ['ROLE_ADMIN'])
     */
    getUserRoles() {
        const user = this.getStoredUser()
        if (!user || !user.roles) return []

        return user.roles.map((role) => role.roleName || role)
    },

    /**
     * 【2일차 추가】 현재 사용자의 주요 역할 조회
     *
     * @returns {string|null} 주요 역할 이름
     */
    getPrimaryRole() {
        const user = this.getStoredUser()
        return user?.primaryRole || null
    },

    /**
     * 【2일차 추가】 특정 역할 보유 여부 확인
     *
     * @param {string} roleName - 확인할 역할 이름
     * @returns {boolean} 역할 보유 여부
     */
    hasRole(roleName) {
        const roles = this.getUserRoles()
        return roles.includes(roleName)
    },

    /**
     * 【2일차 추가】 관리자 권한 확인 (ADMIN 또는 BUSINESS_SUPPORT)
     *
     * @returns {boolean} 관리자 권한 여부
     */
    isManager() {
        const roles = this.getUserRoles()
        return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_BUSINESS_SUPPORT')
    },

    /**
     * 【2일차 추가】 1종 업무 접근 가능 여부 확인
     *
     * @returns {boolean} 1종 접근 가능 여부
     */
    canAccessType1() {
        const type1Roles = [
            'ROLE_ADMIN',
            'ROLE_BUSINESS_SUPPORT',
            'ROLE_EXECUTIVE_ALL',
            'ROLE_EXECUTIVE_TYPE1',
            'ROLE_TEAM_LEADER_ALL',
            'ROLE_TEAM_LEADER_TYPE1',
            'ROLE_INVESTIGATOR_ALL',
            'ROLE_INVESTIGATOR_TYPE1',
        ]

        const userRoles = this.getUserRoles()
        return userRoles.some((role) => type1Roles.includes(role))
    },

    /**
     * 【2일차 추가】 4종 업무 접근 가능 여부 확인
     *
     * @returns {boolean} 4종 접근 가능 여부
     */
    canAccessType4() {
        const type4Roles = [
            'ROLE_ADMIN',
            'ROLE_BUSINESS_SUPPORT',
            'ROLE_EXECUTIVE_ALL',
            'ROLE_EXECUTIVE_TYPE4',
            'ROLE_TEAM_LEADER_ALL',
            'ROLE_TEAM_LEADER_TYPE4',
            'ROLE_INVESTIGATOR_ALL',
            'ROLE_INVESTIGATOR_TYPE4',
        ]

        const userRoles = this.getUserRoles()
        return userRoles.some((role) => type4Roles.includes(role))
    },
}

// 기본 내보내기
export default authService
