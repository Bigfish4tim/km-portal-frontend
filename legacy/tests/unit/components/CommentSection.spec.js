/**
 * CommentSection.vue 컴포넌트 단위 테스트
 *
 * 이 파일은 댓글 섹션 컴포넌트의 기능을 검증합니다.
 *
 * [테스트 항목]
 * 1. 컴포넌트 렌더링
 * 2. 로그인 상태에 따른 UI 변화
 * 3. 댓글 작성 기능
 * 4. 댓글 수정/삭제 권한
 * 5. 대댓글 기능
 * 6. 유틸리티 함수 (아바타, 날짜 포맷)
 *
 * [사용 라이브러리]
 * - @vue/test-utils 2.x: Vue 3 컴포넌트 테스트 유틸리티
 * - Jest 27: 테스트 프레임워크
 *
 * 파일 위치: tests/unit/components/CommentSection.spec.js
 *
 * 작성일: 2025년 11월 29일 (40일차)
 * 작성자: KM Portal Dev Team
 */

import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import CommentSection from '@/components/board/CommentSection.vue'

// ================================
// Mock 설정
// ================================

/**
 * Vue Router Mock
 */
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn()
}

const mockRoute = {
  params: { id: '1' }
}

/**
 * commentService Mock
 *
 * 실제 API 호출 없이 테스트하기 위해 Mock 합니다.
 */
jest.mock('@/services/commentService', () => ({
  default: {
    getComments: jest.fn().mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0
    }),
    createComment: jest.fn().mockResolvedValue({ id: 1 }),
    updateComment: jest.fn().mockResolvedValue({}),
    deleteComment: jest.fn().mockResolvedValue({}),
    getReplies: jest.fn().mockResolvedValue([])
  }
}))

/**
 * Element Plus 컴포넌트 Mock
 */
const mockConfirm = jest.fn().mockResolvedValue(true)
const mockMessage = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
}

// ================================
// 테스트 데이터
// ================================

/**
 * 테스트용 사용자 데이터
 */
const mockUser = {
  userId: 1,
  username: 'testuser',
  fullName: '테스트 사용자',
  email: 'test@example.com',
  roles: ['ROLE_USER']
}

const mockAdminUser = {
  userId: 2,
  username: 'admin',
  fullName: '관리자',
  email: 'admin@example.com',
  roles: ['ROLE_ADMIN']
}

/**
 * 테스트용 댓글 데이터
 */
const mockComments = [
  {
    id: 1,
    content: '첫 번째 댓글입니다.',
    authorId: 1,
    authorName: '테스트 사용자',
    createdAt: '2025-11-29T10:00:00',
    updatedAt: '2025-11-29T10:00:00',
    isDeleted: false,
    replyCount: 2
  },
  {
    id: 2,
    content: '두 번째 댓글입니다.',
    authorId: 3,
    authorName: '다른 사용자',
    createdAt: '2025-11-29T11:00:00',
    updatedAt: '2025-11-29T11:30:00',
    isDeleted: false,
    replyCount: 0
  },
  {
    id: 3,
    content: '삭제된 댓글입니다.',
    authorId: 1,
    authorName: '테스트 사용자',
    createdAt: '2025-11-29T09:00:00',
    updatedAt: '2025-11-29T09:00:00',
    isDeleted: true,
    replyCount: 0
  }
]

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
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: () => ({
          user: options.user || null,
          accessToken: options.user ? 'mock-token' : null
        }),
        getters: {
          isAuthenticated: (state) => !!state.accessToken && !!state.user,
          user: (state) => state.user,
          isAdmin: (state) => state.user?.roles?.includes('ROLE_ADMIN') || false
        }
      }
    }
  })
}

// ================================
// 테스트 헬퍼 함수
// ================================

/**
 * CommentSection 컴포넌트를 마운트하는 헬퍼 함수
 *
 * @param {Object} options - 마운트 옵션
 * @returns {Wrapper} Vue Test Utils Wrapper
 */
const mountCommentSection = (options = {}) => {
  const store = options.store || createMockStore({ user: options.user })

  return shallowMount(CommentSection, {
    props: {
      boardId: options.boardId || 1
    },
    global: {
      plugins: [store],
      mocks: {
        $router: mockRouter,
        $route: mockRoute,
        $confirm: mockConfirm,
        $message: mockMessage
      },
      stubs: {
        // Element Plus 컴포넌트 스텁
        'el-card': {
          template: '<div class="el-card"><slot /></div>'
        },
        'el-input': {
          template: '<textarea class="el-input"></textarea>',
          props: ['modelValue', 'disabled', 'rows', 'maxlength', 'placeholder']
        },
        'el-button': {
          template: '<button class="el-button"><slot /></button>',
          props: ['loading', 'disabled', 'type', 'link', 'text', 'size']
        },
        'el-avatar': {
          template: '<div class="el-avatar"><slot /></div>',
          props: ['size']
        },
        'el-tag': {
          template: '<span class="el-tag"><slot /></span>',
          props: ['type', 'size']
        },
        'el-alert': {
          template: '<div class="el-alert"><slot /><slot name="default" /></div>',
          props: ['title', 'type', 'closable', 'show-icon']
        },
        'el-empty': {
          template: '<div class="el-empty">{{ description }}</div>',
          props: ['description', 'image-size']
        },
        'el-skeleton': {
          template: '<div class="el-skeleton"></div>',
          props: ['rows', 'animated']
        },
        'el-pagination': {
          template: '<div class="el-pagination"></div>',
          props: ['total', 'page-size', 'current-page']
        },
        'el-icon': {
          template: '<i class="el-icon"><slot /></i>'
        },
        // Lucide 아이콘 스텁
        'ChatLineRound': true,
        'Edit': true,
        'Delete': true,
        'ArrowUp': true,
        'ArrowDown': true
      }
    },
    ...options
  })
}

// ================================
// 테스트 시작
// ================================

describe('CommentSection.vue', () => {
  // 각 테스트 전에 Mock 초기화
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ================================
  // 렌더링 테스트
  // ================================

  describe('렌더링', () => {
    it('컴포넌트가 정상적으로 마운트되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.exists()).toBe(true)
    })

    it('댓글 섹션 컨테이너가 렌더링되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.find('.comment-section').exists()).toBe(true)
    })

    it('댓글 헤더가 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.find('.comment-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('댓글')
    })

    it('댓글 수가 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.find('.comment-count').exists()).toBe(true)
    })
  })

  // ================================
  // 로그인 상태에 따른 UI 테스트
  // ================================

  describe('로그인 상태에 따른 UI', () => {
    it('로그인한 사용자에게 댓글 작성 폼이 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection({ user: mockUser })

      // Then
      expect(wrapper.find('.comment-form-container').exists()).toBe(true)
    })

    it('비로그인 사용자에게 로그인 안내 메시지가 표시되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection({ user: null })

      // Then
      expect(wrapper.find('.login-required').exists()).toBe(true)
    })

    it('비로그인 사용자에게 댓글 작성 폼이 숨겨져야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection({ user: null })

      // Then
      expect(wrapper.find('.comment-form-container').exists()).toBe(false)
    })
  })

  // ================================
  // 초기 데이터 테스트
  // ================================

  describe('초기 데이터', () => {
    it('comments 배열이 빈 배열로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.vm.comments).toEqual([])
    })

    it('newCommentContent가 빈 문자열로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.vm.newCommentContent).toBe('')
    })

    it('isLoading이 false로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('isSubmitting이 false로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.vm.isSubmitting).toBe(false)
    })

    it('totalComments가 0으로 초기화되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection()

      // Then
      expect(wrapper.vm.totalComments).toBe(0)
    })
  })

  // ================================
  // Props 테스트
  // ================================

  describe('Props', () => {
    it('boardId prop이 전달되어야 한다', () => {
      // Given & When
      const wrapper = mountCommentSection({ boardId: 123 })

      // Then
      expect(wrapper.props('boardId')).toBe(123)
    })
  })

  // ================================
  // 댓글 수정/삭제 권한 테스트
  // ================================

  describe('댓글 수정/삭제 권한', () => {
    it('본인이 작성한 댓글은 수정할 수 있어야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      await wrapper.setData({ comments: mockComments })

      const ownComment = mockComments[0] // authorId: 1 (mockUser.userId: 1)

      // When
      const canEdit = wrapper.vm.canEdit(ownComment)

      // Then
      expect(canEdit).toBe(true)
    })

    it('다른 사람이 작성한 댓글은 수정할 수 없어야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      await wrapper.setData({ comments: mockComments })

      const otherComment = mockComments[1] // authorId: 3 (다른 사용자)

      // When
      const canEdit = wrapper.vm.canEdit(otherComment)

      // Then
      expect(canEdit).toBe(false)
    })

    it('관리자는 모든 댓글을 삭제할 수 있어야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockAdminUser })
      await wrapper.setData({ comments: mockComments })

      const otherComment = mockComments[1] // 다른 사용자의 댓글

      // When
      const canDelete = wrapper.vm.canDelete(otherComment)

      // Then
      expect(canDelete).toBe(true)
    })

    it('비로그인 사용자는 수정/삭제할 수 없어야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: null })
      await wrapper.setData({ comments: mockComments })

      const comment = mockComments[0]

      // When
      const canEdit = wrapper.vm.canEdit(comment)
      const canDelete = wrapper.vm.canDelete(comment)

      // Then
      expect(canEdit).toBe(false)
      expect(canDelete).toBe(false)
    })

    it('삭제된 댓글은 수정할 수 없어야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      await wrapper.setData({ comments: mockComments })

      const deletedComment = mockComments[2] // isDeleted: true

      // When
      const canEdit = wrapper.vm.canEdit(deletedComment)

      // Then
      expect(canEdit).toBe(false)
    })
  })

  // ================================
  // 아바타 유틸리티 테스트
  // ================================

  describe('아바타 유틸리티', () => {
    it('getAvatarText가 이름의 첫 글자를 반환해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()

      // When & Then
      expect(wrapper.vm.getAvatarText('홍길동')).toBe('홍')
      expect(wrapper.vm.getAvatarText('John Doe')).toBe('J')
      expect(wrapper.vm.getAvatarText('테스트')).toBe('테')
    })

    it('getAvatarText가 빈 이름에 대해 기본값을 반환해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()

      // When & Then
      expect(wrapper.vm.getAvatarText('')).toBe('?')
      expect(wrapper.vm.getAvatarText(null)).toBe('?')
      expect(wrapper.vm.getAvatarText(undefined)).toBe('?')
    })

    it('getAvatarColor가 색상을 반환해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()

      // When
      const color1 = wrapper.vm.getAvatarColor('사용자1')
      const color2 = wrapper.vm.getAvatarColor('사용자2')

      // Then
      expect(color1).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(color2).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('같은 이름에 대해 같은 색상을 반환해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()

      // When
      const color1 = wrapper.vm.getAvatarColor('동일사용자')
      const color2 = wrapper.vm.getAvatarColor('동일사용자')

      // Then
      expect(color1).toBe(color2)
    })
  })

  // ================================
  // 날짜 포맷 테스트
  // ================================

  describe('날짜 포맷', () => {
    it('formatDate가 날짜를 포맷해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()
      const date = '2025-11-29T10:30:00'

      // When
      const formatted = wrapper.vm.formatDate(date)

      // Then
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('isEdited가 수정된 댓글을 감지해야 한다', () => {
      // Given
      const wrapper = mountCommentSection()

      const editedComment = {
        createdAt: '2025-11-29T10:00:00',
        updatedAt: '2025-11-29T11:00:00'
      }

      const notEditedComment = {
        createdAt: '2025-11-29T10:00:00',
        updatedAt: '2025-11-29T10:00:00'
      }

      // When & Then
      expect(wrapper.vm.isEdited(editedComment)).toBe(true)
      expect(wrapper.vm.isEdited(notEditedComment)).toBe(false)
    })
  })

  // ================================
  // 관리자 댓글 판별 테스트
  // ================================

  describe('관리자 댓글 판별', () => {
    it('isCommentByAdmin이 관리자 댓글을 판별해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })

      const adminComment = {
        id: 1,
        authorRoles: ['ROLE_ADMIN']
      }

      const userComment = {
        id: 2,
        authorRoles: ['ROLE_USER']
      }

      // When & Then
      expect(wrapper.vm.isCommentByAdmin(adminComment)).toBe(true)
      expect(wrapper.vm.isCommentByAdmin(userComment)).toBe(false)
    })
  })

  // ================================
  // 대댓글 토글 테스트
  // ================================

  describe('대댓글 토글', () => {
    it('toggleReplies가 답글 표시 상태를 토글해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      const comment = { id: 1, replyCount: 3 }

      // When - 첫 번째 토글 (열기)
      await wrapper.vm.toggleReplies(comment)

      // Then
      expect(wrapper.vm.showingRepliesFor).toContain(1)

      // When - 두 번째 토글 (닫기)
      await wrapper.vm.toggleReplies(comment)

      // Then
      expect(wrapper.vm.showingRepliesFor).not.toContain(1)
    })
  })

  // ================================
  // 수정 모드 테스트
  // ================================

  describe('수정 모드', () => {
    it('handleEditComment가 수정 모드를 활성화해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      const comment = {
        id: 1,
        content: '원본 댓글 내용'
      }

      // When
      wrapper.vm.handleEditComment(comment)

      // Then
      expect(wrapper.vm.editingCommentId).toBe(1)
      expect(wrapper.vm.editingContent).toBe('원본 댓글 내용')
    })

    it('handleCancelEdit가 수정 모드를 비활성화해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      wrapper.vm.editingCommentId = 1
      wrapper.vm.editingContent = '수정 중인 내용'

      // When
      wrapper.vm.handleCancelEdit()

      // Then
      expect(wrapper.vm.editingCommentId).toBeNull()
      expect(wrapper.vm.editingContent).toBe('')
    })
  })

  // ================================
  // 답글 모드 테스트
  // ================================

  describe('답글 모드', () => {
    it('handleReplyComment가 답글 모드를 활성화해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      const comment = { id: 1 }

      // When
      wrapper.vm.handleReplyComment(comment)

      // Then
      expect(wrapper.vm.replyingToId).toBe(1)
    })

    it('handleCancelReply가 답글 모드를 비활성화해야 한다', async () => {
      // Given
      const wrapper = mountCommentSection({ user: mockUser })
      wrapper.vm.replyingToId = 1
      wrapper.vm.replyContent = '답글 내용'

      // When
      wrapper.vm.handleCancelReply()

      // Then
      expect(wrapper.vm.replyingToId).toBeNull()
      expect(wrapper.vm.replyContent).toBe('')
    })
  })

  // ================================
  // 로그인 페이지 이동 테스트
  // ================================

  describe('로그인 페이지 이동', () => {
    it('goToLogin이 로그인 페이지로 이동해야 한다', () => {
      // Given
      const wrapper = mountCommentSection({ user: null })

      // When
      wrapper.vm.goToLogin()

      // Then
      expect(mockRouter.push).toHaveBeenCalled()
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
 *    npm run test:unit -- CommentSection.spec.js
 *
 * 3. 감시 모드:
 *    npm run test:unit -- --watch
 *
 * ====== 테스트 작성 팁 ======
 *
 * 1. 컴포넌트 상태 변경:
 *    await wrapper.setData({ key: value })
 *
 * 2. Props 확인:
 *    wrapper.props('propName')
 *
 * 3. 이벤트 발생:
 *    await wrapper.find('button').trigger('click')
 *
 * 4. 비동기 대기:
 *    await wrapper.vm.$nextTick()
 */