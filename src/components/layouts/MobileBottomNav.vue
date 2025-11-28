<!--
============================================
📱 src/components/layout/MobileBottomNav.vue
모바일 전용 하단 네비게이션 컴포넌트

37일차 UI 고급 개선 - 모바일 최적화

주요 기능:
1. 모바일 화면에서만 표시되는 하단 고정 네비게이션
2. 주요 메뉴 빠른 접근 (대시보드, 게시판, 알림, 마이페이지)
3. 읽지 않은 알림 개수 뱃지 표시
4. 현재 활성 메뉴 하이라이트
5. iOS Safe Area 지원 (iPhone X 이상 노치 대응)
6. 터치 최적화 (44px 이상 터치 타겟)

사용법:
1. DefaultLayout.vue에서 import하여 사용
2. 768px 미만 화면에서만 자동 표시 (responsive.scss 활용)
3. 알림 개수는 props로 전달받음

@author KM Portal Dev Team
@version 1.0
@since 2025-11-28 (37일차)
============================================
-->

<template>
  <!-- 
    모바일 하단 네비게이션 바
    - class에 따라 조건부 스타일 적용
    - v-show 대신 CSS로 반응형 처리 (성능 최적화)
  -->
  <nav class="mobile-bottom-nav" role="navigation" aria-label="모바일 메인 네비게이션">
    
    <!-- 
      홈(대시보드) 버튼
      - router-link로 페이지 이동
      - router-link-exact-active 클래스로 활성 상태 표시
    -->
    <router-link 
      to="/" 
      class="nav-item"
      :class="{ 'is-active': isActive('/') }"
      aria-label="대시보드"
    >
      <div class="nav-icon">
        <el-icon :size="24"><Odometer /></el-icon>
      </div>
      <span class="nav-label">홈</span>
    </router-link>

    <!-- 
      게시판 버튼
      - /board로 시작하는 모든 경로에서 활성화
    -->
    <router-link 
      to="/board" 
      class="nav-item"
      :class="{ 'is-active': isActive('/board') }"
      aria-label="게시판"
    >
      <div class="nav-icon">
        <el-icon :size="24"><Document /></el-icon>
      </div>
      <span class="nav-label">게시판</span>
    </router-link>

    <!-- 
      알림 버튼
      - 읽지 않은 알림 개수 뱃지 표시
      - 뱃지는 99 초과시 99+로 표시
    -->
    <router-link 
      to="/notifications" 
      class="nav-item"
      :class="{ 'is-active': isActive('/notifications') }"
      aria-label="알림"
    >
      <div class="nav-icon">
        <!-- Element Plus Badge로 알림 개수 표시 -->
        <el-badge 
          :value="unreadCount" 
          :hidden="unreadCount === 0"
          :max="99"
          class="notification-badge"
        >
          <el-icon :size="24"><Bell /></el-icon>
        </el-badge>
      </div>
      <span class="nav-label">알림</span>
    </router-link>

    <!-- 
      마이페이지 버튼
    -->
    <router-link 
      to="/mypage" 
      class="nav-item"
      :class="{ 'is-active': isActive('/mypage') }"
      aria-label="마이페이지"
    >
      <div class="nav-icon">
        <el-icon :size="24"><User /></el-icon>
      </div>
      <span class="nav-label">MY</span>
    </router-link>

    <!-- 
      파일 버튼 (선택적으로 표시)
      - 5개 이상의 메뉴가 필요할 경우 더보기 메뉴로 대체 가능
    -->
    <router-link 
      to="/files" 
      class="nav-item"
      :class="{ 'is-active': isActive('/files') }"
      aria-label="파일 관리"
    >
      <div class="nav-icon">
        <el-icon :size="24"><Folder /></el-icon>
      </div>
      <span class="nav-label">파일</span>
    </router-link>

  </nav>
</template>

<script setup>
/**
 * MobileBottomNav.vue - 모바일 하단 네비게이션 컴포넌트
 * 
 * Vue 3 Composition API + <script setup> 문법 사용
 * 
 * @version 1.0 (37일차)
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer,   // 대시보드/홈 아이콘
  Document,   // 게시판 아이콘
  Bell,       // 알림 아이콘
  User,       // 마이페이지 아이콘
  Folder      // 파일 아이콘
} from '@element-plus/icons-vue'

// ========================================
// Props 정의
// ========================================

/**
 * Props 타입 정의
 * 
 * @prop {number} unreadCount - 읽지 않은 알림 개수
 *   - 0이면 뱃지 숨김
 *   - 99 초과시 "99+"로 표시
 */
const props = defineProps({
  unreadCount: {
    type: Number,
    default: 0
  }
})

// ========================================
// 라우터 설정
// ========================================

/**
 * 현재 라우트 정보
 * 활성 메뉴 판별에 사용
 */
const route = useRoute()

// ========================================
// 메서드 정의
// ========================================

/**
 * 현재 라우트가 특정 경로와 일치하는지 확인
 * 
 * 정확히 일치하거나 하위 경로인 경우 true 반환
 * 예: isActive('/board')는 /board, /board/1, /board/create 모두 true
 * 
 * @param {string} path - 확인할 경로
 * @returns {boolean} 활성 상태 여부
 */
function isActive(path) {
  // 홈(/)은 정확히 일치해야 함
  if (path === '/') {
    return route.path === '/'
  }
  
  // 다른 경로는 시작 부분이 일치하면 활성
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
/**
 * 모바일 하단 네비게이션 스타일
 * 
 * 설계 원칙:
 * 1. 터치 타겟 최소 44px 보장 (Apple HIG 권장)
 * 2. Safe Area 대응 (iPhone X 이상 노치)
 * 3. 시각적 피드백 (활성 상태, 터치 상태)
 * 4. 데스크톱에서는 숨김 처리
 */

// 브레이크포인트 변수
$bp-tablet: 768px;

// 색상 변수
$nav-bg: #ffffff;
$nav-border: #e4e7ed;
$nav-text: #909399;
$nav-active: #409eff;
$nav-active-bg: rgba(64, 158, 255, 0.1);

// Safe Area 대응 (iOS)
$safe-area-bottom: env(safe-area-inset-bottom, 0px);

.mobile-bottom-nav {
  // 기본 레이아웃
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;  // 대부분의 UI 위에 표시
  
  // 배경 및 테두리
  background: $nav-bg;
  border-top: 1px solid $nav-border;
  
  // Safe Area 대응 (iPhone X 이상)
  // padding-bottom으로 노치 영역 확보
  padding-bottom: $safe-area-bottom;
  
  // Flexbox로 아이템 균등 배치
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  
  // 높이 설정 (Safe Area 제외)
  height: calc(56px + #{$safe-area-bottom});
  min-height: 56px;
  
  // 그림자 효과 (부드러운 상단 그림자)
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  
  // 데스크톱에서 숨김 (768px 이상)
  @media (min-width: $bp-tablet) {
    display: none !important;
  }
}

// ========================================
// 네비게이션 아이템 스타일
// ========================================
.nav-item {
  // 레이아웃
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  
  // 터치 영역 최소 크기 보장
  min-width: 64px;
  min-height: 56px;
  padding: 6px 4px;
  
  // 링크 스타일 초기화
  text-decoration: none;
  color: $nav-text;
  
  // 전환 효과
  transition: all 0.2s ease;
  
  // 터치/클릭 시 하이라이트 제거
  -webkit-tap-highlight-color: transparent;
  
  // 호버 효과 (터치 디바이스에서는 무시됨)
  &:hover {
    color: $nav-active;
    background-color: $nav-active-bg;
  }
  
  // 활성 상태 스타일
  &.is-active {
    color: $nav-active;
    
    .nav-icon {
      transform: scale(1.1);
    }
    
    .nav-label {
      font-weight: 600;
    }
  }
  
  // 터치(클릭) 상태
  &:active {
    background-color: rgba(64, 158, 255, 0.15);
    transform: scale(0.95);
  }
}

// ========================================
// 아이콘 영역 스타일
// ========================================
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;   // 터치 타겟 최소 크기
  height: 28px;
  margin-bottom: 2px;
  
  // 전환 효과
  transition: transform 0.2s ease;
  
  // Element Plus 아이콘 스타일
  .el-icon {
    transition: color 0.2s ease;
  }
}

// ========================================
// 알림 뱃지 스타일
// ========================================
.notification-badge {
  // 뱃지 위치 조정
  :deep(.el-badge__content) {
    // 위치 미세 조정
    top: -4px;
    right: -6px;
    
    // 크기 최적화
    padding: 0 5px;
    height: 16px;
    line-height: 16px;
    font-size: 10px;
    min-width: 16px;
    
    // 뱃지 스타일
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

// ========================================
// 라벨 텍스트 스타일
// ========================================
.nav-label {
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
  
  // 전환 효과
  transition: font-weight 0.2s ease;
}

// ========================================
// 추가 반응형 조정
// ========================================

// 초소형 화면 (360px 미만)
@media (max-width: 359px) {
  .nav-item {
    min-width: 56px;
    padding: 4px 2px;
  }
  
  .nav-label {
    font-size: 9px;
  }
  
  .nav-icon {
    .el-icon {
      font-size: 20px !important;
    }
  }
}

// 가로 모드 (landscape)
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-bottom-nav {
    height: calc(48px + #{$safe-area-bottom});
    min-height: 48px;
  }
  
  .nav-item {
    min-height: 48px;
    padding: 4px;
  }
  
  .nav-icon {
    height: 24px;
    
    .el-icon {
      font-size: 20px !important;
    }
  }
  
  .nav-label {
    font-size: 9px;
  }
}

// ========================================
// 다크 테마 지원 (선택적)
// ========================================
:global(.dark-theme) {
  .mobile-bottom-nav {
    background: #1d1e1f;
    border-top-color: #3c3c3c;
    
    .nav-item {
      color: #a0a0a0;
      
      &:hover,
      &.is-active {
        color: #409eff;
        background-color: rgba(64, 158, 255, 0.15);
      }
    }
  }
}
</style>