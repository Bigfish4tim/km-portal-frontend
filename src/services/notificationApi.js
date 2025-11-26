/**
 * 알림 API 통신 모듈
 *
 * 백엔드의 알림 API와 통신하는 모든 함수를 제공합니다.
 * api.js의 axios 인스턴스를 사용하여 JWT 토큰 처리가 자동으로 됩니다.
 *
 * API 엔드포인트:
 * - GET    /api/notifications              : 알림 목록 조회 (페이징)
 * - GET    /api/notifications/unread-count : 읽지 않은 알림 개수 조회
 * - GET    /api/notifications/recent       : 최근 알림 조회 (드롭다운용)
 * - PUT    /api/notifications/{id}/read    : 개별 알림 읽음 처리
 * - PUT    /api/notifications/read-all     : 전체 알림 읽음 처리
 * - DELETE /api/notifications/{id}         : 알림 삭제
 *
 * 작성일: 2025년 11월 26일 (34일차)
 * 작성자: 34일차 개발 담당자
 *
 * @author KM Portal Dev Team
 * @version 1.0
 * @since 2025-11-26
 */

import api from './api'

/**
 * 알림 API 객체
 *
 * 알림 관련 모든 API 호출 함수를 포함합니다.
 *
 * 사용 예시:
 * import notificationApi from '@/services/notificationApi'
 *
 * // 알림 목록 조회
 * const response = await notificationApi.getNotifications({ page: 0, size: 10 })
 *
 * // 읽지 않은 알림 개수
 * const count = await notificationApi.getUnreadCount()
 */
const notificationApi = {

  // ====== 알림 조회 API ======

  /**
   * 알림 목록 조회 (페이징)
   *
   * 현재 로그인한 사용자의 알림 목록을 조회합니다.
   *
   * @param {Object} params - 조회 파라미터
   * @param {number} params.page - 페이지 번호 (0부터 시작, 기본값: 0)
   * @param {number} params.size - 페이지 크기 (기본값: 10)
   * @param {boolean|null} params.isRead - 읽음 여부 필터 (선택사항)
   * @param {string|null} params.type - 알림 유형 필터 (선택사항)
   * @returns {Promise<Object>} 알림 목록 (페이징 정보 포함)
   *
   * 사용 예시:
   * // 기본 조회
   * const response = await notificationApi.getNotifications({ page: 0, size: 10 })
   *
   * // 읽지 않은 알림만 조회
   * const unread = await notificationApi.getNotifications({
   *   page: 0,
   *   size: 10,
   *   isRead: false
   * })
   *
   * // 특정 유형만 조회
   * const comments = await notificationApi.getNotifications({
   *   page: 0,
   *   size: 10,
   *   type: 'NEW_COMMENT'
   * })
   *
   * 응답 형식:
   * {
   *   success: true,
   *   data: {
   *     content: [ { id: 1, title: '새 댓글', ... }, ... ],
   *     totalElements: 50,
   *     totalPages: 5,
   *     number: 0,
   *     size: 10,
   *     first: true,
   *     last: false
   *   }
   * }
   */
  async getNotifications(params = {}) {
    try {
      // 기본값 설정
      const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        ...params  // isRead, type 등 추가 파라미터
      }

      // null/undefined 값 제거 (API에서 불필요한 파라미터 방지)
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key]
        }
      })

      const response = await api.get('/notifications', { params: queryParams })
      return response.data

    } catch (error) {
      console.error('[NotificationAPI] 알림 목록 조회 실패:', error)
      throw error
    }
  },

  /**
   * 읽지 않은 알림 개수 조회
   *
   * 헤더의 알림 뱃지에 표시할 숫자를 조회합니다.
   * 이 API는 자주 호출되므로 가볍게 유지합니다.
   *
   * @returns {Promise<number>} 읽지 않은 알림 개수
   *
   * 사용 예시:
   * const count = await notificationApi.getUnreadCount()
   * console.log(`읽지 않은 알림: ${count}개`)
   *
   * 응답 형식:
   * {
   *   success: true,
   *   data: { count: 5 }
   * }
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count')
      return response.data.data?.count || 0

    } catch (error) {
      console.error('[NotificationAPI] 읽지 않은 알림 개수 조회 실패:', error)
      // 에러 시 0 반환 (UI에서 뱃지 숨김)
      return 0
    }
  },

  /**
   * 최근 알림 조회 (드롭다운용)
   *
   * 헤더의 알림 드롭다운에 표시할 최근 알림을 조회합니다.
   *
   * @param {number} limit - 조회할 개수 (기본값: 5, 최대: 10)
   * @returns {Promise<Object>} 최근 알림 목록과 읽지 않은 개수
   *
   * 사용 예시:
   * const { notifications, unreadCount } = await notificationApi.getRecentNotifications(5)
   *
   * 응답 형식:
   * {
   *   success: true,
   *   data: {
   *     notifications: [ { id: 1, title: '새 댓글', ... }, ... ],
   *     unreadCount: 5
   *   }
   * }
   */
  async getRecentNotifications(limit = 5) {
    try {
      const response = await api.get('/notifications/recent', {
        params: { limit: Math.min(limit, 10) }  // 최대 10개로 제한
      })
      return response.data.data || { notifications: [], unreadCount: 0 }

    } catch (error) {
      console.error('[NotificationAPI] 최근 알림 조회 실패:', error)
      // 에러 시 빈 배열 반환
      return { notifications: [], unreadCount: 0 }
    }
  },

  /**
   * 단일 알림 상세 조회
   *
   * @param {number} id - 알림 ID
   * @returns {Promise<Object>} 알림 상세 정보
   */
  async getNotification(id) {
    try {
      const response = await api.get(`/notifications/${id}`)
      return response.data

    } catch (error) {
      console.error('[NotificationAPI] 알림 상세 조회 실패:', error)
      throw error
    }
  },

  // ====== 알림 읽음 처리 API ======

  /**
   * 개별 알림 읽음 처리
   *
   * 특정 알림을 읽음 상태로 변경합니다.
   *
   * @param {number} id - 알림 ID
   * @returns {Promise<Object>} 읽음 처리된 알림 정보
   *
   * 사용 예시:
   * await notificationApi.markAsRead(123)
   *
   * 응답 형식:
   * {
   *   success: true,
   *   message: '알림을 읽음 처리했습니다.',
   *   data: { id: 123, isRead: true, ... }
   * }
   */
  async markAsRead(id) {
    try {
      const response = await api.put(`/notifications/${id}/read`)
      return response.data

    } catch (error) {
      console.error('[NotificationAPI] 알림 읽음 처리 실패:', error)
      throw error
    }
  },

  /**
   * 전체 알림 읽음 처리
   *
   * 현재 사용자의 모든 읽지 않은 알림을 읽음 상태로 변경합니다.
   *
   * @returns {Promise<Object>} 읽음 처리 결과 (처리된 개수 포함)
   *
   * 사용 예시:
   * const result = await notificationApi.markAllAsRead()
   * console.log(`${result.data.count}개의 알림을 읽음 처리했습니다.`)
   *
   * 응답 형식:
   * {
   *   success: true,
   *   message: '10개의 알림을 읽음 처리했습니다.',
   *   data: { count: 10 }
   * }
   */
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all')
      return response.data

    } catch (error) {
      console.error('[NotificationAPI] 전체 알림 읽음 처리 실패:', error)
      throw error
    }
  },

  // ====== 알림 삭제 API ======

  /**
   * 알림 삭제
   *
   * 특정 알림을 삭제합니다. (Soft Delete)
   *
   * @param {number} id - 알림 ID
   * @returns {Promise<Object>} 삭제 결과
   *
   * 사용 예시:
   * await notificationApi.deleteNotification(123)
   *
   * 응답 형식:
   * {
   *   success: true,
   *   message: '알림이 삭제되었습니다.'
   * }
   */
  async deleteNotification(id) {
    try {
      const response = await api.delete(`/notifications/${id}`)
      return response.data

    } catch (error) {
      console.error('[NotificationAPI] 알림 삭제 실패:', error)
      throw error
    }
  },

  // ====== 헬퍼 함수 ======

  /**
   * 알림 유형별 아이콘 클래스 반환
   *
   * 프론트엔드에서 알림 유형에 따라 다른 아이콘을 표시할 때 사용합니다.
   *
   * @param {string} type - 알림 유형
   * @returns {string} Element Plus 아이콘 이름
   *
   * 사용 예시:
   * const icon = notificationApi.getIconByType('NEW_COMMENT')
   * // 결과: 'ChatDotRound'
   */
  getIconByType(type) {
    const iconMap = {
      'NEW_COMMENT': 'ChatDotRound',      // 새 댓글
      'NEW_REPLY': 'ChatDotRound',        // 새 답글
      'NEW_BOARD': 'Document',            // 새 게시글
      'MENTION': 'ChatLineRound',         // 멘션
      'SYSTEM': 'InfoFilled',             // 시스템 알림
      'FILE_SHARED': 'Folder',            // 파일 공유
      'BOARD_PINNED': 'Star',             // 게시글 고정
      'ROLE_CHANGED': 'User'              // 권한 변경
    }
    return iconMap[type] || 'Bell'
  },

  /**
   * 알림 유형별 한글 이름 반환
   *
   * @param {string} type - 알림 유형
   * @returns {string} 알림 유형의 한글 이름
   *
   * 사용 예시:
   * const typeName = notificationApi.getTypeDisplayName('NEW_COMMENT')
   * // 결과: '새 댓글'
   */
  getTypeDisplayName(type) {
    const nameMap = {
      'NEW_COMMENT': '새 댓글',
      'NEW_REPLY': '새 답글',
      'NEW_BOARD': '새 게시글',
      'MENTION': '멘션',
      'SYSTEM': '시스템',
      'FILE_SHARED': '파일 공유',
      'BOARD_PINNED': '게시글 고정',
      'ROLE_CHANGED': '권한 변경'
    }
    return nameMap[type] || '알림'
  },

  /**
   * 알림 유형 목록 반환
   *
   * 필터링 드롭다운에서 사용합니다.
   *
   * @returns {Array} 알림 유형 목록
   */
  getNotificationTypes() {
    return [
      { value: 'NEW_COMMENT', label: '새 댓글' },
      { value: 'NEW_REPLY', label: '새 답글' },
      { value: 'NEW_BOARD', label: '새 게시글' },
      { value: 'MENTION', label: '멘션' },
      { value: 'SYSTEM', label: '시스템' },
      { value: 'FILE_SHARED', label: '파일 공유' },
      { value: 'BOARD_PINNED', label: '게시글 고정' },
      { value: 'ROLE_CHANGED', label: '권한 변경' }
    ]
  },

  /**
   * 상대적 시간 형식으로 변환
   *
   * 알림 목록에서 "3분 전", "1시간 전" 등으로 표시할 때 사용합니다.
   *
   * @param {string|Date} dateTime - 변환할 날짜/시간
   * @returns {string} 상대적 시간 문자열
   *
   * 사용 예시:
   * const relativeTime = notificationApi.formatRelativeTime('2025-11-26T10:30:00')
   * // 결과: '30분 전'
   */
  formatRelativeTime(dateTime) {
    if (!dateTime) return ''

    const date = new Date(dateTime)
    const now = new Date()
    const diffMs = now - date
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return '방금 전'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      // 7일 이상이면 날짜 표시
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}.${month}.${day}`
    }
  },

  /**
   * 전체 날짜/시간 형식으로 변환
   *
   * @param {string|Date} dateTime - 변환할 날짜/시간
   * @returns {string} 'YYYY.MM.DD HH:mm' 형식의 문자열
   *
   * 사용 예시:
   * const formatted = notificationApi.formatDateTime('2025-11-26T10:30:00')
   * // 결과: '2025.11.26 10:30'
   */
  formatDateTime(dateTime) {
    if (!dateTime) return ''

    const date = new Date(dateTime)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hours}:${minutes}`
  }
}

// 기본 export
export default notificationApi

// 개별 함수 export (필요시 사용)
export const {
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getIconByType,
  getTypeDisplayName,
  formatRelativeTime,
  formatDateTime
} = notificationApi