/**
 * Statistics API 서비스
 * 
 * 대시보드에서 사용할 통계 데이터를 백엔드로부터 가져오는 API 통신 함수들입니다.
 * 시스템 전체 통계, 최근 활동 내역 등을 조회할 수 있습니다.
 * 
 * 주요 기능:
 * - 기본 통계 카운트 조회 (사용자, 게시글, 댓글, 파일)
 * - 최근 활동 조회 (게시글, 댓글)
 * - 통합 대시보드 통계 조회 (한 번의 API 호출로 모든 데이터)
 * 
 * 사용법:
 * import { getDashboardStatistics } from '@/services/statisticsApi'
 * 
 * // 통합 통계 조회 (권장)
 * const data = await getDashboardStatistics()
 * console.log(data.statistics)  // { userCount, boardCount, commentCount, fileCount }
 * console.log(data.recentBoards)  // 최근 게시글 5개
 * console.log(data.recentComments)  // 최근 댓글 5개
 * 
 * // 개별 통계 조회
 * const userCount = await getUserCount()
 * const boardCount = await getBoardCount()
 * 
 * 작성일: 2025년 11월 25일 (32일차)
 * 작성자: 32일차 개발 담당자
 * 
 * @author KM Portal Dev Team
 * @version 1.0
 * @since 2025-11-25
 */

import api from './api'

// ====== 기본 통계 카운트 API ======

/**
 * 총 사용자 수 조회
 * 
 * GET /api/statistics/users/count
 * 
 * 시스템에 등록된 전체 사용자 수를 조회합니다.
 * 
 * @returns {Promise<number>} 사용자 수
 * 
 * @example
 * const userCount = await getUserCount()
 * console.log(`총 사용자: ${userCount}명`)
 */
export const getUserCount = async () => {
  try {
    // API 호출
    const response = await api.get('/statistics/users/count')
    
    // 응답 데이터 반환
    return response.data
  } catch (error) {
    console.error('[Statistics API] 사용자 수 조회 실패:', error)
    throw error
  }
}

/**
 * 총 게시글 수 조회
 * 
 * GET /api/statistics/boards/count
 * 
 * 시스템에 작성된 전체 게시글 수를 조회합니다.
 * 
 * @returns {Promise<number>} 게시글 수
 * 
 * @example
 * const boardCount = await getBoardCount()
 * console.log(`총 게시글: ${boardCount}개`)
 */
export const getBoardCount = async () => {
  try {
    const response = await api.get('/statistics/boards/count')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 게시글 수 조회 실패:', error)
    throw error
  }
}

/**
 * 총 댓글 수 조회
 * 
 * GET /api/statistics/comments/count
 * 
 * 시스템에 작성된 전체 댓글 수를 조회합니다.
 * 
 * @returns {Promise<number>} 댓글 수
 * 
 * @example
 * const commentCount = await getCommentCount()
 * console.log(`총 댓글: ${commentCount}개`)
 */
export const getCommentCount = async () => {
  try {
    const response = await api.get('/statistics/comments/count')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 댓글 수 조회 실패:', error)
    throw error
  }
}

/**
 * 총 파일 수 조회
 * 
 * GET /api/statistics/files/count
 * 
 * 시스템에 업로드된 전체 파일 수를 조회합니다.
 * 
 * @returns {Promise<number>} 파일 수
 * 
 * @example
 * const fileCount = await getFileCount()
 * console.log(`총 파일: ${fileCount}개`)
 */
export const getFileCount = async () => {
  try {
    const response = await api.get('/statistics/files/count')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 파일 수 조회 실패:', error)
    throw error
  }
}

// ====== 최근 활동 API ======

/**
 * 최근 게시글 조회
 * 
 * GET /api/statistics/boards/recent
 * 
 * 최근에 작성된 게시글 5개를 조회합니다.
 * 생성일시 기준으로 내림차순 정렬됩니다.
 * 
 * @returns {Promise<Array>} 최근 게시글 배열 (최대 5개)
 * 
 * @example
 * const recentBoards = await getRecentBoards()
 * recentBoards.forEach(board => {
 *   console.log(`${board.title} - ${board.authorName}`)
 * })
 */
export const getRecentBoards = async () => {
  try {
    const response = await api.get('/statistics/boards/recent')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 최근 게시글 조회 실패:', error)
    throw error
  }
}

/**
 * 최근 댓글 조회
 * 
 * GET /api/statistics/comments/recent
 * 
 * 최근에 작성된 댓글 5개를 조회합니다.
 * 삭제된 댓글은 제외됩니다.
 * 생성일시 기준으로 내림차순 정렬됩니다.
 * 
 * @returns {Promise<Array>} 최근 댓글 배열 (최대 5개)
 * 
 * @example
 * const recentComments = await getRecentComments()
 * recentComments.forEach(comment => {
 *   console.log(`${comment.content} - ${comment.authorName}`)
 * })
 */
export const getRecentComments = async () => {
  try {
    const response = await api.get('/statistics/comments/recent')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 최근 댓글 조회 실패:', error)
    throw error
  }
}

// ====== 통합 대시보드 API ======

/**
 * 통합 대시보드 통계 조회 ⭐ 권장
 * 
 * GET /api/statistics/dashboard
 * 
 * 대시보드에 필요한 모든 통계 데이터를 한 번의 API 호출로 제공합니다.
 * 여러 번의 API 호출을 줄여 네트워크 효율성을 높이고 로딩 시간을 단축시킵니다.
 * 
 * 포함 데이터:
 * - statistics: 기본 통계 카운트 (userCount, boardCount, commentCount, fileCount)
 * - recentBoards: 최근 게시글 5개
 * - recentComments: 최근 댓글 5개
 * 
 * @returns {Promise<Object>} 통합 대시보드 통계 객체
 * @returns {Object} return.statistics - 기본 통계 카운트
 * @returns {number} return.statistics.userCount - 총 사용자 수
 * @returns {number} return.statistics.boardCount - 총 게시글 수
 * @returns {number} return.statistics.commentCount - 총 댓글 수
 * @returns {number} return.statistics.fileCount - 총 파일 수
 * @returns {Array} return.recentBoards - 최근 게시글 목록
 * @returns {Array} return.recentComments - 최근 댓글 목록
 * 
 * @example
 * // Dashboard.vue mounted() 훅에서 사용
 * async mounted() {
 *   try {
 *     const data = await getDashboardStatistics()
 *     
 *     // 통계 데이터
 *     this.statistics = data.statistics
 *     console.log(`사용자: ${data.statistics.userCount}명`)
 *     console.log(`게시글: ${data.statistics.boardCount}개`)
 *     console.log(`댓글: ${data.statistics.commentCount}개`)
 *     console.log(`파일: ${data.statistics.fileCount}개`)
 *     
 *     // 최근 활동
 *     this.recentBoards = data.recentBoards
 *     this.recentComments = data.recentComments
 *     
 *   } catch (error) {
 *     console.error('통계 로드 실패:', error)
 *   }
 * }
 */
export const getDashboardStatistics = async () => {
  try {
    // 개발 모드에서 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[Statistics API] 대시보드 통계 조회 시작')
    }
    
    // API 호출
    const response = await api.get('/statistics/dashboard')
    
    // 개발 모드에서 응답 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('[Statistics API] 대시보드 통계 조회 성공')
      console.log('[Statistics API] 사용자 수:', response.data.statistics.userCount)
      console.log('[Statistics API] 게시글 수:', response.data.statistics.boardCount)
      console.log('[Statistics API] 댓글 수:', response.data.statistics.commentCount)
      console.log('[Statistics API] 파일 수:', response.data.statistics.fileCount)
      console.log('[Statistics API] 최근 게시글:', response.data.recentBoards.length + '개')
      console.log('[Statistics API] 최근 댓글:', response.data.recentComments.length + '개')
    }
    
    // 응답 데이터 반환
    return response.data
  } catch (error) {
    console.error('[Statistics API] 대시보드 통계 조회 실패:', error)
    
    // 에러 정보 로깅
    if (error.response) {
      // 서버가 2xx 범위 밖의 상태 코드로 응답
      console.error('[Statistics API] 응답 상태:', error.response.status)
      console.error('[Statistics API] 응답 데이터:', error.response.data)
    } else if (error.request) {
      // 요청은 전송되었지만 응답이 없음
      console.error('[Statistics API] 서버 응답 없음')
    } else {
      // 요청 설정 중 에러 발생
      console.error('[Statistics API] 요청 설정 오류:', error.message)
    }
    
    throw error
  }
}

// ====== 일별 통계 API (선택사항) ======

/**
 * 오늘 작성된 게시글 수 조회
 * 
 * GET /api/statistics/boards/today
 * 
 * 오늘(당일) 작성된 게시글 수를 조회합니다.
 * 일일 활동량을 보여줄 때 사용할 수 있습니다.
 * 
 * @returns {Promise<number>} 오늘 작성된 게시글 수
 * 
 * @example
 * const todayBoards = await getTodayBoardCount()
 * console.log(`오늘 작성된 게시글: ${todayBoards}개`)
 */
export const getTodayBoardCount = async () => {
  try {
    const response = await api.get('/statistics/boards/today')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 오늘 작성된 게시글 수 조회 실패:', error)
    throw error
  }
}

/**
 * 오늘 작성된 댓글 수 조회
 * 
 * GET /api/statistics/comments/today
 * 
 * 오늘(당일) 작성된 댓글 수를 조회합니다.
 * 일일 활동량을 보여줄 때 사용할 수 있습니다.
 * 
 * @returns {Promise<number>} 오늘 작성된 댓글 수
 * 
 * @example
 * const todayComments = await getTodayCommentCount()
 * console.log(`오늘 작성된 댓글: ${todayComments}개`)
 */
export const getTodayCommentCount = async () => {
  try {
    const response = await api.get('/statistics/comments/today')
    return response.data
  } catch (error) {
    console.error('[Statistics API] 오늘 작성된 댓글 수 조회 실패:', error)
    throw error
  }
}

// ====== Default Export ======

/**
 * Default export로 모든 함수를 객체로 제공
 * 
 * 사용법:
 * import statisticsApi from '@/services/statisticsApi'
 * 
 * const data = await statisticsApi.getDashboardStatistics()
 * const userCount = await statisticsApi.getUserCount()
 */
export default {
  // 기본 통계
  getUserCount,
  getBoardCount,
  getCommentCount,
  getFileCount,
  
  // 최근 활동
  getRecentBoards,
  getRecentComments,
  
  // 통합 대시보드 (권장)
  getDashboardStatistics,
  
  // 일별 통계 (선택사항)
  getTodayBoardCount,
  getTodayCommentCount
}

/*
 * ====== 사용 예시 ======
 *
 * 1. Named import (권장)
 *    import { getDashboardStatistics } from '@/services/statisticsApi'
 *    
 *    const data = await getDashboardStatistics()
 *
 * 2. Default import
 *    import statisticsApi from '@/services/statisticsApi'
 *    
 *    const data = await statisticsApi.getDashboardStatistics()
 *
 * 3. Dashboard.vue에서 사용
 *    <script>
 *    import { getDashboardStatistics } from '@/services/statisticsApi'
 *    
 *    export default {
 *      data() {
 *        return {
 *          loading: false,
 *          statistics: {
 *            userCount: 0,
 *            boardCount: 0,
 *            commentCount: 0,
 *            fileCount: 0
 *          },
 *          recentBoards: [],
 *          recentComments: [],
 *          error: null
 *        }
 *      },
 *      
 *      async mounted() {
 *        await this.loadStatistics()
 *      },
 *      
 *      methods: {
 *        async loadStatistics() {
 *          this.loading = true
 *          this.error = null
 *          
 *          try {
 *            // 한 번의 API 호출로 모든 데이터 로드
 *            const data = await getDashboardStatistics()
 *            
 *            // 통계 데이터 설정
 *            this.statistics = data.statistics
 *            
 *            // 최근 활동 설정
 *            this.recentBoards = data.recentBoards
 *            this.recentComments = data.recentComments
 *            
 *          } catch (error) {
 *            console.error('통계 로드 실패:', error)
 *            this.error = '통계 데이터를 불러오는데 실패했습니다.'
 *          } finally {
 *            this.loading = false
 *          }
 *        }
 *      }
 *    }
 *    </script>
 */

/*
 * ====== 에러 처리 ======
 *
 * 각 함수는 에러가 발생하면 throw합니다.
 * 호출하는 쪽에서 try-catch로 에러를 처리해야 합니다.
 *
 * 에러 타입:
 * 1. Network Error - 서버 연결 실패
 * 2. 401 Unauthorized - 인증 실패 (토큰 만료 등)
 * 3. 403 Forbidden - 권한 없음
 * 4. 404 Not Found - API 엔드포인트 없음
 * 5. 500 Internal Server Error - 서버 오류
 *
 * 예시:
 * try {
 *   const data = await getDashboardStatistics()
 * } catch (error) {
 *   if (error.response?.status === 401) {
 *     // 인증 실패 - 로그인 페이지로 리디렉션
 *     this.$router.push('/login')
 *   } else if (error.response?.status === 403) {
 *     // 권한 없음
 *     this.$message.error('통계를 볼 권한이 없습니다.')
 *   } else {
 *     // 기타 에러
 *     this.$message.error('통계 데이터를 불러오는데 실패했습니다.')
 *   }
 * }
 */

/*
 * ====== 성능 최적화 팁 ======
 *
 * 1. 통합 API 사용
 *    ✅ const data = await getDashboardStatistics()
 *    ❌ await getUserCount(), await getBoardCount(), ...
 *
 * 2. 로딩 상태 표시
 *    - Skeleton 로더 사용
 *    - 사용자 경험 개선
 *
 * 3. 에러 상태 표시
 *    - 에러 메시지 표시
 *    - 재시도 버튼 제공
 *
 * 4. 캐싱 (향후 확장)
 *    - 일정 시간 동안 캐시된 데이터 사용
 *    - 새로고침 버튼으로 강제 업데이트
 */