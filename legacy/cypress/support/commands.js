/**
 * Cypress 커스텀 명령어 정의
 * 
 * 자주 사용되는 작업을 재사용 가능한 명령어로 정의합니다.
 * cy.commandName() 형태로 테스트에서 사용할 수 있습니다.
 * 
 * [정의된 명령어]
 * - cy.login(username, password): 로그인 수행
 * - cy.logout(): 로그아웃 수행
 * - cy.loginByApi(username, password): API로 직접 로그인
 * - cy.createBoard(boardData): 게시글 생성
 * - cy.waitForApi(alias): API 응답 대기
 * - cy.getByTestId(testId): data-testid로 요소 선택
 * 
 * 파일 위치: km-portal-frontend/cypress/support/commands.js
 * 
 * 작성일: 2025년 11월 30일 (41일차)
 * 작성자: KM Portal Dev Team
 */

// ====================================
// 인증 관련 명령어
// ====================================

/**
 * UI를 통한 로그인
 * 
 * 실제 로그인 페이지를 통해 로그인을 수행합니다.
 * 전체 로그인 플로우를 테스트할 때 사용합니다.
 * 
 * @param {string} username - 사용자명
 * @param {string} password - 비밀번호
 * 
 * @example
 * cy.login('testuser', 'password123')
 */
Cypress.Commands.add('login', (username, password) => {
  // 기본값 설정 (환경 변수에서 가져오기)
  const user = username || Cypress.env('testUser').username
  const pass = password || Cypress.env('testUser').password

  cy.log(`🔐 로그인 시도: ${user}`)

  // 로그인 페이지로 이동
  cy.visit('/login')

  // 로그인 폼이 로드될 때까지 대기
  cy.get('.login-container', { timeout: 10000 }).should('be.visible')

  // 사용자명 입력
  // Element Plus의 el-input 컴포넌트 내부 input 요소 선택
  cy.get('input[placeholder*="사용자"]')
    .should('be.visible')
    .clear()
    .type(user)

  // 비밀번호 입력
  cy.get('input[type="password"]')
    .should('be.visible')
    .clear()
    .type(pass)

  // 로그인 버튼 클릭
  cy.get('button[type="submit"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click()

  // 로그인 성공 확인 (대시보드 또는 메인 페이지로 이동)
  cy.url().should('not.include', '/login')
  
  // 토큰이 저장되었는지 확인
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken') || 
                  win.sessionStorage.getItem('accessToken')
    expect(token).to.exist
  })

  cy.log('✅ 로그인 성공')
})

/**
 * API를 통한 직접 로그인 (빠른 로그인)
 * 
 * UI를 거치지 않고 API로 직접 로그인합니다.
 * 로그인 자체가 테스트 대상이 아닐 때 사용하여 테스트 속도를 높입니다.
 * 
 * @param {string} username - 사용자명
 * @param {string} password - 비밀번호
 * 
 * @example
 * cy.loginByApi('testuser', 'password123')
 */
Cypress.Commands.add('loginByApi', (username, password) => {
  const user = username || Cypress.env('testUser').username
  const pass = password || Cypress.env('testUser').password
  const apiUrl = Cypress.env('apiUrl')

  cy.log(`🔐 API 로그인: ${user}`)

  cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/login`,
    body: {
      username: user,
      password: pass
    },
    failOnStatusCode: false
  }).then((response) => {
    // 로그인 성공 확인
    expect(response.status).to.eq(200)
    expect(response.body.success).to.be.true

    // 토큰 저장
    const { accessToken, refreshToken, userInfo } = response.body

    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', accessToken)
      win.localStorage.setItem('refreshToken', refreshToken)
      win.localStorage.setItem('user', JSON.stringify(userInfo))
    })

    cy.log('✅ API 로그인 성공')
  })
})

/**
 * 관리자로 로그인
 * 
 * 관리자 계정으로 로그인합니다.
 * 관리자 권한이 필요한 기능 테스트 시 사용합니다.
 * 
 * @example
 * cy.loginAsAdmin()
 */
Cypress.Commands.add('loginAsAdmin', () => {
  const adminUser = Cypress.env('adminUser')
  cy.loginByApi(adminUser.username, adminUser.password)
})

/**
 * 로그아웃
 * 
 * 현재 로그인된 사용자를 로그아웃합니다.
 * 
 * @example
 * cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.log('🚪 로그아웃')

  // 로컬 스토리지 정리
  cy.window().then((win) => {
    win.localStorage.removeItem('accessToken')
    win.localStorage.removeItem('refreshToken')
    win.localStorage.removeItem('user')
  })

  // 로그인 페이지로 이동
  cy.visit('/login')

  cy.log('✅ 로그아웃 완료')
})

/**
 * 현재 로그인 상태 확인
 * 
 * @returns {Cypress.Chainable<boolean>} 로그인 여부
 * 
 * @example
 * cy.isLoggedIn().then(isLoggedIn => {
 *   if (!isLoggedIn) cy.login()
 * })
 */
Cypress.Commands.add('isLoggedIn', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken')
    return !!token
  })
})

// ====================================
// 게시판 관련 명령어
// ====================================

/**
 * 게시글 생성 (API)
 * 
 * API를 통해 게시글을 직접 생성합니다.
 * 테스트 데이터 설정 시 사용합니다.
 * 
 * @param {Object} boardData - 게시글 데이터
 * @param {string} boardData.title - 제목
 * @param {string} boardData.content - 내용
 * @param {string} boardData.category - 카테고리
 * 
 * @example
 * cy.createBoard({ title: '테스트', content: '내용', category: '공지사항' })
 */
Cypress.Commands.add('createBoard', (boardData) => {
  const apiUrl = Cypress.env('apiUrl')

  cy.log(`📝 게시글 생성: ${boardData.title}`)

  // 토큰 가져오기
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken')

    cy.request({
      method: 'POST',
      url: `${apiUrl}/boards`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: boardData
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201])
      cy.log(`✅ 게시글 생성 완료: ID ${response.body.boardId}`)
      return response.body
    })
  })
})

/**
 * 게시글 삭제 (API)
 * 
 * @param {number} boardId - 삭제할 게시글 ID
 * 
 * @example
 * cy.deleteBoard(123)
 */
Cypress.Commands.add('deleteBoard', (boardId) => {
  const apiUrl = Cypress.env('apiUrl')

  cy.log(`🗑️ 게시글 삭제: ID ${boardId}`)

  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken')

    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/boards/${boardId}`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      failOnStatusCode: false
    })
  })
})

// ====================================
// 유틸리티 명령어
// ====================================

/**
 * data-testid 속성으로 요소 선택
 * 
 * 테스트 전용 속성을 사용하여 요소를 선택합니다.
 * CSS 클래스나 구조 변경에 영향받지 않는 안정적인 선택자입니다.
 * 
 * @param {string} testId - data-testid 값
 * 
 * @example
 * // HTML: <button data-testid="submit-btn">제출</button>
 * cy.getByTestId('submit-btn').click()
 */
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`)
})

/**
 * data-cy 속성으로 요소 선택 (별칭)
 * 
 * @param {string} selector - data-cy 값
 * 
 * @example
 * cy.getBySel('login-form')
 */
Cypress.Commands.add('getBySel', (selector) => {
  return cy.get(`[data-cy="${selector}"]`)
})

/**
 * API 응답 대기
 * 
 * 인터셉트한 API 요청의 응답을 대기합니다.
 * 
 * @param {string} alias - 인터셉트 별칭 (@로 시작)
 * 
 * @example
 * cy.intercept('GET', '/api/boards').as('getBoards')
 * cy.visit('/boards')
 * cy.waitForApi('@getBoards')
 */
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(alias).its('response.statusCode').should('be.oneOf', [200, 201])
})

/**
 * Element Plus 알림(Notification) 확인
 * 
 * Element Plus의 ElNotification 컴포넌트 메시지를 확인합니다.
 * 
 * @param {string} message - 확인할 메시지 (부분 일치)
 * @param {string} type - 알림 타입 (success, error, warning, info)
 * 
 * @example
 * cy.checkNotification('저장되었습니다', 'success')
 */
Cypress.Commands.add('checkNotification', (message, type = 'success') => {
  cy.get('.el-notification')
    .should('be.visible')
    .and('contain', message)

  if (type) {
    cy.get(`.el-notification.el-notification--${type}`)
      .should('exist')
  }
})

/**
 * Element Plus 메시지박스(MessageBox) 확인 버튼 클릭
 * 
 * 확인 다이얼로그의 확인 버튼을 클릭합니다.
 * 
 * @example
 * cy.confirmDialog()
 */
Cypress.Commands.add('confirmDialog', () => {
  cy.get('.el-message-box__btns')
    .find('button')
    .contains('확인')
    .click()
})

/**
 * Element Plus 메시지박스 취소 버튼 클릭
 * 
 * @example
 * cy.cancelDialog()
 */
Cypress.Commands.add('cancelDialog', () => {
  cy.get('.el-message-box__btns')
    .find('button')
    .contains('취소')
    .click()
})

/**
 * 로딩 완료 대기
 * 
 * 페이지의 로딩 인디케이터가 사라질 때까지 대기합니다.
 * 
 * @example
 * cy.waitForLoading()
 */
Cypress.Commands.add('waitForLoading', () => {
  // Element Plus Loading 컴포넌트
  cy.get('.el-loading-mask', { timeout: 1000 })
    .should('not.exist')

  // 또는 커스텀 로딩 컴포넌트
  cy.get('[data-loading="true"]', { timeout: 1000 })
    .should('not.exist')
})

/**
 * 스크롤하여 요소 보이게 하기
 * 
 * @param {string} selector - CSS 선택자
 * 
 * @example
 * cy.scrollToElement('.footer')
 */
Cypress.Commands.add('scrollToElement', (selector) => {
  cy.get(selector).scrollIntoView({ duration: 500 })
})

/**
 * 클립보드에 텍스트 복사
 * 
 * @param {string} text - 복사할 텍스트
 * 
 * @example
 * cy.copyToClipboard('복사할 텍스트')
 */
Cypress.Commands.add('copyToClipboard', (text) => {
  cy.window().then((win) => {
    win.navigator.clipboard.writeText(text)
  })
})

/**
 * 파일 업로드
 * 
 * 파일 입력 요소에 파일을 첨부합니다.
 * 
 * @param {string} selector - 파일 입력 선택자
 * @param {string} fileName - fixtures 폴더 내 파일명
 * 
 * @example
 * cy.uploadFile('input[type="file"]', 'test-document.pdf')
 */
Cypress.Commands.add('uploadFile', (selector, fileName) => {
  cy.get(selector).selectFile(`cypress/fixtures/${fileName}`, { force: true })
})

// ====================================
// 디버깅 명령어
// ====================================

/**
 * 현재 상태 스냅샷 출력 (디버깅용)
 * 
 * @example
 * cy.debugState()
 */
Cypress.Commands.add('debugState', () => {
  cy.window().then((win) => {
    console.log('=== Debug State ===')
    console.log('URL:', win.location.href)
    console.log('LocalStorage:', { ...win.localStorage })
    console.log('SessionStorage:', { ...win.sessionStorage })
    console.log('==================')
  })
})

// ====================================
// 콘솔 로그
// ====================================

console.log('📦 KM 포털 커스텀 명령어가 로드되었습니다.')

/*
 * ====== 커스텀 명령어 사용 가이드 ======
 *
 * 1. 인증 관련:
 *    cy.login()           - UI를 통한 로그인
 *    cy.loginByApi()      - API를 통한 빠른 로그인
 *    cy.loginAsAdmin()    - 관리자 로그인
 *    cy.logout()          - 로그아웃
 *
 * 2. 게시판 관련:
 *    cy.createBoard({})   - 게시글 생성
 *    cy.deleteBoard(id)   - 게시글 삭제
 *
 * 3. 유틸리티:
 *    cy.getByTestId()     - data-testid로 선택
 *    cy.waitForApi()      - API 응답 대기
 *    cy.checkNotification() - 알림 확인
 *    cy.waitForLoading()  - 로딩 완료 대기
 *
 * 4. 디버깅:
 *    cy.debugState()      - 현재 상태 출력
 *
 * 작성일: 2025년 11월 30일 (41일차)
 */