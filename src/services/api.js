// api.js - Axios 기반 API 서비스 설정
// 파일 위치: src/services/api.js

import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
// store는 3일차에 생성할 예정이므로 주석 처리
// import store from '@/store'

/**
 * API 기본 설정
 * 
 * 이 파일은 모든 HTTP 요청의 기반이 되는 Axios 인스턴스를 설정합니다.
 * JWT 토큰 관리, 요청/응답 인터셉터, 오류 처리 등을 포함합니다.
 */

// ====== 기본 설정 ======

/**
 * 환경별 API Base URL 설정
 * 
 * 개발환경: http://localhost:8080/api (백엔드 개발 서버)
 * 운영환경: 실제 서버 도메인 (향후 설정)
 */
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080/api'  // 개발 환경: 로컬 Spring Boot 서버
  : '/api'                       // 운영 환경: 같은 도메인의 /api 경로

/**
 * Axios 인스턴스 생성
 * 
 * 모든 API 요청에서 사용할 기본 설정을 포함한 Axios 인스턴스
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,                 // 요청 타임아웃: 15초
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // CORS 설정 (개발 환경에서 중요)
  withCredentials: false          // JWT 토큰 사용시에는 false
})

// ====== 요청 인터셉터 (Request Interceptor) ======

/**
 * 모든 요청 전에 실행되는 인터셉터
 * 
 * 주요 기능:
 * 1. JWT 토큰을 Authorization 헤더에 자동 추가
 * 2. 요청 로깅 (개발 환경)
 * 3. 요청 데이터 전처리
 */
apiClient.interceptors.request.use(
  (config) => {
    // 개발 환경에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      if (config.data) {
        console.log('📤 Request Data:', config.data)
      }
    }
    
    // JWT 토큰 자동 추가 (로컬스토리지에서 가져오기)
    // 3일차에 인증 시스템 구축 후 활성화할 예정
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 시작 시간 기록 (성능 측정용)
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// ====== 응답 인터셉터 (Response Interceptor) ======

/**
 * 모든 응답 후에 실행되는 인터셉터
 * 
 * 주요 기능:
 * 1. 성공 응답 처리 및 데이터 추출
 * 2. 에러 응답 통합 처리
 * 3. JWT 토큰 갱신 처리
 * 4. 응답 로깅 (개발 환경)
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 시간 계산 (성능 측정)
    if (response.config.metadata) {
      const endTime = new Date()
      const duration = endTime - response.config.metadata.startTime
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
        console.log('📥 Response Data:', response.data)
      }
    }
    
    // 백엔드의 ApiResponse 구조에 맞춘 데이터 추출
    if (response.data && typeof response.data === 'object') {
      // 성공 응답인 경우 data 필드 반환
      if (response.data.success === true) {
        return response.data
      }
      // 실패 응답인 경우도 일단 전체 응답 반환 (에러 핸들러에서 처리)
      return response.data
    }
    
    // 일반적인 응답 데이터 반환
    return response.data
  },
  async (error) => {
    // 에러 발생 시간 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error.response?.status, error.response?.data || error.message)
    }
    
    const { response } = error
    
    // 응답이 있는 경우 (서버 에러)
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          // 잘못된 요청 - 사용자에게 구체적인 메시지 표시
          handleBadRequest(data)
          break
          
        case 401:
          // 인증 실패 - 로그인 페이지로 리다이렉트
          await handleUnauthorized()
          break
          
        case 403:
          // 권한 없음 - 접근 거부 메시지 표시
          handleForbidden(data)
          break
          
        case 404:
          // 리소스 없음
          handleNotFound(data)
          break
          
        case 409:
          // 충돌 (중복 데이터 등)
          handleConflict(data)
          break
          
        case 422:
          // 검증 실패
          handleValidationError(data)
          break
          
        case 500:
        case 502:
        case 503:
        case 504:
          // 서버 오류
          handleServerError(data, status)
          break
          
        default:
          // 기타 오류
          handleGenericError(data, status)
      }
    } else if (error.code === 'ECONNABORTED') {
      // 요청 타임아웃
      ElMessage.error('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.')
    } else if (error.message === 'Network Error') {
      // 네트워크 오류
      ElMessage.error('네트워크 연결을 확인해주세요.')
    } else {
      // 기타 오류
      ElMessage.error('알 수 없는 오류가 발생했습니다.')
    }
    
    return Promise.reject(error)
  }
)

// ====== 에러 처리 함수들 ======

/**
 * 400 Bad Request 처리
 */
function handleBadRequest(data) {
  const message = data?.message || '잘못된 요청입니다.'
  ElMessage.error(message)
  
  // 검증 오류 상세 정보가 있는 경우 표시
  if (data?.data && Array.isArray(data.data)) {
    data.data.forEach(error => {
      ElMessage.error(error)
    })
  }
}

/**
 * 401 Unauthorized 처리 (인증 실패)
 */
async function handleUnauthorized() {
  // JWT 토큰 제거
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  
  // Vuex 상태 초기화 (3일차에 활성화)
  // store.dispatch('auth/logout')
  
  ElMessage.error('로그인이 필요합니다.')
  
  // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
  if (router.currentRoute.value.path !== '/login') {
    await router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  }
}

/**
 * 403 Forbidden 처리 (권한 없음)
 */
function handleForbidden(data) {
  const message = data?.message || '접근 권한이 없습니다.'
  ElMessage.error(message)
}

/**
 * 404 Not Found 처리
 */
function handleNotFound(data) {
  const message = data?.message || '요청한 리소스를 찾을 수 없습니다.'
  ElMessage.error(message)
}

/**
 * 409 Conflict 처리 (중복 데이터)
 */
function handleConflict(data) {
  const message = data?.message || '이미 존재하는 데이터입니다.'
  ElMessage.error(message)
}

/**
 * 422 Validation Error 처리
 */
function handleValidationError(data) {
  const message = data?.message || '입력 데이터가 올바르지 않습니다.'
  ElMessage.error(message)
  
  // 개별 필드 검증 오류 표시
  if (data?.data && Array.isArray(data.data)) {
    data.data.slice(0, 3).forEach(error => { // 최대 3개까지만 표시
      ElMessage.error(error)
    })
  }
}

/**
 * 500+ Server Error 처리
 */
function handleServerError(data, status) {
  const message = data?.message || '서버에서 오류가 발생했습니다.'
  
  ElMessage.error(`서버 오류 (${status}): ${message}`)
  
  // 심각한 서버 오류의 경우 관리자에게 알림 (향후 구현)
  if (status >= 500) {
    console.error('Critical Server Error:', data)
  }
}

/**
 * 기타 오류 처리
 */
function handleGenericError(data, status) {
  const message = data?.message || '알 수 없는 오류가 발생했습니다.'
  ElMessage.error(`오류 (${status}): ${message}`)
}

// ====== 공통 API 메서드들 ======

/**
 * 공통 API 호출 래퍼 함수들
 * 
 * 각 서비스 파일에서 이 함수들을 사용하여 API를 호출합니다.
 */
export const api = {
  /**
   * GET 요청
   */
  get(url, config = {}) {
    return apiClient.get(url, config)
  },
  
  /**
   * POST 요청
   */
  post(url, data = {}, config = {}) {
    return apiClient.post(url, data, config)
  },
  
  /**
   * PUT 요청
   */
  put(url, data = {}, config = {}) {
    return apiClient.put(url, data, config)
  },
  
  /**
   * PATCH 요청
   */
  patch(url, data = {}, config = {}) {
    return apiClient.patch(url, data, config)
  },
  
  /**
   * DELETE 요청
   */
  delete(url, config = {}) {
    return apiClient.delete(url, config)
  },
  
  /**
   * 파일 업로드 요청
   */
  upload(url, formData, onUploadProgress) {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },
  
  /**
   * 파일 다운로드 요청
   */
  download(url, config = {}) {
    return apiClient.get(url, {
      ...config,
      responseType: 'blob'
    })
  }
}

// ====== 헬스체크 API (테스트용) ======

/**
 * 서버 헬스체크 API
 * 
 * 백엔드 서버가 정상 동작하는지 확인하는 테스트 API
 * 1일차에 생성한 HealthController와 연동
 */
export const healthCheck = {
  /**
   * 서버 상태 확인
   */
  async checkStatus() {
    try {
      const response = await api.get('/health/status')
      return response
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

// ====== 기본 내보내기 ======

export default apiClient

/* 
 * ====== 사용법 예시 ======
 * 
 * 1. 다른 서비스 파일에서 api 객체 사용:
 * import { api } from '@/services/api'
 * const users = await api.get('/users')
 * 
 * 2. 직접 apiClient 사용:
 * import apiClient from '@/services/api'
 * const response = await apiClient.get('/users')
 * 
 * 3. 헬스체크 사용:
 * import { healthCheck } from '@/services/api'
 * const status = await healthCheck.checkStatus()
 */