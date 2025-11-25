/**
 * 댓글 API 서비스 (Comment API Service)
 * 
 * 이 파일은 댓글 관련 백엔드 API와 통신하는 모든 함수를 정의합니다.
 * boardApi.js와 동일한 패턴으로 작성되었습니다.
 * 
 * 주요 기능:
 * - 댓글 CRUD (생성, 조회, 수정, 삭제)
 * - 대댓글 작성 및 조회 (Self Referencing)
 * - 댓글 수 조회
 * - 페이징 처리
 * 
 * 사용 예시:
 * import * as commentApi from '@/services/commentApi'
 * 
 * // 댓글 목록 조회
 * const response = await commentApi.getComments(1, 0, 20)
 * 
 * // 댓글 작성
 * const newComment = await commentApi.createComment(1, '댓글 내용')
 * 
 * @author KM Portal Team
 * @version 1.1 (호환성 수정)
 * @since 2025-11-25 (31일차)
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * API 기본 URL 설정
 * 
 * 개발 환경: http://localhost:8080
 * 프로덕션: 실제 서버 URL
 * 
 * boardApi.js와 동일한 설정 사용
 */
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'

/**
 * Axios 인스턴스 생성
 * 
 * boardApi.js와 동일한 패턴으로 생성합니다.
 * 모든 요청에 공통으로 적용되는 설정을 정의합니다:
 * - baseURL: API 서버 주소
 * - timeout: 요청 타임아웃 (30초)
 * - headers: 공통 헤더 (Content-Type)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 요청 인터셉터
 * 
 * 모든 API 요청 전에 실행됩니다.
 * JWT 토큰을 localStorage에서 가져와 자동으로 헤더에 추가합니다.
 * 
 * ⚠️ 중요: boardApi.js와 동일한 방식으로 localStorage 사용
 * - localStorage 키: 'km_portal_access_token'
 * - Vuex store 사용하지 않음
 */
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 JWT 토큰 가져오기 (boardApi.js와 동일)
    const token = localStorage.getItem('km_portal_access_token')
    
    if (token) {
      // Authorization 헤더에 Bearer 토큰 추가
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Comment API Request] ${config.method?.toUpperCase()} ${config.url}`)
      if (config.params) {
        console.log('[Comment API Params]', config.params)
      }
      if (config.data) {
        console.log('[Comment API Data]', config.data)
      }
    }
    
    return config
  },
  (error) => {
    console.error('[Comment API Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * 응답 인터셉터
 * 
 * 모든 API 응답 후에 실행됩니다.
 * 에러 처리 및 로깅을 담당합니다.
 * boardApi.js와 동일한 에러 처리 로직 사용
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Comment API Response] ${response.config.url}`, response.data)
    }
    
    return response
  },
  (error) => {
    // 에러 로그
    console.error('[Comment API Response Error]', error)
    
    // 에러 메시지 표시 (boardApi.js와 동일)
    if (error.response) {
      // 서버에서 응답은 왔지만 에러 상태 코드인 경우
      const status = error.response.status
      const message = error.response.data?.message || '서버 오류가 발생했습니다.'
      
      switch (status) {
        case 400:
          ElMessage.error(`잘못된 요청: ${message}`)
          break
        case 401:
          ElMessage.error('인증이 필요합니다. 다시 로그인해주세요.')
          break
        case 403:
          ElMessage.error('접근 권한이 없습니다.')
          break
        case 404:
          ElMessage.error('요청한 리소스를 찾을 수 없습니다.')
          break
        case 500:
          ElMessage.error('서버 내부 오류가 발생했습니다.')
          break
        default:
          ElMessage.error(message)
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      ElMessage.error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.')
    } else {
      // 요청 설정 중 오류 발생
      ElMessage.error('요청 처리 중 오류가 발생했습니다.')
    }
    
    return Promise.reject(error)
  }
)

// =============================================================================
// 댓글 CRUD API
// =============================================================================

/**
 * 1. 댓글 목록 조회 (GET /api/boards/:boardId/comments)
 * 
 * 특정 게시글의 댓글 목록을 페이징하여 조회합니다.
 * 
 * @param {number} boardId - 게시글 ID
 * @param {number} page - 페이지 번호 (0부터 시작, 기본값: 0)
 * @param {number} size - 페이지 크기 (기본값: 20)
 * 
 * @returns {Promise<Object>} API 응답 객체
 * @returns {boolean} response.success - 성공 여부
 * @returns {string} response.message - 응답 메시지
 * @returns {Object} response.data - 페이징 데이터
 * @returns {Array} response.data.content - 댓글 배열
 * @returns {number} response.data.totalElements - 전체 댓글 수
 * @returns {number} response.data.totalPages - 전체 페이지 수
 * @returns {number} response.data.number - 현재 페이지 번호
 * @returns {number} response.data.size - 페이지 크기
 * 
 * @throws {Error} 서버 오류 시 에러 발생
 * 
 * @example
 * const response = await getComments(1, 0, 20)
 * console.log('댓글 목록:', response.data.content)
 * console.log('전체 댓글 수:', response.data.totalElements)
 */
export async function getComments(boardId, page = 0, size = 20) {
  try {
    const response = await apiClient.get(`/api/boards/${boardId}/comments`, {
      params: { page, size }
    })
    return response.data
  } catch (error) {
    console.error('[getComments] 댓글 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 2. 댓글 작성 (POST /api/boards/:boardId/comments)
 * 
 * 특정 게시글에 새로운 댓글을 작성합니다.
 * 로그인한 사용자만 댓글을 작성할 수 있으며,
 * JWT 토큰이 자동으로 요청에 포함됩니다.
 * 
 * @param {number} boardId - 게시글 ID
 * @param {string} content - 댓글 내용 (1~1000자)
 * 
 * @returns {Promise<Object>} API 응답 객체
 * @returns {boolean} response.success - 성공 여부
 * @returns {string} response.message - 응답 메시지
 * @returns {Object} response.data - 생성된 댓글 정보
 * 
 * @throws {Error} 서버 오류 시 에러 발생
 * 
 * @example
 * const response = await createComment(1, '좋은 글이네요!')
 * console.log('생성된 댓글 ID:', response.data.id)
 */
export async function createComment(boardId, content) {
  try {
    const response = await apiClient.post(`/api/boards/${boardId}/comments`, {
      content
    })
    return response.data
  } catch (error) {
    console.error('[createComment] 댓글 작성 실패:', error)
    throw error
  }
}

/**
 * 3. 대댓글 작성 (POST /api/boards/:boardId/comments/:commentId/replies)
 * 
 * 특정 댓글에 대한 대댓글(답글)을 작성합니다.
 * Self Referencing 관계를 통해 계층 구조를 형성합니다.
 * 
 * Self Referencing이란?
 * - 같은 테이블이 자기 자신을 참조하는 관계
 * - parent 필드로 부모 댓글을 참조
 * - 최상위 댓글: parent = null
 * - 대댓글: parent != null
 * 
 * 구조 예시:
 * ```
 * 댓글 1 (parent = null)
 *  ├─ 대댓글 1-1 (parent = 댓글 1)
 *  └─ 대댓글 1-2 (parent = 댓글 1)
 * 댓글 2 (parent = null)
 * ```
 * 
 * @param {number} boardId - 게시글 ID
 * @param {number} commentId - 부모 댓글 ID (대댓글을 달 대상)
 * @param {string} content - 대댓글 내용 (1~1000자)
 * 
 * @returns {Promise<Object>} API 응답 객체
 * 
 * @example
 * const response = await createReply(1, 10, '저도 그렇게 생각합니다!')
 * console.log('대댓글 ID:', response.data.id)
 * console.log('부모 댓글 ID:', response.data.parentId)
 */
export async function createReply(boardId, commentId, content) {
  try {
    const response = await apiClient.post(
      `/api/boards/${boardId}/comments/${commentId}/replies`,
      { content }
    )
    return response.data
  } catch (error) {
    console.error('[createReply] 대댓글 작성 실패:', error)
    throw error
  }
}

/**
 * 4. 대댓글 목록 조회 (GET /api/boards/:boardId/comments/:commentId/replies)
 * 
 * 특정 댓글에 달린 대댓글 목록을 조회합니다.
 * 생성일시 기준 오름차순으로 정렬됩니다.
 * 
 * @param {number} boardId - 게시글 ID
 * @param {number} commentId - 부모 댓글 ID
 * 
 * @returns {Promise<Object>} API 응답 객체
 * 
 * @example
 * const response = await getReplies(1, 10)
 * console.log('대댓글 목록:', response.data)
 */
export async function getReplies(boardId, commentId) {
  try {
    const response = await apiClient.get(
      `/api/boards/${boardId}/comments/${commentId}/replies`
    )
    return response.data
  } catch (error) {
    console.error('[getReplies] 대댓글 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 5. 댓글 수정 (PUT /api/boards/:boardId/comments/:commentId)
 * 
 * 기존 댓글의 내용을 수정합니다.
 * 본인이 작성한 댓글만 수정할 수 있으며,
 * 백엔드에서 권한을 검증합니다.
 * 
 * 권한 정책:
 * - 본인이 작성한 댓글: 수정 가능
 * - 타인이 작성한 댓글: 수정 불가 (403 Forbidden)
 * - 삭제된 댓글: 수정 불가 (404 Not Found)
 * 
 * @param {number} boardId - 게시글 ID
 * @param {number} commentId - 댓글 ID
 * @param {string} content - 수정할 댓글 내용 (1~1000자)
 * 
 * @returns {Promise<Object>} API 응답 객체
 * 
 * @throws {Error} 권한 오류 또는 서버 오류
 * 
 * @example
 * const response = await updateComment(1, 10, '수정된 댓글 내용입니다.')
 * console.log('수정된 댓글:', response.data)
 */
export async function updateComment(boardId, commentId, content) {
  try {
    const response = await apiClient.put(
      `/api/boards/${boardId}/comments/${commentId}`,
      { content }
    )
    return response.data
  } catch (error) {
    console.error('[updateComment] 댓글 수정 실패:', error)
    throw error
  }
}

/**
 * 6. 댓글 삭제 (DELETE /api/boards/:boardId/comments/:commentId)
 * 
 * 댓글을 삭제합니다 (Soft Delete 방식).
 * 실제 데이터는 DB에 남아있고 is_deleted 플래그만 변경됩니다.
 * 
 * Soft Delete란?
 * - 실제 데이터는 DB에 남아있음
 * - is_deleted = true로 변경하여 논리적으로만 삭제
 * - 복구 가능
 * - 통계 데이터 유지
 * - 대댓글이 있어도 안전하게 삭제 가능
 * 
 * Hard Delete vs Soft Delete:
 * - Hard Delete: DELETE FROM comments WHERE id = ?
 * - Soft Delete: UPDATE comments SET is_deleted = true WHERE id = ?
 * 
 * 권한 정책:
 * - 본인이 작성한 댓글: 삭제 가능
 * - 관리자 (ROLE_ADMIN): 모든 댓글 삭제 가능
 * - 기타 사용자: 삭제 불가 (403 Forbidden)
 * 
 * @param {number} boardId - 게시글 ID
 * @param {number} commentId - 댓글 ID
 * 
 * @returns {Promise<Object>} API 응답 객체
 * 
 * @throws {Error} 권한 오류 또는 서버 오류
 * 
 * @example
 * const response = await deleteComment(1, 10)
 * console.log('삭제 완료:', response.message)
 */
export async function deleteComment(boardId, commentId) {
  try {
    const response = await apiClient.delete(
      `/api/boards/${boardId}/comments/${commentId}`
    )
    return response.data
  } catch (error) {
    console.error('[deleteComment] 댓글 삭제 실패:', error)
    throw error
  }
}

/**
 * 7. 댓글 수 조회 (GET /api/boards/:boardId/comments/count)
 * 
 * 특정 게시글의 전체 댓글 수를 조회합니다.
 * 삭제된 댓글은 제외됩니다.
 * 
 * @param {number} boardId - 게시글 ID
 * 
 * @returns {Promise<Object>} API 응답 객체
 * 
 * @example
 * const response = await getCommentCount(1)
 * console.log('댓글 수:', response.data.count)
 */
export async function getCommentCount(boardId) {
  try {
    const response = await apiClient.get(`/api/boards/${boardId}/comments/count`)
    return response.data
  } catch (error) {
    console.error('[getCommentCount] 댓글 수 조회 실패:', error)
    throw error
  }
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 날짜 포맷팅 함수
 * 
 * ISO 8601 형식의 날짜 문자열을 사용자 친화적인 형태로 변환합니다.
 * boardApi.js의 formatDate()와 유사한 로직 사용
 * 
 * 예시:
 * - "2025-11-25T10:30:00" → "2025년 11월 25일 10:30"
 * - 오늘 작성한 경우 → "오늘 10:30"
 * - 어제 작성한 경우 → "어제 10:30"
 * 
 * @param {string} dateString - ISO 8601 형식 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 * 
 * @example
 * const formatted = formatDate('2025-11-25T10:30:00')
 * // 결과: '2025년 11월 25일 10:30'
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  
  // 오늘인지 확인
  const isToday = date.toDateString() === now.toDateString()
  
  // 어제인지 확인
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  // 시간 포맷 (HH:MM)
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  if (isToday) {
    return `오늘 ${timeStr}`
  } else if (isYesterday) {
    return `어제 ${timeStr}`
  } else {
    // YYYY년 MM월 DD일 HH:MM
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}

/**
 * 상대 시간 표시 함수
 * 
 * 날짜를 '방금 전', '3분 전', '2시간 전', '3일 전' 등으로 표시합니다.
 * boardApi.js의 getRelativeTime()과 동일한 로직
 * 
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 상대 시간 문자열
 * 
 * @example
 * const relative = getRelativeTime('2025-11-25T10:30:00')
 * // 결과: '2시간 전'
 */
export function getRelativeTime(dateString) {
  if (!dateString) return ''
  
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  
  // 7일 이상이면 날짜 표시
  return formatDate(dateString)
}

/**
 * 기본 내보내기
 * 
 * boardApi.js와 동일한 패턴으로 모든 함수를 객체로 묶어서 내보냅니다.
 * import * as commentApi from '@/services/commentApi' 형태로 사용 권장
 */
export default {
  // CRUD
  getComments,
  createComment,
  createReply,
  getReplies,
  updateComment,
  deleteComment,
  
  // 통계
  getCommentCount,
  
  // 유틸리티
  formatDate,
  getRelativeTime
}