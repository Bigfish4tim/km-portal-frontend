/**
 * Login.vue 컴포넌트 단위 테스트
 *
 * 이 파일은 로그인 페이지 컴포넌트의 기능을 검증합니다.
 *
 * [테스트 항목]
 * 1. 컴포넌트 렌더링
 * 2. 폼 입력 및 유효성 검사
 * 3. 로그인 버튼 동작
 * 4. 에러 메시지 표시
 * 5. 회원가입 링크 동작
 * 6. 로그인 정보 저장/복원
 *
 * [사용 라이브러리]
 * - @vue/test-utils 2.x: Vue 3 컴포넌트 테스트 유틸리티
 * - Jest 27: 테스트 프레임워크
 * - Vuex 4: 상태 관리
 *
 * 파일 위치: tests/unit/components/Login.spec.js
 *
 * 작성일: 2025년 11월 29일 (40일차)
 * 작성자: KM Portal Dev Team
 */

import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Login from '@/views/Login.vue'

// ================================
// Mock 설정
// ================================

/**
 * Vue Router Mock
 *
 * 실제 라우터 없이 테스트하기 위해 Mock 객체를 생성합니다.
 * push, replace 등의 메서드를 Jest Mock 함수로 대체합니다.
 */
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn()
}

const mockRoute = {
  query: {},
  params: {}
}

/**
 * authService Mock
 *
 * 실제 API 호출 없이 테스트하기 위해 Mock 합니다.
 */
jest.mock('@/services/authService', () => ({
  default: {
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    logout: jest.fn()
  }
}))

/**
 * Element Plus Message Mock
 */
const mockMessage = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
}

// ================================
// Vuex Store Mock 생성
// ================================

/**
 * 테스트용 Vuex Store를 생성하는 함수
 *
 * @param {Object} options - 커스터마이징 옵션
 * @returns {Object} Vuex Store 인스턴스
 */
const createMockStore = (options = {}) => {
  const defaultAuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoading: false,
    lastError: null
  }

  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: () => ({
          ...defaultAuthState,
          ...options.authState
        }),
        getters: {
          isAuthenticated: (state) => !!state.accessToken && !!state.user,
          lastError: (state) => state.lastError,
          isLoading: (state) => state.isLoading,
          user: (state) => state.user,
          ...options.authGetters
        },
        mutations: {
          setLoading: (state, isLoading) => { state.isLoading = isLoading },
          setError: (state, error) => { state.lastError = error },
          setTokens: (state, { accessToken, refreshToken }) => {
            state.accessToken = accessToken
            state.refreshToken = refreshToken
          },
          setUser: (state, user) => { state.user = user },
          clearAuth: (state) => {
            state.accessToken = null
            state.refreshToken = null
            state.user = null
          }
        },
        actions: {
          login: options.loginAction || jest.fn().mockResolvedValue({ success: true }),
          logout: jest.fn(),
          ...options.authActions
        }
      }
    }
  })
}

// ================================
// 테스트 헬퍼 함수
// ================================

/**
 * Login 컴포넌트를 마운트하는 헬퍼 함수
 *
 * Vue 3 + @vue/test-utils 2.x 방식으로 컴포넌트를 마운트합니다.
 *
 * @param {Object} options - 마운트 옵션
 * @returns {Wrapper} Vue Test Utils Wrapper
 */
const mountLogin = (options = {}) => {
  const store = options.store || createMockStore()

  return shallowMount(Login, {
    global: {
      // Vuex Store 주입
      plugins: [store],
      
      // Router Mock 주입
      mocks: {
        $router: mockRouter,
        $route: mockRoute,
        $message: mockMessage
      },
      
      // Element Plus 컴포넌트 스텁
      stubs: {
        'el-card': {
          template: '<div class="el-card"><slot /></div>'
        },
        'el-form': {
          template: '<form class="el-form"><slot /></form>'
        },
        'el-form-item': {
          template: '<div class="el-form-item"><slot /></div>'
        },
        'el-input': {
          template: '<input class="el-input" />',
          props: ['modelValue', 'disabled', 'type', 'placeholder']
        },
        'el-button': {
          template: '<button class="el-button"><slot /></button>',
          props: ['loading', 'disabled', 'type']
        },
        'el-checkbox': {
          template: '<label class="el-checkbox"><input type="checkbox" /><slot /></label>',
          props: ['modelValue', 'disabled']
        },
        'el-link': {
          template: '<a class="el-link"><slot /></a>'
        },
        'el-divider': {
          template: '<div class="el-divider"><slot /></div>'
        },
        'el-tag': {
          template: '<span class="el-tag"><slot /></span>',
          props: ['type']
        }
      }
    },
    ...options
  })
}

// ================================
// 테스트 시작
// ================================

describe('Login.vue', () => {
  // 각 테스트 전에 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Router mock 초기화
    mockRouter.push.mockClear()
    mockRouter.replace.mockClear()
  })

  // ================================
  // 렌더링 테스트
  // ================================

  describe('렌더링', () => {
    it('컴포넌트가 정상적으로 마운트되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.exists()).toBe(true)
    })

    it('로그인 컨테이너가 렌더링되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.login-container').exists()).toBe(true)
    })

    it('로그인 카드가 렌더링되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.login-card').exists()).toBe(true)
    })

    it('KM 업무 포털 제목이 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.text()).toContain('KM 업무 포털')
    })

    it('지식관리 통합 업무 시스템 부제목이 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.text()).toContain('지식관리 통합 업무 시스템')
    })

    it('로그인 폼이 렌더링되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.login-form').exists()).toBe(true)
    })

    it('회원가입 버튼이 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.register-button').exists()).toBe(true)
    })

    it('푸터가 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.login-footer').exists()).toBe(true)
      expect(wrapper.text()).toContain('© 2025 KM Portal Team')
    })
  })

  // ================================
  // 초기 데이터 테스트
  // ================================

  describe('초기 데이터', () => {
    it('loginForm이 빈 값으로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.loginForm.username).toBe('')
      expect(wrapper.vm.loginForm.password).toBe('')
    })

    it('isLoading이 false로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('errorMessage가 빈 문자열로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.errorMessage).toBe('')
    })

    it('rememberMe가 false로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.rememberMe).toBe(false)
    })
  })

  // ================================
  // 폼 유효성 검사 규칙 테스트
  // ================================

  describe('폼 유효성 검사 규칙', () => {
    it('사용자명 필수 입력 규칙이 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()
      const usernameRules = wrapper.vm.loginRules.username

      // Then
      expect(usernameRules).toBeDefined()
      expect(usernameRules.some(rule => rule.required === true)).toBe(true)
    })

    it('사용자명 길이 규칙이 있어야 한다 (2-50자)', () => {
      // Given & When
      const wrapper = mountLogin()
      const usernameRules = wrapper.vm.loginRules.username

      // Then
      const lengthRule = usernameRules.find(rule => rule.min && rule.max)
      expect(lengthRule).toBeDefined()
      expect(lengthRule.min).toBe(2)
      expect(lengthRule.max).toBe(50)
    })

    it('비밀번호 필수 입력 규칙이 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()
      const passwordRules = wrapper.vm.loginRules.password

      // Then
      expect(passwordRules).toBeDefined()
      expect(passwordRules.some(rule => rule.required === true)).toBe(true)
    })

    it('비밀번호 최소 길이 규칙이 있어야 한다 (4자)', () => {
      // Given & When
      const wrapper = mountLogin()
      const passwordRules = wrapper.vm.loginRules.password

      // Then
      const minLengthRule = passwordRules.find(rule => rule.min)
      expect(minLengthRule).toBeDefined()
      expect(minLengthRule.min).toBe(4)
    })
  })

  // ================================
  // 테스트 계정 기능 테스트
  // ================================

  describe('테스트 계정', () => {
    it('testAccounts 배열이 정의되어 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.testAccounts).toBeDefined()
      expect(Array.isArray(wrapper.vm.testAccounts)).toBe(true)
      expect(wrapper.vm.testAccounts.length).toBeGreaterThan(0)
    })

    it('admin 테스트 계정이 포함되어 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()
      const adminAccount = wrapper.vm.testAccounts.find(
        acc => acc.username === 'admin'
      )

      // Then
      expect(adminAccount).toBeDefined()
      expect(adminAccount.password).toBe('admin123')
      expect(adminAccount.type).toBe('danger')
    })

    it('user01 테스트 계정이 포함되어 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()
      const userAccount = wrapper.vm.testAccounts.find(
        acc => acc.username === 'user01'
      )

      // Then
      expect(userAccount).toBeDefined()
      expect(userAccount.password).toBe('user123')
      expect(userAccount.type).toBe('success')
    })

    it('fillTestAccount 메서드가 폼을 채워야 한다', async () => {
      // Given
      const wrapper = mountLogin()
      const testAccount = {
        username: 'testuser',
        password: 'testpass123',
        label: '테스트',
        type: 'info'
      }

      // When
      await wrapper.vm.fillTestAccount(testAccount)

      // Then
      expect(wrapper.vm.loginForm.username).toBe('testuser')
      expect(wrapper.vm.loginForm.password).toBe('testpass123')
    })
  })

  // ================================
  // 개발 모드 판별 테스트
  // ================================

  describe('개발 모드 판별', () => {
    it('isDevelopment computed가 정의되어 있어야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.vm.isDevelopment).toBeDefined()
      expect(typeof wrapper.vm.isDevelopment).toBe('boolean')
    })
  })

  // ================================
  // 로그인 정보 저장/복원 테스트
  // ================================

  describe('로그인 정보 저장', () => {
    it('rememberMe가 true일 때 localStorage에 저장해야 한다', () => {
      // Given
      const wrapper = mountLogin()
      wrapper.vm.rememberMe = true

      // When
      wrapper.vm.saveOrClearCredentials('testuser')

      // Then
      expect(localStorage.getItem('km_portal_remember_me')).toBe('true')
      expect(localStorage.getItem('km_portal_saved_username')).toBe('testuser')
    })

    it('rememberMe가 false일 때 localStorage에서 제거해야 한다', () => {
      // Given
      localStorage.setItem('km_portal_remember_me', 'true')
      localStorage.setItem('km_portal_saved_username', 'olduser')

      const wrapper = mountLogin()
      wrapper.vm.rememberMe = false

      // When
      wrapper.vm.saveOrClearCredentials('newuser')

      // Then
      expect(localStorage.getItem('km_portal_remember_me')).toBeNull()
      expect(localStorage.getItem('km_portal_saved_username')).toBeNull()
    })

    it('loadRememberedCredentials가 저장된 정보를 복원해야 한다', () => {
      // Given
      localStorage.setItem('km_portal_remember_me', 'true')
      localStorage.setItem('km_portal_saved_username', 'saveduser')

      // When
      const wrapper = mountLogin()
      wrapper.vm.loadRememberedCredentials()

      // Then
      expect(wrapper.vm.loginForm.username).toBe('saveduser')
      expect(wrapper.vm.rememberMe).toBe(true)
    })

    it('저장된 정보가 없으면 폼이 비어있어야 한다', () => {
      // Given
      localStorage.clear()

      // When
      const wrapper = mountLogin()
      wrapper.vm.loadRememberedCredentials()

      // Then
      expect(wrapper.vm.loginForm.username).toBe('')
      expect(wrapper.vm.rememberMe).toBe(false)
    })
  })

  // ================================
  // 회원가입 페이지 이동 테스트
  // ================================

  describe('회원가입 페이지 이동', () => {
    it('goToRegister 메서드가 /register로 이동해야 한다', () => {
      // Given
      const wrapper = mountLogin()

      // When
      wrapper.vm.goToRegister()

      // Then
      expect(mockRouter.push).toHaveBeenCalledWith('/register')
    })
  })

  // ================================
  // 에러 메시지 표시 테스트
  // ================================

  describe('에러 메시지 표시', () => {
    it('errorMessage가 있을 때 에러 영역이 표시되어야 한다', async () => {
      // Given
      const wrapper = mountLogin()

      // When
      await wrapper.setData({ errorMessage: '로그인에 실패했습니다.' })

      // Then
      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('로그인에 실패했습니다.')
    })

    it('errorMessage가 없을 때 에러 영역이 숨겨져야 한다', () => {
      // Given & When
      const wrapper = mountLogin()

      // Then
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  // ================================
  // 로딩 상태 테스트
  // ================================

  describe('로딩 상태', () => {
    it('isLoading 상태가 변경되어야 한다', async () => {
      // Given
      const wrapper = mountLogin()
      expect(wrapper.vm.isLoading).toBe(false)

      // When
      await wrapper.setData({ isLoading: true })

      // Then
      expect(wrapper.vm.isLoading).toBe(true)
    })
  })

  // ================================
  // 로그인 처리 테스트
  // ================================

  describe('로그인 처리', () => {
    it('이미 로딩 중이면 handleLogin이 중복 실행되지 않아야 한다', async () => {
      // Given
      const wrapper = mountLogin()
      wrapper.vm.isLoading = true

      // When
      await wrapper.vm.handleLogin()

      // Then - 로딩 중이면 바로 리턴되므로 추가 동작 없음
      expect(wrapper.vm.isLoading).toBe(true)
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
 *    npm run test:unit -- Login.spec.js
 *
 * 3. 감시 모드:
 *    npm run test:unit -- --watch
 *
 * 4. 커버리지 리포트:
 *    npm run test:unit -- --coverage
 *
 * ====== Vue 3 + @vue/test-utils 2.x 변경사항 ======
 *
 * 1. createLocalVue() 제거됨
 *    - global 옵션으로 대체
 *
 * 2. 마운트 옵션 변경:
 *    - mocks → global.mocks
 *    - stubs → global.stubs
 *    - plugins → global.plugins
 *
 * 3. Store 주입 방식:
 *    - global.plugins에 store 추가
 */