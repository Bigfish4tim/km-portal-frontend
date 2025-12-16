/**
 * 게시판(Board) E2E 테스트
 * 
 * KM 포털의 게시판 관련 사용자 시나리오를 테스트합니다.
 * 게시글 CRUD, 검색, 댓글 등 전체 사용자 플로우를 검증합니다.
 * 
 * [테스트 시나리오]
 * 
 * 1. 게시글 목록 조회 및 페이징
 * 2. 게시글 상세 조회
 * 3. 게시글 작성
 * 4. 게시글 수정/삭제
 * 5. 게시글 검색
 * 6. 댓글 작성/수정/삭제
 * 7. 권한별 동작 확인
 * 
 * 파일 위치: km-portal-frontend/cypress/e2e/board.cy.js
 * 
 * 작성일: 2025년 11월 30일 (41일차)
 * 작성자: KM Portal Dev Team
 */

describe('게시판(Board) E2E 테스트', () => {

  // ====================================
  // 테스트 전 초기화
  // ====================================

  beforeEach(() => {
    // 로그인 상태로 시작
    cy.loginByApi()
  })

  // ====================================
  // 게시글 목록 테스트
  // ====================================

  describe('게시글 목록 조회', () => {

    beforeEach(() => {
      // API 인터셉트
      cy.intercept('GET', '**/api/boards*').as('getBoardList')
      
      // 게시판 페이지로 이동
      cy.visit('/boards')
      cy.wait('@getBoardList')
    })

    /**
     * 게시글 목록 페이지 렌더링 확인
     */
    it('게시글 목록이 올바르게 표시되어야 한다', () => {
      // 페이지 제목 확인
      cy.contains('게시판').should('be.visible')

      // 테이블 또는 목록 컴포넌트 확인
      cy.get('[data-testid="board-list"]').should('be.visible')

      // 게시글 작성 버튼 확인
      cy.contains('글쓰기').should('be.visible')
    })

    /**
     * 게시글 항목 표시 확인
     */
    it('각 게시글에 제목, 작성자, 날짜가 표시되어야 한다', () => {
      // 게시글 항목이 있다면 확인
      cy.get('[data-testid="board-item"]').first().within(() => {
        cy.get('[data-testid="board-title"]').should('exist')
        cy.get('[data-testid="board-author"]').should('exist')
        cy.get('[data-testid="board-date"]').should('exist')
      })
    })

    /**
     * 페이징 동작 확인
     */
    it('페이징이 올바르게 동작해야 한다', () => {
      // 페이지네이션 컴포넌트 확인
      cy.get('.el-pagination').should('be.visible')

      // 다음 페이지 버튼 클릭
      cy.get('.el-pagination .btn-next')
        .should('be.visible')
        .click()

      // API 호출 확인
      cy.wait('@getBoardList').then((interception) => {
        expect(interception.request.url).to.include('page=1')
      })

      // URL에 페이지 파라미터 반영 확인
      cy.url().should('include', 'page=2')
    })

    /**
     * 정렬 기능 확인
     */
    it('정렬 옵션을 변경할 수 있어야 한다', () => {
      // 정렬 선택 컴포넌트
      cy.get('[data-testid="sort-select"]')
        .should('be.visible')
        .click()

      // 정렬 옵션 선택 (최신순, 조회순 등)
      cy.contains('조회순').click()

      // API 호출 확인
      cy.wait('@getBoardList').then((interception) => {
        expect(interception.request.url).to.include('sort=viewCount')
      })
    })

    /**
     * 카테고리 필터 확인
     */
    it('카테고리별로 필터링할 수 있어야 한다', () => {
      // 카테고리 탭 또는 필터
      cy.get('[data-testid="category-tabs"]')
        .should('be.visible')

      // 특정 카테고리 선택
      cy.contains('공지사항').click()

      // API 호출 확인
      cy.wait('@getBoardList').then((interception) => {
        expect(interception.request.url).to.include('category=공지사항')
      })
    })

    /**
     * 빈 목록 표시 확인
     */
    it('게시글이 없으면 안내 메시지를 표시해야 한다', () => {
      // 빈 결과 모킹
      cy.intercept('GET', '**/api/boards*', {
        statusCode: 200,
        body: {
          content: [],
          totalElements: 0,
          totalPages: 0
        }
      }).as('emptyList')

      cy.visit('/boards')
      cy.wait('@emptyList')

      // 빈 상태 메시지 확인
      cy.contains('게시글이 없습니다').should('be.visible')
    })
  })

  // ====================================
  // 게시글 상세 조회 테스트
  // ====================================

  describe('게시글 상세 조회', () => {

    let testBoardId

    beforeEach(() => {
      // 테스트용 게시글 생성
      cy.createBoard({
        title: 'E2E 테스트 게시글',
        content: '테스트 내용입니다.',
        category: '자유게시판'
      }).then((board) => {
        testBoardId = board.boardId
      })
    })

    /**
     * 게시글 상세 페이지 표시
     */
    it('게시글 클릭 시 상세 페이지로 이동해야 한다', () => {
      // API 인터셉트
      cy.intercept('GET', '**/api/boards/*').as('getBoardDetail')

      // 게시글 목록으로 이동
      cy.visit('/boards')

      // 게시글 클릭
      cy.contains('E2E 테스트 게시글').click()

      // 상세 페이지로 이동 확인
      cy.url().should('include', '/boards/')
      cy.wait('@getBoardDetail')

      // 상세 내용 표시 확인
      cy.contains('E2E 테스트 게시글').should('be.visible')
      cy.contains('테스트 내용입니다.').should('be.visible')
    })

    /**
     * 게시글 상세 정보 표시
     */
    it('게시글 상세 정보가 올바르게 표시되어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 제목
      cy.get('[data-testid="board-title"]')
        .should('contain', 'E2E 테스트 게시글')

      // 내용
      cy.get('[data-testid="board-content"]')
        .should('contain', '테스트 내용입니다.')

      // 카테고리
      cy.get('[data-testid="board-category"]')
        .should('contain', '자유게시판')

      // 작성자
      cy.get('[data-testid="board-author"]')
        .should('exist')

      // 작성일
      cy.get('[data-testid="board-date"]')
        .should('exist')

      // 조회수
      cy.get('[data-testid="board-view-count"]')
        .should('exist')
    })

    /**
     * 목록으로 돌아가기
     */
    it('목록 버튼 클릭 시 목록 페이지로 이동해야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 목록 버튼 클릭
      cy.contains('목록').click()

      // 목록 페이지 확인
      cy.url().should('match', /\/boards\/?$/)
    })

    /**
     * 존재하지 않는 게시글
     */
    it('존재하지 않는 게시글 접근 시 에러 페이지를 표시해야 한다', () => {
      cy.intercept('GET', '**/api/boards/99999', {
        statusCode: 404,
        body: { message: '게시글을 찾을 수 없습니다.' }
      })

      cy.visit('/boards/99999')

      // 404 또는 에러 메시지 확인
      cy.contains('찾을 수 없습니다').should('be.visible')
    })
  })

  // ====================================
  // 게시글 작성 테스트
  // ====================================

  describe('게시글 작성', () => {

    beforeEach(() => {
      cy.intercept('POST', '**/api/boards').as('createBoard')
    })

    /**
     * 게시글 작성 페이지 이동
     */
    it('글쓰기 버튼 클릭 시 작성 페이지로 이동해야 한다', () => {
      cy.visit('/boards')

      cy.contains('글쓰기').click()

      cy.url().should('include', '/boards/create')
    })

    /**
     * 게시글 작성 폼 확인
     */
    it('게시글 작성 폼이 올바르게 표시되어야 한다', () => {
      cy.visit('/boards/create')

      // 제목 입력 필드
      cy.get('input[placeholder*="제목"]').should('be.visible')

      // 카테고리 선택
      cy.get('[data-testid="category-select"]').should('be.visible')

      // 내용 에디터
      cy.get('[data-testid="content-editor"]').should('be.visible')

      // 등록 버튼
      cy.contains('등록').should('be.visible')

      // 취소 버튼
      cy.contains('취소').should('be.visible')
    })

    /**
     * 게시글 작성 성공
     */
    it('유효한 내용으로 게시글을 작성할 수 있어야 한다', () => {
      cy.visit('/boards/create')

      // 제목 입력
      cy.get('input[placeholder*="제목"]')
        .type('새로운 게시글 제목')

      // 카테고리 선택
      cy.get('[data-testid="category-select"]').click()
      cy.contains('자유게시판').click()

      // 내용 입력 (에디터에 따라 다름)
      cy.get('[data-testid="content-editor"]')
        .find('[contenteditable="true"]')
        .type('게시글 내용입니다. E2E 테스트 중입니다.')

      // 등록 버튼 클릭
      cy.contains('등록').click()

      // API 응답 확인
      cy.wait('@createBoard').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201])
      })

      // 성공 알림 확인
      cy.checkNotification('등록되었습니다', 'success')

      // 상세 페이지 또는 목록으로 이동
      cy.url().should('match', /\/boards\/\d+|\/boards\/?$/)
    })

    /**
     * 필수 필드 유효성 검사
     */
    it('제목 없이 등록 시 에러를 표시해야 한다', () => {
      cy.visit('/boards/create')

      // 내용만 입력
      cy.get('[data-testid="content-editor"]')
        .find('[contenteditable="true"]')
        .type('내용만 입력')

      // 등록 시도
      cy.contains('등록').click()

      // 유효성 에러 확인
      cy.contains('제목').should('be.visible')
      cy.get('.el-form-item__error').should('exist')
    })

    /**
     * 내용 없이 등록 시 에러
     */
    it('내용 없이 등록 시 에러를 표시해야 한다', () => {
      cy.visit('/boards/create')

      // 제목만 입력
      cy.get('input[placeholder*="제목"]')
        .type('제목만 입력')

      // 등록 시도
      cy.contains('등록').click()

      // 유효성 에러 확인
      cy.contains('내용').should('be.visible')
    })

    /**
     * 취소 버튼 동작
     */
    it('취소 버튼 클릭 시 목록으로 돌아가야 한다', () => {
      cy.visit('/boards/create')

      // 내용 입력
      cy.get('input[placeholder*="제목"]').type('임시 제목')

      // 취소 버튼 클릭
      cy.contains('취소').click()

      // 확인 다이얼로그가 있다면 확인
      cy.get('body').then(($body) => {
        if ($body.find('.el-message-box').length > 0) {
          cy.confirmDialog()
        }
      })

      // 목록 페이지로 이동
      cy.url().should('match', /\/boards\/?$/)
    })

    /**
     * 비로그인 사용자 접근 제한
     */
    it('비로그인 사용자는 작성 페이지에 접근할 수 없어야 한다', () => {
      // 로그아웃
      cy.logout()

      // 작성 페이지 직접 접근 시도
      cy.visit('/boards/create')

      // 로그인 페이지로 리다이렉트
      cy.url().should('include', '/login')
    })
  })

  // ====================================
  // 게시글 수정 테스트
  // ====================================

  describe('게시글 수정', () => {

    let testBoardId

    beforeEach(() => {
      // 테스트용 게시글 생성
      cy.createBoard({
        title: '수정 테스트 게시글',
        content: '원본 내용입니다.',
        category: '자유게시판'
      }).then((board) => {
        testBoardId = board.boardId
      })

      cy.intercept('PUT', '**/api/boards/*').as('updateBoard')
    })

    /**
     * 수정 페이지 이동
     */
    it('수정 버튼 클릭 시 수정 페이지로 이동해야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 수정 버튼 클릭
      cy.get('[data-testid="edit-btn"]').click()

      // 수정 페이지 확인
      cy.url().should('include', `/boards/${testBoardId}/edit`)
    })

    /**
     * 기존 내용 표시
     */
    it('수정 페이지에 기존 내용이 표시되어야 한다', () => {
      cy.visit(`/boards/${testBoardId}/edit`)

      // 기존 제목 확인
      cy.get('input[placeholder*="제목"]')
        .should('have.value', '수정 테스트 게시글')

      // 기존 내용 확인
      cy.get('[data-testid="content-editor"]')
        .should('contain', '원본 내용입니다.')
    })

    /**
     * 게시글 수정 성공
     */
    it('게시글을 수정할 수 있어야 한다', () => {
      cy.visit(`/boards/${testBoardId}/edit`)

      // 제목 수정
      cy.get('input[placeholder*="제목"]')
        .clear()
        .type('수정된 제목')

      // 내용 수정
      cy.get('[data-testid="content-editor"]')
        .find('[contenteditable="true"]')
        .clear()
        .type('수정된 내용입니다.')

      // 저장 버튼 클릭
      cy.contains('저장').click()

      // API 응답 확인
      cy.wait('@updateBoard').then((interception) => {
        expect(interception.response.statusCode).to.eq(200)
      })

      // 성공 알림
      cy.checkNotification('수정되었습니다', 'success')

      // 상세 페이지로 이동
      cy.url().should('include', `/boards/${testBoardId}`)
      cy.contains('수정된 제목').should('be.visible')
    })

    /**
     * 다른 사용자의 게시글 수정 불가
     */
    it('다른 사용자의 게시글은 수정할 수 없어야 한다', () => {
      // 다른 사용자로 로그인 (otheruser가 있다고 가정)
      cy.logout()
      cy.loginByApi('otheruser', 'password123')

      // 수정 페이지 직접 접근
      cy.visit(`/boards/${testBoardId}/edit`)

      // 접근 거부 또는 수정 버튼 없음
      cy.url().should('not.include', '/edit')
      // 또는
      // cy.contains('권한이 없습니다').should('be.visible')
    })
  })

  // ====================================
  // 게시글 삭제 테스트
  // ====================================

  describe('게시글 삭제', () => {

    let testBoardId

    beforeEach(() => {
      cy.createBoard({
        title: '삭제 테스트 게시글',
        content: '삭제될 내용입니다.',
        category: '자유게시판'
      }).then((board) => {
        testBoardId = board.boardId
      })

      cy.intercept('DELETE', '**/api/boards/*').as('deleteBoard')
    })

    /**
     * 게시글 삭제 성공
     */
    it('삭제 버튼 클릭 시 게시글이 삭제되어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 삭제 버튼 클릭
      cy.get('[data-testid="delete-btn"]').click()

      // 확인 다이얼로그에서 확인
      cy.confirmDialog()

      // API 응답 확인
      cy.wait('@deleteBoard').then((interception) => {
        expect(interception.response.statusCode).to.eq(200)
      })

      // 성공 알림
      cy.checkNotification('삭제되었습니다', 'success')

      // 목록 페이지로 이동
      cy.url().should('match', /\/boards\/?$/)

      // 삭제된 게시글이 목록에 없는지 확인
      cy.contains('삭제 테스트 게시글').should('not.exist')
    })

    /**
     * 삭제 취소
     */
    it('삭제 확인 다이얼로그에서 취소할 수 있어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 삭제 버튼 클릭
      cy.get('[data-testid="delete-btn"]').click()

      // 취소 버튼 클릭
      cy.cancelDialog()

      // 여전히 상세 페이지에 있어야 함
      cy.url().should('include', `/boards/${testBoardId}`)
    })
  })

  // ====================================
  // 게시글 검색 테스트
  // ====================================

  describe('게시글 검색', () => {

    beforeEach(() => {
      // 검색용 테스트 데이터 생성
      cy.createBoard({ title: 'Spring Boot 가이드', content: 'Spring 관련 내용', category: '기술문서' })
      cy.createBoard({ title: 'Vue.js 튜토리얼', content: 'Vue 관련 내용', category: '기술문서' })
      cy.createBoard({ title: '일반 공지사항', content: '공지 내용', category: '공지사항' })

      cy.intercept('GET', '**/api/boards/search*').as('searchBoards')
    })

    /**
     * 키워드 검색
     */
    it('키워드로 게시글을 검색할 수 있어야 한다', () => {
      cy.visit('/boards')

      // 검색어 입력
      cy.get('[data-testid="search-input"]')
        .type('Spring')

      // 검색 버튼 클릭 또는 Enter
      cy.get('[data-testid="search-input"]').type('{enter}')

      // API 호출 확인
      cy.wait('@searchBoards').then((interception) => {
        expect(interception.request.url).to.include('keyword=Spring')
      })

      // 검색 결과에 'Spring' 포함된 게시글만 표시
      cy.contains('Spring Boot 가이드').should('be.visible')
      cy.contains('Vue.js 튜토리얼').should('not.exist')
    })

    /**
     * 검색 결과 없음
     */
    it('검색 결과가 없으면 안내 메시지를 표시해야 한다', () => {
      cy.visit('/boards')

      cy.get('[data-testid="search-input"]')
        .type('존재하지않는검색어xyz')
        .type('{enter}')

      cy.wait('@searchBoards')

      cy.contains('검색 결과가 없습니다').should('be.visible')
    })

    /**
     * 검색어 초기화
     */
    it('검색어를 초기화할 수 있어야 한다', () => {
      cy.visit('/boards')

      // 검색
      cy.get('[data-testid="search-input"]')
        .type('Spring')
        .type('{enter}')

      cy.wait('@searchBoards')

      // 검색어 초기화 버튼 클릭
      cy.get('[data-testid="search-clear"]').click()

      // 전체 목록 표시
      cy.contains('Vue.js 튜토리얼').should('be.visible')
    })
  })

  // ====================================
  // 댓글 테스트
  // ====================================

  describe('댓글 기능', () => {

    let testBoardId

    beforeEach(() => {
      cy.createBoard({
        title: '댓글 테스트 게시글',
        content: '댓글 테스트용 게시글입니다.',
        category: '자유게시판'
      }).then((board) => {
        testBoardId = board.boardId
      })

      cy.intercept('POST', '**/api/boards/*/comments').as('createComment')
      cy.intercept('DELETE', '**/api/boards/*/comments/*').as('deleteComment')
    })

    /**
     * 댓글 작성
     */
    it('댓글을 작성할 수 있어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 댓글 입력
      cy.get('[data-testid="comment-input"]')
        .type('테스트 댓글입니다.')

      // 댓글 등록 버튼 클릭
      cy.get('[data-testid="comment-submit"]').click()

      // API 응답 확인
      cy.wait('@createComment').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201])
      })

      // 댓글이 표시되는지 확인
      cy.contains('테스트 댓글입니다.').should('be.visible')
    })

    /**
     * 빈 댓글 작성 불가
     */
    it('빈 댓글은 작성할 수 없어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 빈 상태로 등록 시도
      cy.get('[data-testid="comment-submit"]').click()

      // 에러 메시지 또는 버튼 비활성화
      cy.get('[data-testid="comment-submit"]')
        .should('be.disabled')
    })

    /**
     * 댓글 삭제
     */
    it('본인의 댓글을 삭제할 수 있어야 한다', () => {
      cy.visit(`/boards/${testBoardId}`)

      // 먼저 댓글 작성
      cy.get('[data-testid="comment-input"]').type('삭제될 댓글')
      cy.get('[data-testid="comment-submit"]').click()
      cy.wait('@createComment')

      // 삭제 버튼 클릭
      cy.get('[data-testid="comment-delete"]').first().click()

      // 확인 다이얼로그
      cy.confirmDialog()

      // API 응답 확인
      cy.wait('@deleteComment')

      // 댓글이 삭제되었는지 확인
      cy.contains('삭제될 댓글').should('not.exist')
    })

    /**
     * 비로그인 사용자 댓글 불가
     */
    it('비로그인 사용자는 댓글을 작성할 수 없어야 한다', () => {
      cy.logout()
      cy.visit(`/boards/${testBoardId}`)

      // 댓글 입력 영역이 없거나 로그인 안내 표시
      cy.get('[data-testid="comment-input"]').should('not.exist')
      // 또는
      cy.contains('로그인이 필요합니다').should('be.visible')
    })
  })

  // ====================================
  // 관리자 기능 테스트
  // ====================================

  describe('관리자 기능', () => {

    let testBoardId

    beforeEach(() => {
      // 일반 사용자로 게시글 생성
      cy.createBoard({
        title: '관리자 테스트 게시글',
        content: '관리자 기능 테스트용',
        category: '자유게시판'
      }).then((board) => {
        testBoardId = board.boardId
      })
    })

    /**
     * 관리자의 타인 게시글 삭제
     */
    it('관리자는 다른 사용자의 게시글을 삭제할 수 있어야 한다', () => {
      // 관리자로 로그인
      cy.logout()
      cy.loginAsAdmin()

      cy.intercept('DELETE', '**/api/boards/*').as('deleteBoard')

      cy.visit(`/boards/${testBoardId}`)

      // 삭제 버튼이 표시되어야 함
      cy.get('[data-testid="delete-btn"]')
        .should('be.visible')
        .click()

      cy.confirmDialog()
      cy.wait('@deleteBoard')

      cy.checkNotification('삭제되었습니다', 'success')
    })

    /**
     * 게시글 고정 기능
     */
    it('관리자는 게시글을 고정할 수 있어야 한다', () => {
      cy.logout()
      cy.loginAsAdmin()

      cy.intercept('PATCH', '**/api/boards/*/pin').as('pinBoard')

      cy.visit(`/boards/${testBoardId}`)

      // 고정 버튼 클릭
      cy.get('[data-testid="pin-btn"]')
        .should('be.visible')
        .click()

      cy.wait('@pinBoard')

      // 고정 상태 표시 확인
      cy.get('[data-testid="pinned-badge"]').should('be.visible')
    })
  })
})

/*
 * ====== 게시판 E2E 테스트 가이드 ======
 *
 * 1. 테스트 실행:
 *
 *    npx cypress run --spec "cypress/e2e/board.cy.js"
 *
 * 2. 테스트 데이터:
 *
 *    - 각 테스트에서 cy.createBoard()로 필요한 데이터 생성
 *    - beforeEach에서 초기화하여 테스트 격리
 *
 * 3. API 인터셉트:
 *
 *    cy.intercept('METHOD', 'URL패턴').as('별칭')
 *    cy.wait('@별칭')
 *
 * 4. 선택자 모범 사례:
 *
 *    - data-testid 속성 사용 권장
 *    - CSS 클래스보다 안정적
 *    - 예: [data-testid="board-title"]
 *
 * 작성일: 2025년 11월 30일 (41일차)
 */