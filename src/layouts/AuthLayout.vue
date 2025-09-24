<!-- ==============================================
📁 src/layouts/AuthLayout.vue
인증 레이아웃 (로그인, 회원가입)
============================================== -->

<template>
  <div class="auth-layout">
    <!-- 배경 영역 -->
    <div class="auth-background">
      <div class="background-pattern"></div>
    </div>

    <!-- 메인 컨테이너 -->
    <div class="auth-container">
      <!-- 로고 및 제목 영역 -->
      <div class="auth-header">
        <img src="/logo.png" alt="KM Portal" class="logo" />
        <h1 class="title">KM Portal</h1>
        <p class="subtitle">Knowledge Management System</p>
      </div>

      <!-- 인증 폼 영역 -->
      <div class="auth-content">
        <router-view v-slot="{ Component }">
          <transition name="auth-transition" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <!-- 푸터 영역 -->
      <div class="auth-footer">
        <p>&copy; 2025 KM Portal. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" @click.prevent>개인정보처리방침</a>
          <span>|</span>
          <a href="#" @click.prevent>이용약관</a>
          <span>|</span>
          <a href="#" @click.prevent>고객지원</a>
        </div>
      </div>
    </div>

    <!-- 테마 토글 버튼 -->
    <div class="theme-toggle">
      <el-button 
        :icon="isDarkMode ? Sunny : Moon" 
        @click="toggleTheme"
        circle
        size="large"
      />
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <LoadingSpinner :overlay="true" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { Sunny, Moon } from '@element-plus/icons-vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'AuthLayout',
  components: {
    Sunny,
    Moon,
    LoadingSpinner
  },
  setup() {
    const store = useStore()

    // 계산된 속성
    const isDarkMode = computed(() => store.getters.isDarkMode)
    const isLoading = computed(() => store.getters['ui/isLoading'])

    // 메서드
    const toggleTheme = () => {
      store.dispatch('toggleTheme')
    }

    return {
      isDarkMode,
      isLoading,
      toggleTheme
    }
  }
}
</script>

<style lang="scss" scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  overflow: hidden;

  // 배경 영역
  .auth-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      var(--el-color-primary-light-7) 0%, 
      var(--el-color-primary-light-5) 50%, 
      var(--el-color-primary) 100%
    );

    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: pattern-move 20s linear infinite;
    }
  }

  // 메인 컨테이너
  .auth-container {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 40px 20px;
    max-width: 480px;
    margin: 0 auto;

    // 헤더 영역
    .auth-header {
      text-align: center;
      margin-bottom: 40px;

      .logo {
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
      }

      .title {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        font-weight: 300;
      }
    }

    // 콘텐츠 영역
    .auth-content {
      width: 100%;
      background: var(--el-bg-color);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    // 푸터 영역
    .auth-footer {
      margin-top: 40px;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);

      p {
        margin: 0 0 12px 0;
        font-size: 14px;
      }

      .footer-links {
        font-size: 12px;

        a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.2s;

          &:hover {
            color: white;
          }
        }

        span {
          margin: 0 8px;
          opacity: 0.6;
        }
      }
    }
  }

  // 테마 토글 버튼
  .theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }

  // 로딩 오버레이
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }

  // 반응형 디자인
  @media (max-width: 768px) {
    .auth-container {
      padding: 20px;
      max-width: 100%;

      .auth-header {
        margin-bottom: 32px;

        .logo {
          width: 60px;
          height: 60px;
        }

        .title {
          font-size: 28px;
        }

        .subtitle {
          font-size: 14px;
        }
      }

      .auth-footer {
        margin-top: 32px;
      }
    }
  }
}

// 인증 페이지 전환 애니메이션
.auth-transition-enter-active,
.auth-transition-leave-active {
  transition: all 0.3s ease;
}

.auth-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.auth-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 배경 패턴 애니메이션
@keyframes pattern-move {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

// 다크모드 지원
.dark-mode .auth-layout {
  .auth-background {
    background: linear-gradient(135deg, 
      var(--el-bg-color-page) 0%, 
      var(--el-bg-color) 50%, 
      var(--el-color-primary-dark-2) 100%
    );
  }

  .auth-container {
    .auth-header {
      .title {
        color: var(--el-text-color-primary);
      }

      .subtitle {
        color: var(--el-text-color-regular);
      }
    }

    .auth-footer {
      color: var(--el-text-color-regular);

      .footer-links a {
        color: var(--el-text-color-regular);

        &:hover {
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}
</style>