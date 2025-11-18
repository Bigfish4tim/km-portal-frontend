/**
 * 게시판 API 서비스 (Board API Service)
 * 
 * 이 파일은 게시판 관련 백엔드 API와 통신하는 모든 함수를 정의합니다.
 * Vue 컴포넌트에서 이 함수들을 import하여 사용합니다.
 * 
 * 주요 기능:
 * - 게시글 CRUD (생성, 조회, 수정, 삭제)
 * - 게시글 목록 조회 (페이징, 검색, 필터링)
 * - 게시글 상단 고정 관리
 * - 게시판 통계 조회
 * - 인기 게시글 조회
 * 
 * 사용 예시:
 * import * as boardApi from '@/api/boardApi'
 * 
 * // 게시글 목록 조회
 * const response = await boardApi.getBoards({ page: 0, size: 10 })
 * 
 * // 게시글 생성
 * const newBoard = await boardApi.createBoard({ title: '제목', content: '내용' })
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-17 (25일차)
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * API 기본 URL 설정
 * 
 * 개발 환경: http://localhost:8080
 * 프로덕션: 실제 서버 URL
 */
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'

/**
 * Axios 인스턴스 생성
 * 
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
 * JWT 토큰을 자동으로 헤더에 추가합니다.
 */
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 JWT 토큰 가져오기
    const token = localStorage.getItem('accessToken')
    
    if (token) {
      // Authorization 헤더에 Bearer 토큰 추가
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Board API Request] ${config.method?.toUpperCase()} ${config.url}`)
      if (config.params) {
        console.log('[Board API Params]', config.params)
      }
      if (config.data) {
        console.log('[Board API Data]', config.data)
      }
    }
    
    return config
  },
  (error) => {
    console.error('[Board API Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * 응답 인터셉터
 * 
 * 모든 API 응답 후에 실행됩니다.
 * 에러 처리 및 로깅을 담당합니다.
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Board API Response] ${response.config.url}`, response.data)
    }
    
    return response
  },
  (error) => {
    // 에러 로그
    console.error('[Board API Response Error]', error)
    
    // 에러 메시지 표시
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
          // 로그인 페이지로 리디렉션 (선택사항)
          // window.location.href = '/login'
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
// 게시글 CRUD API
// =============================================================================

/**
 * 1. 게시글 생성 (POST /api/boards)
 * 
 * 새로운 게시글을 작성합니다.
 * 
 * @param {Object} boardData - 게시글 데이터
 * @param {string} boardData.title - 게시글 제목 (필수, 1-200자)
 * @param {string} boardData.content - 게시글 내용 (필수, HTML 지원)
 * @param {string} boardData.category - 게시글 카테고리 (선택, 최대 50자)
 * 
 * @returns {Promise<Object>} 생성된 게시글 정보
 * 
 * @throws {Error} 서버 오류 시 에러 발생
 * 
 * @example
 * const newBoard = await createBoard({
 *   title: '새로운 게시글',
 *   content: '<p>게시글 내용입니다.</p>',
 *   category: 'FREE'
 * })
 * console.log('생성된 게시글 ID:', newBoard.id)
 */
export async function createBoard(boardData) {
  try {
    const response = await apiClient.post('/api/boards', boardData)
    return response.data
  } catch (error) {
    console.error('[createBoard] 게시글 생성 실패:', error)
    throw error
  }
}

/**
 * 2. 게시글 목록 조회 (GET /api/boards)
 * 
 * 게시글 목록을 페이징하여 조회합니다.
 * 검색, 필터링, 정렬 기능을 지원합니다.
 * 
 * @param {Object} params - 조회 파라미터
 * @param {number} params.page - 페이지 번호 (0부터 시작)
 * @param {number} params.size - 페이지 크기 (기본: 10)
 * @param {string} params.keyword - 검색 키워드 (선택, 제목+내용 검색)
 * @param {string} params.category - 카테고리 필터 (선택)
 * @param {string} params.sort - 정렬 기준 (선택, 기본: 'createdAt,desc')
 * 
 * @returns {Promise<Object>} 페이징된 게시글 목록
 * @returns {Array} response.content - 게시글 배열
 * @returns {number} response.totalElements - 전체 게시글 수
 * @returns {number} response.totalPages - 전체 페이지 수
 * @returns {number} response.number - 현재 페이지 번호
 * @returns {number} response.size - 페이지 크기
 * 
 * @example
 * // 기본 목록 조회
 * const result = await getBoards({ page: 0, size: 10 })
 * console.log('게시글 목록:', result.content)
 * console.log('전체 게시글 수:', result.totalElements)
 * 
 * // 검색 + 필터링
 * const result = await getBoards({
 *   page: 0,
 *   size: 10,
 *   keyword: 'Vue',
 *   category: 'TECH'
 * })
 */
export async function getBoards(params = {}) {
  try {
    const response = await apiClient.get('/api/boards', { params })
    return response.data
  } catch (error) {
    console.error('[getBoards] 게시글 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 3. 게시글 상세 조회 (GET /api/boards/:id)
 * 
 * 특정 게시글의 상세 정보를 조회합니다.
 * 조회 시 조회수가 자동으로 1 증가합니다.
 * 
 * @param {number} boardId - 게시글 ID
 * 
 * @returns {Promise<Object>} 게시글 상세 정보
 * @returns {number} response.id - 게시글 ID
 * @returns {string} response.title - 제목
 * @returns {string} response.content - 내용 (HTML)
 * @returns {string} response.category - 카테고리
 * @returns {Object} response.author - 작성자 정보
 * @returns {number} response.viewCount - 조회수
 * @returns {boolean} response.isPinned - 상단 고정 여부
 * @returns {string} response.createdAt - 생성일시
 * @returns {string} response.updatedAt - 수정일시
 * 
 * @example
 * const board = await getBoardById(1)
 * console.log('제목:', board.title)
 * console.log('작성자:', board.author.fullName)
 * console.log('조회수:', board.viewCount)
 */
export async function getBoardById(boardId) {
  try {
    const response = await apiClient.get(`/api/boards/${boardId}`)
    return response.data
  } catch (error) {
    console.error(`[getBoardById] 게시글 ${boardId} 조회 실패:`, error)
    throw error
  }
}

/**
 * 4. 게시글 수정 (PUT /api/boards/:id)
 * 
 * 기존 게시글을 수정합니다.
 * 작성자 본인 또는 관리자만 수정할 수 있습니다.
 * 
 * @param {number} boardId - 게시글 ID
 * @param {Object} boardData - 수정할 데이터
 * @param {string} boardData.title - 새 제목 (선택)
 * @param {string} boardData.content - 새 내용 (선택)
 * @param {string} boardData.category - 새 카테고리 (선택)
 * 
 * @returns {Promise<Object>} 수정된 게시글 정보
 * 
 * @throws {Error} 권한이 없거나 게시글이 존재하지 않을 경우 에러
 * 
 * @example
 * const updatedBoard = await updateBoard(1, {
 *   title: '수정된 제목',
 *   content: '<p>수정된 내용</p>',
 *   category: 'NOTICE'
 * })
 */
export async function updateBoard(boardId, boardData) {
  try {
    const response = await apiClient.put(`/api/boards/${boardId}`, boardData)
    return response.data
  } catch (error) {
    console.error(`[updateBoard] 게시글 ${boardId} 수정 실패:`, error)
    throw error
  }
}

/**
 * 5. 게시글 삭제 (DELETE /api/boards/:id)
 * 
 * 게시글을 삭제합니다 (Soft Delete 방식).
 * 실제로는 데이터가 삭제되지 않고 isDeleted 플래그만 true로 변경됩니다.
 * 작성자 본인 또는 관리자만 삭제할 수 있습니다.
 * 
 * @param {number} boardId - 삭제할 게시글 ID
 * 
 * @returns {Promise<void>} 응답 없음 (204 No Content)
 * 
 * @throws {Error} 권한이 없거나 게시글이 존재하지 않을 경우 에러
 * 
 * @example
 * await deleteBoard(1)
 * ElMessage.success('게시글이 삭제되었습니다.')
 */
export async function deleteBoard(boardId) {
  try {
    const response = await apiClient.delete(`/api/boards/${boardId}`)
    return response.data
  } catch (error) {
    console.error(`[deleteBoard] 게시글 ${boardId} 삭제 실패:`, error)
    throw error
  }
}

// =============================================================================
// 게시글 검색 및 필터링 API
// =============================================================================

/**
 * 6. 게시글 검색 (GET /api/boards/search)
 * 
 * 제목과 내용에서 키워드를 검색합니다.
 * 
 * @param {Object} params - 검색 파라미터
 * @param {string} params.keyword - 검색 키워드 (필수)
 * @param {string} params.category - 카테고리 필터 (선택)
 * @param {number} params.page - 페이지 번호 (기본: 0)
 * @param {number} params.size - 페이지 크기 (기본: 10)
 * 
 * @returns {Promise<Object>} 검색 결과 (페이징)
 * 
 * @example
 * const results = await searchBoards({
 *   keyword: 'Vue',
 *   category: 'TECH',
 *   page: 0,
 *   size: 20
 * })
 */
export async function searchBoards(params) {
  try {
    const response = await apiClient.get('/api/boards/search', { params })
    return response.data
  } catch (error) {
    console.error('[searchBoards] 게시글 검색 실패:', error)
    throw error
  }
}

/**
 * 7. 카테고리별 게시글 조회 (GET /api/boards)
 * 
 * 특정 카테고리의 게시글만 조회합니다.
 * getBoards() 함수에 category 파라미터를 전달하는 것과 동일합니다.
 * 
 * @param {string} category - 카테고리명 (예: 'NOTICE', 'FREE', 'QNA')
 * @param {Object} params - 추가 파라미터 (page, size 등)
 * 
 * @returns {Promise<Object>} 카테고리별 게시글 목록
 * 
 * @example
 * const notices = await getBoardsByCategory('NOTICE', { page: 0, size: 10 })
 */
export async function getBoardsByCategory(category, params = {}) {
  try {
    const response = await apiClient.get('/api/boards', {
      params: { ...params, category }
    })
    return response.data
  } catch (error) {
    console.error(`[getBoardsByCategory] 카테고리 ${category} 조회 실패:`, error)
    throw error
  }
}

// =============================================================================
// 게시글 상단 고정 API
// =============================================================================

/**
 * 8. 게시글 상단 고정/해제 (PUT /api/boards/:id/pin)
 * 
 * 게시글을 목록 최상단에 고정하거나 고정을 해제합니다.
 * 관리자(ADMIN) 권한이 필요합니다.
 * 
 * @param {number} boardId - 게시글 ID
 * @param {boolean} pin - true: 고정, false: 고정 해제
 * 
 * @returns {Promise<Object>} 수정된 게시글 정보
 * 
 * @throws {Error} 권한이 없을 경우 403 에러
 * 
 * @example
 * // 게시글 상단 고정
 * await pinBoard(1, true)
 * ElMessage.success('게시글이 상단에 고정되었습니다.')
 * 
 * // 게시글 고정 해제
 * await pinBoard(1, false)
 * ElMessage.success('게시글 고정이 해제되었습니다.')
 */
export async function pinBoard(boardId, pin = true) {
  try {
    const response = await apiClient.put(`/api/boards/${boardId}/pin`, null, {
      params: { pin }
    })
    return response.data
  } catch (error) {
    console.error(`[pinBoard] 게시글 ${boardId} 고정 설정 실패:`, error)
    throw error
  }
}

/**
 * 9. 상단 고정 게시글 목록 조회 (GET /api/boards/pinned)
 * 
 * 상단에 고정된 게시글만 조회합니다.
 * 공지사항 등을 표시할 때 사용합니다.
 * 
 * @returns {Promise<Array>} 고정 게시글 배열 (최신순)
 * 
 * @example
 * const pinnedBoards = await getPinnedBoards()
 * console.log('고정 게시글 수:', pinnedBoards.length)
 */
export async function getPinnedBoards() {
  try {
    const response = await apiClient.get('/api/boards/pinned')
    return response.data
  } catch (error) {
    console.error('[getPinnedBoards] 고정 게시글 조회 실패:', error)
    throw error
  }
}

// =============================================================================
// 인기 게시글 및 통계 API
// =============================================================================

/**
 * 10. 인기 게시글 조회 (GET /api/boards/popular)
 * 
 * 조회수가 높은 인기 게시글을 조회합니다.
 * 
 * @param {Object} params - 조회 파라미터
 * @param {number} params.limit - 조회할 게시글 수 (기본: 10)
 * @param {number} params.days - 최근 며칠 기준 (선택)
 * 
 * @returns {Promise<Array>} 인기 게시글 배열 (조회수 내림차순)
 * 
 * @example
 * // 인기 게시글 상위 10개
 * const popular = await getPopularBoards({ limit: 10 })
 * 
 * // 최근 7일간 인기 게시글 상위 5개
 * const recent = await getPopularBoards({ limit: 5, days: 7 })
 */
export async function getPopularBoards(params = { limit: 10 }) {
  try {
    const response = await apiClient.get('/api/boards/popular', { params })
    return response.data
  } catch (error) {
    console.error('[getPopularBoards] 인기 게시글 조회 실패:', error)
    throw error
  }
}

/**
 * 11. 게시판 통계 조회 (GET /api/boards/statistics)
 * 
 * 게시판 전체 통계 정보를 조회합니다.
 * 관리자(ADMIN) 또는 매니저(MANAGER) 권한이 필요합니다.
 * 
 * @returns {Promise<Object>} 통계 정보
 * @returns {number} response.totalBoards - 전체 게시글 수
 * @returns {number} response.totalActiveBoards - 활성 게시글 수
 * @returns {number} response.totalDeletedBoards - 삭제된 게시글 수
 * @returns {number} response.totalViews - 전체 조회수
 * @returns {Object} response.categoryStats - 카테고리별 통계
 * @returns {Array} response.recentBoards - 최근 게시글
 * 
 * @throws {Error} 권한이 없을 경우 403 에러
 * 
 * @example
 * const stats = await getBoardStatistics()
 * console.log('전체 게시글:', stats.totalBoards)
 * console.log('총 조회수:', stats.totalViews)
 */
export async function getBoardStatistics() {
  try {
    const response = await apiClient.get('/api/boards/statistics')
    return response.data
  } catch (error) {
    console.error('[getBoardStatistics] 통계 조회 실패:', error)
    throw error
  }
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 카테고리 목록 정의
 * 
 * 애플리케이션에서 사용하는 게시판 카테고리 목록입니다.
 * 프론트엔드에서 카테고리 선택 시 사용합니다.
 * 
 * @constant {Array<Object>} BOARD_CATEGORIES
 */
export const BOARD_CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'NOTICE', label: '공지사항' },
  { value: 'FREE', label: '자유 게시판' },
  { value: 'QNA', label: '질문과 답변' },
  { value: 'TECH', label: '기술 게시판' },
  { value: 'REVIEW', label: '후기' },
  { value: 'ETC', label: '기타' }
]

/**
 * 카테고리 한글명 가져오기
 * 
 * 영문 카테고리 코드를 한글 이름으로 변환합니다.
 * 
 * @param {string} category - 카테고리 코드 (예: 'NOTICE')
 * @returns {string} 카테고리 한글명 (예: '공지사항')
 * 
 * @example
 * const label = getCategoryLabel('NOTICE')  // '공지사항'
 */
export function getCategoryLabel(category) {
  const found = BOARD_CATEGORIES.find(c => c.value === category)
  return found ? found.label : '기타'
}

/**
 * 날짜 포맷팅 함수
 * 
 * ISO 8601 날짜 문자열을 'YYYY-MM-DD HH:mm' 형식으로 변환합니다.
 * 
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 포맷된 날짜 문자열
 * 
 * @example
 * const formatted = formatDate('2025-11-17T10:30:00')
 * // 결과: '2025-11-17 10:30'
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 상대 시간 표시 함수
 * 
 * 날짜를 '방금 전', '3분 전', '2시간 전', '3일 전' 등으로 표시합니다.
 * 
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 상대 시간 문자열
 * 
 * @example
 * const relative = getRelativeTime('2025-11-17T10:30:00')
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
 * HTML 태그 제거 함수
 * 
 * HTML 내용에서 태그를 제거하고 순수 텍스트만 추출합니다.
 * 미리보기 등에서 사용합니다.
 * 
 * @param {string} html - HTML 문자열
 * @param {number} maxLength - 최대 길이 (기본: 100)
 * @returns {string} 순수 텍스트
 * 
 * @example
 * const text = stripHtml('<p><strong>제목</strong>: 내용입니다.</p>')
 * // 결과: '제목: 내용입니다.'
 */
export function stripHtml(html, maxLength = 100) {
  if (!html) return ''
  
  // HTML 태그 제거
  const text = html.replace(/<[^>]*>/g, '')
  
  // 연속된 공백을 하나로
  const cleaned = text.replace(/\s+/g, ' ').trim()
  
  // 최대 길이 제한
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...'
  }
  
  return cleaned
}

/**
 * 기본 내보내기
 * 
 * 주요 함수들을 객체로 묶어서 내보냅니다.
 * import * as boardApi from '@/api/boardApi' 형태로 사용 권장
 */
export default {
  // CRUD
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  
  // 검색 및 필터링
  searchBoards,
  getBoardsByCategory,
  
  // 상단 고정
  pinBoard,
  getPinnedBoards,
  
  // 인기 및 통계
  getPopularBoards,
  getBoardStatistics,
  
  // 유틸리티
  BOARD_CATEGORIES,
  getCategoryLabel,
  formatDate,
  getRelativeTime,
  stripHtml
}