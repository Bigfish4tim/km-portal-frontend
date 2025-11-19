<template>
  <div class="board-detail-view">
    <!-- 로딩 중 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 게시글 내용 -->
    <div v-else-if="board" class="board-content">
      <!-- 게시글 헤더 카드 -->
      <el-card class="board-header-card">
        <!-- 카테고리 태그 -->
        <div v-if="board.category" class="category-tag-wrapper">
          <el-tag
            :type="getCategoryTagType(board.category)"
            size="large"
          >
            {{ getCategoryLabel(board.category) }}
          </el-tag>
        </div>

        <!-- 게시글 제목 -->
        <h1 class="board-title">
          <!-- 상단 고정 아이콘 -->
          <el-icon
            v-if="board.isPinned"
            class="pinned-icon"
            color="#F56C6C"
          >
            <Star />
          </el-icon>
          {{ board.title }}
        </h1>

        <!-- 게시글 메타 정보 -->
        <div class="board-meta">
          <!-- 작성자 정보 -->
          <div class="meta-item">
            <el-icon><User /></el-icon>
            <span class="author-name">
              {{ board.author?.fullName || '알 수 없음' }}
            </span>
            <span class="author-username text-muted">
              ({{ board.author?.username || '-' }})
            </span>
          </div>

          <!-- 작성일시 -->
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span :title="formatDate(board.createdAt)">
              {{ getRelativeTime(board.createdAt) }}
            </span>
          </div>

          <!-- 수정일시 (수정된 경우에만 표시) -->
          <div
            v-if="isUpdated"
            class="meta-item"
            :title="`마지막 수정: ${formatDate(board.updatedAt)}`"
          >
            <el-icon><Edit /></el-icon>
            <span class="text-muted">수정됨</span>
          </div>

          <!-- 조회수 -->
          <div class="meta-item">
            <el-icon><View /></el-icon>
            <span>조회 {{ formatNumber(board.viewCount) }}</span>
          </div>
        </div>

        <!-- 액션 버튼들 -->
        <div class="action-buttons">
          <!-- 목록 버튼 (모두 표시) -->
          <el-button
            :icon="List"
            @click="goToList"
          >
            목록
          </el-button>

          <!-- 수정 버튼 (작성자 본인 또는 관리자만) -->
          <el-button
            v-if="canModify"
            type="primary"
            :icon="Edit"
            @click="goToEdit"
          >
            수정
          </el-button>

          <!-- 삭제 버튼 (작성자 본인 또는 관리자만) -->
          <el-button
            v-if="canModify"
            type="danger"
            :icon="Delete"
            @click="handleDelete"
          >
            삭제
          </el-button>

          <!-- 상단 고정/해제 버튼 (관리자만) -->
          <el-button
            v-if="hasPermission(['ADMIN'])"
            :type="board.isPinned ? 'warning' : 'success'"
            :icon="board.isPinned ? RemoveFilled : StarFilled"
            @click="handleTogglePin"
          >
            {{ board.isPinned ? '고정 해제' : '상단 고정' }}
          </el-button>
        </div>
      </el-card>

      <!-- 게시글 본문 카드 -->
      <el-card class="board-body-card">
        <div class="board-content-wrapper">
          <!-- 
            v-html 디렉티브 사용
            
            Quill Editor로 작성된 HTML 내용을 렌더링합니다.
            ⚠️ 주의: XSS 공격 방지를 위해 백엔드에서 HTML 새니타이징 필수!
            
            백엔드에서 이미 새니타이징된 내용만 표시하므로 안전합니다.
          -->
          <div
            v-html="board.content"
            class="board-content-html"
          ></div>
        </div>
      </el-card>

      <!-- 추가 정보 카드 (선택사항) -->
      <el-card v-if="hasPermission(['ADMIN', 'MANAGER'])" class="board-info-card">
        <template #header>
          <span class="info-header">
            <el-icon><InfoFilled /></el-icon>
            관리자 정보
          </span>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">게시글 ID:</span>
            <span class="info-value">{{ board.id }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">작성자 ID:</span>
            <span class="info-value">{{ board.author?.userId || '-' }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">생성일시:</span>
            <span class="info-value">{{ formatDate(board.createdAt) }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">수정일시:</span>
            <span class="info-value">{{ formatDate(board.updatedAt) }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">상단 고정:</span>
            <span class="info-value">
              <el-tag :type="board.isPinned ? 'success' : 'info'" size="small">
                {{ board.isPinned ? '예' : '아니오' }}
              </el-tag>
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">삭제 여부:</span>
            <span class="info-value">
              <el-tag :type="board.isDeleted ? 'danger' : 'success'" size="small">
                {{ board.isDeleted ? '삭제됨' : '정상' }}
              </el-tag>
            </span>
          </div>
        </div>
      </el-card>

      <!-- 하단 네비게이션 버튼 -->
      <div class="bottom-navigation">
        <el-button
          size="large"
          :icon="List"
          @click="goToList"
        >
          목록으로 돌아가기
        </el-button>
      </div>
    </div>

    <!-- 게시글이 없을 때 (404) -->
    <div v-else class="not-found-container">
      <el-empty
        description="게시글을 찾을 수 없습니다"
        :image-size="120"
      >
        <el-button type="primary" @click="goToList">
          목록으로 돌아가기
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
/**
 * BoardDetailView.vue - 게시글 상세 페이지
 * 
 * 이 컴포넌트는 게시글의 상세 내용을 표시합니다.
 * 게시글 조회 시 조회수가 자동으로 1 증가합니다.
 * 
 * 주요 기능:
 * 1. 게시글 상세 정보 표시
 * 2. 작성자 정보 표시
 * 3. 조회수, 작성일시 표시
 * 4. HTML 내용 렌더링 (v-html)
 * 5. 수정/삭제 버튼 (작성자 본인 또는 관리자만)
 * 6. 상단 고정/해제 버튼 (관리자만)
 * 7. 목록으로 돌아가기
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-17 (25일차)
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  StarFilled,
  RemoveFilled,
  User,
  Clock,
  Edit,
  View,
  List,
  Delete,
  InfoFilled
} from '@element-plus/icons-vue'

// boardApi 모듈에서 필요한 함수들 import
import * as boardApi from '@/services/boardApi'

// 인증 서비스 (권한 체크용)
import authService from '@/services/authService'

// =============================================================================
// 라우터 및 권한 설정
// =============================================================================

const router = useRouter()
const route = useRoute()

/**
 * 권한 체크 함수
 * 
 * 현재 사용자가 특정 권한을 가지고 있는지 확인합니다.
 * 
 * @param {Array<string>} roles - 확인할 권한 배열 (예: ['ADMIN', 'MANAGER'])
 * @returns {boolean} 권한이 있으면 true, 없으면 false
 */
function hasPermission(roles) {
  return authService.hasAnyRole(roles.map(role => `ROLE_${role}`))
}

/**
 * 현재 로그인한 사용자 정보
 */
const currentUser = computed(() => authService.getCurrentUser())

// =============================================================================
// 반응형 데이터 (Reactive Data)
// =============================================================================

/**
 * 로딩 상태
 * API 요청 중에는 true, 완료되면 false
 */
const loading = ref(false)

/**
 * 게시글 데이터
 * 백엔드에서 가져온 게시글 상세 정보를 저장합니다.
 */
const board = ref(null)

/**
 * 게시글 ID (URL 파라미터에서 가져옴)
 */
const boardId = computed(() => {
  return parseInt(route.params.id)
})

// =============================================================================
// Computed 속성들
// =============================================================================

/**
 * 게시글이 수정되었는지 확인
 * 
 * @returns {boolean} 수정되었으면 true, 아니면 false
 */
const isUpdated = computed(() => {
  if (!board.value) return false
  
  const createdAt = new Date(board.value.createdAt)
  const updatedAt = new Date(board.value.updatedAt)
  
  // 생성일시와 수정일시가 다르면 수정된 것으로 판단
  return updatedAt.getTime() - createdAt.getTime() > 1000 // 1초 이상 차이
})

/**
 * 현재 사용자가 게시글을 수정/삭제할 수 있는지 확인
 * 
 * 조건:
 * 1. 작성자 본인이거나
 * 2. 관리자(ADMIN) 권한이 있어야 함
 * 
 * @returns {boolean} 수정/삭제 가능하면 true, 불가능하면 false
 */
const canModify = computed(() => {
  if (!board.value || !currentUser.value) return false
  
  // 관리자는 모든 게시글 수정/삭제 가능
  if (hasPermission(['ADMIN'])) {
    return true
  }
  
  // 작성자 본인 확인
  return board.value.author?.userId === currentUser.value.userId
})

// =============================================================================
// 게시글 로드 함수
// =============================================================================

/**
 * 게시글 상세 정보 로드
 * 
 * 백엔드 API를 호출하여 게시글 상세 정보를 가져옵니다.
 * 조회 시 조회수가 자동으로 1 증가합니다.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function loadBoard() {
  try {
    // 로딩 시작
    loading.value = true

    console.log('[BoardDetailView] 게시글 조회 시작:', boardId.value)

    // API 호출
    const response = await boardApi.getBoardById(boardId.value)

    console.log('[BoardDetailView] 게시글 조회 성공:', response)

    // 응답 데이터 저장
    board.value = response

  } catch (error) {
    console.error('[BoardDetailView] 게시글 조회 실패:', error)
    
    // 에러 처리
    if (error.response?.status === 404) {
      // 404: 게시글이 존재하지 않음
      ElMessage.error('게시글을 찾을 수 없습니다.')
      board.value = null
    } else if (error.response?.status === 403) {
      // 403: 권한 없음
      ElMessage.error('게시글을 조회할 권한이 없습니다.')
      goToList()
    } else {
      // 기타 에러
      ElMessage.error('게시글을 불러오는 데 실패했습니다.')
    }
    
  } finally {
    // 로딩 종료
    loading.value = false
  }
}

// =============================================================================
// 네비게이션 함수들
// =============================================================================

/**
 * 게시글 목록으로 돌아가기
 */
function goToList() {
  console.log('[BoardDetailView] 목록으로 이동')
  
  router.push({
    name: 'BoardList'
  })
}

/**
 * 게시글 수정 페이지로 이동
 * 
 * 26일차 완료: BoardFormView.vue 구현 완료!
 */
function goToEdit() {
  console.log('[BoardDetailView] 수정 페이지 이동:', boardId.value)
  
  // 게시글 수정 페이지로 이동
  router.push({
    name: 'BoardEdit',
    params: { id: boardId.value }
  })
}

// =============================================================================
// 게시글 관리 함수들
// =============================================================================

/**
 * 게시글 삭제
 * 
 * 작성자 본인 또는 관리자만 삭제할 수 있습니다.
 * 확인 대화상자를 표시한 후 삭제합니다.
 */
async function handleDelete() {
  try {
    // 확인 대화상자
    await ElMessageBox.confirm(
      '이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.',
      '게시글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    console.log('[BoardDetailView] 게시글 삭제 시작:', boardId.value)

    // API 호출
    await boardApi.deleteBoard(boardId.value)

    console.log('[BoardDetailView] 게시글 삭제 성공')

    // 성공 메시지
    ElMessage.success('게시글이 삭제되었습니다.')

    // 목록으로 이동
    goToList()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('[BoardDetailView] 게시글 삭제 실패:', error)
      ElMessage.error('게시글 삭제에 실패했습니다.')
    }
  }
}

/**
 * 게시글 상단 고정/해제 토글
 * 
 * 관리자만 사용할 수 있습니다.
 */
async function handleTogglePin() {
  try {
    const isPinning = !board.value.isPinned
    const actionText = isPinning ? '고정' : '고정 해제'

    // 확인 대화상자
    await ElMessageBox.confirm(
      `이 게시글을 ${actionText}하시겠습니까?`,
      `게시글 ${actionText}`,
      {
        confirmButtonText: actionText,
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    console.log(`[BoardDetailView] 게시글 ${actionText} 시작:`, boardId.value)

    // API 호출
    await boardApi.pinBoard(boardId.value, isPinning)

    console.log(`[BoardDetailView] 게시글 ${actionText} 성공`)

    // 성공 메시지
    ElMessage.success(`게시글이 ${actionText}되었습니다.`)

    // 게시글 정보 새로고침
    await loadBoard()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('[BoardDetailView] 상단 고정 토글 실패:', error)
      ElMessage.error('작업에 실패했습니다.')
    }
  }
}

// =============================================================================
// 유틸리티 함수들
// =============================================================================

/**
 * 카테고리 한글명 가져오기
 * 
 * @param {string} category - 카테고리 코드
 * @returns {string} 카테고리 한글명
 */
function getCategoryLabel(category) {
  return boardApi.getCategoryLabel(category)
}

/**
 * 카테고리에 따른 태그 타입 반환
 * 
 * @param {string} category - 카테고리 코드
 * @returns {string} Element Plus 태그 타입
 */
function getCategoryTagType(category) {
  const types = {
    'NOTICE': 'danger',
    'FREE': '',
    'QNA': 'warning',
    'TECH': 'success',
    'REVIEW': 'info',
    'ETC': 'info'
  }
  return types[category] || ''
}

/**
 * 날짜 포맷팅
 * 
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(dateString) {
  return boardApi.formatDate(dateString)
}

/**
 * 상대 시간 표시
 * 
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 상대 시간 문자열 (예: '2시간 전')
 */
function getRelativeTime(dateString) {
  return boardApi.getRelativeTime(dateString)
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 * 
 * @param {number} num - 숫자
 * @returns {string} 포맷된 숫자 문자열
 */
function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString()
}

// =============================================================================
// 라이프사이클 훅
// =============================================================================

/**
 * 컴포넌트 마운트 시 실행
 * 
 * 페이지가 로드되면 게시글 상세 정보를 가져옵니다.
 */
onMounted(async () => {
  console.log('[BoardDetailView] 컴포넌트 마운트')
  
  // 게시글 ID 유효성 검사
  if (!boardId.value || isNaN(boardId.value)) {
    ElMessage.error('잘못된 게시글 ID입니다.')
    goToList()
    return
  }
  
  // 게시글 로드
  await loadBoard()
})
</script>

<style scoped lang="scss">
/**
 * 게시글 상세 페이지 스타일
 * 
 * SCSS를 사용하여 중첩 스타일을 작성합니다.
 * scoped 속성으로 이 컴포넌트에만 적용됩니다.
 */

.board-detail-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 로딩 컨테이너 */
.loading-container {
  padding: 40px;
}

/* 게시글 내용 */
.board-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 게시글 헤더 카드 */
.board-header-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .category-tag-wrapper {
    margin-bottom: 16px;
  }

  .board-title {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 20px 0;
    line-height: 1.4;
    word-break: break-word;
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .pinned-icon {
      flex-shrink: 0;
      margin-top: 4px;
      font-size: 28px;
    }
  }

  .board-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 16px 0;
    border-top: 1px solid #EBEEF5;
    border-bottom: 1px solid #EBEEF5;
    margin-bottom: 20px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      font-size: 14px;

      .el-icon {
        color: #909399;
        font-size: 16px;
      }

      .author-name {
        font-weight: 600;
        color: #303133;
      }

      .author-username {
        font-size: 13px;
      }

      .text-muted {
        color: #909399;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

/* 게시글 본문 카드 */
.board-body-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 400px;

  .board-content-wrapper {
    padding: 20px;
  }

  .board-content-html {
    font-size: 16px;
    line-height: 1.8;
    color: #303133;
    word-break: break-word;

    /* 
     * Quill Editor HTML 콘텐츠 스타일링
     * 
     * v-html로 렌더링된 HTML 요소들에 스타일을 적용합니다.
     */

    :deep(p) {
      margin: 0 0 16px 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 24px 0 16px 0;
      font-weight: 600;
      line-height: 1.4;
      color: #303133;

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(h1) {
      font-size: 28px;
    }

    :deep(h2) {
      font-size: 24px;
    }

    :deep(h3) {
      font-size: 20px;
    }

    :deep(ul),
    :deep(ol) {
      margin: 16px 0;
      padding-left: 28px;

      li {
        margin: 8px 0;
      }
    }

    :deep(blockquote) {
      margin: 16px 0;
      padding: 12px 20px;
      border-left: 4px solid #409EFF;
      background-color: #F5F7FA;
      color: #606266;
    }

    :deep(code) {
      padding: 2px 6px;
      background-color: #F5F7FA;
      border: 1px solid #EBEEF5;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      color: #E6A23C;
    }

    :deep(pre) {
      margin: 16px 0;
      padding: 16px;
      background-color: #282C34;
      border-radius: 4px;
      overflow-x: auto;

      code {
        padding: 0;
        background-color: transparent;
        border: none;
        color: #ABB2BF;
        font-size: 14px;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    :deep(a) {
      color: #409EFF;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(table) {
      width: 100%;
      margin: 16px 0;
      border-collapse: collapse;

      th,
      td {
        padding: 12px;
        border: 1px solid #EBEEF5;
        text-align: left;
      }

      th {
        background-color: #F5F7FA;
        font-weight: 600;
      }

      tr:hover {
        background-color: #F5F7FA;
      }
    }

    :deep(hr) {
      margin: 24px 0;
      border: none;
      border-top: 1px solid #EBEEF5;
    }

    :deep(strong) {
      font-weight: 600;
    }

    :deep(em) {
      font-style: italic;
    }

    :deep(del) {
      text-decoration: line-through;
    }
  }
}

/* 관리자 정보 카드 */
.board-info-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #E6A23C;

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #E6A23C;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background-color: #F5F7FA;
      border-radius: 4px;

      .info-label {
        font-weight: 600;
        color: #606266;
      }

      .info-value {
        color: #303133;
      }
    }
  }
}

/* 하단 네비게이션 */
.bottom-navigation {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 404 에러 컨테이너 */
.not-found-container {
  padding: 80px 20px;
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .board-detail-view {
    padding: 12px;
  }

  .board-header-card {
    .board-title {
      font-size: 24px;

      .pinned-icon {
        font-size: 22px;
      }
    }

    .board-meta {
      gap: 12px;

      .meta-item {
        font-size: 13px;
      }
    }

    .action-buttons {
      .el-button {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .board-body-card {
    .board-content-wrapper {
      padding: 16px;
    }

    .board-content-html {
      font-size: 15px;
      line-height: 1.7;

      :deep(h1) {
        font-size: 22px;
      }

      :deep(h2) {
        font-size: 20px;
      }

      :deep(h3) {
        font-size: 18px;
      }
    }
  }

  .board-info-card {
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
}

/* 텍스트 유틸리티 */
.text-muted {
  color: #909399;
}
</style>