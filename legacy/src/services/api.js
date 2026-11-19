/**
 * API 통신을 위한 Axios 설정 및 관리 모듈
 * 
 * 이 모듈은 Vue.js 애플리케이션에서 Spring Boot 백엔드와의 
 * HTTP 통신을 위한 모든 설정을 담당합니다.
 * 
 * 주요 기능:
 * - Axios 인스턴스 생성 및 기본 설정
 * - 요청/응답 인터셉터를 통한 JWT 토큰 자동 처리
 * - 토큰 만료시 자동 갱신 및 재시도
 * - 공통 에러 처리 및 로깅
 * - 개발/프로덕션 환경별 API 기본 URL 설정
 * 
 * 사용법:
 * import api from '@/services/api'
 * 
 * // GET 요청
 * const response = await api.get('/users')
 * 
 * // POST 요청  
 * const response = await api.post('/auth/login', { username, password })
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-24
 */

import axios from 'axios'
import store from '@/store'
import router from '@/router'

// API 기본 설정
const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'
const API_PREFIX = '/api'

/**
 * 메인 API 인스턴스 생성
 * 
 * 백엔드 API와의 모든 통신에 사용되는 axios 인스턴스입니다.
 * 기본 URL, 타임아웃, 공통 헤더 등을 설정합니다.
 */
const api = axios.create({
  // 백엔드 API 기본 URL 설정 (개발환경: localhost:8081)
  baseURL: `${BASE_URL}${API_PREFIX}`,
  
  // 요청 타임아웃 설정 (30초)
  timeout: 30000,
  
  // 기본 요청 헤더 설정
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // CORS 인증 정보 포함 (쿠키, 인증 헤더 등)
  withCredentials: false
})

/**
 * 토큰 갱신 중인지 확인하는 플래그
 * 동시에 여러 요청이 401 에러를 받을 때 
 * 토큰 갱신이 중복으로 실행되는 것을 방지합니다.
 */
let isRefreshing = false

/**
 * 토큰 갱신 완료를 기다리는 요청들의 큐
 * 토큰 갱신이 진행되는 동안 대기 중인 요청들을 저장합니다.
 */
let failedQueue = []

/**
 * 대기 중인 요청들을 처리하는 함수
 * 
 * @param {Error|null} error - 토큰 갱신 실패시 에러 객체
 * @param {string|null} token - 갱신된 새 토큰
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

/**
 * 요청 인터셉터 설정
 * 
 * 모든 API 요청이 전송되기 전에 실행되는 전처리 로직입니다.
 * JWT 토큰을 자동으로 헤더에 추가하고, 요청을 로깅합니다.
 */
api.interceptors.request.use(
  (config) => {
    // 개발 모드에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      })
    }
    
    // Vuex 스토어에서 액세스 토큰 가져오기
    const token = store.getters['auth/accessToken']
    
    // 토큰이 존재하면 Authorization 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 요청 시작 시간 기록 (성능 측정용)
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    // 요청 설정 오류 처리
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * 응답 인터셉터 설정
 * 
 * 모든 API 응답을 받은 후 실행되는 후처리 로직입니다.
 * 토큰 만료 처리, 자동 갱신, 공통 에러 처리 등을 담당합니다.
 */
api.interceptors.response.use(
  (response) => {
    // 응답 시간 계산 및 로깅 (개발 모드)
    if (process.env.NODE_ENV === 'development') {
      const endTime = new Date()
      const duration = endTime - response.config.metadata.startTime
      
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data
      })
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 개발 모드에서 에러 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
    }
    
    // 401 Unauthorized 에러 처리 (토큰 만료 또는 유효하지 않음)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 토큰 갱신이 진행 중인 경우
      if (isRefreshing) {
        // 현재 요청을 큐에 추가하고 토큰 갱신 완료 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      // 리프레시 토큰으로 새로운 액세스 토큰 요청
      const refreshToken = store.getters['auth/refreshToken']
      
      if (refreshToken) {
        try {
          // 토큰 갱신 API 호출 (별도의 axios 인스턴스 사용)
          const response = await axios.post(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
            refreshToken: refreshToken
          })
          
          const { accessToken } = response.data
          
          // Vuex 스토어에 새 토큰 저장
          store.commit('auth/setAccessToken', accessToken)
          
          // 대기 중인 요청들에 새 토큰 전달
          processQueue(null, accessToken)
          
          // 원래 요청에 새 토큰 추가하여 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          return api(originalRequest)
          
        } catch (refreshError) {
          console.error('[Token Refresh Failed]', refreshError)
          
          // 토큰 갱신 실패시 로그아웃 처리
          processQueue(refreshError, null)
          store.dispatch('auth/logout')
          
          // 로그인 페이지로 리디렉션
          if (router.currentRoute.path !== '/login') {
            router.push('/login')
          }
          
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        // 리프레시 토큰이 없는 경우 즉시 로그아웃
        store.dispatch('auth/logout')
        if (router.currentRoute.path !== '/login') {
          router.push('/login')
        }
      }
    }
    
    // 기타 HTTP 에러 처리
    return Promise.reject(error)
  }
)

/**
 * API 응답 데이터 추출 헬퍼 함수
 * 
 * Axios 응답 객체에서 실제 데이터만 추출하여 반환합니다.
 * 컴포넌트에서 response.data 접근을 생략할 수 있습니다.
 * 
 * @param {Promise} apiPromise - API 호출 Promise
 * @returns {Promise} 응답 데이터
 */
export const extractData = (apiPromise) => {
  return apiPromise.then(response => response.data)
}

/**
 * 파일 업로드용 API 인스턴스
 * 
 * 파일 업로드시 Content-Type을 multipart/form-data로 설정하고
 * 타임아웃을 더 길게 설정한 별도의 인스턴스입니다.
 */
export const fileApi = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 60000, // 1분 타임아웃 (파일 업로드용)
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 파일 업로드 API에도 동일한 인터셉터 적용
fileApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
fileApi.interceptors.response.use(
  api.interceptors.response.handlers[0].fulfilled,
  api.interceptors.response.handlers[0].rejected
)

/**
 * API 상태 확인 함수
 * 
 * 백엔드 서버의 상태를 확인하는 헬스체크 함수입니다.
 * 애플리케이션 시작시 서버 연결 상태를 확인할 때 사용합니다.
 * 
 * @returns {Promise<boolean>} 서버 연결 가능 여부
 */
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/actuator/health`, {
      timeout: 5000
    })
    return response.status === 200
  } catch (error) {
    console.error('[API Health Check Failed]', error)
    return false
  }
}

// 개발 환경에서 요청/응답 로깅
if (process.env.VUE_APP_SHOW_API_LOGS === 'true') {
  api.interceptors.request.use(
    config => {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data)
      return config
    }
  )
  
  api.interceptors.response.use(
    response => {
      console.log(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data)
      return response
    },
    error => {
      console.error('[API Response Error]', error.response || error)
      return Promise.reject(error)
    }
  )
}

// 기본 API 인스턴스 export
export default api