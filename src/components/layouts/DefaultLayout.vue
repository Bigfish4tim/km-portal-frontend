<template>
  <!--
    KM 포털 기본 레이아웃 컴포넌트
    
    이 컴포넌트는 인증된 사용자가 사용하는 메인 레이아웃입니다.
    구조: 헤더 + 사이드바 + 메인 콘텐츠 + 푸터
    
    35일차 업데이트:
    - 알림 드롭다운 API 연동 완료
    - 실시간 알림 폴링 (30초마다)
    - 알림 클릭 시 읽음 처리 및 페이지 이동
    - 읽지 않은 알림 뱃지 표시
    
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
          
          <!-- 
            ====== 35일차 업데이트: 알림 드롭다운 API 연동 완료 ======
            
            기능:
            1. 읽지 않은 알림 개수 뱃지 표시 (실시간)
            2. 최근 알림 목록 드롭다운 표시
            3. 알림 클릭 시 해당 페이지로 이동 + 읽음 처리
            4. "모든 알림 보기" 클릭 시 알림 목록 페이지로 이동
            5. 30초마다 자동 새로고침 (폴링)
          -->
          <el-dropdown 
            @command="handleNotificationCommand" 
            @visible-change="onNotificationDropdownOpen"
            class="notification-dropdown"
            trigger="click"
          >
            <!-- 알림 아이콘 + 뱃지 -->
            <el-badge 
              :value="unreadNotificationCount" 
              :hidden="unreadNotificationCount === 0"
              :max="99"
            >
              <el-button 
                type="text" 
                icon="Bell" 
                size="large"
                class="header-action-btn"
                :class="{ 'has-unread': unreadNotificationCount > 0 }"
              >
              </el-button>
            </el-badge>
            
            <!-- 알림 드롭다운 메뉴 -->
            <template #dropdown>
              <el-dropdown-menu class="notification-dropdown-menu">
                <!-- 드롭다운 헤더 -->
                <div class="notification-dropdown-header">
                  <span class="notification-dropdown-title">알림</span>
                  <!-- 전체 읽음 버튼 (읽지 않은 알림이 있을 때만 표시) -->
                  <el-button 
                    v-if="unreadNotificationCount > 0"
                    type="text" 
                    size="small"
                    @click.stop="handleMarkAllAsRead"
                    class="mark-all-read-btn"
                  >
                    모두 읽음
                  </el-button>
                </div>
                
                <!-- 알림 목록 (로딩 중) -->
                <div v-if="notificationLoading" class="notification-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>알림을 불러오는 중...</span>
                </div>
                
                <!-- 알림 목록 (비어있음) -->
                <div v-else-if="recentNotifications.length === 0" class="notification-empty">
                  <el-icon><BellFilled /></el-icon>
                  <span>알림이 없습니다</span>
                </div>
                
                <!-- 알림 목록 (데이터 있음) -->
                <template v-else>
                  <el-dropdown-item 
                    v-for="notification in recentNotifications" 
                    :key="notification.id"
                    :command="{ type: 'view', notification: notification }"
                    class="notification-dropdown-item"
                    :class="{ 'unread': !notification.isRead }"
                  >
                    <div class="notification-item">
                      <!-- 알림 아이콘 (유형별) -->
                      <div class="notification-icon" :class="notification.type">
                        <el-icon>
                          <component :is="getNotificationIcon(notification.type)" />
                        </el-icon>
                      </div>
                      
                      <!-- 알림 내용 -->
                      <div class="notification-content">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-message" v-if="notification.message">
                          {{ truncateText(notification.message, 40) }}
                        </div>
                        <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                      </div>
                      
                      <!-- 읽지 않음 표시 -->
                      <div class="notification-unread-dot" v-if="!notification.isRead"></div>
                    </div>
                  </el-dropdown-item>
                </template>
                
                <!-- 구분선 -->
                <el-divider style="margin: 8px 0;" />
                
                <!-- 모든 알림 보기 링크 -->
                <el-dropdown-item :command="{ type: 'viewAll' }" class="view-all-link">
                  <el-icon><ArrowRight /></el-icon>
                  <span>모든 알림 보기</span>
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
              <el-menu-item index="/board">
                <i class="el-icon-document-copy"></i>
                <span>전체 게시글</span>
              </el-menu-item>
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
              <!-- 35일차 추가: 알림 메뉴 -->
              <el-menu-item index="/notifications">
                <i class="el-icon-bell"></i>
                <span>알림</span>
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
/**
 * DefaultLayout 컴포넌트 스크립트
 * 
 * 35일차 업데이트:
 * - notificationApi.js import 추가
 * - 알림 관련 반응형 데이터 추가
 * - 알림 폴링 로직 추가 (30초마다)
 * - 알림 읽음 처리 및 페이지 이동 로직 추가
 * 
 * @version 2.0 (35일차 업데이트)
 */

// Vue 3 Composition API와 필요한 라이브러리들을 import
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 35일차 추가: 알림 API import
import notificationApi from '@/services/notificationApi'

// Element Plus 아이콘 import (알림 유형별 아이콘용)
import { 
  ChatDotRound,    // 댓글
  Document,        // 게시글
  InfoFilled,      // 시스템
  Folder,          // 파일
  Star,            // 고정
  User,            // 권한
  Bell,            // 기본 알림
  BellFilled,      // 빈 알림
  Loading,         // 로딩
  ArrowRight       // 화살표
} from '@element-plus/icons-vue'

export default {
  name: 'DefaultLayout',
  
  // Element Plus 아이콘 컴포넌트 등록
  components: {
    ChatDotRound,
    Document,
    InfoFilled,
    Folder,
    Star,
    User,
    Bell,
    BellFilled,
    Loading,
    ArrowRight
  },
  
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
    
    // ====== 35일차 추가: 알림 관련 반응형 데이터 ======
    
    /**
     * 읽지 않은 알림 개수
     * 헤더의 알림 뱃지에 표시됩니다.
     */
    const unreadNotificationCount = ref(0)
    
    /**
     * 최근 알림 목록 (드롭다운용)
     * 최대 5개의 알림을 표시합니다.
     */
    const recentNotifications = ref([])
    
    /**
     * 알림 로딩 상태
     * 드롭다운을 열 때 로딩 표시용
     */
    const notificationLoading = ref(false)
    
    /**
     * 알림 폴링 인터벌 ID
     * 컴포넌트 언마운트 시 정리하기 위해 저장
     */
    let notificationPollingInterval = null
    
    /**
     * 알림 폴링 주기 (밀리초)
     * 30초마다 알림을 새로고침합니다.
     */
    const NOTIFICATION_POLLING_INTERVAL = 30000
    
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
    
    // ================================
    // 35일차 추가: 알림 관련 메서드
    // ================================
    
    /**
     * 알림 데이터 로드
     * 
     * 최근 알림 목록과 읽지 않은 알림 개수를 동시에 조회합니다.
     * 헤더의 알림 드롭다운에 표시되는 데이터를 갱신합니다.
     * 
     * @param {boolean} showLoading - 로딩 상태 표시 여부 (기본값: false)
     */
    const loadNotifications = async (showLoading = false) => {
      try {
        if (showLoading) {
          notificationLoading.value = true
        }
        
        // 최근 알림 5개 조회 (unreadCount도 함께 반환됨)
        const response = await notificationApi.getRecentNotifications(5)
        
        // 응답 데이터 적용
        recentNotifications.value = response.notifications || []
        unreadNotificationCount.value = response.unreadCount || 0
        
        console.log('[DefaultLayout] 알림 데이터 로드 완료:', {
          count: recentNotifications.value.length,
          unreadCount: unreadNotificationCount.value
        })
        
      } catch (error) {
        console.error('[DefaultLayout] 알림 데이터 로드 실패:', error)
        // 에러 발생해도 UI는 유지 (빈 상태로)
        // 사용자에게 에러 메시지 표시하지 않음 (백그라운드 작업이므로)
      } finally {
        notificationLoading.value = false
      }
    }
    
    /**
     * 읽지 않은 알림 개수만 조회
     * 
     * 전체 알림 데이터를 조회하지 않고, 개수만 빠르게 조회합니다.
     * 폴링 시 사용하여 네트워크 부하를 줄입니다.
     */
    const loadUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount()
        unreadNotificationCount.value = count
      } catch (error) {
        console.error('[DefaultLayout] 읽지 않은 알림 개수 조회 실패:', error)
      }
    }
    
    /**
     * 알림 폴링 시작
     * 
     * 지정된 간격(30초)으로 알림 개수를 주기적으로 조회합니다.
     * 실시간 알림 효과를 구현합니다.
     */
    const startNotificationPolling = () => {
      // 기존 인터벌이 있으면 정리
      if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval)
      }
      
      // 새 인터벌 시작
      notificationPollingInterval = setInterval(() => {
        loadUnreadCount()
      }, NOTIFICATION_POLLING_INTERVAL)
      
      console.log('[DefaultLayout] 알림 폴링 시작 - 간격:', NOTIFICATION_POLLING_INTERVAL, 'ms')
    }
    
    /**
     * 알림 폴링 중지
     * 
     * 컴포넌트 언마운트 시 호출하여 메모리 누수를 방지합니다.
     */
    const stopNotificationPolling = () => {
      if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval)
        notificationPollingInterval = null
        console.log('[DefaultLayout] 알림 폴링 중지')
      }
    }
    
    /**
     * 알림 드롭다운 열림 이벤트 핸들러
     * 
     * 드롭다운이 열릴 때 최신 알림 데이터를 조회합니다.
     * 
     * @param {boolean} visible - 드롭다운 표시 여부
     */
    const onNotificationDropdownOpen = (visible) => {
      if (visible) {
        console.log('[DefaultLayout] 알림 드롭다운 열림 - 데이터 새로고침')
        loadNotifications(true)  // 로딩 표시와 함께 조회
      }
    }
    
    /**
     * 알림 명령 처리 핸들러
     * 
     * 드롭다운 메뉴 항목 클릭 시 호출됩니다.
     * 
     * @param {Object} command - 클릭된 항목 정보
     *   - type: 'view' (개별 알림) 또는 'viewAll' (모든 알림)
     *   - notification: 알림 객체 (type='view'일 때)
     */
    const handleNotificationCommand = async (command) => {
      console.log('[DefaultLayout] 알림 명령 처리:', command)
      
      if (command.type === 'viewAll') {
        // "모든 알림 보기" 클릭 - 알림 목록 페이지로 이동
        await router.push('/notifications')
        
      } else if (command.type === 'view' && command.notification) {
        // 개별 알림 클릭 - 읽음 처리 후 해당 페이지로 이동
        const notification = command.notification
        
        try {
          // 1. 읽지 않은 알림이면 읽음 처리
          if (!notification.isRead) {
            await notificationApi.markAsRead(notification.id)
            
            // 로컬 상태 업데이트 (UI 즉시 반영)
            notification.isRead = true
            unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1)
          }
          
          // 2. 링크가 있으면 해당 페이지로 이동
          if (notification.link) {
            await router.push(notification.link)
          } else if (notification.relatedBoardId) {
            // link가 없지만 관련 게시글이 있으면 게시글 상세로 이동
            await router.push(`/board/${notification.relatedBoardId}`)
          }
          
        } catch (error) {
          console.error('[DefaultLayout] 알림 처리 실패:', error)
          ElMessage.error('알림을 처리하는 중 오류가 발생했습니다.')
        }
      }
    }
    
    /**
     * 전체 알림 읽음 처리 핸들러
     * 
     * "모두 읽음" 버튼 클릭 시 호출됩니다.
     */
    const handleMarkAllAsRead = async () => {
      try {
        // API 호출하여 전체 읽음 처리
        await notificationApi.markAllAsRead()
        
        // 로컬 상태 업데이트
        recentNotifications.value.forEach(n => {
          n.isRead = true
        })
        unreadNotificationCount.value = 0
        
        ElMessage.success('모든 알림을 읽음 처리했습니다.')
        
      } catch (error) {
        console.error('[DefaultLayout] 전체 읽음 처리 실패:', error)
        ElMessage.error('알림 읽음 처리 중 오류가 발생했습니다.')
      }
    }
    
    /**
     * 알림 유형별 아이콘 반환
     * 
     * @param {string} type - 알림 유형
     * @returns {string} Element Plus 아이콘 컴포넌트 이름
     */
    const getNotificationIcon = (type) => {
      const iconMap = {
        'NEW_COMMENT': 'ChatDotRound',
        'NEW_REPLY': 'ChatDotRound',
        'NEW_BOARD': 'Document',
        'MENTION': 'ChatDotRound',
        'SYSTEM': 'InfoFilled',
        'FILE_SHARED': 'Folder',
        'BOARD_PINNED': 'Star',
        'ROLE_CHANGED': 'User'
      }
      return iconMap[type] || 'Bell'
    }
    
    /**
     * 텍스트 자르기 (말줄임표)
     * 
     * @param {string} text - 원본 텍스트
     * @param {number} maxLength - 최대 길이
     * @returns {string} 잘린 텍스트
     */
    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
    
    // ================================
    // 기존 메서드 정의
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
          // 35일차 추가: 로그아웃 시 알림 폴링 중지
          stopNotificationPolling()
          
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
      if (!datetime) return ''
      
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
      // 7일 미만
      else if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}일 전`
      }
      // 그 외
      else {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}.${month}.${day}`
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
      
      // ====== 35일차 추가: 알림 데이터 초기 로드 및 폴링 시작 ======
      // 초기 알림 데이터 로드
      loadNotifications()
      
      // 알림 폴링 시작 (30초마다)
      startNotificationPolling()
      
      console.log('[DefaultLayout] 마운트 완료 - 알림 시스템 활성화')
    })
    
    /**
     * 35일차 추가: 컴포넌트 언마운트 시 정리
     */
    onUnmounted(() => {
      // 알림 폴링 중지 (메모리 누수 방지)
      stopNotificationPolling()
      
      console.log('[DefaultLayout] 언마운트 완료 - 알림 시스템 비활성화')
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
      
      // 35일차 추가: 알림 관련 데이터
      unreadNotificationCount,
      recentNotifications,
      notificationLoading,
      
      // 계산된 속성
      currentUser,
      sidebarWidth,
      activeMenu,
      breadcrumbs,
      pageTitle,
      pageDescription,
      
      // 메서드
      toggleSidebar,
      toggleTheme,
      toggleFullscreen,
      hasPermission,
      handleMenuSelect,
      handleUserCommand,
      formatTime,
      showSystemInfo,
      showHelp,
      
      // 35일차 추가: 알림 관련 메서드
      handleNotificationCommand,
      handleMarkAllAsRead,
      onNotificationDropdownOpen,
      getNotificationIcon,
      truncateText,
      loadNotifications
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
 * 
 * 35일차 업데이트:
 * - 알림 드롭다운 스타일 추가
 * - 읽지 않은 알림 표시 스타일 추가
 * - 알림 아이콘 애니메이션 추가
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
  
  /* 35일차 추가: 알림 관련 색상 */
  --notification-unread-bg: #ecf5ff;
  --notification-unread-border: #409eff;
  --notification-icon-comment: #409eff;
  --notification-icon-system: #67c23a;
  --notification-icon-file: #e6a23c;
  --notification-icon-default: #909399;
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
  
  --notification-unread-bg: #1d3557;
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

/* ====== 35일차 추가: 알림 관련 스타일 ====== */

/* 알림 드롭다운 */
.notification-dropdown {
  margin-right: 8px;
}

/* 읽지 않은 알림이 있을 때 아이콘 강조 */
.header-action-btn.has-unread {
  color: #409eff;
  animation: bellShake 0.5s ease-in-out;
}

/* 알림 아이콘 흔들림 애니메이션 */
@keyframes bellShake {
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(-10deg); }
  40%, 80% { transform: rotate(10deg); }
}

/* 알림 드롭다운 메뉴 */
.notification-dropdown-menu {
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  padding: 0;
}

/* 드롭다운 헤더 */
.notification-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.notification-dropdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.mark-all-read-btn {
  font-size: 12px;
  color: #409eff;
  padding: 4px 8px;
}

.mark-all-read-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

/* 알림 로딩 상태 */
.notification-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.notification-loading .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 알림 비어있음 상태 */
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.notification-empty .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #dcdfe6;
}

/* 알림 아이템 */
.notification-dropdown-item {
  padding: 0 !important;
}

.notification-dropdown-item.unread {
  background-color: var(--notification-unread-bg) !important;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  gap: 12px;
  position: relative;
  width: 100%;
}

.notification-dropdown-item:hover .notification-item {
  background-color: #f5f7fa;
}

/* 알림 아이콘 */
.notification-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  color: var(--notification-icon-default);
}

.notification-icon.NEW_COMMENT,
.notification-icon.NEW_REPLY,
.notification-icon.MENTION {
  background-color: #ecf5ff;
  color: var(--notification-icon-comment);
}

.notification-icon.SYSTEM {
  background-color: #f0f9eb;
  color: var(--notification-icon-system);
}

.notification-icon.FILE_SHARED {
  background-color: #fdf6ec;
  color: var(--notification-icon-file);
}

.notification-icon.BOARD_PINNED {
  background-color: #fef0f0;
  color: #f56c6c;
}

.notification-icon.ROLE_CHANGED {
  background-color: #f4f4f5;
  color: #909399;
}

/* 알림 내용 */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-message {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

/* 읽지 않음 표시 점 */
.notification-unread-dot {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
}

/* 모든 알림 보기 링크 */
.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px !important;
  color: #409eff;
  font-size: 13px;
}

.view-all-link:hover {
  background-color: #ecf5ff !important;
}

/* ====== 기존 스타일 (유지) ====== */

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
  
  /* 35일차 추가: 모바일 알림 드롭다운 */
  .notification-dropdown-menu {
    width: 320px;
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
  
  /* 35일차 추가: 모바일 알림 드롭다운 */
  .notification-dropdown-menu {
    width: calc(100vw - 32px);
    max-width: 360px;
  }
}

/* 스크롤바 스타일 (Webkit 기반 브라우저) */
.sidebar-content::-webkit-scrollbar,
.layout-main::-webkit-scrollbar,
.notification-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track,
.layout-main::-webkit-scrollbar-track,
.notification-dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb,
.layout-main::-webkit-scrollbar-thumb,
.notification-dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover,
.layout-main::-webkit-scrollbar-thumb:hover,
.notification-dropdown-menu::-webkit-scrollbar-thumb:hover {
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