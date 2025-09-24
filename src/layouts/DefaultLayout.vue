<template>
  <!--
    KM 포털 기본 레이아웃 컴포넌트
    
    이 컴포넌트는 인증된 사용자가 사용하는 메인 레이아웃입니다.
    구조: 헤더 + 사이드바 + 메인 콘텐츠 + 푸터
    
    Element Plus 컴포넌트 사용:
    - el-container: 레이아웃 컨테이너
    - el-header: 헤더 영역
    - el-aside: 사이드바 영역
    - el-main: 메인 콘텐츠 영역
    - el-footer: 푸터 영역
  -->
  <el-container class="layout-container">
    <!-- 헤더 영역: 로고, 사용자 정보, 알림 등 -->
    <el-header class="layout-header" height="60px">
      <div class="header-content">
        <!-- 좌측 영역: 메뉴 토글 버튼 + 로고 -->
        <div class="header-left">
          <!-- 사이드바 토글 버튼 -->
          <el-button 
            type="text" 
            @click="toggleSidebar"
            class="sidebar-toggle"
            :icon="sidebarCollapsed ? 'Menu' : 'Fold'"
            size="large"
          >
          </el-button>
          
          <!-- 로고 및 서비스명 -->
          <div class="logo-section">
            <img src="/src/assets/logo.png" alt="KM Portal" class="logo" v-if="false">
            <h1 class="service-title">KM 포털</h1>
            <span class="service-subtitle">업무 관리 시스템</span>
          </div>
        </div>
        
        <!-- 중앙 영역: 브레드크럼 네비게이션 -->
        <div class="header-center">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item 
              v-for="(breadcrumb, index) in breadcrumbs" 
              :key="index"
              :to="breadcrumb.path"
            >
              <i :class="breadcrumb.icon" v-if="breadcrumb.icon"></i>
              {{ breadcrumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <!-- 우측 영역: 사용자 메뉴, 알림, 설정 -->
        <div class="header-right">
          <!-- 전체화면 버튼 -->
          <el-tooltip content="전체화면" placement="bottom">
            <el-button 
              type="text" 
              @click="toggleFullscreen"
              :icon="isFullscreen ? 'CloseBold' : 'FullScreen'"
              size="large"
              class="header-action-btn"
            >
            </el-button>
          </el-tooltip>
          
          <!-- 테마 변경 버튼 -->
          <el-tooltip content="테마 변경" placement="bottom">
            <el-button 
              type="text" 
              @click="toggleTheme"
              :icon="isDarkTheme ? 'Sunny' : 'Moon'"
              size="large"
              class="header-action-btn"
            >
            </el-button>
          </el-tooltip>
          
          <!-- 알림 드롭다운 -->
          <el-dropdown @command="handleNotificationCommand" class="notification-dropdown">
            <el-badge :value="unreadNotificationCount" :hidden="unreadNotificationCount === 0">
              <el-button 
                type="text" 
                icon="Bell" 
                size="large"
                class="header-action-btn"
              >
              </el-button>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-for="notification in recentNotifications" 
                  :key="notification.id"
                  :command="notification.id"
                  :divided="true"
                >
                  <div class="notification-item">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="viewAll" divided>
                  <strong>모든 알림 보기</strong>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 사용자 메뉴 드롭다운 -->
          <el-dropdown @command="handleUserCommand" class="user-dropdown">
            <div class="user-info">
              <!-- 사용자 아바타 -->
              <el-avatar 
                :size="32" 
                :src="currentUser?.avatar"
                class="user-avatar"
              >
                {{ currentUser?.fullName?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ currentUser?.fullName }}</div>
                <div class="user-role">{{ currentUser?.highestRole?.displayName }}</div>
              </div>
              <i class="el-icon-caret-bottom user-dropdown-arrow"></i>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" icon="User">
                  마이페이지
                </el-dropdown-item>
                <el-dropdown-item command="settings" icon="Setting">
                  설정
                </el-dropdown-item>
                <el-dropdown-item command="help" icon="QuestionFilled">
                  도움말
                </el-dropdown-item>
                <el-dropdown-item command="logout" icon="SwitchButton" divided>
                  로그아웃
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <!-- 메인 콘텐츠 영역 -->
    <el-container class="main-container">
      <!-- 사이드바 영역: 네비게이션 메뉴 -->
      <el-aside 
        :width="sidebarWidth" 
        class="layout-sidebar"
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      >
        <div class="sidebar-content">
          <!-- 메뉴 리스트 -->
          <el-menu
            :default-active="activeMenu"
            :collapse="sidebarCollapsed"
            :unique-opened="true"
            router
            class="sidebar-menu"
            background-color="var(--sidebar-bg-color)"
            text-color="var(--sidebar-text-color)"
            active-text-color="var(--sidebar-active-color)"
            @select="handleMenuSelect"
          >
            <!-- 대시보드 -->
            <el-menu-item index="/dashboard" v-if="hasPermission('dashboard')">
              <i class="el-icon-pie-chart"></i>
              <span>대시보드</span>
            </el-menu-item>
            
            <!-- 사용자 관리 (관리자만) -->
            <el-sub-menu index="user-management" v-if="hasPermission('user-management')">
              <template #title>
                <i class="el-icon-user"></i>
                <span>사용자 관리</span>
              </template>
              <el-menu-item index="/admin/users">
                <i class="el-icon-user-solid"></i>
                <span>사용자 목록</span>
              </el-menu-item>
              <el-menu-item index="/admin/roles" v-if="hasPermission('role-management')">
                <i class="el-icon-medal"></i>
                <span>역할 관리</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 게시판 -->
            <el-sub-menu index="board" v-if="hasPermission('board')">
              <template #title>
                <i class="el-icon-document"></i>
                <span>게시판</span>
              </template>
              <el-menu-item index="/board/notice">
                <i class="el-icon-bell"></i>
                <span>공지사항</span>
              </el-menu-item>
              <el-menu-item index="/board/free">
                <i class="el-icon-chat-dot-round"></i>
                <span>자유게시판</span>
              </el-menu-item>
              <el-menu-item index="/board/qna">
                <i class="el-icon-question"></i>
                <span>Q&A</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 파일 관리 -->
            <el-menu-item index="/files" v-if="hasPermission('files')">
              <i class="el-icon-folder"></i>
              <span>파일 관리</span>
            </el-menu-item>
            
            <!-- 개인 메뉴 -->
            <el-sub-menu index="my-menu">
              <template #title>
                <i class="el-icon-user"></i>
                <span>내 정보</span>
              </template>
              <el-menu-item index="/mypage">
                <i class="el-icon-edit"></i>
                <span>마이페이지</span>
              </el-menu-item>
              <el-menu-item index="/my-posts">
                <i class="el-icon-document-copy"></i>
                <span>내 게시글</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 설정 (관리자만) -->
            <el-menu-item index="/admin/settings" v-if="hasPermission('admin-settings')">
              <i class="el-icon-setting"></i>
              <span>시스템 설정</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      
      <!-- 메인 콘텐츠 -->
      <el-main class="layout-main">
        <div class="main-content">
          <!-- 페이지 제목 영역 -->
          <div class="page-header" v-if="showPageHeader">
            <div class="page-title">
              <h2>{{ pageTitle }}</h2>
              <p class="page-description" v-if="pageDescription">{{ pageDescription }}</p>
            </div>
            <div class="page-actions">
              <!-- 페이지별 액션 버튼들이 여기에 표시됨 -->
              <slot name="page-actions"></slot>
            </div>
          </div>
          
          <!-- 라우터 뷰: 실제 페이지 콘텐츠가 여기에 렌더링 -->
          <div class="page-content">
            <router-view></router-view>
          </div>
        </div>
      </el-main>
    </el-container>
    
    <!-- 푸터 영역 -->
    <el-footer class="layout-footer" height="40px">
      <div class="footer-content">
        <div class="footer-left">
          <span>&copy; 2025 KM Portal. All rights reserved.</span>
        </div>
        <div class="footer-right">
          <span>Version 1.0.0</span>
          <el-divider direction="vertical"></el-divider>
          <el-button type="text" size="small" @click="showSystemInfo">시스템 정보</el-button>
          <el-divider direction="vertical"></el-divider>
          <el-button type="text" size="small" @click="showHelp">도움말</el-button>
        </div>
      </div>
    </el-footer>
  </el-container>
</template>

<script>
// Vue 3 Composition API와 필요한 라이브러리들을 import
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'DefaultLayout',
  
  setup() {
    // ================================
    // Vue 라이브러리 훅 초기화
    // ================================
    
    // Vuex 스토어 - 전역 상태 관리
    const store = useStore()
    
    // Vue Router - 라우팅 관리
    const route = useRoute()
    const router = useRouter()
    
    // ================================
    // 반응형 데이터 정의 (ref, reactive)
    // ================================
    
    // 사이드바 상태 관리
    const sidebarCollapsed = ref(false) // 사이드바 접힘/펼침 상태
    
    // 테마 관련 상태
    const isDarkTheme = ref(false) // 다크 테마 여부
    const isFullscreen = ref(false) // 전체화면 모드 여부
    
    // 페이지 헤더 표시 여부
    const showPageHeader = ref(true)
    
    // ================================
    // 계산된 속성 (computed)
    // ================================
    
    /**
     * 현재 로그인한 사용자 정보
     * Vuex 스토어에서 사용자 정보를 가져옴
     */
    const currentUser = computed(() => {
      return store.getters['auth/currentUser']
    })
    
    /**
     * 사이드바 너비 계산
     * 접혔을 때: 64px, 펼쳤을 때: 240px
     */
    const sidebarWidth = computed(() => {
      return sidebarCollapsed.value ? '64px' : '240px'
    })
    
    /**
     * 현재 활성 메뉴 계산
     * 현재 라우트 경로를 기반으로 활성 메뉴 결정
     */
    const activeMenu = computed(() => {
      return route.path
    })
    
    /**
     * 브레드크럼 네비게이션 생성
     * 현재 라우트의 메타 정보를 기반으로 브레드크럼 생성
     */
    const breadcrumbs = computed(() => {
      const matched = route.matched.filter(item => item.meta?.title)
      const breadcrumbList = []
      
      // 홈 링크 추가
      breadcrumbList.push({
        title: '홈',
        path: '/dashboard',
        icon: 'el-icon-house'
      })
      
      // 라우트 매치된 항목들 추가
      matched.forEach(match => {
        breadcrumbList.push({
          title: match.meta.title,
          path: match.path,
          icon: match.meta.icon
        })
      })
      
      return breadcrumbList
    })
    
    /**
     * 페이지 제목 계산
     * 라우트 메타 정보에서 페이지 제목 추출
     */
    const pageTitle = computed(() => {
      return route.meta?.title || '페이지'
    })
    
    /**
     * 페이지 설명 계산
     */
    const pageDescription = computed(() => {
      return route.meta?.description
    })
    
    /**
     * 읽지 않은 알림 개수
     * Vuex 스토어에서 알림 데이터 가져옴
     */
    const unreadNotificationCount = computed(() => {
      return store.getters['notifications/unreadCount']
    })
    
    /**
     * 최근 알림 목록 (최대 5개)
     */
    const recentNotifications = computed(() => {
      return store.getters['notifications/recentList']
    })
    
    // ================================
    // 메서드 정의
    // ================================
    
    /**
     * 사이드바 토글 기능
     * 사이드바 펼침/접힘 상태를 전환하고 상태를 저장
     */
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
      
      // 사이드바 상태를 로컬 스토리지에 저장
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
      
      // Vuex 스토어에도 상태 업데이트
      store.commit('ui/setSidebarCollapsed', sidebarCollapsed.value)
    }
    
    /**
     * 테마 토글 기능
     * 라이트/다크 테마 전환
     */
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value
      
      // HTML 요소에 다크 테마 클래스 추가/제거
      const html = document.documentElement
      if (isDarkTheme.value) {
        html.classList.add('dark-theme')
      } else {
        html.classList.remove('dark-theme')
      }
      
      // 테마 상태 저장
      localStorage.setItem('darkTheme', isDarkTheme.value)
      store.commit('ui/setDarkTheme', isDarkTheme.value)
    }
    
    /**
     * 전체화면 토글 기능
     */
    const toggleFullscreen = () => {
      if (isFullscreen.value) {
        // 전체화면 해제
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      } else {
        // 전체화면 진입
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
        }
      }
    }
    
    /**
     * 권한 검사 함수
     * 현재 사용자가 특정 기능에 접근할 권한이 있는지 확인
     * 
     * @param {string} permission - 확인할 권한명
     * @returns {boolean} 권한이 있으면 true
     */
    const hasPermission = (permission) => {
      const userRoles = currentUser.value?.roles || []
      
      // 권한별 필요한 역할 정의
      const permissionRoles = {
        'dashboard': ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_BOARD_ADMIN'],
        'user-management': ['ROLE_ADMIN', 'ROLE_MANAGER'],
        'role-management': ['ROLE_ADMIN'],
        'board': ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_BOARD_ADMIN'],
        'files': ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER'],
        'admin-settings': ['ROLE_ADMIN']
      }
      
      const requiredRoles = permissionRoles[permission] || []
      return userRoles.some(role => requiredRoles.includes(role.roleName))
    }
    
    /**
     * 메뉴 선택 핸들러
     * 사용자가 사이드바 메뉴를 클릭했을 때 실행
     * 
     * @param {string} menuKey - 선택된 메뉴의 키
     */
    const handleMenuSelect = (menuKey) => {
      console.log('메뉴 선택됨:', menuKey)
      
      // 메뉴 선택 로그를 서버에 전송 (사용자 행동 분석용)
      store.dispatch('analytics/trackMenuClick', {
        menu: menuKey,
        timestamp: new Date()
      })
    }
    
    /**
     * 사용자 메뉴 명령 처리
     * 사용자 드롭다운 메뉴의 각 항목 클릭 처리
     * 
     * @param {string} command - 실행할 명령
     */
    const handleUserCommand = async (command) => {
      switch (command) {
        case 'profile':
          // 마이페이지로 이동
          await router.push('/mypage')
          break
          
        case 'settings':
          // 설정 페이지로 이동
          await router.push('/settings')
          break
          
        case 'help':
          // 도움말 표시
          showHelp()
          break
          
        case 'logout':
          // 로그아웃 확인 및 처리
          await handleLogout()
          break
      }
    }
    
    /**
     * 알림 메뉴 명령 처리
     * 
     * @param {string|number} command - 알림 ID 또는 특수 명령
     */
    const handleNotificationCommand = async (command) => {
      if (command === 'viewAll') {
        // 모든 알림 페이지로 이동
        await router.push('/notifications')
      } else {
        // 특정 알림 읽음 처리 및 상세 보기
        await store.dispatch('notifications/markAsRead', command)
        // 알림 상세 페이지로 이동 또는 모달 표시
      }
    }
    
    /**
     * 로그아웃 처리
     * 사용자 확인 후 로그아웃 실행
     */
    const handleLogout = async () => {
      try {
        const confirmed = await ElMessageBox.confirm(
          '로그아웃 하시겠습니까?',
          '확인',
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        if (confirmed) {
          // Vuex를 통한 로그아웃 처리
          await store.dispatch('auth/logout')
          
          // 로그인 페이지로 리다이렉트
          await router.push('/login')
          
          ElMessage.success('로그아웃 되었습니다.')
        }
      } catch (error) {
        console.log('로그아웃 취소됨')
      }
    }
    
    /**
     * 시간 포맷팅 함수
     * 알림 시간을 사용자 친화적 형태로 변환
     * 
     * @param {Date|string} datetime - 변환할 시간
     * @returns {string} 포맷된 시간 문자열
     */
    const formatTime = (datetime) => {
      const date = new Date(datetime)
      const now = new Date()
      const diff = now - date
      
      // 1분 미만
      if (diff < 60000) {
        return '방금 전'
      }
      // 1시간 미만
      else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}분 전`
      }
      // 1일 미만
      else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}시간 전`
      }
      // 그 외
      else {
        return date.toLocaleDateString()
      }
    }
    
    /**
     * 시스템 정보 표시
     */
    const showSystemInfo = () => {
      ElMessageBox.alert(
        `
        <div>
          <p><strong>KM 포털 시스템</strong></p>
          <p>버전: 1.0.0</p>
          <p>빌드: ${new Date().toLocaleDateString()}</p>
          <p>사용자: ${currentUser.value?.fullName}</p>
          <p>권한: ${currentUser.value?.highestRole?.displayName}</p>
        </div>
        `,
        '시스템 정보',
        {
          dangerouslyUseHTMLString: true
        }
      )
    }
    
    /**
     * 도움말 표시
     */
    const showHelp = () => {
      ElMessageBox.alert(
        '도움말 페이지로 이동하거나 관리자에게 문의하세요.',
        '도움말',
        {
          confirmButtonText: '확인'
        }
      )
    }
    
    // ================================
    // 라이프사이클 훅
    // ================================
    
    /**
     * 컴포넌트 마운트 시 초기화
     */
    onMounted(() => {
      // 저장된 사이드바 상태 복원
      const savedSidebarState = localStorage.getItem('sidebarCollapsed')
      if (savedSidebarState !== null) {
        sidebarCollapsed.value = savedSidebarState === 'true'
      }
      
      // 저장된 테마 상태 복원
      const savedTheme = localStorage.getItem('darkTheme')
      if (savedTheme !== null) {
        isDarkTheme.value = savedTheme === 'true'
        toggleTheme() // 테마 적용
      }
      
      // 전체화면 상태 감지
      document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
      })
      
      // 사용자 정보 로드
      if (!currentUser.value) {
        store.dispatch('auth/fetchCurrentUser')
      }
      
      // 알림 데이터 로드
      store.dispatch('notifications/fetchNotifications')
    })
    
    /**
     * 라우트 변경 감지
     * 페이지 이동 시 필요한 처리 수행
     */
    watch(
      () => route.path,
      (newPath, oldPath) => {
        console.log('라우트 변경:', oldPath, '->', newPath)
        
        // 페이지 이동 추적
        store.dispatch('analytics/trackPageView', {
          from: oldPath,
          to: newPath,
          timestamp: new Date()
        })
      }
    )
    
    // ================================
    // 컴포넌트 반환값
    // 템플릿에서 사용할 모든 데이터와 메서드를 반환
    // ================================
    
    return {
      // 반응형 데이터
      sidebarCollapsed,
      isDarkTheme,
      isFullscreen,
      showPageHeader,
      
      // 계산된 속성
      currentUser,
      sidebarWidth,
      activeMenu,
      breadcrumbs,
      pageTitle,
      pageDescription,
      unreadNotificationCount,
      recentNotifications,
      
      // 메서드
      toggleSidebar,
      toggleTheme,
      toggleFullscreen,
      hasPermission,
      handleMenuSelect,
      handleUserCommand,
      handleNotificationCommand,
      formatTime,
      showSystemInfo,
      showHelp
    }
  }
}
</script>

<style scoped>
/**
 * DefaultLayout 컴포넌트 스타일
 * 
 * CSS 변수를 활용하여 테마 변경이 용이하도록 설계
 * 반응형 디자인을 고려하여 모바일 환경도 지원
 */

/* CSS 변수 정의 (라이트 테마) */
:root {
  --header-bg-color: #ffffff;
  --header-text-color: #303133;
  --header-border-color: #e4e7ed;
  
  --sidebar-bg-color: #304156;
  --sidebar-text-color: #bfcbd9;
  --sidebar-active-color: #409eff;
  
  --main-bg-color: #f0f2f5;
  --content-bg-color: #ffffff;
  
  --footer-bg-color: #ffffff;
  --footer-text-color: #909399;
  --footer-border-color: #e4e7ed;
}

/* 다크 테마 CSS 변수 */
.dark-theme {
  --header-bg-color: #1d1e1f;
  --header-text-color: #e4e7ed;
  --header-border-color: #4c4d4f;
  
  --sidebar-bg-color: #2b2f3a;
  --sidebar-text-color: #bfcbd9;
  --sidebar-active-color: #409eff;
  
  --main-bg-color: #0a0a0a;
  --content-bg-color: #1d1e1f;
  
  --footer-bg-color: #1d1e1f;
  --footer-text-color: #909399;
  --footer-border-color: #4c4d4f;
}

/* 레이아웃 컨테이너 */
.layout-container {
  height: 100vh;
  width: 100%;
}

/* 헤더 스타일 */
.layout-header {
  background-color: var(--header-bg-color);
  border-bottom: 1px solid var(--header-border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  color: var(--header-text-color);
  font-size: 18px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 32px;
  width: 32px;
}

.service-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--header-text-color);
}

.service-subtitle {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 40px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action-btn {
  color: var(--header-text-color);
  font-size: 16px;
  padding: 8px;
}

.header-action-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

/* 알림 드롭다운 */
.notification-dropdown {
  margin-right: 8px;
}

.notification-item {
  max-width: 250px;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

/* 사용자 드롭다운 */
.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.user-avatar {
  border: 2px solid #e4e7ed;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--header-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-role {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-dropdown-arrow {
  color: #909399;
  font-size: 12px;
}

/* 메인 컨테이너 */
.main-container {
  height: calc(100vh - 100px); /* 헤더와 푸터 높이 제외 */
}

/* 사이드바 스타일 */
.layout-sidebar {
  background-color: var(--sidebar-bg-color);
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 64px !important;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  height: 48px;
  line-height: 48px;
  padding-left: 20px !important;
}

.sidebar-menu.el-menu--collapse .el-menu-item,
.sidebar-menu.el-menu--collapse .el-sub-menu__title {
  padding-left: 20px !important;
}

/* 메인 콘텐츠 영역 */
.layout-main {
  background-color: var(--main-bg-color);
  padding: 0;
  overflow-y: auto;
}

.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  background-color: var(--content-bg-color);
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 푸터 스타일 */
.layout-footer {
  background-color: var(--footer-bg-color);
  border-top: 1px solid var(--footer-border-color);
  padding: 0;
  line-height: 40px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  font-size: 12px;
  color: var(--footer-text-color);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-center {
    display: none; /* 모바일에서는 브레드크럼 숨김 */
  }
  
  .user-details {
    display: none; /* 모바일에서는 사용자 이름 숨김 */
  }
  
  .service-subtitle {
    display: none; /* 모바일에서는 부제목 숨김 */
  }
  
  .page-content {
    padding: 16px;
  }
  
  .footer-content {
    padding: 0 16px;
  }
  
  .footer-left span {
    display: none; /* 모바일에서는 저작권 표시 숨김 */
  }
}

@media (max-width: 480px) {
  .layout-sidebar {
    position: fixed;
    left: -240px;
    z-index: 999;
    transition: left 0.3s ease;
  }
  
  .layout-sidebar.show {
    left: 0;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .page-title h2 {
    font-size: 20px;
  }
}

/* 스크롤바 스타일 (Webkit 기반 브라우저) */
.sidebar-content::-webkit-scrollbar,
.layout-main::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track,
.layout-main::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb,
.layout-main::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover,
.layout-main::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.5);
}

/* 로딩 및 전환 애니메이션 */
.page-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Element Plus 컴포넌트 커스터마이징 */
.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

.el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.2) !important;
  border-right: 3px solid #409eff;
}
</style>