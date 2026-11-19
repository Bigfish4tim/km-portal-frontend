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
    
    36일차 업데이트:
    - 반응형 디자인 적용 (모바일/태블릿/데스크톱)
    - 햄버거 메뉴 버튼으로 통합
    - 모바일 사이드바 오버레이 추가
    - 브레이크포인트 기반 UI 조정
    
    Element Plus 컴포넌트 사용:
    - el-container: 레이아웃 컨테이너
    - el-header: 헤더 영역
    - el-aside: 사이드바 영역
    - el-main: 메인 콘텐츠 영역
    - el-footer: 푸터 영역
  -->
  <el-container class="layout-container">
    
    <!-- 
      36일차 추가: 모바일 오버레이
      모바일에서 사이드바가 열렸을 때 배경을 어둡게 처리하고
      클릭 시 사이드바를 닫는 역할을 합니다.
    -->
    <transition name="fade">
      <div 
        v-if="isMobileSidebarOpen" 
        class="mobile-overlay" 
        @click="closeMobileSidebar"
      ></div>
    </transition>
    
    <!-- 헤더 영역: 로고, 사용자 정보, 알림 등 -->
    <el-header class="layout-header" height="60px">
      <div class="header-content">
        <!-- 좌측 영역: 메뉴 토글 버튼 + 로고 -->
        <div class="header-left">
          <!-- 
            36일차 업데이트: 햄버거 메뉴 버튼
            모바일에서는 사이드바 열기/닫기
            데스크톱에서는 사이드바 접기/펼치기
            CSS 애니메이션으로 X 모양 전환
          -->
          <button 
            class="hamburger-btn" 
            :class="{ 'is-active': isMobileSidebarOpen }" 
            @click="handleMenuToggle"
            aria-label="메뉴 토글"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
          
          <!-- 로고 및 서비스명 -->
          <div class="logo-section">
            <h1 class="service-title">KM 포털</h1>
            <!-- 36일차: 부제목은 데스크톱에서만 표시 -->
            <span class="service-subtitle desktop-only">업무 관리 시스템</span>
          </div>
        </div>
        
        <!-- 
          중앙 영역: 브레드크럼 네비게이션 
          36일차: 데스크톱에서만 표시
        -->
        <div class="header-center desktop-only">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item 
              v-for="(breadcrumb, index) in breadcrumbs" 
              :key="index"
              :to="breadcrumb.path"
            >
              {{ breadcrumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <!-- 우측 영역: 사용자 메뉴, 알림, 설정 -->
        <div class="header-right">
          <!-- 전체화면 버튼 (36일차: 태블릿 이상에서만 표시) -->
          <el-tooltip content="전체화면" placement="bottom">
            <el-button 
              type="text" 
              @click="toggleFullscreen"
              :icon="isFullscreen ? 'CloseBold' : 'FullScreen'"
              size="large"
              class="header-action-btn tablet-up-only"
            >
            </el-button>
          </el-tooltip>
          
          <!-- 테마 변경 버튼 (36일차: 태블릿 이상에서만 표시) -->
          <el-tooltip content="테마 변경" placement="bottom">
            <el-button 
              type="text" 
              @click="toggleTheme"
              :icon="isDarkTheme ? 'Sunny' : 'Moon'"
              size="large"
              class="header-action-btn tablet-up-only"
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
              <!-- 36일차: 사용자 상세 정보는 태블릿 이상에서만 표시 -->
              <div class="user-details tablet-up-only">
                <div class="user-name">{{ currentUser?.fullName }}</div>
                <div class="user-role">{{ currentUser?.highestRole?.displayName }}</div>
              </div>
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
      <!-- 
        사이드바 영역: 네비게이션 메뉴 
        36일차: 반응형 클래스 추가
        - sidebar-collapsed: 데스크톱에서 접힌 상태
        - mobile-sidebar-open: 모바일에서 열린 상태
      -->
      <el-aside 
        :width="sidebarWidth" 
        class="layout-sidebar"
        :class="{ 
          'sidebar-collapsed': sidebarCollapsed, 
          'mobile-sidebar-open': isMobileSidebarOpen 
        }"
      >
        <div class="sidebar-content">
          <!-- 36일차: 모바일 전용 사이드바 헤더 -->
          <div class="mobile-sidebar-header mobile-only">
            <span class="mobile-sidebar-title">메뉴</span>
            <el-button 
              type="text" 
              icon="Close" 
              @click="closeMobileSidebar" 
              class="mobile-close-btn" 
            />
          </div>
          
          <!-- 메뉴 리스트 -->
          <el-menu
            :default-active="activeMenu"
            :collapse="sidebarCollapsed && !isMobile"
            :unique-opened="true"
            router
            class="sidebar-menu"
            @select="handleMenuSelect"
          >
            <!-- 대시보드 -->
            <el-menu-item index="/dashboard" v-if="hasPermission('dashboard')">
              <el-icon><Odometer /></el-icon>
              <span>대시보드</span>
            </el-menu-item>
            
            <!-- 사용자 관리 (관리자만) -->
            <el-sub-menu index="user-management" v-if="hasPermission('user-management')">
              <template #title>
                <el-icon><User /></el-icon>
                <span>사용자 관리</span>
              </template>
              <el-menu-item index="/admin/users">
                <el-icon><UserFilled /></el-icon>
                <span>사용자 목록</span>
              </el-menu-item>
              <el-menu-item index="/admin/roles" v-if="hasPermission('role-management')">
                <el-icon><Medal /></el-icon>
                <span>역할 관리</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 게시판 -->
            <el-sub-menu index="board" v-if="hasPermission('board')">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>게시판</span>
              </template>
              <el-menu-item index="/board">
                <el-icon><DocumentCopy /></el-icon>
                <span>전체 게시글</span>
              </el-menu-item>
              <el-menu-item index="/board/notice">
                <el-icon><Bell /></el-icon>
                <span>공지사항</span>
              </el-menu-item>
              <el-menu-item index="/board/free">
                <el-icon><ChatDotRound /></el-icon>
                <span>자유게시판</span>
              </el-menu-item>
              <el-menu-item index="/board/qna">
                <el-icon><QuestionFilled /></el-icon>
                <span>Q&A</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 파일 관리 -->
            <el-menu-item index="/files" v-if="hasPermission('files')">
              <el-icon><Folder /></el-icon>
              <span>파일 관리</span>
            </el-menu-item>
            
            <!-- 개인 메뉴 -->
            <el-sub-menu index="my-menu">
              <template #title>
                <el-icon><User /></el-icon>
                <span>내 정보</span>
              </template>
              <el-menu-item index="/mypage">
                <el-icon><Edit /></el-icon>
                <span>마이페이지</span>
              </el-menu-item>
              <el-menu-item index="/my-posts">
                <el-icon><DocumentCopy /></el-icon>
                <span>내 게시글</span>
              </el-menu-item>
              <!-- 35일차 추가: 알림 메뉴 -->
              <el-menu-item index="/notifications">
                <el-icon><Bell /></el-icon>
                <span>알림</span>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 설정 (관리자만) -->
            <el-menu-item index="/admin/settings" v-if="hasPermission('admin-settings')">
              <el-icon><Setting /></el-icon>
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
          <!-- 36일차: 반응형 텍스트 -->
          <span class="desktop-only">&copy; 2025 KM Portal. All rights reserved.</span>
          <span class="mobile-only">&copy; 2025 KM Portal</span>
        </div>
        <!-- 36일차: 푸터 우측은 태블릿 이상에서만 표시 -->
        <div class="footer-right tablet-up-only">
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
 * 36일차 업데이트:
 * - 반응형 상태 관리 추가 (windowWidth, isMobile, isDesktop)
 * - 모바일 사이드바 제어 로직 추가
 * - 리사이즈 이벤트 핸들러 추가 (디바운싱 적용)
 * - 라우트 변경 시 모바일 사이드바 자동 닫기
 * 
 * @version 3.0 (36일차 업데이트)
 */

// Vue 3 Composition API와 필요한 라이브러리들을 import
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 35일차 추가: 알림 API import
import notificationApi from '@/services/notificationApi'

// Element Plus 아이콘 import (알림 유형별 아이콘 및 메뉴 아이콘용)
import { 
  ChatDotRound,    // 댓글
  Document,        // 게시글
  DocumentCopy,    // 문서 복사
  InfoFilled,      // 시스템 정보
  Folder,          // 폴더/파일
  Star,            // 고정/즐겨찾기
  User,            // 사용자
  UserFilled,      // 사용자 채움
  Bell,            // 알림
  BellFilled,      // 알림 채움
  Loading,         // 로딩
  ArrowRight,      // 화살표
  Odometer,        // 대시보드
  Medal,           // 메달/역할
  QuestionFilled,  // 질문
  Edit,            // 편집
  Setting,         // 설정
  Close            // 닫기
} from '@element-plus/icons-vue'

export default {
  name: 'DefaultLayout',
  
  // Element Plus 아이콘 컴포넌트 등록
  components: {
    ChatDotRound,
    Document,
    DocumentCopy,
    InfoFilled,
    Folder,
    Star,
    User,
    UserFilled,
    Bell,
    BellFilled,
    Loading,
    ArrowRight,
    Odometer,
    Medal,
    QuestionFilled,
    Edit,
    Setting,
    Close
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
    
    // ====== 36일차 추가: 반응형 상태 관리 ======
    
    /**
     * 현재 윈도우 너비
     * 반응형 레이아웃 결정에 사용됩니다.
     */
    const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
    
    /**
     * 모바일 사이드바 열림 상태
     * 모바일에서 햄버거 메뉴 클릭 시 true로 설정됩니다.
     */
    const isMobileSidebarOpen = ref(false)
    
    /**
     * 브레이크포인트 정의
     * CSS와 동일한 값을 사용하여 일관성을 유지합니다.
     */
    const BREAKPOINTS = {
      mobile: 480,    // 480px 미만: 모바일
      tablet: 768,    // 768px 미만: 태블릿
      desktop: 1024   // 1024px 이상: 데스크톱
    }
    
    /**
     * 리사이즈 디바운스 타임아웃 ID
     * 리사이즈 이벤트 최적화에 사용됩니다.
     */
    let resizeTimeout = null
    
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
     * 36일차: 모바일 여부 판단
     * 태블릿 브레이크포인트 미만이면 모바일로 간주
     */
    const isMobile = computed(() => windowWidth.value < BREAKPOINTS.tablet)
    
    /**
     * 36일차: 데스크톱 여부 판단
     * 데스크톱 브레이크포인트 이상이면 데스크톱으로 간주
     */
    const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.desktop)
    
    /**
     * 사이드바 너비 계산
     * 36일차 업데이트: 반응형 너비 적용
     * - 모바일: 280px (고정)
     * - 접혔을 때: 64px
     * - 펼쳤을 때: 240px
     */
    const sidebarWidth = computed(() => {
      if (isMobile.value) {
        return '280px'
      }
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
        path: '/dashboard'
      })
      
      // 라우트 매치된 항목들 추가
      matched.forEach(match => {
        breadcrumbList.push({
          title: match.meta.title,
          path: match.path
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
    // 36일차 추가: 반응형 관련 메서드
    // ================================
    
    /**
     * 윈도우 리사이즈 핸들러
     * 
     * 디바운싱을 적용하여 성능을 최적화합니다.
     * 리사이즈 완료 후 100ms 후에 윈도우 너비를 업데이트합니다.
     */
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      resizeTimeout = setTimeout(() => {
        windowWidth.value = window.innerWidth
        
        // 화면이 커지면 모바일 사이드바 자동 닫기
        if (!isMobile.value && isMobileSidebarOpen.value) {
          isMobileSidebarOpen.value = false
          document.body.style.overflow = ''
        }
      }, 100)
    }
    
    /**
     * 메뉴 토글 핸들러
     * 
     * 모바일에서는 사이드바를 열고 닫습니다.
     * 데스크톱에서는 사이드바를 접고 펼칩니다.
     */
    const handleMenuToggle = () => {
      if (isMobile.value) {
        // 모바일: 사이드바 오버레이 방식
        isMobileSidebarOpen.value = !isMobileSidebarOpen.value
        // 사이드바 열릴 때 body 스크롤 방지
        document.body.style.overflow = isMobileSidebarOpen.value ? 'hidden' : ''
      } else {
        // 데스크톱: 사이드바 접기/펼치기
        toggleSidebar()
      }
    }
    
    /**
     * 모바일 사이드바 닫기
     * 
     * 오버레이 클릭 또는 메뉴 선택 시 호출됩니다.
     */
    const closeMobileSidebar = () => {
      isMobileSidebarOpen.value = false
      document.body.style.overflow = ''
    }
    
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
     * 36일차 업데이트: 모바일에서 사이드바 닫기 추가
     * 
     * @param {Object} command - 클릭된 항목 정보
     *   - type: 'view' (개별 알림) 또는 'viewAll' (모든 알림)
     *   - notification: 알림 객체 (type='view'일 때)
     */
    const handleNotificationCommand = async (command) => {
      console.log('[DefaultLayout] 알림 명령 처리:', command)
      
      // 36일차: 모바일에서 알림 클릭 시 사이드바 닫기
      if (isMobile.value) {
        closeMobileSidebar()
      }
      
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
    }
    
    /**
     * 테마 토글 기능
     * 라이트/다크 테마 전환
     */
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value
      
      // HTML 요소에 다크 테마 클래스 추가/제거
      document.documentElement.classList.toggle('dark-theme', isDarkTheme.value)
      
      // 테마 상태 저장
      localStorage.setItem('darkTheme', isDarkTheme.value)
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
     * 36일차 업데이트: 모바일에서 메뉴 선택 시 사이드바 닫기
     * 
     * @param {string} menuKey - 선택된 메뉴의 키
     */
    const handleMenuSelect = (menuKey) => {
      console.log('메뉴 선택됨:', menuKey)
      
      // 36일차: 모바일에서 메뉴 선택 시 사이드바 닫기
      if (isMobile.value) {
        closeMobileSidebar()
      }
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
        await ElMessageBox.confirm(
          '로그아웃 하시겠습니까?',
          '확인',
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        // 35일차 추가: 로그아웃 시 알림 폴링 중지
        stopNotificationPolling()
        
        // Vuex를 통한 로그아웃 처리
        await store.dispatch('auth/logout')
        
        // 로그인 페이지로 리다이렉트
        await router.push('/login')
        
        ElMessage.success('로그아웃 되었습니다.')
        
      } catch (error) {
        // 취소 버튼 클릭 시 'cancel' 에러가 발생하므로 무시
        if (error !== 'cancel') {
          console.error('로그아웃 오류:', error)
          ElMessage.error('오류가 발생했습니다.')
        }
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
      if (savedTheme === 'true') {
        isDarkTheme.value = true
        document.documentElement.classList.add('dark-theme')
      }
      
      // 전체화면 상태 감지
      document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
      })
      
      // 36일차 추가: 리사이즈 이벤트 리스너 등록
      window.addEventListener('resize', handleResize)
      windowWidth.value = window.innerWidth
      
      // 사용자 정보 로드
      if (!currentUser.value) {
        store.dispatch('auth/fetchCurrentUser')
      }
      
      // 35일차 추가: 알림 데이터 초기 로드 및 폴링 시작
      loadNotifications()
      startNotificationPolling()
      
      console.log('[DefaultLayout] 마운트 완료 - 알림 시스템 및 반응형 시스템 활성화')
    })
    
    /**
     * 컴포넌트 언마운트 시 정리
     * 35일차: 알림 폴링 중지
     * 36일차: 리사이즈 이벤트 리스너 제거
     */
    onUnmounted(() => {
      // 알림 폴링 중지 (메모리 누수 방지)
      stopNotificationPolling()
      
      // 36일차: 리사이즈 이벤트 리스너 제거
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      // 36일차: body 스크롤 복원
      document.body.style.overflow = ''
      
      console.log('[DefaultLayout] 언마운트 완료 - 알림 시스템 및 반응형 시스템 비활성화')
    })
    
    /**
     * 라우트 변경 감지
     * 36일차: 페이지 이동 시 모바일 사이드바 자동 닫기
     */
    watch(
      () => route.path,
      (newPath, oldPath) => {
        console.log('라우트 변경:', oldPath, '->', newPath)
        
        // 36일차: 모바일에서 페이지 이동 시 사이드바 닫기
        if (isMobile.value && isMobileSidebarOpen.value) {
          closeMobileSidebar()
        }
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
      
      // 36일차 추가: 반응형 관련 데이터
      windowWidth,
      isMobileSidebarOpen,
      isMobile,
      isDesktop,
      
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
      handleLogout,
      formatTime,
      showSystemInfo,
      showHelp,
      
      // 36일차 추가: 반응형 관련 메서드
      handleMenuToggle,
      closeMobileSidebar,
      
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

<style lang="scss" scoped>
/**
 * DefaultLayout 컴포넌트 스타일
 * 
 * 36일차 업데이트: SCSS로 전환 및 반응형 스타일 추가
 * - 브레이크포인트 변수 정의
 * - 반응형 유틸리티 클래스 추가
 * - 모바일 사이드바 및 오버레이 스타일
 * - 햄버거 메뉴 애니메이션
 */

// ================================
// 브레이크포인트 변수
// ================================
$bp-mobile: 480px;
$bp-tablet: 768px;
$bp-desktop: 1024px;

// ================================
// CSS 변수 정의 (라이트 테마)
// ================================
:root {
  --header-bg: #ffffff;
  --header-text: #303133;
  --sidebar-bg: #001529;
  --sidebar-text: rgba(255, 255, 255, 0.85);
  --sidebar-active: #409eff;
  --main-bg: #f0f2f5;
  --content-bg: #ffffff;
  
  // 35일차: 알림 관련 색상
  --notification-unread-bg: #ecf5ff;
  --notification-unread-border: #409eff;
  --notification-icon-comment: #409eff;
  --notification-icon-system: #67c23a;
  --notification-icon-file: #e6a23c;
  --notification-icon-default: #909399;
}

// ================================
// 반응형 유틸리티 클래스
// ================================

// 모바일에서만 표시
.mobile-only {
  display: none;
  
  @media (max-width: #{$bp-tablet - 1px}) {
    display: block;
  }
}

// 태블릿 이상에서만 표시
.tablet-up-only {
  @media (max-width: #{$bp-tablet - 1px}) {
    display: none !important;
  }
}

// 데스크톱에서만 표시
.desktop-only {
  @media (max-width: #{$bp-desktop - 1px}) {
    display: none !important;
  }
}

// ================================
// 레이아웃 컨테이너
// ================================
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// ================================
// 모바일 오버레이
// ================================
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  
  // 태블릿 이상에서는 숨김
  @media (min-width: $bp-tablet) {
    display: none;
  }
}

// 오버레이 페이드 애니메이션
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ================================
// 헤더 스타일
// ================================
.layout-header {
  background: var(--header-bg);
  border-bottom: 1px solid #e4e7ed;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (min-width: $bp-tablet) {
    padding: 0 24px;
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (min-width: $bp-tablet) {
    gap: 16px;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  
  @media (min-width: $bp-tablet) {
    gap: 8px;
  }
}

// ================================
// 햄버거 메뉴 버튼 (36일차)
// ================================
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  gap: 5px;
  
  .hamburger-line {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--header-text);
    border-radius: 1px;
    transition: all 0.3s;
  }
  
  // 활성화 상태 (X 모양으로 변환)
  &.is-active {
    .hamburger-line:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    
    .hamburger-line:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    
    .hamburger-line:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }
  }
  
  &:hover {
    background: rgba(64, 158, 255, 0.1);
    border-radius: 6px;
  }
}

// ================================
// 로고 섹션
// ================================
.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--header-text);
  margin: 0;
  
  @media (min-width: $bp-tablet) {
    font-size: 20px;
  }
}

.service-subtitle {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

// ================================
// 헤더 액션 버튼
// ================================
.header-action-btn {
  font-size: 18px;
  color: #606266;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  
  &:hover {
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 6px;
  }
  
  &.has-unread {
    color: #409eff;
  }
}

// ================================
// 알림 드롭다운 (35일차)
// ================================
.notification-dropdown-menu {
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  padding: 0;
  
  @media (max-width: #{$bp-tablet - 1px}) {
    width: calc(100vw - 32px);
    max-width: 360px;
  }
}

.notification-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.notification-dropdown-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.notification-loading,
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #909399;
  gap: 8px;
  
  .el-icon {
    font-size: 32px;
  }
}

.notification-dropdown-item {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f0f2f5;
  
  &.unread {
    background: #ecf5ff;
  }
  
  &:hover {
    background: #f5f7fa !important;
  }
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf5ff;
  color: #409eff;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-message {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 11px;
  color: #c0c4cc;
}

.notification-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
  margin-top: 4px;
}

.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px !important;
  color: #409eff;
  font-size: 13px;
}

// ================================
// 사용자 정보
// ================================
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  
  &:hover {
    background: rgba(64, 158, 255, 0.1);
  }
}

.user-avatar {
  border: 2px solid #e4e7ed;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--header-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

// ================================
// 메인 컨테이너
// ================================
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// ================================
// 사이드바 스타일 (36일차 반응형 적용)
// ================================
.layout-sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid #e4e7ed;
  transition: all 0.3s;
  overflow: hidden;
  flex-shrink: 0;
  
  // 모바일: 고정 위치 + 슬라이드 인/아웃
  @media (max-width: #{$bp-tablet - 1px}) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    width: 280px !important;
    
    &.mobile-sidebar-open {
      transform: translateX(0);
    }
  }
}

.sidebar-collapsed {
  @media (min-width: $bp-tablet) {
    width: 64px !important;
  }
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

// 모바일 사이드바 헤더 (36일차)
.mobile-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  
  .mobile-sidebar-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }
  
  .mobile-close-btn {
    color: rgba(255, 255, 255, 0.85);
    font-size: 20px;
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
    
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
    }
  }
}

.sidebar-menu {
  border: none;
  flex: 1;
  
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 48px;
    line-height: 48px;
    padding-left: 20px !important;
    
    @media (max-width: #{$bp-tablet - 1px}) {
      height: 52px;
      line-height: 52px;
    }
  }
}

// ================================
// 메인 콘텐츠 영역
// ================================
.layout-main {
  background: var(--main-bg);
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: var(--content-bg);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (min-width: $bp-tablet) {
    padding: 20px 24px;
  }
}

.page-title h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  
  @media (min-width: $bp-tablet) {
    font-size: 24px;
  }
}

.page-description {
  margin: 0;
  font-size: 13px;
  color: #909399;
  
  @media (min-width: $bp-tablet) {
    font-size: 14px;
  }
}

.page-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  
  @media (min-width: $bp-tablet) {
    gap: 12px;
  }
}

.page-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-in-out;
  
  @media (min-width: $bp-tablet) {
    padding: 24px;
  }
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

// ================================
// 푸터 스타일
// ================================
.layout-footer {
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
  line-height: 40px;
  flex-shrink: 0;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
  font-size: 12px;
  color: #909399;
  
  @media (min-width: $bp-tablet) {
    padding: 0 24px;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

// ================================
// 스크롤바 스타일
// ================================
.sidebar-content::-webkit-scrollbar,
.layout-main::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-thumb,
.layout-main::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
  
  &:hover {
    background: rgba(144, 147, 153, 0.5);
  }
}

// ================================
// Element Plus 컴포넌트 커스터마이징
// ================================
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: rgba(64, 158, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background: rgba(64, 158, 255, 0.2) !important;
  border-right: 3px solid #409eff;
}

// ================================
// 다크 테마 오버라이드
// ================================
:global(.dark-theme) {
  --header-bg: #1d1e1f;
  --header-text: #e4e7ed;
  --sidebar-bg: #2b2f3a;
  --main-bg: #0a0a0a;
  --content-bg: #1d1e1f;
  --notification-unread-bg: #1d3557;
}
</style>