/**
 * Cypress E2E 테스트 전역 설정 파일
 * 
 * 모든 E2E 테스트에서 공통으로 사용되는 설정과 훅을 정의합니다.
 * 이 파일은 각 테스트 파일 실행 전에 자동으로 로드됩니다.
 * 
 * 파일 위치: km-portal-frontend/cypress/support/e2e.js
 * 
 * 작성일: 2025년 11월 30일 (41일차)
 * 작성자: KM Portal Dev Team
 */

// ====================================
// 커스텀 명령어 불러오기
// ====================================
import './commands'

// ====================================
// 전역 훅 설정
// ====================================

/**
 * 각 테스트 실행 전 호출
 * 테스트 격리를 위한 상태 초기화
 */
beforeEach(() => {
  // 콘솔 로그 캡처 (디버깅용)
  cy.window().then((win) => {
    cy.spy(win.console, 'error').as('consoleError')
    cy.spy(win.console, 'warn').as('consoleWarn')
  })
})

/**
 * 각 테스트 완료 후 호출
 * 정리 작업 수행
 */
afterEach(() => {
  // 콘솔 에러 확인 (선택적)
  // cy.get('@consoleError').should('not.have.been.called')
})

// ====================================
// 전역 예외 처리
// ====================================

/**
 * 처리되지 않은 예외 무시
 * 
 * Vue 애플리케이션에서 발생하는 일부 예외는 테스트에 영향을 주지 않음
 * 필요한 경우 특정 예외만 무시하도록 수정 가능
 */
Cypress.on('uncaught:exception', (err, runnable) => {
  // ResizeObserver 관련 에러 무시 (Element Plus 컴포넌트에서 발생)
  if (err.message.includes('ResizeObserver')) {
    return false
  }

  // 네트워크 에러 무시 (개발 환경에서 발생할 수 있음)
  if (err.message.includes('Network Error')) {
    return false
  }

  // Vue 경고 무시
  if (err.message.includes('[Vue warn]')) {
    return false
  }

  // 그 외 에러는 테스트 실패로 처리
  return true
})

// ====================================
// API 인터셉트 기본 설정
// ====================================

/**
 * API 요청 로깅
 * 디버깅 시 유용
 */
if (Cypress.env('logApiRequests')) {
  beforeEach(() => {
    cy.intercept('**/*', (req) => {
      console.log(`🌐 ${req.method} ${req.url}`)
    })
  })
}

// ====================================
// 뷰포트 프리셋
// ====================================

/**
 * 자주 사용되는 뷰포트 크기 정의
 * cy.viewport('preset명') 으로 사용
 */
Cypress.Commands.overwrite('viewport', (originalFn, preset, height) => {
  const presets = {
    'mobile': [375, 667],      // iPhone SE
    'mobile-lg': [414, 896],   // iPhone XR
    'tablet': [768, 1024],     // iPad
    'desktop': [1280, 720],    // 일반 데스크톱
    'desktop-lg': [1920, 1080] // Full HD
  }

  if (typeof preset === 'string' && presets[preset]) {
    return originalFn(presets[preset][0], presets[preset][1])
  }

  return originalFn(preset, height)
})

// ====================================
// 콘솔 로그 출력
// ====================================

console.log('🧪 KM 포털 E2E 테스트 환경이 로드되었습니다.')
console.log(`📍 Base URL: ${Cypress.config('baseUrl')}`)
console.log(`📍 API URL: ${Cypress.env('apiUrl')}`)