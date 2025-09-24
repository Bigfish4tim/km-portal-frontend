<!-- ==============================================
📁 src/App.vue
메인 애플리케이션 컴포넌트 - 3일차 업데이트
============================================== -->

<template>
  <div id="app" :class="appClasses">
    <!-- 전역 로딩 스피너 -->
    <div v-if="appInitializing" class="app-initializing">
      <LoadingSpinner 
        :overlay="true" 
        message="애플리케이션을 초기화하는 중..."
      />
    </div>

    <!-- 메인 라우터 뷰 -->
    <router-view v-else />

    <!-- 전역 알림 컨테이너 -->
    <div class="global-notifications">
      <transition-group name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="`notification-${notification.type}`"
        >
          <el-alert
            :title="notification.title"
            :description="notification.message"
            :type="notification.type"
            :closable="true"
            show-icon
            @close="removeNotification(notification.id)"
          />
        </div>
      </transition-group>
    </div>

    <!-- 개발 환경 디버그 정보 -->
    <div v-if="showDebugInfo" class="debug-info">
      <el-card class="debug-card" shadow="always">
        <template #header>
          <div class="debug-header">
            <span>🔧 개발 디버그</span>
            <el-button size="small" @click="toggleDebugInfo">
              {{ debugInfoExpanded ? '접기' : '펼치기' }}
            </el-button>
          </div>
        </template>
        
        <div v-show="debugInfoExpanded" class="debug-content">
          <div class="debug-section">
            <h4>인증 상태</h4>
            <p>로그인 여부: {{ isAuthenticated ? '✅' : '❌' }}</p>
            <p>사용자: {{ currentUser?.fullName || '없음' }}</p>
            <p>역할: {{ userRoles.join(', ') || '없음' }}</p>
          </div>
          
          <div class="debug-section">
            <h4>현재 라우트</h4>
            <p>경로: {{ $route.path }}</p>
            <p>이름: {{ $route.name }}</p>
          </div>
          
          <div class="debug-section">
            <h4>시스템 설정</h4>
            <p>테마: {{ currentTheme }}</p>
            <p>언어: {{ currentLanguage }}</p>
            <p>환경: {{ nodeEnv }}</p>
          </div>

          <div class="debug-actions">
            <el-button size="small" @click="testNotification">
              알림 테스트
            </el-button>
            <el-button size="small" @click="testError">
              에러 테스트
            </el-button>
            <el-button size="small" @click="clearStorage">
              스토리지 초기화
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 개발 환경 플로팅 버튼 -->
    <div v-if="isDevelopment" class="floating-debug-btn">
      <el-button
        circle
        size="large"
        type="info"
        @click="toggleDebugPanel"
      >
        🔧
      </el-button>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'App',
  components: {
    LoadingSpinner
  },
  setup() {
    const store = useStore()
    const route = useRoute()

    // 반응형 데이터
    const appInitializing = ref(true)
    const showDebugInfo = ref(false)
    const debugInfoExpanded = ref(false)

    // 계산된 속성들
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const userRoles = computed(() => store.getters['auth/userRoles'])
    const currentTheme = computed(() => store.getters.currentTheme)
    const currentLanguage = computed(() => store.getters.currentLanguage)
    const notifications = computed(() => store.getters['ui/notifications'])
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')
    const nodeEnv = computed(() => process.env.NODE_ENV)

    // 앱 클래스 계산
    const appClasses = computed(() => ({
      [`theme-${currentTheme.value}`]: true,
      [`lang-${currentLanguage.value}`]: true,
      'app-authenticated': isAuthenticated.value,
      'app-development': isDevelopment.value
    }))

    // 메서드들
    const removeNotification = (notificationId) => {
      store.commit('ui/REMOVE_NOTIFICATION', notificationId)
    }

    const toggleDebugPanel = () => {
      showDebugInfo.value = !showDebugInfo.value
      if (showDebugInfo.value) {
        debugInfoExpanded.value = true
      }
    }

    const toggleDebugInfo = () => {
      debugInfoExpanded.value = !debugInfoExpanded.value
    }

    // 디버그 테스트 함수들
    const testNotification = () => {
      const types = ['success', 'info', 'warning', 'error']
      const randomType = types[Math.floor(Math.random() * types.length)]
      
      store.dispatch('ui/addNotification', {
        type: randomType,
        title: `${randomType.toUpperCase()} 테스트`,
        message: `이것은 ${randomType} 타입의 테스트 알림입니다.`,
        duration: 3000
      })
    }

    const testError = () => {
      try {
        throw new Error('테스트 에러입니다!')
      } catch (error) {
        console.error('테스트 에러:', error)
        store.dispatch('ui/showError', '이것은 테스트 에러 메시지입니다.')
      }
    }

    const clearStorage = () => {
      localStorage.clear()
      sessionStorage.clear()
      ElMessage.success('스토리지가 초기화되었습니다. 페이지를 새로고침하세요.')
    }

    // 애플리케이션 초기화
    const initializeApp = async () => {
      try {
        console.log('🚀 KM Portal 애플리케이션 초기화 시작')
        
        // 1. 전역 스토어 초기화
        await store.dispatch('initializeApp')
        
        // 2. 테마 적용
        document.documentElement.setAttribute('data-theme', currentTheme.value)
        
        // 3. 언어 설정 (향후 i18n 연동)
        document.documentElement.setAttribute('lang', currentLanguage.value)
        
        // 4. 전역 에러 핸들러 설정
        window.addEventListener('error', handleGlobalError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)
        
        // 5. 사용자 활동 추적 (인증된 사용자만)
        if (isAuthenticated.value) {
          startActivityTracking()
        }
        
        console.log('✅ 애플리케이션 초기화 완료')
        
      } catch (error) {
        console.error('❌ 애플리케이션 초기화 실패:', error)
        
        // 초기화 실패시 기본 설정 적용
        store.commit('SET_THEME', 'light')
        store.dispatch('ui/showError', '애플리케이션 초기화 중 오류가 발생했습니다.')
        
      } finally {
        // 로딩 완료
        setTimeout(() => {
          appInitializing.value = false
        }, 1500) // 최소 1.5초간 로딩 표시
      }
    }

    // 전역 에러 핸들러
    const handleGlobalError = (event) => {
      console.error('전역 에러:', event.error)
      store.dispatch('ui/showError', '예상치 못한 오류가 발생했습니다.')
    }

    const handleUnhandledRejection = (event) => {
      console.error('처리되지 않은 Promise 거부:', event.reason)
      store.dispatch('ui/showError', '네트워크 오류가 발생했습니다.')
    }

    // 사용자 활동 추적
    let activityTimer = null

    const startActivityTracking = () => {
      const updateActivity = () => {
        if (isAuthenticated.value) {
          store.dispatch('auth/updateActivity')
        }
      }

      // 5분마다 활동 시간 업데이트
      activityTimer = setInterval(updateActivity, 5 * 60 * 1000)
      
      // 사용자 상호작용 이벤트 감지
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true })
      })
    }

    const stopActivityTracking = () => {
      if (activityTimer) {
        clearInterval(activityTimer)
        activityTimer = null
      }
    }

    // 테마 변경 감지
    watch(currentTheme, (newTheme) => {
      document.documentElement.setAttribute('data-theme', newTheme)
      
      // CSS 변수 업데이트 (필요시)
      if (newTheme === 'dark') {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
    })

    // 인증 상태 변경 감지
    watch(isAuthenticated, (authenticated) => {
      if (authenticated) {
        startActivityTracking()
        console.log('✅ 사용자 로그인 - 활동 추적 시작')
      } else {
        stopActivityTracking()
        console.log('🔐 사용자 로그아웃 - 활동 추적 중지')
      }
    })

    // 라우트 변경 감지 (페이지뷰 추적)
    watch(route, (to, from) => {
      console.log(`📍 페이지 이동: ${from?.path || '/'} → ${to.path}`)
      
      // 페이지 제목 업데이트 (라우터 가드에서도 처리하지만 추가 보험)
      if (to.meta?.title) {
        document.title = `${to.meta.title} - KM Portal`
      }
      
      // Google Analytics 등 분석 도구 연동 (향후)
      // gtag('config', 'GA_TRACKING_ID', { page_path: to.path })
    })

    // 라이프사이클
    onMounted(() => {
      initializeApp()
    })

    onUnmounted(() => {
      // 정리 작업
      stopActivityTracking()
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    })

    return {
      // 반응형 데이터
      appInitializing,
      showDebugInfo,
      debugInfoExpanded,
      
      // 계산된 속성
      appClasses,
      isAuthenticated,
      currentUser,
      userRoles,
      currentTheme,
      currentLanguage,
      notifications,
      isDevelopment,
      nodeEnv,
      
      // 메서드
      removeNotification,
      toggleDebugPanel,
      toggleDebugInfo,
      testNotification,
      testError,
      clearStorage
    }
  }
}
</script>

<style lang="scss">
// ==============================================
// 전역 애플리케이션 스타일
// ==============================================

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
  transition: all 0.3s ease;
}

// ==============================================
// 애플리케이션 초기화 로딩
// ==============================================

.app-initializing {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--el-bg-color);
}

// ==============================================
// 전역 알림 스타일
// ==============================================

.global-notifications {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9998;
  max-width: 400px;

  .notification-item {
    margin-bottom: 12px;
  }
}

// 알림 애니메이션
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// ==============================================
// 디버그 패널 스타일
// ==============================================

.debug-info {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 9997;
  max-width: 350px;

  .debug-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--el-border-color);

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .debug-content {
      .debug-section {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-of-type {
          border-bottom: none;
        }

        h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--el-color-primary);
          font-weight: 600;
        }

        p {
          margin: 4px 0;
          font-size: 12px;
          color: var(--el-text-color-regular);
        }
      }

      .debug-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }
}

.floating-debug-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9996;
}

// ==============================================
// 테마별 스타일
// ==============================================

// 라이트 테마
.theme-light {
  --app-primary-color: #409EFF;
  --app-success-color: #67C23A;
  --app-warning-color: #E6A23C;
  --app-danger-color: #F56C6C;
  --app-info-color: #909399;
}

// 다크 테마
.theme-dark {
  --app-primary-color: #337ECC;
  --app-success-color: #529B2E;
  --app-warning-color: #B88230;
  --app-danger-color: #C45656;
  --app-info-color: #73767A;

  .debug-info .debug-card {
    background: rgba(0, 0, 0, 0.95);
    color: var(--el-text-color-primary);
  }
}

// ==============================================
// 반응형 디자인
// ==============================================

@media (max-width: 768px) {
  .global-notifications {
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .debug-info {
    right: 10px;
    left: 10px;
    bottom: 70px;
    max-width: none;
  }

  .floating-debug-btn {
    bottom: 10px;
    right: 10px;
  }
}

// ==============================================
// 접근성 향상
// ==============================================

// 포커스 표시 개선
*:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

// 버튼 접근성
button:focus,
.el-button:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

// 링크 접근성
a:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

// ==============================================
// 스크롤바 스타일 (webkit 브라우저)
// ==============================================

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--el-fill-color);
  border-radius: 4px;
  
  &:hover {
    background: var(--el-fill-color-dark);
  }
}

// ==============================================
// 인쇄 스타일
// ==============================================

@media print {
  .global-notifications,
  .debug-info,
  .floating-debug-btn {
    display: none !important;
  }
  
  #app {
    background: white !important;
    color: black !important;
  }
}

// ==============================================
// 애니메이션 감소 설정 (접근성)
// ==============================================

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
