// main.js - Vue 애플리케이션 진입점 (2일차 업데이트)
// 파일 위치: src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// ====== Element Plus 관련 import ======
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ====== 글로벌 스타일 import ======
// variables.scss는 vue.config.js에서 전역으로 처리됨
import '@/assets/css/global.scss'     // 글로벌 스타일

// ====== 추가 라이브러리 import ======
import 'animate.css'                  // CSS 애니메이션 라이브러리
import 'nprogress/nprogress.css'      // 로딩 프로그래스바 스타일

// ====== 개발 환경 설정 ======
// 개발 환경에서만 Vue 개발자 도구와 성능 팁 활성화
if (process.env.NODE_ENV === 'development') {
  // Vue 개발자 도구 활성화 (기본적으로 활성화되어 있지만 명시적으로 설정)
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || {}
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled = true
}

/**
 * Vue 애플리케이션 인스턴스 생성 및 설정
 */
const app = createApp(App)

// ====== Element Plus 설정 ======

// Element Plus 메인 라이브러리 등록
app.use(ElementPlus, {
  // Element Plus 전역 설정
  size: 'default',        // 컴포넌트 기본 크기 (large, default, small)
  zIndex: 3000,          // Element Plus 컴포넌트들의 기본 z-index
  
  // 다국어 설정 (한국어)
  locale: {
    // 기본 한국어 설정 - 향후 i18n과 연동 예정
    name: 'ko',
    el: {
      colorpicker: {
        confirm: '확인',
        clear: '지우기'
      },
      datepicker: {
        now: '현재',
        today: '오늘',
        cancel: '취소',
        clear: '지우기',
        confirm: '확인',
        selectDate: '날짜 선택',
        selectTime: '시간 선택',
        startDate: '시작 날짜',
        endDate: '종료 날짜',
        prevYear: '이전 년도',
        nextYear: '다음 년도',
        prevMonth: '이전 월',
        nextMonth: '다음 월',
        year: '년',
        month1: '1월',
        month2: '2월',
        month3: '3월',
        month4: '4월',
        month5: '5월',
        month6: '6월',
        month7: '7월',
        month8: '8월',
        month9: '9월',
        month10: '10월',
        month11: '11월',
        month12: '12월',
        weeks: {
          sun: '일',
          mon: '월',
          tue: '화',
          wed: '수',
          thu: '목',
          fri: '금',
          sat: '토'
        },
        months: {
          jan: '1월',
          feb: '2월',
          mar: '3월',
          apr: '4월',
          may: '5월',
          jun: '6월',
          jul: '7월',
          aug: '8월',
          sep: '9월',
          oct: '10월',
          nov: '11월',
          dec: '12월'
        }
      },
      pagination: {
        goto: '이동',
        pagesize: '개/페이지',
        total: '총 {total} 개',
        pageClassifier: '페이지'
      },
      messagebox: {
        title: '알림',
        confirm: '확인',
        cancel: '취소',
        error: '오류'
      },
      upload: {
        deleteTip: '삭제하려면 Delete 키를 누르세요',
        delete: '삭제',
        preview: '미리보기',
        continue: '계속'
      },
      table: {
        emptyText: '데이터가 없습니다',
        confirmFilter: '확인',
        resetFilter: '초기화',
        clearFilter: '모두',
        sumText: '합계'
      },
      tree: {
        emptyText: '데이터가 없습니다'
      },
      transfer: {
        noMatch: '일치하는 데이터가 없습니다',
        noData: '데이터가 없습니다',
        titles: ['리스트 1', '리스트 2'],
        filterPlaceholder: '검색어를 입력하세요',
        noCheckedFormat: '총 {total} 개',
        hasCheckedFormat: '{checked}/{total} 개 선택됨'
      },
      image: {
        error: '로드 실패'
      },
      pageHeader: {
        title: '뒤로'
      },
      popconfirm: {
        confirmButtonText: '확인',
        cancelButtonText: '취소'
      }
    }
  }
})

// Element Plus 아이콘들을 전역 컴포넌트로 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ====== 라우터 및 스토어 등록 ======
app.use(store)  // Vuex 스토어 등록
app.use(router) // Vue Router 등록

// ====== 전역 속성 및 메서드 등록 ======

// 전역 상수들 등록 (모든 컴포넌트에서 this.$constants로 접근 가능)
import constants from '@/utils/constants'
app.config.globalProperties.$constants = constants

// API 서비스 전역 등록 (this.$api로 접근 가능)
import { api } from '@/services/api'
app.config.globalProperties.$api = api

// ====== 전역 에러 핸들러 등록 ======
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Global Error:', error)
  console.error('Vue Instance:', instance)
  console.error('Error Info:', info)
  
  // 개발 환경에서는 콘솔에 상세 정보 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Component Stack:', instance?.$parent)
  }
  
  // 운영 환경에서는 에러 로깅 서비스로 전송 (향후 구현)
  if (process.env.NODE_ENV === 'production') {
    // 에러 로깅 서비스 호출
    // errorLoggingService.log(error, instance, info)
  }
}

// ====== 전역 경고 핸들러 등록 ======
app.config.warnHandler = (msg, instance, trace) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue Warning:', msg)
    console.warn('Component Trace:', trace)
  }
}

// ====== 성능 측정 (개발 환경) ======
if (process.env.NODE_ENV === 'development') {
  // 애플리케이션 시작 시간 기록
  const startTime = performance.now()
  
  app.mixin({
    mounted() {
      // 첫 번째 컴포넌트가 마운트되면 로딩 시간 출력
      if (this.$el === document.querySelector('#app')) {
        const endTime = performance.now()
        console.log(`🚀 Vue App loaded in ${(endTime - startTime).toFixed(2)}ms`)
      }
    }
  })
}

// ====== 전역 믹스인 등록 (공통 기능) ======
app.mixin({
  methods: {
    /**
     * 날짜 포맷팅 헬퍼 메서드
     * @param {Date|string} date 날짜 객체 또는 문자열
     * @param {string} format 포맷 문자열
     * @returns {string} 포맷된 날짜 문자열
     */
    $formatDate(date, format = 'YYYY-MM-DD') {
      if (!date) return ''
      
      // dayjs 라이브러리를 사용하여 날짜 포맷팅 (향후 추가 예정)
      // return dayjs(date).format(format)
      
      // 임시로 기본 Date 객체 사용
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
    },
    
    /**
     * 파일 크기 포맷팅 헬퍼 메서드
     * @param {number} bytes 바이트 크기
     * @returns {string} 포맷된 파일 크기
     */
    $formatFileSize(bytes) {
      return constants.formatFileSize(bytes)
    },
    
    /**
     * 권한 체크 헬퍼 메서드
     * @param {string} permission 확인할 권한
     * @returns {boolean} 권한 보유 여부
     */
    $hasPermission(permission) {
      // 향후 Vuex store에서 사용자 권한 정보를 가져와서 체크
      // return this.$store.getters['auth/hasPermission'](permission)
      
      // 임시로 true 반환 (3일차에 인증 시스템 구축 후 실제 구현)
      return true
    },
    
    /**
     * 에러 메시지 표시 헬퍼 메서드
     * @param {string} message 에러 메시지
     * @param {number} duration 표시 시간 (ms)
     */
    $showError(message, duration = 3000) {
      this.$message.error({
        message,
        duration,
        showClose: true
      })
    },
    
    /**
     * 성공 메시지 표시 헬퍼 메서드
     * @param {string} message 성공 메시지
     * @param {number} duration 표시 시간 (ms)
     */
    $showSuccess(message, duration = 2000) {
      this.$message.success({
        message,
        duration,
        showClose: true
      })
    }
  }
})

// ====== Vue 애플리케이션 마운트 ======
app.mount('#app')

// ====== 개발 환경 디버깅 도구 ======
if (process.env.NODE_ENV === 'development') {
  // 전역 Vue 인스턴스 참조 (브라우저 콘솔에서 접근 가능)
  window.vueApp = app
  
  // 개발자 도구에서 사용할 수 있는 헬퍼 함수들
  window.vueHelpers = {
    // 현재 라우트 정보 출력
    currentRoute: () => router.currentRoute.value,
    
    // 스토어 상태 출력
    storeState: () => store.state,
    
    // API 테스트 함수
    testApi: async () => {
      try {
        const response = await api.get('/health/status')
        console.log('API Test Success:', response)
        return response
      } catch (error) {
        console.error('API Test Failed:', error)
        throw error
      }
    }
  }
  
  console.log('🔧 Development helpers available:')
  console.log('- window.vueApp: Vue application instance')
  console.log('- window.vueHelpers: Development helper functions')
  console.log('- window.vueHelpers.testApi(): Test backend connection')
}

// ====== 브라우저 호환성 체크 ======
if (!window.fetch) {
  console.error('❌ This browser does not support fetch API. Please use a modern browser.')
}

if (!window.Promise) {
  console.error('❌ This browser does not support Promise. Please use a modern browser.')
}

// ====== 애플리케이션 초기화 완료 로그 ======
console.log('✅ KM Portal Vue application initialized successfully')

/* 
 * ====== 향후 추가될 설정들 ======
 * 
 * 1. 다국어 지원 (Vue I18n):
 *    import { createI18n } from 'vue-i18n'
 *    const i18n = createI18n({ ... })
 *    app.use(i18n)
 * 
 * 2. 플러그인들:
 *    import VueClipboard from 'vue-clipboard3'
 *    app.use(VueClipboard)
 * 
 * 3. 전역 컴포넌트 등록:
 *    import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
 *    app.component('LoadingSpinner', LoadingSpinner)
 * 
 * 4. 전역 디렉티브:
 *    app.directive('loading', LoadingDirective)
 *    app.directive('permission', PermissionDirective)
 */