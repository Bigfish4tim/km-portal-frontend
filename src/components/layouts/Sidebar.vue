<!-- 
============================================
📁 src/components/layout/Sidebar.vue
사이드바 메뉴 컴포넌트 (권한별 필터링 완성)

14-15일차 권한 관리 업무 완료:
- 사용자 권한에 따라 메뉴 자동 필터링
- 하위 메뉴도 권한별로 표시/숨김
- 현재 활성 메뉴 하이라이트
============================================
-->

<template>
  <div class="sidebar">
    <!-- 사이드바 헤더 -->
    <div class="sidebar-header">
      <h1 class="logo">KM 포털</h1>
      <p class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ currentUser?.fullName || '사용자' }}</span>
      </p>
    </div>

    <!-- 메뉴 -->
    <el-menu
      :default-active="activeRoute"
      class="sidebar-menu"
      :unique-opened="true"
      router
      @select="handleMenuSelect"
    >
      <!-- 
        ⭐ filteredMenuItems: 사용자 권한에 따라 필터링된 메뉴만 표시
        권한 없는 메뉴는 DOM에서 완전히 제거됨 (display:none이 아님)
      -->
      <template v-for="item in filteredMenuItems" :key="item.path">
        
        <!-- 하위 메뉴가 없는 경우 (단일 메뉴) -->
        <el-menu-item
          v-if="!item.children"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>
            <span>{{ item.title }}</span>
          </template>
        </el-menu-item>

        <!-- 하위 메뉴가 있는 경우 (서브메뉴) -->
        <el-sub-menu
          v-else
          :index="item.path"
        >
          <!-- 서브메뉴 타이틀 -->
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </template>

          <!-- 
            ⭐ 하위 메뉴도 권한 체크!
            접근 가능한 하위 메뉴만 표시
          -->
          <el-menu-item
            v-for="child in getAccessibleChildren(item.children)"
            :key="child.path"
            :index="child.path"
          >
            <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
            <template #title>
              <span>{{ child.title }}</span>
            </template>
          </el-menu-item>
        </el-sub-menu>

      </template>
    </el-menu>

    <!-- 사이드바 푸터 (로그아웃 버튼 등) -->
    <div class="sidebar-footer">
      <el-button
        type="danger"
        :icon="SwitchButton"
        @click="handleLogout"
        class="logout-btn"
      >
        로그아웃
      </el-button>
    </div>
  </div>
</template>

<script>
/**
 * Sidebar.vue
 * 
 * 사이드바 메뉴 컴포넌트
 * 
 * 주요 기능:
 * 1. 사용자 권한에 따라 메뉴 자동 필터링
 * 2. 하위 메뉴도 권한별로 표시/숨김
 * 3. 현재 활성 라우트 자동 감지
 * 4. 로그아웃 기능
 * 
 * @author KM Portal Team
 * @version 2.0 (권한 필터링 완성)
 * @since 2025-11-06
 */

import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Odometer,
  Document,
  Files,
  Setting,
  Unlock,
  SwitchButton
} from '@element-plus/icons-vue'

export default {
  name: 'Sidebar',

  components: {
    User,
    Odometer,
    Document,
    Files,
    Setting,
    Unlock,
    SwitchButton
  },

  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    /**
     * 메뉴 아이템 정의
     * 
     * 구조:
     * - title: 메뉴에 표시할 제목
     * - path: 라우터 경로
     * - icon: 아이콘 컴포넌트
     * - roles: 접근 가능한 역할 목록 (없으면 모든 로그인 사용자 접근 가능)
     * - children: 하위 메뉴 (있으면 서브메뉴로 표시)
     */
    const menuItems = ref([
      {
        title: '대시보드',
        path: '/',
        icon: 'Odometer'
        // roles 없음 → 모든 로그인 사용자 접근 가능
      },
      {
        title: '게시판',
        path: '/board',
        icon: 'Document'
        // roles 없음 → 모든 로그인 사용자 접근 가능
      },
      {
        title: '파일 관리',
        path: '/files',
        icon: 'Files'
        // roles 없음 → 모든 로그인 사용자 접근 가능
      },
      {
        title: '마이페이지',
        path: '/mypage',
        icon: 'User'
        // roles 없음 → 모든 로그인 사용자 접근 가능
      },
      {
        title: '관리자',
        icon: 'Setting',
        // 하위 메뉴 중 하나라도 접근 가능하면 표시됨
        children: [
          {
            title: '사용자 관리',
            path: '/admin/users',
            icon: 'User',
            roles: ['ROLE_ADMIN', 'ROLE_MANAGER']  // ⬅️ ADMIN, MANAGER만
          },
          {
            title: '역할 관리',
            path: '/admin/roles',
            icon: 'Unlock',
            roles: ['ROLE_ADMIN']  // ⬅️ ADMIN만
          }
        ]
      }
    ])

    /**
     * Computed: 현재 로그인한 사용자 정보
     * Vuex store에서 가져옴
     */
    const currentUser = computed(() => store.getters['auth/user'])

    /**
     * Computed: 현재 사용자의 권한 목록
     * 예: ['ROLE_USER', 'ROLE_MANAGER']
     */
    const userRoles = computed(() => store.getters['auth/userRoles'] || [])

    /**
     * Computed: 현재 활성화된 라우트 경로
     * Element Plus 메뉴에서 현재 메뉴를 하이라이트하기 위해 사용
     */
    const activeRoute = computed(() => route.path)

    /**
     * Computed: 권한별로 필터링된 메뉴 목록
     * 
     * 필터링 로직:
     * 1. 권한 설정이 없는 메뉴 → 모두 표시 (일반 메뉴)
     * 2. 하위 메뉴가 있는 경우 → 접근 가능한 하위 메뉴가 하나라도 있으면 표시
     * 3. 권한이 있는 메뉴 → 사용자 권한과 비교하여 표시/숨김
     * 
     * @returns {Array} 사용자가 접근 가능한 메뉴 목록
     */
    const filteredMenuItems = computed(() => {
      return menuItems.value.filter(item => {
        // 1. 하위 메뉴가 있는 경우 (예: "관리자" 메뉴)
        if (item.children && item.children.length > 0) {
          // 하위 메뉴 중 접근 가능한 것이 하나라도 있는지 확인
          const accessibleChildren = item.children.filter(child =>
            canAccessMenu(child)
          )

          // 접근 가능한 하위 메뉴가 없으면 부모 메뉴도 숨김
          return accessibleChildren.length > 0
        }

        // 2. 단일 메뉴인 경우
        return canAccessMenu(item)
      })
    })

    /**
     * 메뉴 접근 가능 여부 확인 함수
     * 
     * @param {Object} menuItem - 확인할 메뉴 객체
     * @returns {boolean} 접근 가능하면 true, 불가능하면 false
     * 
     * 판단 기준:
     * 1. roles 설정이 없으면 → 모든 로그인 사용자 접근 가능 (true)
     * 2. roles 설정이 있으면 → 사용자가 해당 역할을 하나라도 가지고 있는지 확인
     * 
     * @example
     * // 예시 1: 일반 메뉴 (roles 없음)
     * canAccessMenu({ title: '대시보드', path: '/' })
     * // → true (모든 사용자 접근 가능)
     * 
     * // 예시 2: 관리자 메뉴 (roles 있음)
     * canAccessMenu({ title: '사용자 관리', roles: ['ROLE_ADMIN'] })
     * // → 현재 사용자가 ROLE_ADMIN을 가지고 있으면 true, 없으면 false
     */
    const canAccessMenu = (menuItem) => {
      // 권한 설정이 없으면 모든 로그인 사용자 접근 가능
      if (!menuItem.roles || menuItem.roles.length === 0) {
        return true
      }

      // 사용자가 필요 권한 중 하나라도 보유하면 접근 가능
      // Array.some(): 배열의 요소 중 하나라도 조건을 만족하면 true
      return menuItem.roles.some(role => userRoles.value.includes(role))
    }

    /**
     * 접근 가능한 하위 메뉴만 필터링하는 함수
     * 
     * @param {Array} children - 하위 메뉴 배열
     * @returns {Array} 접근 가능한 하위 메뉴 배열
     * 
     * 서브메뉴에서도 권한별로 메뉴를 표시/숨김 처리
     */
    const getAccessibleChildren = (children) => {
      if (!children) return []

      return children.filter(child => canAccessMenu(child))
    }

    /**
     * 메뉴 선택 이벤트 핸들러
     * 
     * @param {string} path - 선택된 메뉴의 경로
     * 
     * Element Plus 메뉴에서 router 속성을 사용하면
     * 자동으로 해당 경로로 이동하므로, 별도 처리는 필요 없음
     * 
     * 필요시 여기서 추가 로직 구현 가능 (예: 로그 기록, 분석 등)
     */
    const handleMenuSelect = (path) => {
      console.log('[Sidebar] 메뉴 선택:', path)

      // 필요시 추가 로직 구현
      // 예: Google Analytics 이벤트 전송
      // 예: 메뉴 사용 통계 기록 등
    }

    /**
     * 로그아웃 처리 함수
     * 
     * 1. 사용자에게 확인 다이얼로그 표시
     * 2. 확인 시 Vuex의 logout 액션 호출
     * 3. 로그인 페이지로 리디렉션
     */
    const handleLogout = async () => {
      try {
        // 확인 다이얼로그 표시
        await ElMessageBox.confirm(
          '정말 로그아웃하시겠습니까?',
          '로그아웃 확인',
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )

        // Vuex의 logout 액션 호출
        await store.dispatch('auth/logout')

        // 성공 메시지 표시
        ElMessage.success('로그아웃되었습니다')

        // 로그인 페이지로 리디렉션
        router.push('/login')

      } catch (error) {
        // 사용자가 취소 버튼을 누른 경우
        if (error === 'cancel') {
          console.log('[Sidebar] 로그아웃 취소됨')
        } else {
          // 실제 에러가 발생한 경우
          console.error('[Sidebar] 로그아웃 오류:', error)
          ElMessage.error('로그아웃 중 오류가 발생했습니다')
        }
      }
    }

    // 컴포넌트에서 사용할 속성과 메서드 반환
    return {
      currentUser,
      userRoles,
      activeRoute,
      filteredMenuItems,
      getAccessibleChildren,
      handleMenuSelect,
      handleLogout,
      SwitchButton
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * 사이드바 스타일
 * 
 * SCSS 변수를 사용하여 테마 색상을 일관되게 관리
 */

// 색상 변수 정의
$sidebar-bg: #001529;           // 사이드바 배경색 (어두운 남색)
$sidebar-text: #ffffff;         // 기본 텍스트 색상
$sidebar-hover-bg: #1890ff;    // 호버 시 배경색 (파란색)
$sidebar-active-bg: #1890ff;   // 활성 메뉴 배경색
$header-height: 120px;          // 헤더 높이
$footer-height: 80px;           // 푸터 높이

.sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $sidebar-bg;
  color: $sidebar-text;

  /**
   * 사이드바 헤더
   * 로고와 사용자 정보 표시
   */
  .sidebar-header {
    height: $header-height;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;

    .logo {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: $sidebar-text;
    }

    .user-info {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      span {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  /**
   * 메뉴 영역
   * flex: 1로 남은 공간을 모두 차지
   */
  .sidebar-menu {
    flex: 1;
    border: none;
    background-color: $sidebar-bg;
    overflow-y: auto;  // 메뉴가 많을 경우 스크롤

    // Element Plus 메뉴 스타일 커스터마이징
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      color: rgba(255, 255, 255, 0.85);
      
      &:hover {
        background-color: $sidebar-hover-bg !important;
        color: $sidebar-text;
      }
    }

    // 활성 메뉴 스타일
    :deep(.el-menu-item.is-active) {
      background-color: $sidebar-active-bg !important;
      color: $sidebar-text;
    }

    // 아이콘 색상
    :deep(.el-icon) {
      color: rgba(255, 255, 255, 0.85);
    }

    // 서브메뉴 배경색
    :deep(.el-menu) {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  /**
   * 사이드바 푸터
   * 로그아웃 버튼 등 고정 버튼 영역
   */
  .sidebar-footer {
    height: $footer-height;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .logout-btn {
      width: 100%;
    }
  }
}

/**
 * 스크롤바 스타일링 (선택사항)
 */
.sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>