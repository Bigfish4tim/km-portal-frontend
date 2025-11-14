/**
 * 파일 관리 API
 * 
 * 파일 업로드, 다운로드, 삭제, 목록 조회 등의 API 호출 함수를 제공합니다.
 * 
 * 주요 기능:
 * - uploadFile: 파일 업로드 (진행률 추적 지원)
 * - getFiles: 파일 목록 조회 (페이징)
 * - searchFiles: 파일 검색 (21일차 추가) ✨
 * - getMyFiles: 내가 업로드한 파일 목록
 * - getFileById: 파일 상세 조회
 * - downloadFile: 파일 다운로드
 * - deleteFile: 파일 삭제
 * - getFileStatistics: 파일 통계 조회
 * 
 * @author KM Portal Team
 * @since 2025-11-13
 * 수정일: 2025-11-14 (21일차) - 파일 검색 기능 추가
 */

import api from './api'

/**
 * 파일 업로드
 * 
 * FormData를 사용하여 multipart/form-data 형식으로 파일을 업로드합니다.
 * 업로드 진행률을 실시간으로 추적할 수 있습니다.
 * 
 * @param {File} file - 업로드할 파일 객체 (File 타입, el-upload의 경우 file.raw)
 * @param {string} description - 파일 설명 (선택사항)
 * @param {Function} onUploadProgress - 업로드 진행률 콜백 함수
 *                                       progressEvent.loaded: 업로드된 바이트
 *                                       progressEvent.total: 전체 바이트
 * @returns {Promise<Object>} 업로드된 파일 정보
 * 
 * @example
 * // 기본 사용법
 * const fileInfo = await uploadFile(file.raw)
 * 
 * @example
 * // 진행률 추적
 * await uploadFile(
 *   file.raw,
 *   '회의 자료',
 *   (progressEvent) => {
 *     const percentCompleted = Math.round(
 *       (progressEvent.loaded * 100) / progressEvent.total
 *     )
 *     console.log(`업로드 진행률: ${percentCompleted}%`)
 *   }
 * )
 */
export const uploadFile = (file, description = '', onUploadProgress = null) => {
  // FormData 객체 생성
  // multipart/form-data 형식으로 파일을 전송하기 위해 사용
  const formData = new FormData()
  
  // 파일 추가
  // 백엔드의 @RequestParam("file") 파라미터명과 일치해야 함
  formData.append('file', file)
  
  // 설명 추가 (선택사항)
  if (description) {
    formData.append('description', description)
  }

  // Axios 요청 설정
  const config = {
    headers: {
      // Content-Type을 명시적으로 설정하지 않음
      // Axios가 자동으로 multipart/form-data로 설정하며,
      // boundary 값도 자동으로 생성
      // 'Content-Type': 'multipart/form-data' // ❌ 명시하지 않음
    }
  }

  // 진행률 콜백이 제공된 경우 설정에 추가
  if (onUploadProgress && typeof onUploadProgress === 'function') {
    config.onUploadProgress = onUploadProgress
  }

  // POST 요청으로 파일 업로드
  // api 인스턴스는 이미 baseURL과 인증 헤더가 설정되어 있음
  return api.post('/files', formData, config)
}

/**
 * 파일 목록 조회 (페이징)
 * 
 * 전체 파일 목록을 페이징 방식으로 조회합니다.
 * ADMIN, MANAGER 권한이 필요합니다.
 * 
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} size - 페이지 크기 (한 페이지당 항목 수)
 * @param {string} sort - 정렬 기준 (예: 'createdAt,desc' 또는 'fileName,asc')
 * @returns {Promise<Object>} 페이징된 파일 목록
 *                            content: 파일 배열
 *                            totalElements: 전체 파일 수
 *                            totalPages: 전체 페이지 수
 *                            number: 현재 페이지 번호
 * 
 * @example
 * // 첫 페이지, 10개씩, 최신순
 * const response = await getFiles(0, 10, 'createdAt,desc')
 * console.log(response.data.content) // 파일 배열
 * console.log(response.data.totalElements) // 전체 파일 수
 */
export const getFiles = (page = 0, size = 10, sort = 'createdAt,desc') => {
  return api.get('/files', {
    params: {
      page,
      size,
      sort
    }
  })
}

/**
 * ✨ 21일차 추가: 파일 검색
 * 
 * 복합 검색 조건으로 파일을 검색합니다.
 * 
 * 검색 조건:
 * - keyword: 파일명 또는 설명에 포함된 키워드
 * - category: 파일 카테고리 (DOCUMENT, IMAGE 등)
 * - userId: 특정 사용자가 업로드한 파일만
 * - startDate: 검색 시작 날짜
 * - endDate: 검색 종료 날짜
 * 
 * @param {Object} searchParams - 검색 조건 객체
 * @param {string} searchParams.keyword - 검색 키워드 (선택)
 * @param {string} searchParams.category - 파일 카테고리 (선택)
 * @param {number} searchParams.userId - 사용자 ID (선택)
 * @param {string} searchParams.startDate - 시작 날짜 ISO 문자열 (선택)
 * @param {string} searchParams.endDate - 종료 날짜 ISO 문자열 (선택)
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} size - 페이지 크기
 * @param {string} sort - 정렬 기준
 * @returns {Promise<Object>} 검색된 파일 목록
 * 
 * @example
 * // 키워드로 검색
 * const result = await searchFiles({ keyword: '회의록' }, 0, 10)
 * 
 * @example
 * // 카테고리와 키워드로 검색
 * const result = await searchFiles(
 *   { keyword: '보고서', category: 'DOCUMENT' },
 *   0, 20
 * )
 * 
 * @example
 * // 날짜 범위로 검색
 * const result = await searchFiles(
 *   {
 *     startDate: '2025-11-01T00:00:00',
 *     endDate: '2025-11-14T23:59:59'
 *   },
 *   0, 10
 * )
 * 
 * @example
 * // 특정 사용자의 파일 검색
 * const result = await searchFiles(
 *   { userId: 1, keyword: '계획서' },
 *   0, 10
 * )
 * 
 * @since 2025-11-14 (21일차)
 */
export const searchFiles = (searchParams = {}, page = 0, size = 10, sort = 'createdAt,desc') => {
  // 검색 파라미터 구성
  const params = {
    page,
    size,
    sort
  }

  // keyword가 있으면 추가
  if (searchParams.keyword) {
    params.keyword = searchParams.keyword
  }

  // category가 있으면 추가
  if (searchParams.category) {
    params.category = searchParams.category
  }

  // userId가 있으면 추가
  if (searchParams.userId) {
    params.userId = searchParams.userId
  }

  // startDate가 있으면 추가
  if (searchParams.startDate) {
    params.startDate = searchParams.startDate
  }

  // endDate가 있으면 추가
  if (searchParams.endDate) {
    params.endDate = searchParams.endDate
  }

  console.log('🔍 파일 검색 요청:', params)

  // GET 요청으로 검색 API 호출
  return api.get('/files/search', { params })
}

/**
 * 내가 업로드한 파일 목록 조회
 * 
 * 현재 로그인한 사용자가 업로드한 파일 목록을 조회합니다.
 * 모든 인증된 사용자가 호출 가능합니다.
 * 
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} size - 페이지 크기
 * @param {string} sort - 정렬 기준
 * @returns {Promise<Object>} 페이징된 파일 목록
 * 
 * @example
 * const myFiles = await getMyFiles(0, 20)
 */
export const getMyFiles = (page = 0, size = 10, sort = 'createdAt,desc') => {
  return api.get('/files/my', {
    params: {
      page,
      size,
      sort
    }
  })
}

/**
 * 파일 상세 조회
 * 
 * 특정 파일의 상세 정보를 조회합니다.
 * 
 * @param {number} fileId - 파일 ID
 * @returns {Promise<Object>} 파일 상세 정보
 *                            id, originalName, storedName, fileSize, contentType,
 *                            uploadedBy, createdAt, updatedAt 등
 * 
 * @example
 * const fileDetail = await getFileById(123)
 * console.log(fileDetail.data.originalName)
 */
export const getFileById = (fileId) => {
  return api.get(`/files/${fileId}`)
}

/**
 * 파일 다운로드
 * 
 * 파일을 다운로드합니다.
 * responseType을 'blob'으로 설정하여 바이너리 데이터를 받습니다.
 * 
 * @param {number} fileId - 파일 ID
 * @returns {Promise<Blob>} 파일 바이너리 데이터 (Blob)
 * 
 * @example
 * // 파일 다운로드 및 저장
 * const response = await downloadFile(123)
 * const blob = new Blob([response.data])
 * const url = window.URL.createObjectURL(blob)
 * const link = document.createElement('a')
 * link.href = url
 * link.download = '파일명.jpg'
 * link.click()
 * window.URL.revokeObjectURL(url)
 */
export const downloadFile = (fileId) => {
  return api.get(`/files/${fileId}/download`, {
    // responseType을 'blob'으로 설정 (중요!)
    // 이렇게 하지 않으면 바이너리 데이터가 손상됨
    responseType: 'blob'
  })
}

/**
 * 파일 삭제
 * 
 * 파일을 삭제합니다 (Soft Delete 방식).
 * 파일을 업로드한 본인 또는 ADMIN/MANAGER 권한이 필요합니다.
 * 
 * 실제 파일은 서버에 남아있고, isDeleted 플래그만 true로 변경됩니다.
 * 
 * @param {number} fileId - 파일 ID
 * @returns {Promise<void>}
 * 
 * @example
 * await deleteFile(123)
 * ElMessage.success('파일이 삭제되었습니다')
 */
export const deleteFile = (fileId) => {
  return api.delete(`/files/${fileId}`)
}

/**
 * 파일 통계 조회
 * 
 * 전체 파일 통계 정보를 조회합니다.
 * ADMIN, MANAGER 권한이 필요합니다.
 * 
 * @returns {Promise<Object>} 통계 정보
 *                            totalFiles: 전체 파일 수
 *                            totalSize: 전체 파일 크기 (bytes)
 *                            totalActiveFiles: 활성 파일 수
 *                            totalDeletedFiles: 삭제된 파일 수
 * 
 * @example
 * const stats = await getFileStatistics()
 * console.log(`전체 파일: ${stats.data.totalFiles}개`)
 * console.log(`총 용량: ${(stats.data.totalSize / 1024 / 1024).toFixed(2)}MB`)
 */
export const getFileStatistics = () => {
  return api.get('/files/statistics')
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 * 
 * 유틸리티 함수로, API 호출과는 관련 없지만 파일 크기를 표시할 때 유용합니다.
 * 
 * @param {number} bytes - 바이트 단위 파일 크기
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {string} 변환된 파일 크기 문자열 (예: "2.50 MB")
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(2048000) // "1.95 MB"
 * formatFileSize(5368709120) // "5.00 GB"
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 파일 확장자 추출
 * 
 * 파일명에서 확장자를 추출합니다.
 * 
 * @param {string} filename - 파일명
 * @returns {string} 확장자 (소문자, 점 제외)
 * 
 * @example
 * getFileExtension('document.pdf') // 'pdf'
 * getFileExtension('image.JPG') // 'jpg'
 * getFileExtension('no-extension') // ''
 */
export const getFileExtension = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * 파일 타입 아이콘 가져오기
 * 
 * 파일 확장자에 따라 적절한 Element Plus 아이콘 이름을 반환합니다.
 * 
 * @param {string} filename - 파일명 또는 확장자
 * @returns {string} Element Plus 아이콘 이름
 * 
 * @example
 * getFileTypeIcon('document.pdf') // 'Document'
 * getFileTypeIcon('image.jpg') // 'Picture'
 * getFileTypeIcon('data.xlsx') // 'Document'
 */
export const getFileTypeIcon = (filename) => {
  const ext = getFileExtension(filename)
  
  // 이미지 파일
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return 'Picture'
  }
  
  // 문서 파일
  if (['doc', 'docx', 'pdf', 'txt'].includes(ext)) {
    return 'Document'
  }
  
  // 스프레드시트
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return 'Document'
  }
  
  // 프레젠테이션
  if (['ppt', 'pptx'].includes(ext)) {
    return 'Document'
  }
  
  // 압축 파일
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'FolderOpened'
  }
  
  // 비디오
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
    return 'VideoCamera'
  }
  
  // 오디오
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
    return 'Headset'
  }
  
  // 기본 아이콘
  return 'Document'
}

// 기본 내보내기 (선택사항)
export default {
  uploadFile,
  getFiles,
  searchFiles,  // ✨ 21일차 추가
  getMyFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getFileStatistics,
  formatFileSize,
  getFileExtension,
  getFileTypeIcon
}