<!-- ==============================================
📁 src/layouts/DefaultLayout.vue
기본 레이아웃 (헤더, 사이드바, 메인 콘텐츠)
============================================== -->

<template>
  <div class="layout-container" :class="layoutClasses">
    <!-- 헤더 영역 -->
    <header class="layout-header">
      <div class="header-content">
        <!-- 로고 및 타이틀 -->
        <div class="header-left">
          <el-button 
            class="sidebar-toggle"
            :icon="Menu" 
            @click="toggleSidebar"
            text
          />
          <router-link to="/" class="logo-section">
            <img src="/logo.png" alt="KM Portal" class="logo" />
            <h1 class="title">KM Portal</h1>
          </router-link>
        </div>

        <!-- 헤더 우측 메뉴 -->
        <div class="header-right">
          <!-- 알림 버튼 -->
          <el-badge :value="unreadNotificationCount" :hidden="unreadNotificationCount === 0">
            <el-button :icon="Bell" @click="showNotifications" text />
          </el-badge>

          <!-- 테마 토글 버튼 -->
          <el-button 
            :icon="isDarkMode ? Sunny : Moon" 
            @click="toggleTheme"
            text
          />

          <!-- 사용자 메뉴 -->
          <el-dropdown @command="handleUserMenuCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" :src="currentUser?.avatar">
                {{ currentUser?.fullName?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ currentUser?.fullName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" :icon="User">
                  마이페이지
                </el-dropdown-item>
                <el-dropdown-item command="settings" :icon="Setting">
                  설정
                </el-dropdown-item>
                <el-dropdown-item divided command="logout" :icon="SwitchButton">
                  로그아웃
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 사이드바 영역 -->
    <aside class="layout-sidebar" :class="sidebarClasses">
      <el-scrollbar class="sidebar-scroll">
        <nav class="sidebar-nav">
          <!-- 대시보드 -->
          <div class="nav-section">
            <router-link to="/dashboard" class="nav-item" active-class="active">
              <el-icon><Dashboard /></el-icon>
              <span class="nav-text">대시보드</span>
            </router-link>
          </div>

          <!-- 게시판 -->
          <div class="nav-section">
            <div class="nav-title">커뮤니티</div>
            <router-link to="/board" class="nav-item" active-class="active">
              <el-icon><Document /></el-icon>
              <span class="nav-text">게시판</span>
            </router-link>
          </div>

          <!-- 파일 관리 -->
          <div class="nav-section">
            <div class="nav-title">파일</div>
            <router-link to="/files" class="nav-item" active-class="active">
              <el-icon><Folder /></el-icon>
              <span class="nav-text">파일 관리</span>
            </router-link>
          </div>

          <!-- 관리자 메뉴 (권한에 따라 표시) -->
          <div v-if="isManager" class="nav-section">
            <div class="nav-title">관리</div>
            <router-link to="/admin/users" class="nav-item" active-class="active">
              <el-icon><UserFilled /></el-icon>
              <span class="nav-text">사용자 관리</span>
            </router-link>
            <router-link 
              v-if="isAdmin" 
              to="/admin/roles" 
              class="nav-item" 
              active-class="active"
            >
              <el-icon><Key /></el-icon>
              <span class="nav-text">역할 관리</span>
            </router-link>
          </div>
        </nav>
      </el-scrollbar>
    </aside>

    <!-- 메인 콘텐츠 영역 -->
    <main class="layout-main">
      <!-- 브레드크럼 -->
      <div class="breadcrumb-container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item 
            v-for="item in breadcrumbs" 
            :key="item.path"
            :to="item.disabled ? '' : item.path"
          >
            {{ item.text }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 페이지 콘텐츠 -->
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-transition" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <el-loading 
        :text="loadingMessage || '로딩 중...'"
        background="rgba(0, 0, 0, 0.7)"
      />
    </div>

    <!-- 알림 드로어 -->
    <el-drawer
      v-model="notificationDrawerVisible"
      title="알림"
      direction="rtl"
      size="400px"
    >
      <div class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
          <el-button 
            v-if="!notification.read"
            @click="markAsRead(notification.id)"
            size="small"
            text
          >
            읽음 처리
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Menu, Bell, Sunny, Moon, User, Setting, SwitchButton,
  Dashboard, Document, Folder, UserFilled, Key, ArrowDown
} from '@element-plus/icons-vue'
import { generateBreadcrumbs } from '@/router'

export default {
  name: 'DefaultLayout',
  components: {
    Menu, Bell, Sunny, Moon, User, Setting, SwitchButton,
    Dashboard, Document, Folder, UserFilled, Key, ArrowDown
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()

    // 반응형 데이터
    const notificationDrawerVisible = ref(false)

    // 계산된 속성들
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    const isManager = computed(() => store.getters['auth/isManager'])
    const isDarkMode = computed(() => store.getters.isDarkMode)
    const isSidebarCollapsed = computed(() => store.getters['ui/isSidebarCollapsed'])
    const isMobile = computed(() => store.getters['ui/isMobile'])
    const isLoading = computed(() => store.getters['ui/isLoading'])
    const loadingMessage = computed(() => store.getters['ui/loadingMessage'])
    const notifications = computed(() => store.getters['ui/notifications'])
    const unreadNotificationCount = computed(() => store.getters['ui/unreadNotificationCount'])
    const breadcrumbs = computed(() => generateBreadcrumbs(route))

    // CSS 클래스 계산
    const layoutClasses = computed(() => ({
      'sidebar-collapsed': isSidebarCollapsed.value,
      'mobile': isMobile.value,
      'dark-mode': isDarkMode.value
    }))

    const sidebarClasses = computed(() => ({
      'collapsed': isSidebarCollapsed.value,
      'mobile': isMobile.value
    }))

    // 메서드들
    const toggleSidebar = () => {
      store.commit('ui/TOGGLE_SIDEBAR')
    }

    const toggleTheme = () => {
      store.dispatch('toggleTheme')
    }

    const showNotifications = () => {
      notificationDrawerVisible.value = true
    }

    const markAsRead = (notificationId) => {
      store.commit('ui/MARK_NOTIFICATION_READ', notificationId)
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('ko-KR')
    }

    const handleUserMenuCommand = async (command) => {
      switch (command) {
        case 'profile':
          await router.push('/mypage')
          break
        case 'settings':
          ElMessage.info('설정 페이지는 개발 중입니다.')
          break
        case 'logout':
          await handleLogout()
          break
      }
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('auth/logout')
        ElMessage.success('로그아웃되었습니다.')
      } catch (error) {
        ElMessage.error('로그아웃 중 오류가 발생했습니다.')
      }
    }

    // 라이프사이클
    onMounted(() => {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      if (!isAuthenticated.value) {
        router.push('/auth/login')
      }
    })

    // 라우트 변경 감지
    watch(route, () => {
      // 모바일에서 라우트 변경시 사이드바 닫기
      if (isMobile.value) {
        store.commit('ui/SET_SIDEBAR_COLLAPSED', true)
      }
    })

    return {
      // 반응형 데이터
      notificationDrawerVisible,
      
      // 계산된 속성
      currentUser,
      isAdmin,
      isManager,
      isDarkMode,
      layoutClasses,
      sidebarClasses,
      isLoading,
      loadingMessage,
      notifications,
      unreadNotificationCount,
      breadcrumbs,
      
      // 메서드
      toggleSidebar,
      toggleTheme,
      showNotifications,
      markAsRead,
      formatTime,
      handleUserMenuCommand
    }
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

  // 헤더 스타일
  .layout-header {
    height: 60px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color);
    z-index: 1000;
    position: relative;

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 20px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .sidebar-toggle {
          font-size: 18px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--el-text-color-primary);

          .logo {
            height: 32px;
            width: 32px;
          }

          .title {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background-color 0.2s;

          &:hover {
            background: var(--el-fill-color-light);
          }

          .username {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }

  // 사이드바 + 메인 컨테이너
  .layout-container:not(.mobile) {
    .layout-header + * {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
  }

  // 사이드바 스타일
  .layout-sidebar {
    width: 250px;
    background: var(--el-bg-color-page);
    border-right: 1px solid var(--el-border-color);
    transition: width 0.3s ease;
    overflow: hidden;

    &.collapsed {
      width: 64px;
    }

    .sidebar-scroll {
      height: 100%;
    }

    .sidebar-nav {
      padding: 16px 0;

      .nav-section {
        margin-bottom: 24px;

        .nav-title {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0 20px 8px;
          margin-bottom: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: var(--el-text-color-primary);
          text-decoration: none;
          transition: all 0.2s;

          &:hover {
            background: var(--el-fill-color-light);
            color: var(--el-color-primary);
          }

          &.active {
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            border-right: 3px solid var(--el-color-primary);
          }

          .nav-text {
            font-weight: 500;
          }
        }
      }
    }

    // 사이드바 접힘 상태
    &.collapsed {
      .nav-title {
        display: none;
      }

      .nav-item {
        justify-content: center;
        padding: 12px;

        .nav-text {
          display: none;
        }
      }
    }
  }

  // 메인 콘텐츠 스타일
  .layout-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .breadcrumb-container {
      padding: 16px 24px 0;
      background: var(--el-bg-color);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .page-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }
  }

  // 모바일 레이아웃
  &.mobile {
    .layout-header {
      .header-left .title {
        display: none;
      }
    }

    .layout-sidebar {
      position: fixed;
      top: 60px;
      left: 0;
      height: calc(100vh - 60px);
      z-index: 999;
      transform: translateX(-100%);
      transition: transform 0.3s ease;

      &:not(.collapsed) {
        transform: translateX(0);
      }
    }

    .layout-main {
      width: 100%;
    }
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
}

// 페이지 전환 애니메이션
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s ease;
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 알림 스타일
.notifications-list {
  .notification-item {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &.unread {
      background: var(--el-color-primary-light-9);
    }

    .notification-content {
      margin-bottom: 8px;

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .notification-message {
        color: var(--el-text-color-regular);
        line-height: 1.4;
      }

      .notification-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}
</style>