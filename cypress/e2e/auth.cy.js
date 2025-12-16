/**
 * 인증(Auth) E2E 테스트
 * 
 * KM 포털의 인증 관련 사용자 시나리오를 테스트합니다.
 * 실제 브라우저에서 사용자 관점의 전체 플로우를 검증합니다.
 * 
 * [테스트 시나리오]
 * 
 * 1. 로그인 페이지 접근 및 UI 확인
 * 2. 로그인 성공/실패 시나리오
 * 3. 회원가입 플로우
 * 4. 로그아웃 플로우
 * 5. 인증 상태 유지 (토큰)
 * 6. 접근 권한 제어
 * 
 * 파일 위치: km-portal-frontend/cypress/e2e/auth.cy.js
 * 
 * 작성일: 2025년 11월 30일 (41일차)
 * 작성자: KM Portal Dev Team
 */

describe('인증(Auth) E2E 테스트', () => {
  
  // ====================================
  // 테스트 전 초기화
  // ====================================
  
  beforeEach(() => {
    // 로컬 스토리지 정리 (이전 세션 제거)
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  // ====================================
  // 로그인 페이지 UI 테스트
  // ====================================
  
  describe('로그인 페이지 UI', () => {
    
    beforeEach(() => {
      // 로그인 페이지로 이동
      cy.visit('/login')
    })

    /**
     * 로그인 페이지 기본 요소 확인
     */
    it('로그인 페이지가 올바르게 렌더링되어야 한다', () => {
      // 페이지 제목 확인
      cy.contains('KM 업무 포털').should('be.visible')
      
      // 로그인 폼 요소 확인
      cy.get('.login-container').should('be.visible')
      cy.get('input[placeholder*="사용자"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    /**
     * 테스트 계정 자동 입력 버튼 확인
     */
    it('테스트 계정 자동 입력 버튼이 있어야 한다', () => {
      // 개발 환경에서만 표시되는 테스트 계정 버튼
      cy.get('[data-testid="test-account-btn"]')
        .should('be.visible')
        .click()

      // 자동 입력 확인
      cy.get('input[placeholder*="사용자"]')
        .should('have.value', 'testuser')
    })

    /**
     * 회원가입 링크 확인
     */
    it('회원가입 페이지로 이동할 수 있어야 한다', () => {
      cy.contains('회원가입')
        .should('be.visible')
        .click()

      cy.url().should('include', '/register')
    })

    /**
     * 로그인 정보 저장 체크박스 확인
     */
    it('로그인 정보 저장 체크박스가 있어야 한다', () => {
      cy.get('[data-testid="remember-me"]')
        .should('exist')
    })
  })

  // ====================================
  // 로그인 성공 시나리오
  // ====================================

  describe('로그인 성공', () => {
    
    /**
     * 올바른 자격증명으로 로그인 성공
     */
    it('올바른 사용자명과 비밀번호로 로그인해야 한다', () => {
      // API 인터셉트 설정
      cy.intercept('POST', '**/api/auth/login').as('loginRequest')

      // 로그인 페이지 이동
      cy.visit('/login')

      // 로그인 정보 입력
      cy.get('input[placeholder*="사용자"]')
        .type('testuser')
      
      cy.get('input[type="password"]')
        .type('password123')

      // 로그인 버튼 클릭
      cy.get('button[type="submit"]').click()

      // API 응답 대기
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response.statusCode).to.eq(200)
        expect(interception.response.body.success).to.be.true
      })

      // 로그인 후 리다이렉션 확인 (대시보드 또는 메인)
      cy.url().should('not.include', '/login')
      
      // 토큰 저장 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.exist
      })

      // 사용자 정보가 표시되는지 확인 (헤더 영역)
      cy.contains('테스트 사용자').should('be.visible')
    })

    /**
     * 로그인 정보 저장 기능 테스트
     */
    it('로그인 정보 저장 체크 시 localStorage에 저장되어야 한다', () => {
      cy.visit('/login')

      // 사용자명 입력
      cy.get('input[placeholder*="사용자"]')
        .type('testuser')

      // 로그인 정보 저장 체크
      cy.get('[data-testid="remember-me"]')
        .check({ force: true })

      // 비밀번호 입력 및 로그인
      cy.get('input[type="password"]')
        .type('password123')
      
      cy.get('button[type="submit"]').click()

      // 로그인 성공 후 localStorage 확인
      cy.window().then((win) => {
        const savedUsername = win.localStorage.getItem('savedUsername')
        expect(savedUsername).to.eq('testuser')
      })
    })

    /**
     * 로그인 후 원래 요청한 페이지로 리다이렉트
     */
    it('보호된 페이지 접근 시 로그인 후 원래 페이지로 이동해야 한다', () => {
      // 보호된 페이지 직접 접근 시도
      cy.visit('/boards')

      // 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/login')

      // 로그인 수행
      cy.get('input[placeholder*="사용자"]').type('testuser')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 원래 요청한 페이지(/boards)로 이동 확인
      cy.url().should('include', '/boards')
    })
  })

  // ====================================
  // 로그인 실패 시나리오
  // ====================================

  describe('로그인 실패', () => {

    beforeEach(() => {
      cy.visit('/login')
    })

    /**
     * 존재하지 않는 사용자명
     */
    it('존재하지 않는 사용자명으로 로그인 시 에러 메시지를 표시해야 한다', () => {
      // API 인터셉트
      cy.intercept('POST', '**/api/auth/login').as('loginRequest')

      // 잘못된 사용자명 입력
      cy.get('input[placeholder*="사용자"]')
        .type('nonexistentuser')
      
      cy.get('input[type="password"]')
        .type('password123')

      cy.get('button[type="submit"]').click()

      // 에러 메시지 확인
      cy.contains('존재하지 않는 사용자').should('be.visible')
      
      // 여전히 로그인 페이지에 있어야 함
      cy.url().should('include', '/login')
    })

    /**
     * 잘못된 비밀번호
     */
    it('잘못된 비밀번호로 로그인 시 에러 메시지를 표시해야 한다', () => {
      cy.get('input[placeholder*="사용자"]')
        .type('testuser')
      
      cy.get('input[type="password"]')
        .type('wrongpassword')

      cy.get('button[type="submit"]').click()

      // 에러 메시지 확인
      cy.contains('비밀번호').should('be.visible')
    })

    /**
     * 빈 필드 제출
     */
    it('필수 필드가 비어있을 때 유효성 에러를 표시해야 한다', () => {
      // 빈 상태로 제출 시도
      cy.get('button[type="submit"]').click()

      // 유효성 에러 메시지 확인
      cy.contains('필수').should('be.visible')
      // 또는 Element Plus 폼 에러 클래스 확인
      cy.get('.el-form-item__error').should('exist')
    })

    /**
     * 비활성화된 계정
     */
    it('비활성화된 계정으로 로그인 시 에러 메시지를 표시해야 한다', () => {
      // 비활성화된 테스트 계정 사용 (미리 설정 필요)
      cy.get('input[placeholder*="사용자"]')
        .type('inactiveuser')
      
      cy.get('input[type="password"]')
        .type('password123')

      cy.get('button[type="submit"]').click()

      // 비활성화 에러 메시지 확인
      cy.contains('비활성화').should('be.visible')
    })

    /**
     * 잠긴 계정
     */
    it('잠긴 계정으로 로그인 시 에러 메시지를 표시해야 한다', () => {
      cy.get('input[placeholder*="사용자"]')
        .type('lockeduser')
      
      cy.get('input[type="password"]')
        .type('password123')

      cy.get('button[type="submit"]').click()

      // 계정 잠금 에러 메시지 확인
      cy.contains('잠금').should('be.visible')
    })
  })

  // ====================================
  // 회원가입 시나리오
  // ====================================

  describe('회원가입', () => {

    beforeEach(() => {
      cy.visit('/register')
    })

    /**
     * 회원가입 페이지 렌더링 확인
     */
    it('회원가입 페이지가 올바르게 렌더링되어야 한다', () => {
      cy.contains('회원가입').should('be.visible')
      
      // 필수 입력 필드 확인
      cy.get('input[placeholder*="사용자"]').should('be.visible')
      cy.get('input[type="password"]').should('have.length.at.least', 1)
      cy.get('input[placeholder*="이메일"]').should('be.visible')
      cy.get('input[placeholder*="이름"]').should('be.visible')
    })

    /**
     * 회원가입 성공
     */
    it('유효한 정보로 회원가입이 성공해야 한다', () => {
      // API 인터셉트
      cy.intercept('POST', '**/api/auth/register').as('registerRequest')

      // 고유한 사용자명 생성 (타임스탬프 사용)
      const timestamp = Date.now()
      const username = `newuser_${timestamp}`
      const email = `newuser_${timestamp}@example.com`

      // 회원가입 폼 입력
      cy.get('input[placeholder*="사용자"]')
        .type(username)
      
      cy.get('input[placeholder*="비밀번호"]')
        .first()
        .type('password123')
      
      cy.get('input[placeholder*="비밀번호 확인"]')
        .type('password123')
      
      cy.get('input[placeholder*="이메일"]')
        .type(email)
      
      cy.get('input[placeholder*="이름"]')
        .type('신규 사용자')
      
      cy.get('input[placeholder*="부서"]')
        .type('개발팀')

      // 회원가입 버튼 클릭
      cy.get('button[type="submit"]').click()

      // API 응답 확인
      cy.wait('@registerRequest').then((interception) => {
        expect(interception.response.statusCode).to.eq(200)
        expect(interception.response.body.success).to.be.true
      })

      // 성공 메시지 또는 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/login')
    })

    /**
     * 중복 사용자명 에러
     */
    it('이미 존재하는 사용자명으로 가입 시 에러를 표시해야 한다', () => {
      cy.get('input[placeholder*="사용자"]')
        .type('testuser')  // 이미 존재하는 사용자명
      
      cy.get('input[placeholder*="비밀번호"]')
        .first()
        .type('password123')
      
      cy.get('input[placeholder*="비밀번호 확인"]')
        .type('password123')
      
      cy.get('input[placeholder*="이메일"]')
        .type('different@example.com')
      
      cy.get('input[placeholder*="이름"]')
        .type('테스트')
      
      cy.get('input[placeholder*="부서"]')
        .type('개발팀')

      cy.get('button[type="submit"]').click()

      // 중복 에러 메시지 확인
      cy.contains('이미 사용 중인 사용자명').should('be.visible')
    })

    /**
     * 비밀번호 확인 불일치
     */
    it('비밀번호 확인이 일치하지 않으면 에러를 표시해야 한다', () => {
      cy.get('input[placeholder*="사용자"]')
        .type('newuser')
      
      cy.get('input[placeholder*="비밀번호"]')
        .first()
        .type('password123')
      
      cy.get('input[placeholder*="비밀번호 확인"]')
        .type('differentPassword')  // 불일치

      // 비밀번호 확인 필드에서 포커스 아웃
      cy.get('input[placeholder*="이메일"]').click()

      // 에러 메시지 확인
      cy.contains('비밀번호가 일치하지 않습니다').should('be.visible')
    })

    /**
     * 이메일 형식 유효성 검사
     */
    it('잘못된 이메일 형식에 대해 에러를 표시해야 한다', () => {
      cy.get('input[placeholder*="이메일"]')
        .type('invalid-email')
        .blur()

      // 이메일 형식 에러 확인
      cy.contains('유효한 이메일').should('be.visible')
    })
  })

  // ====================================
  // 로그아웃 시나리오
  // ====================================

  describe('로그아웃', () => {

    beforeEach(() => {
      // 먼저 로그인
      cy.loginByApi()
      cy.visit('/')
    })

    /**
     * 로그아웃 성공
     */
    it('로그아웃 버튼 클릭 시 로그아웃되어야 한다', () => {
      // 사용자 메뉴 클릭
      cy.get('[data-testid="user-menu"]')
        .should('be.visible')
        .click()

      // 로그아웃 버튼 클릭
      cy.contains('로그아웃').click()

      // 확인 다이얼로그가 있다면 확인
      cy.get('body').then(($body) => {
        if ($body.find('.el-message-box').length > 0) {
          cy.confirmDialog()
        }
      })

      // 로그인 페이지로 리다이렉트 확인
      cy.url().should('include', '/login')

      // 토큰 삭제 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.be.null
      })
    })

    /**
     * 로그아웃 후 보호된 페이지 접근 불가
     */
    it('로그아웃 후 보호된 페이지에 접근할 수 없어야 한다', () => {
      // 로그아웃
      cy.logout()

      // 보호된 페이지 접근 시도
      cy.visit('/boards')

      // 로그인 페이지로 리다이렉트
      cy.url().should('include', '/login')
    })
  })

  // ====================================
  // 인증 상태 유지 테스트
  // ====================================

  describe('인증 상태 유지', () => {

    /**
     * 페이지 새로고침 후 로그인 상태 유지
     */
    it('페이지 새로고침 후에도 로그인 상태가 유지되어야 한다', () => {
      // 로그인
      cy.loginByApi()
      cy.visit('/')

      // 로그인 상태 확인
      cy.contains('테스트 사용자').should('be.visible')

      // 페이지 새로고침
      cy.reload()

      // 여전히 로그인 상태인지 확인
      cy.contains('테스트 사용자').should('be.visible')
      cy.url().should('not.include', '/login')
    })

    /**
     * 토큰 만료 시 자동 로그아웃
     */
    it('토큰이 만료되면 로그인 페이지로 리다이렉트되어야 한다', () => {
      // 만료된 토큰으로 설정
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'expired-token')
      })

      // API 호출 시 401 응답 모킹
      cy.intercept('GET', '**/api/**', {
        statusCode: 401,
        body: { message: 'Token expired' }
      })

      // 페이지 이동
      cy.visit('/boards')

      // 로그인 페이지로 리다이렉트
      cy.url().should('include', '/login')
    })
  })

  // ====================================
  // 권한별 접근 제어 테스트
  // ====================================

  describe('권한별 접근 제어', () => {

    /**
     * 일반 사용자의 관리자 페이지 접근 불가
     */
    it('일반 사용자는 관리자 페이지에 접근할 수 없어야 한다', () => {
      // 일반 사용자로 로그인
      cy.loginByApi()

      // 관리자 페이지 접근 시도
      cy.visit('/admin')

      // 접근 거부 또는 리다이렉트 확인
      cy.url().should('not.include', '/admin')
      // 또는 403 페이지 표시
      // cy.contains('접근 권한이 없습니다').should('be.visible')
    })

    /**
     * 관리자의 관리자 페이지 접근 가능
     */
    it('관리자는 관리자 페이지에 접근할 수 있어야 한다', () => {
      // 관리자로 로그인
      cy.loginAsAdmin()

      // 관리자 페이지 접근
      cy.visit('/admin')

      // 정상 접근 확인
      cy.url().should('include', '/admin')
      cy.contains('관리자').should('be.visible')
    })
  })
})

/*
 * ====== 인증 E2E 테스트 가이드 ======
 *
 * 1. 테스트 실행:
 *
 *    # 대화형 모드
 *    npx cypress open
 *
 *    # 헤드리스 모드 (auth 테스트만)
 *    npx cypress run --spec "cypress/e2e/auth.cy.js"
 *
 * 2. 테스트 전 요구사항:
 *
 *    - 프론트엔드 서버 실행 (npm run serve)
 *    - 백엔드 서버 실행
 *    - 테스트 계정 존재 (testuser/password123)
 *
 * 3. 테스트 데이터:
 *
 *    cypress/fixtures/users.json에 테스트 사용자 정보 정의 가능
 *
 * 4. 디버깅:
 *
 *    - cy.pause(): 테스트 일시 정지
 *    - cy.debug(): 디버거 실행
 *    - .screenshot(): 스크린샷 촬영
 *
 * 작성일: 2025년 11월 30일 (41일차)
 */