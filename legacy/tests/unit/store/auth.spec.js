/**
 * Vuex Auth 모듈 단위 테스트
 *
 * 이 파일은 인증 관련 Vuex 스토어 모듈의 기능을 검증합니다.
 *
 * [테스트 항목]
 * 1. 초기 상태 (State)
 * 2. 변이 (Mutations)
 * 3. 액션 (Actions)
 * 4. 게터 (Getters)
 *
 * [사용 라이브러리]
 * - Vuex 4: 상태 관리
 * - Jest 27: 테스트 프레임워크
 *
 * 파일 위치: tests/unit/store/auth.spec.js
 *
 * 작성일: 2025년 11월 29일 (40일차)
 * 작성자: KM Portal Dev Team
 */

import { createStore } from 'vuex'
import authModule from '@/store/modules/auth'

// ================================
// Mock 설정
// ================================

/**
 * authService Mock
 */
const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  isAuthenticated: jest.fn()
}

jest.mock('@/services/authService', () => ({
  default: mockAuthService
}))

/**
 * API Mock
 */
const mockApi = {
  get: jest.fn(),
  post: jest.fn()
}

jest.mock('@/services/api', () => ({
  default: mockApi
}))

/**
 * Axios Mock
 */
jest.mock('axios', () => ({
  default: {
    post: jest.fn()
  }
}))

// ================================
// 테스트 헬퍼 함수
// ================================

/**
 * 테스트용 Vuex Store를 생성하는 함수
 *
 * @param {Object} initialState - 초기 상태 오버라이드
 * @returns {Object} Vuex Store 인스턴스
 */
const createTestStore = (initialState = {}) => {
  // authModule을 복사하여 초기 상태 오버라이드
  const moduleWithState = {
    ...authModule,
    state: () => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      loginTime: null,
      isLoading: false,
      lastError: null,
      ...initialState
    })
  }

  return createStore({
    modules: {
      auth: moduleWithState
    }
  })
}

// ================================
// 테스트 데이터
// ================================

const mockUser = {
  userId: 1,
  username: 'testuser',
  fullName: '테스트 사용자',
  email: 'test@example.com',
  department: '개발팀',
  roles: ['ROLE_USER']
}

const mockAdminUser = {
  userId: 2,
  username: 'admin',
  fullName: '관리자',
  email: 'admin@example.com',
  department: '관리부',
  roles: ['ROLE_ADMIN', 'ROLE_USER']
}

const mockManagerUser = {
  userId: 3,
  username: 'manager',
  fullName: '매니저',
  email: 'manager@example.com',
  department: '기획팀',
  roles: ['ROLE_MANAGER', 'ROLE_USER']
}

// ================================
// 테스트 시작
// ================================

describe('Vuex Auth Module', () => {
  // 각 테스트 전에 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ================================
  // 초기 상태 테스트
  // ================================

  describe('초기 상태 (State)', () => {
    it('accessToken이 null로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.accessToken).toBeNull()
    })

    it('refreshToken이 null로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.refreshToken).toBeNull()
    })

    it('user가 null로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.user).toBeNull()
    })

    it('loginTime이 null로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.loginTime).toBeNull()
    })

    it('isLoading이 false로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.isLoading).toBe(false)
    })

    it('lastError가 null로 초기화되어야 한다', () => {
      // Given & When
      const store = createTestStore()

      // Then
      expect(store.state.auth.lastError).toBeNull()
    })
  })

  // ================================
  // 변이 (Mutations) 테스트
  // ================================

  describe('변이 (Mutations)', () => {
    describe('setTokens', () => {
      it('accessToken과 refreshToken을 설정해야 한다', () => {
        // Given
        const store = createTestStore()

        // When
        store.commit('auth/setTokens', {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })

        // Then
        expect(store.state.auth.accessToken).toBe('new-access-token')
        expect(store.state.auth.refreshToken).toBe('new-refresh-token')
      })
    })

    describe('setAccessToken', () => {
      it('accessToken만 업데이트해야 한다', () => {
        // Given
        const store = createTestStore({
          accessToken: 'old-token',
          refreshToken: 'refresh-token'
        })

        // When
        store.commit('auth/setAccessToken', 'updated-access-token')

        // Then
        expect(store.state.auth.accessToken).toBe('updated-access-token')
        expect(store.state.auth.refreshToken).toBe('refresh-token') // 변경되지 않음
      })
    })

    describe('setUser', () => {
      it('사용자 정보를 설정해야 한다', () => {
        // Given
        const store = createTestStore()

        // When
        store.commit('auth/setUser', mockUser)

        // Then
        expect(store.state.auth.user).toEqual(mockUser)
        expect(store.state.auth.user.username).toBe('testuser')
        expect(store.state.auth.user.fullName).toBe('테스트 사용자')
      })
    })

    describe('setLoginTime', () => {
      it('로그인 시간을 설정해야 한다', () => {
        // Given
        const store = createTestStore()
        const loginTime = '2025-11-29T10:00:00.000Z'

        // When
        store.commit('auth/setLoginTime', loginTime)

        // Then
        expect(store.state.auth.loginTime).toBe(loginTime)
      })
    })

    describe('setLoading', () => {
      it('로딩 상태를 true로 설정해야 한다', () => {
        // Given
        const store = createTestStore()

        // When
        store.commit('auth/setLoading', true)

        // Then
        expect(store.state.auth.isLoading).toBe(true)
      })

      it('로딩 상태를 false로 설정해야 한다', () => {
        // Given
        const store = createTestStore({ isLoading: true })

        // When
        store.commit('auth/setLoading', false)

        // Then
        expect(store.state.auth.isLoading).toBe(false)
      })
    })

    describe('setError', () => {
      it('에러 메시지를 설정해야 한다', () => {
        // Given
        const store = createTestStore()

        // When
        store.commit('auth/setError', '로그인에 실패했습니다.')

        // Then
        expect(store.state.auth.lastError).toBe('로그인에 실패했습니다.')
      })

      it('에러 메시지를 null로 초기화해야 한다', () => {
        // Given
        const store = createTestStore({ lastError: '이전 에러' })

        // When
        store.commit('auth/setError', null)

        // Then
        expect(store.state.auth.lastError).toBeNull()
      })
    })

    describe('clearAuth', () => {
      it('모든 인증 정보를 초기화해야 한다', () => {
        // Given
        const store = createTestStore({
          accessToken: 'some-token',
          refreshToken: 'some-refresh-token',
          user: mockUser,
          loginTime: '2025-11-29T10:00:00.000Z',
          isLoading: true,
          lastError: '에러 메시지'
        })

        // When
        store.commit('auth/clearAuth')

        // Then
        expect(store.state.auth.accessToken).toBeNull()
        expect(store.state.auth.refreshToken).toBeNull()
        expect(store.state.auth.user).toBeNull()
        expect(store.state.auth.loginTime).toBeNull()
        expect(store.state.auth.isLoading).toBe(false)
        expect(store.state.auth.lastError).toBeNull()
      })
    })
  })

  // ================================
  // 게터 (Getters) 테스트
  // ================================

  describe('게터 (Getters)', () => {
    describe('accessToken', () => {
      it('accessToken을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ accessToken: 'test-token' })

        // When & Then
        expect(store.getters['auth/accessToken']).toBe('test-token')
      })
    })

    describe('refreshToken', () => {
      it('refreshToken을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ refreshToken: 'test-refresh-token' })

        // When & Then
        expect(store.getters['auth/refreshToken']).toBe('test-refresh-token')
      })
    })

    describe('user', () => {
      it('사용자 정보를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockUser })

        // When & Then
        expect(store.getters['auth/user']).toEqual(mockUser)
      })
    })

    describe('isLoading', () => {
      it('로딩 상태를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ isLoading: true })

        // When & Then
        expect(store.getters['auth/isLoading']).toBe(true)
      })
    })

    describe('lastError', () => {
      it('마지막 에러를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ lastError: '에러 발생' })

        // When & Then
        expect(store.getters['auth/lastError']).toBe('에러 발생')
      })
    })

    describe('isAuthenticated', () => {
      it('토큰과 사용자가 있으면 true를 반환해야 한다', () => {
        // Given
        const store = createTestStore({
          accessToken: 'valid-token',
          user: mockUser
        })

        // When & Then
        expect(store.getters['auth/isAuthenticated']).toBe(true)
      })

      it('토큰이 없으면 false를 반환해야 한다', () => {
        // Given
        const store = createTestStore({
          accessToken: null,
          user: mockUser
        })

        // When & Then
        expect(store.getters['auth/isAuthenticated']).toBe(false)
      })

      it('사용자가 없으면 false를 반환해야 한다', () => {
        // Given
        const store = createTestStore({
          accessToken: 'valid-token',
          user: null
        })

        // When & Then
        expect(store.getters['auth/isAuthenticated']).toBe(false)
      })

      it('둘 다 없으면 false를 반환해야 한다', () => {
        // Given
        const store = createTestStore()

        // When & Then
        expect(store.getters['auth/isAuthenticated']).toBe(false)
      })
    })

    describe('userRoles', () => {
      it('사용자 권한 목록을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockUser })

        // When & Then
        expect(store.getters['auth/userRoles']).toEqual(['ROLE_USER'])
      })

      it('사용자가 없으면 빈 배열을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: null })

        // When & Then
        expect(store.getters['auth/userRoles']).toEqual([])
      })
    })

    describe('isAdmin', () => {
      it('관리자 권한이 있으면 true를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockAdminUser })

        // When & Then
        expect(store.getters['auth/isAdmin']).toBe(true)
      })

      it('관리자 권한이 없으면 false를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockUser })

        // When & Then
        expect(store.getters['auth/isAdmin']).toBe(false)
      })

      it('사용자가 없으면 false를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: null })

        // When & Then
        expect(store.getters['auth/isAdmin']).toBe(false)
      })
    })

    describe('isManager', () => {
      it('매니저 권한이 있으면 true를 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockManagerUser })

        // When & Then
        expect(store.getters['auth/isManager']).toBe(true)
      })

      it('관리자도 매니저 권한이 있어야 한다', () => {
        // Given
        const store = createTestStore({ user: mockAdminUser })

        // When & Then
        expect(store.getters['auth/isManager']).toBe(true)
      })

      it('일반 사용자는 매니저 권한이 없어야 한다', () => {
        // Given
        const store = createTestStore({ user: mockUser })

        // When & Then
        expect(store.getters['auth/isManager']).toBe(false)
      })
    })

    describe('displayName', () => {
      it('전체 이름을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: mockUser })

        // When & Then
        expect(store.getters['auth/displayName']).toBe('테스트 사용자')
      })

      it('전체 이름이 없으면 사용자명을 반환해야 한다', () => {
        // Given
        const userWithoutFullName = {
          ...mockUser,
          fullName: null,
          username: 'testuser'
        }
        const store = createTestStore({ user: userWithoutFullName })

        // When & Then
        expect(store.getters['auth/displayName']).toBe('testuser')
      })

      it('사용자가 없으면 빈 문자열을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ user: null })

        // When & Then
        expect(store.getters['auth/displayName']).toBe('')
      })
    })

    describe('loginDuration', () => {
      it('로그인 후 경과 시간을 분 단위로 반환해야 한다', () => {
        // Given
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const store = createTestStore({ loginTime: tenMinutesAgo })

        // When
        const duration = store.getters['auth/loginDuration']

        // Then
        // 약간의 오차 허용 (9-11분)
        expect(duration).toBeGreaterThanOrEqual(9)
        expect(duration).toBeLessThanOrEqual(11)
      })

      it('로그인 시간이 없으면 null을 반환해야 한다', () => {
        // Given
        const store = createTestStore({ loginTime: null })

        // When & Then
        expect(store.getters['auth/loginDuration']).toBeNull()
      })
    })
  })

  // ================================
  // 액션 (Actions) 테스트
  // ================================

  describe('액션 (Actions)', () => {
    describe('login', () => {
      it('로그인 성공 시 에러를 초기화해야 한다', async () => {
        // Given
        const store = createTestStore({ lastError: '이전 에러' })
        mockAuthService.login.mockResolvedValue({
          success: true,
          message: '로그인 성공'
        })

        // When
        const result = await store.dispatch('auth/login', {
          username: 'testuser',
          password: 'password123'
        })

        // Then
        expect(result.success).toBe(true)
        expect(store.state.auth.lastError).toBeNull()
      })

      it('로그인 실패 시 에러 메시지를 저장해야 한다', async () => {
        // Given
        const store = createTestStore()
        mockAuthService.login.mockResolvedValue({
          success: false,
          message: '비밀번호가 일치하지 않습니다.'
        })

        // When
        const result = await store.dispatch('auth/login', {
          username: 'testuser',
          password: 'wrongpassword'
        })

        // Then
        expect(result.success).toBe(false)
        expect(store.state.auth.lastError).toBe('비밀번호가 일치하지 않습니다.')
      })

      it('로그인 중 로딩 상태가 true로 설정되어야 한다', async () => {
        // Given
        const store = createTestStore()
        let loadingDuringCall = false

        mockAuthService.login.mockImplementation(() => {
          loadingDuringCall = store.state.auth.isLoading
          return Promise.resolve({ success: true })
        })

        // When
        await store.dispatch('auth/login', {
          username: 'testuser',
          password: 'password123'
        })

        // Then
        expect(loadingDuringCall).toBe(true)
        expect(store.state.auth.isLoading).toBe(false) // 완료 후 false
      })

      it('예외 발생 시 에러 메시지를 저장해야 한다', async () => {
        // Given
        const store = createTestStore()
        mockAuthService.login.mockRejectedValue(new Error('네트워크 오류'))

        // When
        const result = await store.dispatch('auth/login', {
          username: 'testuser',
          password: 'password123'
        })

        // Then
        expect(result.success).toBe(false)
        expect(store.state.auth.lastError).toBe('네트워크 오류')
      })
    })

    describe('logout', () => {
      it('로그아웃 시 authService.logout이 호출되어야 한다', async () => {
        // Given
        const store = createTestStore({
          accessToken: 'valid-token',
          user: mockUser
        })
        mockAuthService.logout.mockResolvedValue()

        // When
        await store.dispatch('auth/logout')

        // Then
        expect(mockAuthService.logout).toHaveBeenCalled()
      })

      it('로그아웃 실패 시에도 클라이언트 상태가 정리되어야 한다', async () => {
        // Given
        const store = createTestStore({
          accessToken: 'valid-token',
          user: mockUser
        })
        mockAuthService.logout.mockRejectedValue(new Error('서버 오류'))

        // When
        await store.dispatch('auth/logout')

        // Then
        expect(store.state.auth.accessToken).toBeNull()
        expect(store.state.auth.user).toBeNull()
      })
    })

    describe('register', () => {
      it('회원가입 성공 시 에러를 초기화해야 한다', async () => {
        // Given
        const store = createTestStore({ lastError: '이전 에러' })
        mockAuthService.register.mockResolvedValue({
          success: true,
          message: '회원가입 성공'
        })

        // When
        const result = await store.dispatch('auth/register', {
          username: 'newuser',
          password: 'password123',
          email: 'new@example.com',
          fullName: '신규 사용자'
        })

        // Then
        expect(result.success).toBe(true)
        expect(store.state.auth.lastError).toBeNull()
      })

      it('회원가입 실패 시 에러 메시지를 저장해야 한다', async () => {
        // Given
        const store = createTestStore()
        mockAuthService.register.mockResolvedValue({
          success: false,
          message: '이미 존재하는 사용자명입니다.'
        })

        // When
        const result = await store.dispatch('auth/register', {
          username: 'existinguser',
          password: 'password123',
          email: 'existing@example.com',
          fullName: '기존 사용자'
        })

        // Then
        expect(result.success).toBe(false)
        expect(store.state.auth.lastError).toBe('이미 존재하는 사용자명입니다.')
      })

      it('회원가입 중 로딩 상태가 관리되어야 한다', async () => {
        // Given
        const store = createTestStore()
        let loadingDuringCall = false

        mockAuthService.register.mockImplementation(() => {
          loadingDuringCall = store.state.auth.isLoading
          return Promise.resolve({ success: true })
        })

        // When
        await store.dispatch('auth/register', {
          username: 'newuser',
          password: 'password123'
        })

        // Then
        expect(loadingDuringCall).toBe(true)
        expect(store.state.auth.isLoading).toBe(false)
      })
    })
  })
})

/*
 * ====== 테스트 실행 방법 ======
 *
 * 1. 전체 테스트 실행:
 *    npm run test:unit
 *
 * 2. 특정 파일 테스트:
 *    npm run test:unit -- auth.spec.js
 *
 * 3. 감시 모드:
 *    npm run test:unit -- --watch
 *
 * ====== Vuex 테스트 팁 ======
 *
 * 1. 독립된 Store 인스턴스 사용:
 *    - 각 테스트에서 새로운 store 인스턴스 생성
 *    - 테스트 간 상태 간섭 방지
 *
 * 2. Mutation 테스트:
 *    - store.commit('moduleName/mutationName', payload)
 *    - 상태 변경 직접 확인
 *
 * 3. Action 테스트:
 *    - store.dispatch('moduleName/actionName', payload)
 *    - 비동기 처리 await 필수
 *    - Mock 서비스 활용
 *
 * 4. Getter 테스트:
 *    - store.getters['moduleName/getterName']
 *    - 다양한 상태에 대한 테스트
 */