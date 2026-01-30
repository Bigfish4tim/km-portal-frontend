/**
 * ============================================================================
 * 📁 src/store/modules/auth.js
 * 인증 관련 전역 상태를 관리하는 Vuex 스토어 모듈
 * ============================================================================
 *
 * 【2일차 수정 내역】
 * - isManager getter 수정: ROLE_MANAGER → ROLE_BUSINESS_SUPPORT
 * - isExecutive, isTeamLeader, isInvestigator getter 추가
 * - canAccessType1, canAccessType4 getter 추가
 *
 * 이 모듈은 애플리케이션의 인증 상태를 중앙집중식으로 관리합니다:
 * - 사용자 로그인/로그아웃 상태
 * - JWT 토큰 관리 (Access Token, Refresh Token)
 * - 사용자 정보 저장
 * - 권한 정보 관리
 * - 로그인 시간 추적
 *
 * 사용 예시:
 * - 로그인 상태 확인: this.$store.getters['auth/isAuthenticated']
 * - 사용자 정보: this.$store.getters['auth/user']
 * - 로그인 처리: this.$store.dispatch('auth/login', { username, password })
 *
 * @author KM Portal Team
 * @version 2.0 (2일차 Role 시스템 수정)
 * @since 2025-09-24
 * @modified 2026-01-30 - 12개 Role 시스템 반영
 */

/**
 * ============================================================================
 * 초기 상태 정의
 * ============================================================================
 *
 * 애플리케이션 시작시의 기본 인증 상태를 정의합니다.
 * 모든 값이 null 또는 false로 설정되어 비인증 상태를 나타냅니다.
 */
const initialState = {
    // ========================================
    // JWT 토큰 관련
    // ========================================

    /** JWT Access Token (API 호출시 사용) */
    accessToken: null,

    /** JWT Refresh Token (Access Token 갱신시 사용) */
    refreshToken: null,

    // ========================================
    // 사용자 정보
    // ========================================

    /** 현재 로그인한 사용자 정보 */
    user: null,

    /** 로그인 시간 (ISO 8601 형식) */
    loginTime: null,

    // ========================================
    // UI 상태
    // ========================================

    /** 인증 진행 중 여부 (로딩 상태 표시용) */
    isLoading: false,

    /** 마지막 인증 에러 메시지 */
    lastError: null,
}

/**
 * ============================================================================
 * Vuex 인증 모듈 정의
 * ============================================================================
 */
const authModule = {
    // 네임스페이스 활성화 (모듈 이름으로 접근)
    // 예: this.$store.getters['auth/isAuthenticated']
    namespaced: true,

    /**
     * ==========================================================================
     * 상태 (State)
     * ==========================================================================
     *
     * 인증과 관련된 모든 데이터를 저장하는 객체입니다.
     * 직접 수정할 수 없고 mutations를 통해서만 변경할 수 있습니다.
     */
    state: () => ({
        ...initialState,
    }),

    /**
     * ==========================================================================
     * 변이 (Mutations)
     * ==========================================================================
     *
     * 상태를 변경하는 동기 함수들입니다.
     * 각 mutation은 state를 첫 번째 인자로, 변경할 데이터를 두 번째 인자로 받습니다.
     */
    mutations: {
        /**
         * JWT 토큰들을 설정하는 mutation
         *
         * @param {Object} state - 현재 상태
         * @param {Object} payload - 토큰 정보
         * @param {string} payload.accessToken - 새로운 Access Token
         * @param {string} payload.refreshToken - 새로운 Refresh Token
         */
        setTokens(state, { accessToken, refreshToken }) {
            state.accessToken = accessToken
            state.refreshToken = refreshToken
        },

        /**
         * Access Token만 업데이트하는 mutation
         * 토큰 갱신시 사용됩니다.
         *
         * @param {Object} state - 현재 상태
         * @param {string} accessToken - 새로운 Access Token
         */
        setAccessToken(state, accessToken) {
            state.accessToken = accessToken
        },

        /**
         * 사용자 정보를 설정하는 mutation
         *
         * @param {Object} state - 현재 상태
         * @param {Object} user - 사용자 정보 객체
         * @param {number} user.userId - 사용자 ID
         * @param {string} user.username - 사용자명
         * @param {string} user.fullName - 전체 이름
         * @param {string} user.email - 이메일
         * @param {string} user.department - 부서
         * @param {string[]} user.roles - 권한 목록 (12개 Role 중 하나 이상)
         */
        setUser(state, user) {
            state.user = user
        },

        /**
         * 로그인 시간을 설정하는 mutation
         *
         * @param {Object} state - 현재 상태
         * @param {string} loginTime - 로그인 시간 (ISO 8601 형식)
         */
        setLoginTime(state, loginTime) {
            state.loginTime = loginTime
        },

        /**
         * 로딩 상태를 설정하는 mutation
         *
         * @param {Object} state - 현재 상태
         * @param {boolean} isLoading - 로딩 여부
         */
        setLoading(state, isLoading) {
            state.isLoading = isLoading
        },

        /**
         * 에러 메시지를 설정하는 mutation
         *
         * @param {Object} state - 현재 상태
         * @param {string|null} error - 에러 메시지
         */
        setError(state, error) {
            state.lastError = error
        },

        /**
         * 모든 인증 정보를 초기화하는 mutation
         * 로그아웃시 사용됩니다.
         *
         * @param {Object} state - 현재 상태
         */
        clearAuth(state) {
            // 초기 상태로 모든 값 리셋
            Object.assign(state, {
                ...initialState,
            })
        },
    },

    /**
     * ==========================================================================
     * 액션 (Actions)
     * ==========================================================================
     *
     * 비동기 작업이나 여러 mutation을 조합한 복잡한 로직을 처리하는 함수들입니다.
     * API 호출, 로컬 스토리지 작업 등을 포함할 수 있습니다.
     */
    actions: {
        /**
         * 로그인 액션
         *
         * authService를 통해 실제 로그인을 처리하고 결과에 따라 상태를 업데이트합니다.
         *
         * @param {Object} context - Vuex 컨텍스트 객체
         * @param {Function} context.commit - mutation 실행 함수
         * @param {Object} payload - 로그인 정보
         * @param {string} payload.username - 사용자명
         * @param {string} payload.password - 비밀번호
         * @returns {Promise<Object>} 로그인 결과
         */
        async login({ commit }, { username, password }) {
            // 로딩 시작
            commit('setLoading', true)
            commit('setError', null)

            try {
                // authService를 동적으로 import하여 순환 참조 방지
                const authService = (await import('@/services/authService')).default

                // 실제 로그인 처리
                const result = await authService.login(username, password)

                if (result.success) {
                    // 로그인 성공시 상태는 이미 authService에서 업데이트됨
                    commit('setError', null)
                } else {
                    // 로그인 실패시 에러 메시지 저장
                    commit('setError', result.message)
                }

                return result
            } catch (error) {
                // 예외 발생시 에러 상태 설정
                const errorMessage = error.message || '로그인 중 오류가 발생했습니다.'
                commit('setError', errorMessage)

                return {
                    success: false,
                    message: errorMessage,
                }
            } finally {
                // 로딩 종료
                commit('setLoading', false)
            }
        },

        /**
         * 로그아웃 액션
         *
         * authService를 통해 로그아웃을 처리하고 모든 인증 정보를 제거합니다.
         *
         * @param {Object} context - Vuex 컨텍스트 객체
         * @param {Function} context.commit - mutation 실행 함수
         */
        async logout({ commit }) {
            try {
                // authService를 동적으로 import하여 순환 참조 방지
                const authService = (await import('@/services/authService')).default

                // 실제 로그아웃 처리
                await authService.logout()

                // 상태는 이미 authService에서 정리됨
            } catch (error) {
                console.error('[Store] 로그아웃 처리 오류:', error)

                // 오류가 발생해도 클라이언트 상태는 정리
                commit('clearAuth')
            }
        },

        /**
         * 회원가입 액션
         *
         * authService를 통해 실제 회원가입을 처리하고 결과에 따라 상태를 업데이트합니다.
         *
         * @param {Object} context - Vuex 컨텍스트 객체
         * @param {Function} context.commit - mutation 실행 함수
         * @param {Object} userData - 회원가입 정보
         * @param {string} userData.username - 사용자명
         * @param {string} userData.password - 비밀번호
         * @param {string} userData.email - 이메일
         * @param {string} userData.fullName - 실명
         * @param {string} userData.department - 부서
         * @param {string} userData.position - 직급
         * @param {string} userData.phoneNumber - 전화번호
         * @param {string} [userData.roleName] - 역할명 (선택, 기본값: ROLE_EMPLOYEE)
         * @returns {Promise<Object>} 회원가입 결과
         */
        async register({ commit }, userData) {
            // 로딩 시작
            commit('setLoading', true)
            commit('setError', null)

            try {
                // authService를 동적으로 import하여 순환 참조 방지
                const authService = (await import('@/services/authService')).default

                // 실제 회원가입 처리
                const result = await authService.register(userData)

                if (result.success) {
                    // 회원가입 성공시 에러 메시지 초기화
                    commit('setError', null)
                } else {
                    // 회원가입 실패시 에러 메시지 저장
                    commit('setError', result.message)
                }

                return result
            } catch (error) {
                // 예외 발생시 에러 상태 설정
                const errorMessage = error.message || '회원가입 중 오류가 발생했습니다.'
                commit('setError', errorMessage)

                return {
                    success: false,
                    message: errorMessage,
                }
            } finally {
                // 로딩 종료
                commit('setLoading', false)
            }
        },

        /**
         * 토큰 갱신 액션
         *
         * Access Token이 만료되었을 때 Refresh Token으로 새 토큰을 받아옵니다.
         * api.js의 응답 인터셉터에서 자동으로 호출됩니다.
         *
         * @param {Object} context - Vuex 컨텍스트 객체
         * @param {Function} context.commit - mutation 실행 함수
         * @param {Object} context.state - 현재 상태
         */
        async refreshToken({ commit, state }) {
            if (!state.refreshToken) {
                throw new Error('Refresh Token이 없습니다.')
            }

            try {
                // API 직접 호출하여 순환 참조 방지
                const axios = (await import('axios')).default

                const response = await axios.post('/api/auth/refresh', {
                    refreshToken: state.refreshToken,
                })

                const { accessToken } = response.data

                // 새로운 Access Token 저장
                commit('setAccessToken', accessToken)

                // 로컬 스토리지도 업데이트
                localStorage.setItem('accessToken', accessToken)

                return accessToken
            } catch (error) {
                console.error('[Store] 토큰 갱신 실패:', error)

                // 갱신 실패시 로그아웃 처리
                await this.dispatch('auth/logout')

                throw error
            }
        },

        /**
         * 사용자 정보 갱신 액션
         *
         * 현재 토큰으로 최신 사용자 정보를 가져와 상태를 업데이트합니다.
         *
         * @param {Object} context - Vuex 컨텍스트 객체
         * @param {Function} context.commit - mutation 실행 함수
         */
        async refreshUserInfo({ commit }) {
            try {
                // API를 통해 현재 사용자 정보 조회
                const api = (await import('@/services/api')).default
                const response = await api.get('/auth/me')

                if (response.data) {
                    commit('setUser', response.data)
                }
            } catch (error) {
                console.error('[Store] 사용자 정보 갱신 실패:', error)

                // 사용자 정보 조회 실패시 로그아웃
                await this.dispatch('auth/logout')
            }
        },
    },

    /**
     * ==========================================================================
     * 게터 (Getters)
     * ==========================================================================
     *
     * 상태에서 파생된 값들을 계산하여 반환하는 함수들입니다.
     * 컴포넌트에서 복잡한 로직 없이 필요한 값을 쉽게 가져올 수 있습니다.
     *
     * 【2일차 수정】12개 Role 시스템에 맞게 getter들을 업데이트했습니다.
     */
    getters: {
        // ========================================
        // 기본 상태 조회 Getters
        // ========================================

        /**
         * Access Token을 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string|null} Access Token
         */
        accessToken: (state) => state.accessToken,

        /**
         * Refresh Token을 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string|null} Refresh Token
         */
        refreshToken: (state) => state.refreshToken,

        /**
         * 현재 사용자 정보를 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {Object|null} 사용자 정보 객체
         */
        user: (state) => state.user,

        /**
         * 로그인 시간을 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string|null} 로그인 시간 (ISO 8601 형식)
         */
        loginTime: (state) => state.loginTime,

        /**
         * 로딩 상태를 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {boolean} 로딩 여부
         */
        isLoading: (state) => state.isLoading,

        /**
         * 마지막 에러 메시지를 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string|null} 에러 메시지
         */
        lastError: (state) => state.lastError,

        /**
         * 인증 여부를 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {boolean} 인증된 경우 true, 아니면 false
         */
        isAuthenticated: (state) => {
            return !!(state.accessToken && state.user)
        },

        /**
         * 현재 사용자의 권한 목록을 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string[]} 권한 목록 (빈 배열일 수 있음)
         */
        userRoles: (state) => {
            return state.user?.roles || []
        },

        // ========================================
        // 【2일차 수정】 12개 Role 권한 체크 Getters
        // ========================================

        /**
         * 관리자 권한 여부를 반환하는 getter
         *
         * ROLE_ADMIN: 시스템 전체에 대한 모든 권한
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 관리자인 경우 true, 아니면 false
         */
        isAdmin: (state, getters) => {
            return getters.userRoles.includes('ROLE_ADMIN')
        },

        /**
         * 【2일차 수정】 경영지원 또는 관리자 권한 여부를 반환하는 getter
         *
         * 기존: ROLE_MANAGER (삭제된 Role)
         * 변경: ROLE_BUSINESS_SUPPORT (경영지원)
         *
         * 경영지원 역할:
         * - 전체 업무 접근 (접수/배당/전송)
         * - 1종 + 4종 모두 접근 가능
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 관리자 또는 경영지원 권한이 있는 경우 true
         */
        isManager: (state, getters) => {
            const roles = getters.userRoles
            // 【2일차 수정】 ROLE_MANAGER → ROLE_BUSINESS_SUPPORT
            return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_BUSINESS_SUPPORT')
        },

        /**
         * 【2일차 신규】 임원급 이상 권한 여부를 반환하는 getter
         *
         * 임원 역할:
         * - 보고서 검토 및 승인 권한
         * - 전체 업무 조회 가능
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 임원급 이상 권한이 있는 경우 true
         */
        isExecutive: (state, getters) => {
            const roles = getters.userRoles
            return (
                roles.includes('ROLE_ADMIN') ||
                roles.includes('ROLE_BUSINESS_SUPPORT') ||
                roles.includes('ROLE_EXECUTIVE_ALL') ||
                roles.includes('ROLE_EXECUTIVE_TYPE1') ||
                roles.includes('ROLE_EXECUTIVE_TYPE4')
            )
        },

        /**
         * 【2일차 신규】 팀장급 이상 권한 여부를 반환하는 getter
         *
         * 팀장 역할:
         * - 자기 팀의 조사/보고서 작성/검토 권한
         * - 팀원 관리
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 팀장급 이상 권한이 있는 경우 true
         */
        isTeamLeader: (state, getters) => {
            const roles = getters.userRoles
            return (
                roles.includes('ROLE_ADMIN') ||
                roles.includes('ROLE_BUSINESS_SUPPORT') ||
                roles.includes('ROLE_EXECUTIVE_ALL') ||
                roles.includes('ROLE_EXECUTIVE_TYPE1') ||
                roles.includes('ROLE_EXECUTIVE_TYPE4') ||
                roles.includes('ROLE_TEAM_LEADER_ALL') ||
                roles.includes('ROLE_TEAM_LEADER_TYPE1') ||
                roles.includes('ROLE_TEAM_LEADER_TYPE4')
            )
        },

        /**
         * 【2일차 신규】 조사자급 이상 권한 여부를 반환하는 getter
         *
         * 조사자 역할:
         * - 자기 배당 건 조사 및 보고서 작성 권한
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 조사자급 이상 권한이 있는 경우 true
         */
        isInvestigator: (state, getters) => {
            const roles = getters.userRoles
            // 일반사원(ROLE_EMPLOYEE)만 제외하고 모두 true
            return roles.length > 0 && !roles.every((role) => role === 'ROLE_EMPLOYEE')
        },

        /**
         * 【2일차 신규】 1종 업무 접근 가능 여부를 반환하는 getter
         *
         * 1종 업무 접근 가능 Role:
         * - ROLE_ADMIN, ROLE_BUSINESS_SUPPORT (전체)
         * - ROLE_EXECUTIVE_ALL, ROLE_EXECUTIVE_TYPE1 (임원)
         * - ROLE_TEAM_LEADER_ALL, ROLE_TEAM_LEADER_TYPE1 (팀장)
         * - ROLE_INVESTIGATOR_ALL, ROLE_INVESTIGATOR_TYPE1 (조사자)
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 1종 업무 접근 가능 여부
         */
        canAccessType1: (state, getters) => {
            const roles = getters.userRoles
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
            return roles.some((role) => type1Roles.includes(role))
        },

        /**
         * 【2일차 신규】 4종 업무 접근 가능 여부를 반환하는 getter
         *
         * 4종 업무 접근 가능 Role:
         * - ROLE_ADMIN, ROLE_BUSINESS_SUPPORT (전체)
         * - ROLE_EXECUTIVE_ALL, ROLE_EXECUTIVE_TYPE4 (임원)
         * - ROLE_TEAM_LEADER_ALL, ROLE_TEAM_LEADER_TYPE4 (팀장)
         * - ROLE_INVESTIGATOR_ALL, ROLE_INVESTIGATOR_TYPE4 (조사자)
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {boolean} 4종 업무 접근 가능 여부
         */
        canAccessType4: (state, getters) => {
            const roles = getters.userRoles
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
            return roles.some((role) => type4Roles.includes(role))
        },

        // ========================================
        // 사용자 정보 관련 Getters
        // ========================================

        /**
         * 사용자 표시명을 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {string} 사용자 표시명 (전체이름 또는 사용자명)
         */
        displayName: (state) => {
            if (!state.user) return ''
            return state.user.fullName || state.user.username || '사용자'
        },

        /**
         * 로그인 경과 시간을 분 단위로 반환하는 getter
         *
         * @param {Object} state - 현재 상태
         * @returns {number|null} 로그인 후 경과 시간(분)
         */
        loginDuration: (state) => {
            if (!state.loginTime) return null

            const loginDate = new Date(state.loginTime)
            const now = new Date()
            const durationMs = now - loginDate

            return Math.floor(durationMs / (1000 * 60))
        },

        /**
         * 【2일차 신규】 현재 사용자의 주요 Role 표시명을 반환하는 getter
         *
         * 여러 Role을 가진 경우 우선순위가 가장 높은 Role의 표시명을 반환합니다.
         *
         * @param {Object} state - 현재 상태
         * @param {Object} getters - 다른 getter들
         * @returns {string} Role 표시명
         */
        primaryRoleDisplayName: (state, getters) => {
            const roles = getters.userRoles

            // Role 우선순위에 따른 표시명 매핑
            const roleDisplayMap = {
                ROLE_ADMIN: '관리자',
                ROLE_BUSINESS_SUPPORT: '경영지원',
                ROLE_EXECUTIVE_ALL: '임원(1/4종)',
                ROLE_EXECUTIVE_TYPE1: '임원(1종)',
                ROLE_EXECUTIVE_TYPE4: '임원(4종)',
                ROLE_TEAM_LEADER_ALL: '팀장(1/4종)',
                ROLE_TEAM_LEADER_TYPE1: '팀장(1종)',
                ROLE_TEAM_LEADER_TYPE4: '팀장(4종)',
                ROLE_INVESTIGATOR_ALL: '조사자(1/4종)',
                ROLE_INVESTIGATOR_TYPE1: '조사자(1종)',
                ROLE_INVESTIGATOR_TYPE4: '조사자(4종)',
                ROLE_EMPLOYEE: '일반사원',
            }

            // 우선순위 순서
            const priorityOrder = [
                'ROLE_ADMIN',
                'ROLE_BUSINESS_SUPPORT',
                'ROLE_EXECUTIVE_ALL',
                'ROLE_EXECUTIVE_TYPE1',
                'ROLE_EXECUTIVE_TYPE4',
                'ROLE_TEAM_LEADER_ALL',
                'ROLE_TEAM_LEADER_TYPE1',
                'ROLE_TEAM_LEADER_TYPE4',
                'ROLE_INVESTIGATOR_ALL',
                'ROLE_INVESTIGATOR_TYPE1',
                'ROLE_INVESTIGATOR_TYPE4',
                'ROLE_EMPLOYEE',
            ]

            // 우선순위가 가장 높은 Role 찾기
            for (const role of priorityOrder) {
                if (roles.includes(role)) {
                    return roleDisplayMap[role]
                }
            }

            return '권한 없음'
        },
    },
}

export default authModule
