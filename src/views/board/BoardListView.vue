<template>
  <div class="board-list-view">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Document /></el-icon>
        게시판
      </h1>
      <p class="page-description">
        자유롭게 글을 작성하고 공유할 수 있는 게시판입니다
      </p>
    </div>

    <!-- 게시판 메인 카드 -->
    <el-card class="board-card">
      <!-- 카드 헤더: 타이틀 + 작성 버튼 -->
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><List /></el-icon>
            게시글 목록
          </span>
          
          <!-- 게시글 작성 버튼 (모든 로그인 사용자) -->
          <el-button
            type="primary"
            :icon="Edit"
            @click="goToCreate"
          >
            글쓰기
          </el-button>
        </div>
      </template>

      <!-- 카테고리 탭 -->
      <div class="category-tabs">
        <el-tabs
          v-model="selectedCategory"
          @tab-click="handleCategoryChange"
        >
          <el-tab-pane
            v-for="category in categories"
            :key="category.value"
            :label="category.label"
            :name="category.value"
          />
        </el-tabs>
      </div>

      <!-- 검색 폼 -->
      <div class="search-section">
        <el-form :model="searchForm" :inline="true" class="search-form">
          <!-- 검색 키워드 -->
          <el-form-item>
            <el-input
              v-model="searchForm.keyword"
              placeholder="제목 또는 내용 검색"
              clearable
              style="width: 300px"
              @keyup.enter="handleSearch"
              @clear="handleSearchClear"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 검색 버튼 -->
          <el-form-item>
            <el-button
              type="primary"
              :icon="Search"
              @click="handleSearch"
            >
              검색
            </el-button>
          </el-form-item>

          <!-- 초기화 버튼 -->
          <el-form-item>
            <el-button
              :icon="RefreshLeft"
              @click="handleReset"
            >
              초기화
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 로딩 중 표시 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 게시글 목록 테이블 -->
      <div v-else-if="boardList.length > 0" class="board-table-container">
        <el-table
          :data="boardList"
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
          @sort-change="handleSortChange"
          @row-click="goToDetail"
          class="board-table"
        >
          <!-- 번호 컬럼 -->
          <el-table-column
            prop="id"
            label="번호"
            width="80"
            align="center"
          >
            <template #default="{ row, $index }">
              <!-- 상단 고정 게시글은 '공지' 표시 -->
              <el-tag v-if="row.isPinned" type="danger" size="small">
                공지
              </el-tag>
              <!-- 일반 게시글은 번호 표시 (전체 개수 - 현재 인덱스) -->
              <span v-else>
                {{ totalElements - (currentPage * pageSize) - $index }}
              </span>
            </template>
          </el-table-column>

          <!-- 카테고리 컬럼 -->
          <el-table-column
            prop="category"
            label="카테고리"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                v-if="row.category"
                :type="getCategoryTagType(row.category)"
                size="small"
              >
                {{ getCategoryLabel(row.category) }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <!-- 제목 컬럼 (가장 중요!) -->
          <el-table-column
            prop="title"
            label="제목"
            min-width="300"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="title-column">
                <!-- 상단 고정 아이콘 -->
                <el-icon
                  v-if="row.isPinned"
                  class="pinned-icon"
                  color="#F56C6C"
                >
                  <Star />
                </el-icon>
                
                <!-- 제목 텍스트 -->
                <span class="title-text">{{ row.title }}</span>
                
                <!-- NEW 배지 (24시간 이내 작성) -->
                <el-tag
                  v-if="isNew(row.createdAt)"
                  type="danger"
                  size="small"
                  class="new-badge"
                  effect="dark"
                >
                  NEW
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <!-- 작성자 컬럼 -->
          <el-table-column
            prop="author.fullName"
            label="작성자"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <span class="author-name">
                {{ row.author?.fullName || '알 수 없음' }}
              </span>
            </template>
          </el-table-column>

          <!-- 조회수 컬럼 -->
          <el-table-column
            prop="viewCount"
            label="조회수"
            width="100"
            align="center"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="view-count">
                <el-icon><View /></el-icon>
                {{ formatNumber(row.viewCount) }}
              </span>
            </template>
          </el-table-column>

          <!-- 작성일시 컬럼 -->
          <el-table-column
            prop="createdAt"
            label="작성일시"
            width="180"
            align="center"
            sortable="custom"
          >
            <template #default="{ row }">
              <span class="created-at" :title="formatDate(row.createdAt)">
                {{ getRelativeTime(row.createdAt) }}
              </span>
            </template>
          </el-table-column>

          <!-- 액션 컬럼 (관리자 전용) -->
          <el-table-column
            v-if="hasPermission(['ADMIN'])"
            label="관리"
            width="120"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <!-- 상단 고정/해제 버튼 -->
              <el-button
                v-if="row.isPinned"
                size="small"
                type="warning"
                text
                :icon="RemoveFilled"
                @click.stop="handleUnpin(row)"
              >
                고정 해제
              </el-button>
              <el-button
                v-else
                size="small"
                type="success"
                text
                :icon="StarFilled"
                @click.stop="handlePin(row)"
              >
                상단 고정
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 게시글이 없을 때 -->
      <div v-else class="empty-container">
        <el-empty
          description="게시글이 없습니다"
          :image-size="120"
        >
          <el-button type="primary" @click="goToCreate">
            첫 게시글 작성하기
          </el-button>
        </el-empty>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalElements > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalElements"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * BoardListView.vue - 게시글 목록 페이지
 * 
 * 이 컴포넌트는 게시판의 메인 페이지입니다.
 * 게시글 목록을 표시하고 검색, 필터링, 페이징 기능을 제공합니다.
 * 
 * 주요 기능:
 * 1. 게시글 목록 조회 및 표시 (페이징)
 * 2. 카테고리별 필터링 (탭)
 * 3. 제목/내용 검색
 * 4. 상단 고정 게시글 표시
 * 5. 조회수 및 작성일시 정렬
 * 6. 게시글 상세 페이지로 이동
 * 7. 상단 고정/해제 (관리자 전용)
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-17 (25일차)
 */

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  List,
  Edit,
  Search,
  RefreshLeft,
  View,
  Star,
  StarFilled,
  RemoveFilled
} from '@element-plus/icons-vue'

// boardApi 모듈에서 필요한 함수들 import
import * as boardApi from '@/services/boardApi'

// 인증 서비스 (권한 체크용)
import authService from '@/services/authService'

// =============================================================================
// 라우터 및 권한 설정
// =============================================================================

const router = useRouter()

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

// =============================================================================
// 반응형 데이터 (Reactive Data)
// =============================================================================

/**
 * 로딩 상태
 * API 요청 중에는 true, 완료되면 false
 */
const loading = ref(false)

/**
 * 게시글 목록 배열
 * 백엔드에서 가져온 게시글 데이터를 저장합니다.
 */
const boardList = ref([])

/**
 * 선택된 카테고리
 * 탭에서 선택한 카테고리 값 (기본: 전체)
 */
const selectedCategory = ref('')

/**
 * 카테고리 목록
 * boardApi에서 가져온 카테고리 상수
 */
const categories = boardApi.BOARD_CATEGORIES

/**
 * 검색 폼 데이터
 * 사용자가 입력한 검색 조건을 저장합니다.
 */
const searchForm = reactive({
  keyword: ''  // 검색 키워드
})

// =============================================================================
// 페이징 데이터
// =============================================================================

/**
 * 현재 페이지 번호
 * Element Plus Pagination은 1부터 시작하지만,
 * 백엔드 API는 0부터 시작하므로 변환이 필요합니다.
 */
const currentPage = ref(1)

/**
 * 페이지 크기 (한 페이지당 게시글 수)
 */
const pageSize = ref(10)

/**
 * 전체 게시글 수
 * 백엔드에서 받아온 totalElements 값
 */
const totalElements = ref(0)

/**
 * 전체 페이지 수
 * 백엔드에서 받아온 totalPages 값
 */
const totalPages = ref(0)

/**
 * 정렬 기준
 * 기본값: 'createdAt,desc' (작성일시 내림차순)
 */
const sortBy = ref('createdAt,desc')

// =============================================================================
// 게시글 목록 조회 함수
// =============================================================================

/**
 * 게시글 목록 로드
 * 
 * 백엔드 API를 호출하여 게시글 목록을 가져옵니다.
 * 검색, 필터링, 페이징, 정렬이 모두 적용됩니다.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function loadBoards() {
  try {
    // 로딩 시작
    loading.value = true

    // API 호출 파라미터 구성
    const params = {
      page: currentPage.value - 1,  // UI는 1부터, API는 0부터 시작
      size: pageSize.value,
      sort: sortBy.value
    }

    // 검색 키워드가 있으면 추가
    if (searchForm.keyword && searchForm.keyword.trim()) {
      params.keyword = searchForm.keyword.trim()
    }

    // 카테고리 필터가 있으면 추가 (전체가 아닌 경우)
    if (selectedCategory.value && selectedCategory.value !== '') {
      params.category = selectedCategory.value
    }

    console.log('[BoardListView] 게시글 목록 조회 시작:', params)

    // API 호출
    const response = await boardApi.getBoards(params)

    console.log('[BoardListView] 게시글 목록 조회 성공:', response)

    // 응답 데이터 저장
    if (response && response.content) {
      boardList.value = response.content
      totalElements.value = response.totalElements
      totalPages.value = response.totalPages
    } else {
      // 응답 형식이 다를 경우 (배열로 직접 반환되는 경우)
      boardList.value = Array.isArray(response) ? response : []
      totalElements.value = boardList.value.length
      totalPages.value = 1
    }

  } catch (error) {
    console.error('[BoardListView] 게시글 목록 조회 실패:', error)
    
    // 에러 메시지 표시
    ElMessage.error('게시글 목록을 불러오는 데 실패했습니다.')
    
    // 빈 배열로 초기화
    boardList.value = []
    totalElements.value = 0
    totalPages.value = 0
    
  } finally {
    // 로딩 종료
    loading.value = false
  }
}

// =============================================================================
// 이벤트 핸들러 함수들
// =============================================================================

/**
 * 카테고리 탭 변경 핸들러
 * 
 * 사용자가 카테고리 탭을 클릭하면 해당 카테고리의 게시글만 표시합니다.
 * 
 * @param {Object} tab - 클릭한 탭 객체
 */
function handleCategoryChange(tab) {
  console.log('[BoardListView] 카테고리 변경:', tab.paneName)
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 검색 버튼 클릭 핸들러
 * 
 * 사용자가 검색 버튼을 클릭하거나 Enter 키를 누르면 검색을 실행합니다.
 */
function handleSearch() {
  console.log('[BoardListView] 검색 실행:', searchForm.keyword)
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 검색 초기화 핸들러
 * 
 * 검색창의 X 버튼을 클릭하면 검색을 초기화합니다.
 */
function handleSearchClear() {
  console.log('[BoardListView] 검색 초기화')
  
  // 검색 키워드 초기화
  searchForm.keyword = ''
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 전체 초기화 핸들러
 * 
 * 검색 조건과 카테고리를 모두 초기화하고 첫 페이지를 표시합니다.
 */
function handleReset() {
  console.log('[BoardListView] 전체 초기화')
  
  // 검색 키워드 초기화
  searchForm.keyword = ''
  
  // 카테고리 초기화 (전체)
  selectedCategory.value = ''
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 정렬 초기화
  sortBy.value = 'createdAt,desc'
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 정렬 변경 핸들러
 * 
 * 테이블 헤더를 클릭하여 정렬을 변경하면 호출됩니다.
 * 
 * @param {Object} sortInfo - 정렬 정보 객체
 * @param {string} sortInfo.prop - 정렬할 필드명
 * @param {string} sortInfo.order - 정렬 순서 ('ascending' 또는 'descending')
 */
function handleSortChange({ prop, order }) {
  console.log('[BoardListView] 정렬 변경:', prop, order)
  
  if (!order) {
    // 정렬 해제
    sortBy.value = 'createdAt,desc'
  } else {
    // 정렬 적용
    const direction = order === 'ascending' ? 'asc' : 'desc'
    sortBy.value = `${prop},${direction}`
  }
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 페이지 크기 변경 핸들러
 * 
 * 사용자가 페이지 크기를 변경하면 호출됩니다.
 * 
 * @param {number} newSize - 새로운 페이지 크기
 */
function handleSizeChange(newSize) {
  console.log('[BoardListView] 페이지 크기 변경:', newSize)
  
  pageSize.value = newSize
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 게시글 목록 다시 로드
  loadBoards()
}

/**
 * 페이지 변경 핸들러
 * 
 * 사용자가 다른 페이지로 이동하면 호출됩니다.
 * 
 * @param {number} newPage - 새로운 페이지 번호
 */
function handleCurrentChange(newPage) {
  console.log('[BoardListView] 페이지 변경:', newPage)
  
  currentPage.value = newPage
  
  // 게시글 목록 다시 로드
  loadBoards()
  
  // 페이지 최상단으로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// =============================================================================
// 네비게이션 함수들
// =============================================================================

/**
 * 게시글 상세 페이지로 이동
 * 
 * 게시글 행을 클릭하면 상세 페이지로 이동합니다.
 * 
 * @param {Object} row - 클릭한 게시글 데이터
 */
function goToDetail(row) {
  console.log('[BoardListView] 게시글 상세 이동:', row.id)
  
  router.push({
    name: 'BoardDetail',
    params: { id: row.id }
  })
}

/**
 * 게시글 작성 페이지로 이동
 * 
 * 글쓰기 버튼을 클릭하면 작성 페이지로 이동합니다.
 * (26일차에 BoardFormView.vue 구현 예정)
 */
function goToCreate() {
  console.log('[BoardListView] 게시글 작성 페이지 이동')
  
  // TODO: 26일차에 BoardFormView 라우트 추가 후 주석 해제
  // router.push({ name: 'BoardCreate' })
  
  // 임시: 준비 중 메시지
  ElMessage.info('게시글 작성 기능은 26일차에 구현됩니다.')
}

// =============================================================================
// 관리자 전용 기능
// =============================================================================

/**
 * 게시글 상단 고정
 * 
 * 관리자가 게시글을 목록 최상단에 고정합니다.
 * 
 * @param {Object} board - 고정할 게시글 객체
 */
async function handlePin(board) {
  try {
    // 확인 대화상자
    await ElMessageBox.confirm(
      `"${board.title}" 게시글을 상단에 고정하시겠습니까?`,
      '게시글 고정',
      {
        confirmButtonText: '고정',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    // API 호출
    await boardApi.pinBoard(board.id, true)

    // 성공 메시지
    ElMessage.success('게시글이 상단에 고정되었습니다.')

    // 목록 새로고침
    await loadBoards()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('[BoardListView] 게시글 고정 실패:', error)
      ElMessage.error('게시글 고정에 실패했습니다.')
    }
  }
}

/**
 * 게시글 고정 해제
 * 
 * 관리자가 게시글의 상단 고정을 해제합니다.
 * 
 * @param {Object} board - 고정 해제할 게시글 객체
 */
async function handleUnpin(board) {
  try {
    // 확인 대화상자
    await ElMessageBox.confirm(
      `"${board.title}" 게시글의 고정을 해제하시겠습니까?`,
      '고정 해제',
      {
        confirmButtonText: '해제',
        cancelButtonText: '취소',
        type: 'info'
      }
    )

    // API 호출
    await boardApi.pinBoard(board.id, false)

    // 성공 메시지
    ElMessage.success('게시글 고정이 해제되었습니다.')

    // 목록 새로고침
    await loadBoards()

  } catch (error) {
    if (error !== 'cancel') {
      console.error('[BoardListView] 고정 해제 실패:', error)
      ElMessage.error('고정 해제에 실패했습니다.')
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

/**
 * 새 게시글 여부 확인 (24시간 이내)
 * 
 * @param {string} dateString - 작성일시
 * @returns {boolean} 24시간 이내면 true
 */
function isNew(dateString) {
  if (!dateString) return false
  
  const now = new Date()
  const createdAt = new Date(dateString)
  const diffHours = (now - createdAt) / (1000 * 60 * 60)
  
  return diffHours < 24
}

// =============================================================================
// 라이프사이클 훅
// =============================================================================

/**
 * 컴포넌트 마운트 시 실행
 * 
 * 페이지가 로드되면 게시글 목록을 가져옵니다.
 */
onMounted(async () => {
  console.log('[BoardListView] 컴포넌트 마운트')
  
  // 게시글 목록 로드
  await loadBoards()
})
</script>

<style scoped lang="scss">
/**
 * 게시글 목록 페이지 스타일
 * 
 * SCSS를 사용하여 중첩 스타일을 작성합니다.
 * scoped 속성으로 이 컴포넌트에만 적용됩니다.
 */

.board-list-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 8px 0;

    .el-icon {
      font-size: 32px;
      color: #409EFF;
    }
  }

  .page-description {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

/* 게시판 카드 */
.board-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* 카테고리 탭 */
.category-tabs {
  margin-bottom: 20px;
  border-bottom: 1px solid #EBEEF5;

  :deep(.el-tabs__nav-wrap) {
    &::after {
      display: none; // 기본 하단 선 제거
    }
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
    padding: 0 20px;
    height: 44px;
    line-height: 44px;

    &.is-active {
      color: #409EFF;
      font-weight: 600;
    }

    &:hover {
      color: #66B1FF;
    }
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    background-color: #409EFF;
  }
}

/* 검색 섹션 */
.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #F5F7FA;
  border-radius: 4px;

  .search-form {
    margin: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}

/* 로딩 컨테이너 */
.loading-container {
  padding: 20px;
}

/* 게시글 테이블 */
.board-table-container {
  margin-top: 16px;

  .board-table {
    /* 행 hover 효과 */
    :deep(.el-table__row) {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #F5F7FA !important;
      }
    }

    /* 상단 고정 게시글 강조 */
    :deep(.el-table__row) {
      &.is-pinned {
        background-color: #FEF0F0;
      }
    }
  }

  /* 제목 컬럼 스타일 */
  .title-column {
    display: flex;
    align-items: center;
    gap: 8px;

    .pinned-icon {
      flex-shrink: 0;
    }

    .title-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: #303133;

      &:hover {
        color: #409EFF;
      }
    }

    .new-badge {
      flex-shrink: 0;
      margin-left: 4px;
    }
  }

  /* 작성자 이름 */
  .author-name {
    font-weight: 500;
    color: #606266;
  }

  /* 조회수 */
  .view-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #909399;

    .el-icon {
      font-size: 16px;
    }
  }

  /* 작성일시 */
  .created-at {
    color: #909399;
    font-size: 13px;
  }

  /* 텍스트 muted */
  .text-muted {
    color: #C0C4CC;
  }
}

/* 빈 상태 컨테이너 */
.empty-container {
  padding: 60px 20px;
  text-align: center;
}

/* 페이지네이션 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    .btn-prev,
    .btn-next,
    .el-pager li {
      border-radius: 4px;
    }
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .board-list-view {
    padding: 12px;
  }

  .page-header {
    .page-title {
      font-size: 24px;

      .el-icon {
        font-size: 28px;
      }
    }
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-section {
    .search-form {
      :deep(.el-form-item) {
        display: block;
        margin-bottom: 12px;

        .el-input {
          width: 100% !important;
        }
      }
    }
  }

  /* 모바일에서 일부 컬럼 숨김 */
  .board-table {
    :deep(.el-table__header-wrapper),
    :deep(.el-table__body-wrapper) {
      .el-table-column--selection,
      .view-count,
      .created-at {
        display: none;
      }
    }
  }
}
</style>