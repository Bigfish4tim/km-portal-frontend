// ==============================================
// 📁 src/utils/performance.js
// Web Vitals 성능 측정 및 모니터링 유틸리티
// 42일차 - 프론트엔드 성능 측정 도구
// ==============================================

/**
 * Web Vitals 성능 측정 모듈
 * 
 * 이 모듈은 Core Web Vitals를 측정하고 리포팅합니다:
 * - LCP (Largest Contentful Paint): 최대 콘텐츠 페인트 시간
 * - FID (First Input Delay): 첫 입력 지연 시간
 * - CLS (Cumulative Layout Shift): 누적 레이아웃 이동
 * - FCP (First Contentful Paint): 첫 콘텐츠 페인트 시간
 * - TTFB (Time to First Byte): 첫 바이트 도착 시간
 * - INP (Interaction to Next Paint): 상호작용에서 다음 페인트까지
 * 
 * 설치:
 * npm install web-vitals
 * 
 * 사용법:
 * import { initPerformanceMonitoring } from '@/utils/performance'
 * initPerformanceMonitoring()
 */

// ==============================================
// 상수 정의
// ==============================================

/**
 * 성능 지표 임계값 (Google 권장 기준)
 */
export const PERFORMANCE_THRESHOLDS = {
  // LCP: Largest Contentful Paint
  // 좋음 < 2.5s, 개선 필요 2.5s-4s, 나쁨 > 4s
  LCP: {
    good: 2500,
    needsImprovement: 4000
  },
  
  // FID: First Input Delay
  // 좋음 < 100ms, 개선 필요 100ms-300ms, 나쁨 > 300ms
  FID: {
    good: 100,
    needsImprovement: 300
  },
  
  // CLS: Cumulative Layout Shift
  // 좋음 < 0.1, 개선 필요 0.1-0.25, 나쁨 > 0.25
  CLS: {
    good: 0.1,
    needsImprovement: 0.25
  },
  
  // FCP: First Contentful Paint
  // 좋음 < 1.8s, 개선 필요 1.8s-3s, 나쁨 > 3s
  FCP: {
    good: 1800,
    needsImprovement: 3000
  },
  
  // TTFB: Time to First Byte
  // 좋음 < 800ms, 개선 필요 800ms-1800ms, 나쁨 > 1800ms
  TTFB: {
    good: 800,
    needsImprovement: 1800
  },
  
  // INP: Interaction to Next Paint (FID 대체)
  // 좋음 < 200ms, 개선 필요 200ms-500ms, 나쁨 > 500ms
  INP: {
    good: 200,
    needsImprovement: 500
  }
}

// ==============================================
// 성능 메트릭 저장소
// ==============================================

/**
 * 측정된 성능 데이터를 저장하는 객체
 */
const performanceData = {
  metrics: {},
  entries: [],
  navigationTiming: null,
  resourceTimings: [],
  longTasks: [],
  marks: {},
  measures: {}
}

// ==============================================
// Web Vitals 측정 함수들
// ==============================================

/**
 * Web Vitals 라이브러리 동적 로드 및 측정 초기화
 * 
 * @param {object} options - 설정 옵션
 * @param {boolean} options.reportAllChanges - 모든 변경 사항 보고 여부
 * @param {function} options.onMetric - 메트릭 수집 시 콜백
 * @param {string} options.endpoint - 리포팅 엔드포인트 URL
 */
export async function initWebVitals(options = {}) {
  const {
    reportAllChanges = false,
    onMetric = defaultMetricHandler,
    endpoint = null
  } = options
  
  try {
    // web-vitals 라이브러리 동적 임포트
    // 프로덕션에서만 로드하여 개발 환경 부하 줄임
    const webVitals = await import('web-vitals')
    
    console.log('📊 Web Vitals 모니터링 초기화...')
    
    // Core Web Vitals 측정 시작
    webVitals.onCLS(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    webVitals.onFID(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    webVitals.onLCP(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    webVitals.onFCP(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    webVitals.onTTFB(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    
    // INP는 최신 버전에서 지원
    if (webVitals.onINP) {
      webVitals.onINP(metric => handleMetric(metric, onMetric, endpoint), { reportAllChanges })
    }
    
    console.log('✅ Web Vitals 모니터링 활성화됨')
    
    return true
  } catch (error) {
    console.warn('⚠️ Web Vitals 로드 실패:', error.message)
    console.warn('   web-vitals 패키지가 설치되어 있는지 확인하세요.')
    console.warn('   npm install web-vitals')
    return false
  }
}

/**
 * 메트릭 처리 핸들러
 * 
 * @param {object} metric - Web Vitals 메트릭 객체
 * @param {function} callback - 사용자 정의 콜백
 * @param {string} endpoint - 리포팅 엔드포인트
 */
function handleMetric(metric, callback, endpoint) {
  // 메트릭 저장
  performanceData.metrics[metric.name] = {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now()
  }
  
  // 엔트리 기록
  performanceData.entries.push({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    timestamp: Date.now()
  })
  
  // 사용자 콜백 호출
  if (typeof callback === 'function') {
    callback(metric)
  }
  
  // 엔드포인트로 전송
  if (endpoint) {
    sendToEndpoint(metric, endpoint)
  }
}

/**
 * 기본 메트릭 핸들러 (콘솔 로깅)
 * 
 * @param {object} metric - Web Vitals 메트릭
 */
function defaultMetricHandler(metric) {
  const { name, value, rating } = metric
  
  // 등급별 이모지
  const ratingEmoji = {
    good: '🟢',
    'needs-improvement': '🟡',
    poor: '🔴'
  }
  
  // 값 포맷팅
  let formattedValue
  if (name === 'CLS') {
    formattedValue = value.toFixed(3)
  } else {
    formattedValue = `${Math.round(value)}ms`
  }
  
  console.log(
    `${ratingEmoji[rating] || '⚪'} ${name}: ${formattedValue} (${rating})`
  )
}

/**
 * 메트릭을 서버 엔드포인트로 전송
 * 
 * @param {object} metric - 전송할 메트릭
 * @param {string} endpoint - 엔드포인트 URL
 */
async function sendToEndpoint(metric, endpoint) {
  try {
    // navigator.sendBeacon 사용 (페이지 언로드 시에도 전송 보장)
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: getNavigationType(),
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body)
    } else {
      // sendBeacon 미지원 시 fetch 사용
      await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      })
    }
  } catch (error) {
    console.warn('메트릭 전송 실패:', error)
  }
}

// ==============================================
// Performance API 활용 함수들
// ==============================================

/**
 * Navigation Timing 데이터 수집
 * 페이지 로드 성능 분석에 사용
 * 
 * @returns {object} Navigation Timing 데이터
 */
export function getNavigationTiming() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return null
  }
  
  const [navigation] = performance.getEntriesByType('navigation')
  
  if (!navigation) {
    return null
  }
  
  const timing = {
    // DNS 조회 시간
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    
    // TCP 연결 시간
    tcpConnect: navigation.connectEnd - navigation.connectStart,
    
    // SSL/TLS 핸드셰이크 시간
    sslHandshake: navigation.secureConnectionStart > 0 
      ? navigation.connectEnd - navigation.secureConnectionStart 
      : 0,
    
    // 요청 시간 (요청 시작 ~ 응답 시작)
    request: navigation.responseStart - navigation.requestStart,
    
    // 응답 시간 (응답 시작 ~ 응답 끝)
    response: navigation.responseEnd - navigation.responseStart,
    
    // DOM 파싱 시간
    domParsing: navigation.domInteractive - navigation.responseEnd,
    
    // DOM 콘텐츠 로드
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    
    // 전체 페이지 로드 시간
    loadComplete: navigation.loadEventEnd - navigation.startTime,
    
    // TTFB (Time to First Byte)
    ttfb: navigation.responseStart - navigation.requestStart,
    
    // 전송 크기
    transferSize: navigation.transferSize,
    encodedBodySize: navigation.encodedBodySize,
    decodedBodySize: navigation.decodedBodySize,
    
    // 네비게이션 타입
    type: navigation.type
  }
  
  performanceData.navigationTiming = timing
  
  return timing
}

/**
 * 리소스 타이밍 데이터 수집
 * 개별 리소스(JS, CSS, 이미지 등) 로드 시간 분석
 * 
 * @param {object} options - 필터 옵션
 * @returns {array} 리소스 타이밍 배열
 */
export function getResourceTimings(options = {}) {
  if (!window.performance || !window.performance.getEntriesByType) {
    return []
  }
  
  const { 
    types = ['script', 'css', 'img', 'font', 'fetch', 'xmlhttprequest'],
    minDuration = 0 
  } = options
  
  const resources = performance.getEntriesByType('resource')
  
  const filtered = resources
    .filter(resource => {
      // 타입 필터
      const resourceType = getResourceType(resource.initiatorType, resource.name)
      if (!types.includes(resourceType)) {
        return false
      }
      
      // 최소 지속 시간 필터
      if (resource.duration < minDuration) {
        return false
      }
      
      return true
    })
    .map(resource => ({
      name: getResourceName(resource.name),
      type: getResourceType(resource.initiatorType, resource.name),
      duration: Math.round(resource.duration),
      transferSize: resource.transferSize,
      startTime: Math.round(resource.startTime),
      // 캐시 여부 (transferSize가 0이면 캐시)
      cached: resource.transferSize === 0
    }))
    .sort((a, b) => b.duration - a.duration) // 가장 느린 순으로 정렬
  
  performanceData.resourceTimings = filtered
  
  return filtered
}

/**
 * 느린 리소스 분석
 * 지정된 임계값보다 느린 리소스 목록 반환
 * 
 * @param {number} threshold - 임계값 (ms)
 * @returns {array} 느린 리소스 배열
 */
export function getSlowResources(threshold = 500) {
  const resources = getResourceTimings()
  
  return resources.filter(r => r.duration > threshold)
}

/**
 * 리소스 타입 판별
 */
function getResourceType(initiatorType, url) {
  if (initiatorType === 'script') return 'script'
  if (initiatorType === 'css' || initiatorType === 'link') return 'css'
  if (initiatorType === 'img') return 'img'
  if (initiatorType === 'font' || url.match(/\.(woff2?|ttf|otf|eot)$/i)) return 'font'
  if (initiatorType === 'fetch') return 'fetch'
  if (initiatorType === 'xmlhttprequest') return 'xmlhttprequest'
  return 'other'
}

/**
 * 리소스 이름 추출 (URL에서 파일명만)
 */
function getResourceName(url) {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop()
    return filename || pathname
  } catch {
    return url.split('/').pop() || url
  }
}

// ==============================================
// Long Task 감지
// ==============================================

/**
 * Long Task 관찰 시작
 * 50ms 이상 걸리는 작업을 감지하여 UI 블로킹 분석
 * 
 * @param {function} callback - Long Task 감지 시 콜백
 * @returns {PerformanceObserver|null} Observer 인스턴스
 */
export function observeLongTasks(callback) {
  if (!window.PerformanceObserver) {
    console.warn('PerformanceObserver not supported')
    return null
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const taskInfo = {
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
          name: entry.name,
          // attribution이 있으면 원인 파악 가능
          attribution: entry.attribution?.map(a => ({
            name: a.name,
            containerType: a.containerType,
            containerSrc: a.containerSrc
          })) || []
        }
        
        performanceData.longTasks.push(taskInfo)
        
        // 콜백 호출
        if (typeof callback === 'function') {
          callback(taskInfo)
        }
        
        // 100ms 이상은 경고 로그
        if (entry.duration > 100) {
          console.warn(`⚠️ Long Task 감지: ${Math.round(entry.duration)}ms`, taskInfo)
        }
      }
    })
    
    observer.observe({ type: 'longtask', buffered: true })
    
    console.log('👁️ Long Task 관찰 시작')
    
    return observer
  } catch (error) {
    console.warn('Long Task 관찰 실패:', error)
    return null
  }
}

// ==============================================
// 사용자 정의 마크 및 측정
// ==============================================

/**
 * 성능 마크 생성
 * 특정 시점을 기록하여 나중에 측정에 사용
 * 
 * @param {string} name - 마크 이름
 */
export function mark(name) {
  if (!window.performance || !window.performance.mark) {
    return
  }
  
  const fullName = `km-portal-${name}`
  performance.mark(fullName)
  performanceData.marks[name] = performance.now()
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📍 Mark: ${name}`)
  }
}

/**
 * 두 마크 사이의 시간 측정
 * 
 * @param {string} name - 측정 이름
 * @param {string} startMark - 시작 마크 이름
 * @param {string} endMark - 종료 마크 이름 (생략시 현재 시간)
 * @returns {number|null} 측정된 시간 (ms)
 */
export function measure(name, startMark, endMark = null) {
  if (!window.performance || !window.performance.measure) {
    return null
  }
  
  try {
    const startMarkName = `km-portal-${startMark}`
    const endMarkName = endMark ? `km-portal-${endMark}` : undefined
    
    // 종료 마크가 없으면 현재 시간에 마크 생성
    if (!endMark) {
      performance.mark(`km-portal-${name}-end`)
    }
    
    const measureName = `km-portal-${name}`
    
    performance.measure(
      measureName,
      startMarkName,
      endMarkName || `km-portal-${name}-end`
    )
    
    const [entry] = performance.getEntriesByName(measureName, 'measure')
    const duration = entry ? Math.round(entry.duration) : null
    
    performanceData.measures[name] = duration
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Measure [${name}]: ${duration}ms`)
    }
    
    return duration
  } catch (error) {
    console.warn(`측정 실패 [${name}]:`, error)
    return null
  }
}

// ==============================================
// 컴포넌트 성능 측정 헬퍼
// ==============================================

/**
 * Vue 컴포넌트 렌더링 시간 측정을 위한 믹스인
 * 
 * 사용법:
 * import { componentPerformanceMixin } from '@/utils/performance'
 * 
 * export default {
 *   mixins: [componentPerformanceMixin],
 *   ...
 * }
 */
export const componentPerformanceMixin = {
  data() {
    return {
      _renderStartTime: 0
    }
  },
  
  beforeCreate() {
    this._renderStartTime = performance.now()
  },
  
  mounted() {
    const renderTime = performance.now() - this._renderStartTime
    const componentName = this.$options.name || 'Unknown'
    
    // 100ms 이상 걸린 컴포넌트 경고
    if (renderTime > 100) {
      console.warn(`⚠️ 느린 컴포넌트: ${componentName} (${renderTime.toFixed(2)}ms)`)
    }
    
    // 성능 데이터 저장
    if (!performanceData.components) {
      performanceData.components = []
    }
    
    performanceData.components.push({
      name: componentName,
      renderTime: Math.round(renderTime),
      timestamp: Date.now()
    })
  }
}

/**
 * 컴포넌트 렌더링 시간 측정 Composition API 훅
 * 
 * 사용법:
 * import { useComponentPerformance } from '@/utils/performance'
 * 
 * setup() {
 *   useComponentPerformance('MyComponent')
 *   ...
 * }
 */
export function useComponentPerformance(componentName) {
  const startTime = performance.now()
  
  // Vue 3 Composition API의 onMounted 사용
  // 실제 사용시에는 import { onMounted } from 'vue' 필요
  if (typeof window !== 'undefined') {
    // 간단한 구현 (실제로는 onMounted 훅 사용)
    setTimeout(() => {
      const renderTime = performance.now() - startTime
      
      if (renderTime > 100) {
        console.warn(`⚠️ 느린 컴포넌트: ${componentName} (${renderTime.toFixed(2)}ms)`)
      }
    }, 0)
  }
}

// ==============================================
// 리포팅 함수들
// ==============================================

/**
 * 전체 성능 데이터 수집 및 반환
 * 
 * @returns {object} 수집된 모든 성능 데이터
 */
export function getPerformanceReport() {
  return {
    ...performanceData,
    navigationTiming: getNavigationTiming(),
    slowResources: getSlowResources(),
    summary: getPerformanceSummary()
  }
}

/**
 * 성능 요약 정보 생성
 * 
 * @returns {object} 성능 요약
 */
export function getPerformanceSummary() {
  const metrics = performanceData.metrics
  const timing = getNavigationTiming()
  
  const summary = {
    // Core Web Vitals 요약
    coreWebVitals: {
      LCP: metrics.LCP ? {
        value: metrics.LCP.value,
        rating: metrics.LCP.rating,
        status: getStatusByThreshold(metrics.LCP.value, PERFORMANCE_THRESHOLDS.LCP)
      } : null,
      FID: metrics.FID ? {
        value: metrics.FID.value,
        rating: metrics.FID.rating,
        status: getStatusByThreshold(metrics.FID.value, PERFORMANCE_THRESHOLDS.FID)
      } : null,
      CLS: metrics.CLS ? {
        value: metrics.CLS.value,
        rating: metrics.CLS.rating,
        status: getStatusByThreshold(metrics.CLS.value, PERFORMANCE_THRESHOLDS.CLS)
      } : null
    },
    
    // 페이지 로드 시간
    pageLoad: timing ? {
      ttfb: timing.ttfb,
      domContentLoaded: timing.domContentLoaded,
      loadComplete: timing.loadComplete
    } : null,
    
    // Long Tasks 요약
    longTasks: {
      count: performanceData.longTasks.length,
      totalDuration: performanceData.longTasks.reduce((sum, t) => sum + t.duration, 0),
      maxDuration: performanceData.longTasks.length > 0 
        ? Math.max(...performanceData.longTasks.map(t => t.duration))
        : 0
    },
    
    // 리소스 요약
    resources: {
      count: performanceData.resourceTimings.length,
      slowCount: performanceData.resourceTimings.filter(r => r.duration > 500).length,
      cachedCount: performanceData.resourceTimings.filter(r => r.cached).length
    },
    
    // 전체 점수 (간단한 계산)
    overallScore: calculateOverallScore(metrics)
  }
  
  return summary
}

/**
 * 임계값 기준 상태 판정
 */
function getStatusByThreshold(value, threshold) {
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * 전체 성능 점수 계산 (0-100)
 */
function calculateOverallScore(metrics) {
  let score = 100
  let factors = 0
  
  // 각 메트릭의 점수 기여 계산
  const scoringRules = {
    LCP: { weight: 25, thresholds: PERFORMANCE_THRESHOLDS.LCP },
    FID: { weight: 25, thresholds: PERFORMANCE_THRESHOLDS.FID },
    CLS: { weight: 25, thresholds: PERFORMANCE_THRESHOLDS.CLS },
    FCP: { weight: 15, thresholds: PERFORMANCE_THRESHOLDS.FCP },
    TTFB: { weight: 10, thresholds: PERFORMANCE_THRESHOLDS.TTFB }
  }
  
  for (const [metricName, rule] of Object.entries(scoringRules)) {
    if (metrics[metricName]) {
      const value = metrics[metricName].value
      const { good, needsImprovement } = rule.thresholds
      
      let metricScore
      if (value <= good) {
        metricScore = 100
      } else if (value <= needsImprovement) {
        metricScore = 50 + 50 * (1 - (value - good) / (needsImprovement - good))
      } else {
        metricScore = Math.max(0, 50 * (1 - (value - needsImprovement) / needsImprovement))
      }
      
      score += (metricScore - 100) * (rule.weight / 100)
      factors++
    }
  }
  
  return factors > 0 ? Math.round(score) : null
}

/**
 * 네비게이션 타입 반환
 */
function getNavigationType() {
  if (window.performance?.getEntriesByType) {
    const [navigation] = performance.getEntriesByType('navigation')
    return navigation?.type || 'navigate'
  }
  return 'unknown'
}

// ==============================================
// 성능 모니터링 초기화 함수
// ==============================================

/**
 * 전체 성능 모니터링 초기화
 * main.js에서 호출하여 사용
 * 
 * @param {object} options - 초기화 옵션
 */
export async function initPerformanceMonitoring(options = {}) {
  const {
    enableWebVitals = true,
    enableLongTaskObserver = true,
    enableResourceTiming = true,
    reportEndpoint = null,
    onReady = null
  } = options
  
  console.log('🚀 성능 모니터링 초기화 시작...')
  
  // Web Vitals 초기화
  if (enableWebVitals) {
    await initWebVitals({
      endpoint: reportEndpoint,
      reportAllChanges: process.env.NODE_ENV === 'development'
    })
  }
  
  // Long Task 관찰
  if (enableLongTaskObserver) {
    observeLongTasks()
  }
  
  // 페이지 로드 완료 후 데이터 수집
  if (document.readyState === 'complete') {
    collectInitialData(enableResourceTiming)
  } else {
    window.addEventListener('load', () => {
      // 약간의 지연 후 수집 (모든 메트릭이 준비되도록)
      setTimeout(() => {
        collectInitialData(enableResourceTiming)
        
        if (typeof onReady === 'function') {
          onReady(getPerformanceReport())
        }
      }, 100)
    })
  }
  
  console.log('✅ 성능 모니터링 초기화 완료')
}

/**
 * 초기 데이터 수집
 */
function collectInitialData(enableResourceTiming) {
  getNavigationTiming()
  
  if (enableResourceTiming) {
    getResourceTimings()
  }
}

// ==============================================
// 디버그 유틸리티
// ==============================================

/**
 * 콘솔에 성능 리포트 출력 (개발용)
 */
export function logPerformanceReport() {
  const report = getPerformanceReport()
  
  console.group('📊 KM 포털 성능 리포트')
  
  // Core Web Vitals
  console.group('🎯 Core Web Vitals')
  if (report.summary.coreWebVitals.LCP) {
    console.log('LCP:', report.summary.coreWebVitals.LCP)
  }
  if (report.summary.coreWebVitals.FID) {
    console.log('FID:', report.summary.coreWebVitals.FID)
  }
  if (report.summary.coreWebVitals.CLS) {
    console.log('CLS:', report.summary.coreWebVitals.CLS)
  }
  console.groupEnd()
  
  // 페이지 로드
  if (report.summary.pageLoad) {
    console.group('⏱️ 페이지 로드 시간')
    console.log('TTFB:', report.summary.pageLoad.ttfb, 'ms')
    console.log('DOM Content Loaded:', report.summary.pageLoad.domContentLoaded, 'ms')
    console.log('Load Complete:', report.summary.pageLoad.loadComplete, 'ms')
    console.groupEnd()
  }
  
  // Long Tasks
  console.group('🐢 Long Tasks')
  console.log('Count:', report.summary.longTasks.count)
  console.log('Total Duration:', report.summary.longTasks.totalDuration, 'ms')
  console.log('Max Duration:', report.summary.longTasks.maxDuration, 'ms')
  console.groupEnd()
  
  // 전체 점수
  console.log('🏆 Overall Score:', report.summary.overallScore || 'N/A')
  
  console.groupEnd()
  
  return report
}

// 전역 접근을 위해 window에 등록 (개발 환경에서만)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.kmPerformance = {
    getReport: getPerformanceReport,
    logReport: logPerformanceReport,
    mark,
    measure,
    getSlowResources,
    THRESHOLDS: PERFORMANCE_THRESHOLDS
  }
}

export default {
  initPerformanceMonitoring,
  initWebVitals,
  getPerformanceReport,
  getPerformanceSummary,
  getNavigationTiming,
  getResourceTimings,
  getSlowResources,
  observeLongTasks,
  mark,
  measure,
  logPerformanceReport,
  componentPerformanceMixin,
  useComponentPerformance,
  PERFORMANCE_THRESHOLDS
}
