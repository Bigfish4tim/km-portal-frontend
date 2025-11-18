<template>
  <div class="file-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Folder /></el-icon>
        파일 관리
      </h1>
      <p class="page-description">
        파일을 업로드하고 관리할 수 있습니다
      </p>
    </div>

    <!-- 통계 카드 (ADMIN, MANAGER만 표시) -->
    <div
      v-if="hasPermission(['ADMIN', 'MANAGER'])"
      class="statistics-cards"
    >
      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" color="#409EFF"><DocumentCopy /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalFiles }}</div>
            <div class="stat-label">전체 파일</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" color="#67C23A"><Document /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalActiveFiles }}</div>
            <div class="stat-label">활성 파일</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" color="#F56C6C"><Delete /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalDeletedFiles }}</div>
            <div class="stat-label">삭제된 파일</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" color="#E6A23C"><Coin /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ formatFileSize(statistics.totalSize) }}</div>
            <div class="stat-label">총 용량</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 파일 업로드 컴포넌트 -->
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Upload /></el-icon> 파일 업로드</span>
        </div>
      </template>
      
      <FileUpload
        :max-size="50"
        :max-files="10"
        :show-description="true"
        @upload-success="handleUploadSuccess"
        @upload-error="handleUploadError"
        @upload-complete="handleUploadComplete"
      />
    </el-card>

    <!-- 파일 목록 -->
    <el-card class="file-list-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><List /></el-icon> 파일 목록</span>
          <div class="header-actions">
            <!-- 선택된 파일 수 표시 (22일차) -->
            <el-tag
              v-if="selectedCount > 0"
              type="info"
              class="selection-tag"
            >
              {{ selectedCount }}개 선택됨
            </el-tag>

            <!-- 대량 다운로드 버튼 (22일차) -->
            <el-button
              v-if="selectedCount > 0"
              size="small"
              type="primary"
              :icon="Download"
              :loading="batchActionLoading"
              :disabled="!canBatchAction"
              @click="handleBatchDownload"
            >
              선택 다운로드 (ZIP)
            </el-button>

            <!-- 대량 삭제 버튼 (22일차, ADMIN/MANAGER만) -->
            <el-button
              v-if="selectedCount > 0 && hasPermission(['ADMIN', 'MANAGER'])"
              size="small"
              type="danger"
              :icon="Delete"
              :loading="batchActionLoading"
              :disabled="!canBatchAction"
              @click="handleBatchDelete"
            >
              선택 삭제
            </el-button>

            <!-- 대량 카테고리 변경 버튼 (22일차, ADMIN/MANAGER만) -->
            <el-button
              v-if="selectedCount > 0 && hasPermission(['ADMIN', 'MANAGER'])"
              size="small"
              type="warning"
              :icon="Edit"
              :loading="batchActionLoading"
              :disabled="!canBatchAction"
              @click="showBatchCategoryDialog = true"
            >
              카테고리 변경
            </el-button>

            <!-- 새로고침 버튼 -->
            <el-button
              size="small"
              :icon="Refresh"
              @click="loadFiles"
            >
              새로고침
            </el-button>
          </div>
        </div>
      </template>

      <!-- 검색 및 필터 (21일차) -->
      <div class="search-filter-section">
        <!-- 검색 폼 -->
        <el-form :model="searchForm" label-width="auto" class="search-form">
          <el-row :gutter="20">
            <!-- 키워드 검색 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="키워드">
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="파일명 또는 설명 검색"
                  clearable
                  @clear="handleSearch"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <!-- 카테고리 필터 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="카테고리">
                <el-select
                  v-model="searchForm.category"
                  placeholder="전체"
                  clearable
                  @clear="handleSearch"
                  @change="handleSearch"
                >
                  <el-option label="전체" value="" />
                  <el-option label="문서" value="DOCUMENT" />
                  <el-option label="이미지" value="IMAGE" />
                  <el-option label="스프레드시트" value="SPREADSHEET" />
                  <el-option label="프레젠테이션" value="PRESENTATION" />
                  <el-option label="기타" value="ETC" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 날짜 범위 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="기간">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="-"
                  start-placeholder="시작일"
                  end-placeholder="종료일"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  :shortcuts="dateShortcuts"
                  clearable
                  @clear="handleSearch"
                  @change="handleSearch"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 검색 버튼 -->
          <el-row>
            <el-col :span="24">
              <div class="search-buttons">
                <el-button
                  type="primary"
                  :icon="Search"
                  @click="handleSearch"
                >
                  검색
                </el-button>
                <el-button
                  :icon="RefreshLeft"
                  @click="resetSearch"
                >
                  초기화
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>

        <!-- 검색 결과 표시 -->
        <div v-if="isSearchMode" class="search-result-info">
          <el-alert
            :title="`검색 결과: ${total}건`"
            type="info"
            :closable="false"
          >
            <template #default>
              <div class="search-conditions">
                <el-tag
                  v-if="searchForm.keyword"
                  type="info"
                  closable
                  @close="clearSearchCondition('keyword')"
                >
                  키워드: {{ searchForm.keyword }}
                </el-tag>
                <el-tag
                  v-if="searchForm.category"
                  type="success"
                  closable
                  @close="clearSearchCondition('category')"
                >
                  카테고리: {{ getCategoryLabel(searchForm.category) }}
                </el-tag>
                <el-tag
                  v-if="searchForm.dateRange && searchForm.dateRange.length === 2"
                  type="warning"
                  closable
                  @close="clearSearchCondition('dateRange')"
                >
                  기간: {{ formatSearchDate(searchForm.dateRange[0]) }} ~ {{ formatSearchDate(searchForm.dateRange[1]) }}
                </el-tag>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 로딩 스피너 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" :size="50"><Loading /></el-icon>
        <p>파일 목록을 불러오는 중...</p>
      </div>

      <!-- 파일 테이블 -->
      <el-table
        v-else
        ref="fileTableRef"
        :data="fileList"
        style="width: 100%"
        stripe
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <!-- 체크박스 컬럼 (22일차) -->
        <el-table-column
          type="selection"
          width="55"
          align="center"
        />

        <!-- 파일 아이콘 및 이름 -->
        <el-table-column label="파일명" min-width="300" sortable="custom" prop="originalName">
          <template #default="{ row }">
            <div class="file-info">
              <el-icon :size="24" :color="getFileColor(row.originalName)">
                <component :is="getFileIcon(row.originalName)" />
              </el-icon>
              <div class="file-details">
                <div class="file-name">{{ row.originalName }}</div>
                <div v-if="row.description" class="file-description">
                  {{ row.description }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 파일 크기 -->
        <el-table-column label="크기" width="120" sortable="custom" prop="fileSize">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>

        <!-- 파일 타입 -->
        <el-table-column label="타입" width="100">
          <template #default="{ row }">
            <el-tag size="small">
              {{ getFileExtension(row.originalName).toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 업로드한 사용자 (ADMIN/MANAGER만) -->
        <el-table-column
          v-if="hasPermission(['ADMIN', 'MANAGER'])"
          label="업로더"
          width="150"
        >
          <template #default="{ row }">
            {{ row.uploadedBy?.username || '알 수 없음' }}
          </template>
        </el-table-column>

        <!-- 업로드 날짜 -->
        <el-table-column label="업로드 날짜" width="180" sortable="custom" prop="createdAt">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <!-- 액션 버튼 -->
        <el-table-column label="작업" width="250" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <!-- ✨ 23일차 추가: 상세 정보 버튼 -->
              <el-tooltip content="상세 정보" placement="top">
                <el-button
                  size="small"
                  type="info"
                  :icon="InfoFilled"
                  @click="handleShowDetail(row)"
                />
              </el-tooltip>

              <!-- ✨ 23일차 추가: 미리보기 버튼 (이미지/PDF만) -->
              <el-tooltip
                v-if="canPreview(row)"
                content="미리보기"
                placement="top"
              >
                <el-button
                  size="small"
                  type="success"
                  :icon="View"
                  @click="handlePreview(row)"
                />
              </el-tooltip>

              <!-- 다운로드 버튼 -->
              <el-tooltip content="다운로드" placement="top">
                <el-button
                  size="small"
                  type="primary"
                  :icon="Download"
                  @click="handleDownload(row)"
                />
              </el-tooltip>

              <!-- 삭제 버튼 (본인 또는 ADMIN/MANAGER) -->
              <el-tooltip
                v-if="canDeleteFile(row)"
                content="삭제"
                placement="top"
              >
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  @click="handleDelete(row)"
                />
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 빈 상태 -->
      <el-empty
        v-if="!loading && fileList.length === 0"
        :description="isSearchMode ? '검색 결과가 없습니다' : '업로드된 파일이 없습니다'"
        :image-size="200"
      />

      <!-- 페이지네이션 -->
      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- ============ ✨ 23일차 추가: 파일 상세 정보 대화상자 ============ -->
    <el-dialog
      v-model="showDetailDialog"
      title="파일 상세 정보"
      width="700px"
      destroy-on-close
    >
      <div v-if="currentFile" class="file-detail-content">
        <!-- 파일 아이콘 및 이름 -->
        <div class="file-header">
          <el-icon :size="48" :color="getFileColor(currentFile.originalName)">
            <component :is="getFileIcon(currentFile.originalName)" />
          </el-icon>
          <div class="file-header-info">
            <h3>{{ currentFile.originalName }}</h3>
            <el-tag size="small">
              {{ getFileExtension(currentFile.originalName).toUpperCase() }}
            </el-tag>
          </div>
        </div>

        <!-- 파일 정보 -->
        <el-descriptions :column="2" border class="file-descriptions">
          <el-descriptions-item label="파일 크기">
            {{ formatFileSize(currentFile.fileSize) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="파일 타입">
            {{ currentFile.contentType }}
          </el-descriptions-item>
          
          <el-descriptions-item label="카테고리">
            <el-tag v-if="currentFile.category" type="success" size="small">
              {{ getCategoryLabel(currentFile.category) }}
            </el-tag>
            <span v-else class="text-muted">미지정</span>
          </el-descriptions-item>
          
          <el-descriptions-item label="다운로드 횟수">
            <el-tag type="info" size="small">
              {{ currentFile.downloadCount || 0 }}회
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="공개 여부">
            <el-tag :type="currentFile.isPublic ? 'success' : 'warning'" size="small">
              {{ currentFile.isPublic ? '공개' : '비공개' }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="업로드한 사용자">
            {{ currentFile.uploadedBy?.username || '알 수 없음' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="업로드 날짜" :span="2">
            {{ formatDate(currentFile.createdAt) }}
          </el-descriptions-item>
          
          <el-descriptions-item
            v-if="currentFile.description"
            label="설명"
            :span="2"
          >
            {{ currentFile.description }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 이미지 미리보기 (작은 썸네일) -->
        <div v-if="isImageFile(currentFile)" class="image-thumbnail">
          <h4>미리보기</h4>
          <img
            :src="thumbnailUrl"
            :alt="currentFile.originalName"
            @click="handlePreview(currentFile)"
            style="cursor: pointer; max-width: 100%; max-height: 300px; border-radius: 8px;"
          />
          <p class="text-muted" style="margin-top: 8px; font-size: 12px;">
            클릭하면 전체 크기로 볼 수 있습니다
          </p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false">닫기</el-button>
          <el-button
            v-if="canPreview(currentFile)"
            type="success"
            :icon="View"
            @click="handlePreview(currentFile)"
          >
            미리보기
          </el-button>
          <el-button
            type="primary"
            :icon="Download"
            @click="handleDownload(currentFile)"
          >
            다운로드
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ ✨ 23일차 추가: 파일 미리보기 대화상자 ============ -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="`미리보기: ${currentFile?.originalName}`"
      width="90%"
      top="5vh"
      destroy-on-close
      class="preview-dialog"
    >
      <div v-if="currentFile" class="preview-content" v-loading="previewLoading">
        <!-- 이미지 미리보기 -->
        <div v-if="isImageFile(currentFile)" class="image-preview">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="currentFile.originalName"
            class="preview-image"
          />
          <el-empty v-else description="이미지를 불러오는 중..." />
        </div>

        <!-- PDF 미리보기 -->
        <div v-else-if="isPdfFile(currentFile)" class="pdf-preview">
          <iframe
            v-if="previewUrl"
            :src="previewUrl"
            type="application/pdf"
            width="100%"
            height="700px"
            frameborder="0"
          />
          <el-empty v-else description="PDF를 불러오는 중..." />
          
          <el-alert
            v-if="!previewUrl"
            title="브라우저에서 PDF 미리보기가 지원되지 않을 수 있습니다"
            type="warning"
            :closable="false"
            style="margin-top: 10px;"
          >
            PDF 미리보기가 표시되지 않으면 파일을 다운로드하여 확인해주세요.
          </el-alert>
        </div>

        <!-- 지원하지 않는 파일 타입 -->
        <el-empty v-else description="이 파일 형식은 미리보기를 지원하지 않습니다">
          <el-button type="primary" @click="handleDownload(currentFile)">
            파일 다운로드
          </el-button>
        </el-empty>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closePreview">닫기</el-button>
          <el-button
            type="primary"
            :icon="Download"
            @click="handleDownload(currentFile)"
          >
            다운로드
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 22일차: 대량 카테고리 변경 대화상자 ============ -->
    <el-dialog
      v-model="showBatchCategoryDialog"
      title="카테고리 변경"
      width="500px"
    >
      <div class="batch-category-content">
        <p>선택한 {{ selectedCount }}개 파일의 카테고리를 변경합니다.</p>
        
        <el-form :model="batchCategoryForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="카테고리">
            <el-select
              v-model="batchCategoryForm.category"
              placeholder="카테고리 선택"
              style="width: 100%;"
            >
              <el-option label="문서" value="DOCUMENT" />
              <el-option label="이미지" value="IMAGE" />
              <el-option label="스프레드시트" value="SPREADSHEET" />
              <el-option label="프레젠테이션" value="PRESENTATION" />
              <el-option label="기타" value="ETC" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBatchCategoryDialog = false">취소</el-button>
          <el-button
            type="primary"
            :loading="batchActionLoading"
            @click="handleBatchUpdateCategory"
          >
            변경
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * FileManagementView 페이지
 * 
 * 파일 업로드 및 관리 기능을 제공하는 페이지입니다.
 * 
 * 주요 기능:
 * - 파일 업로드 (FileUpload 컴포넌트 사용)
 * - 파일 목록 조회 (페이징, 정렬)
 * - 파일 검색 (키워드, 카테고리, 날짜) ✨ 21일차
 * - 파일 대량 작업 (다운로드, 삭제, 카테고리 변경) ✨ 22일차
 * - 파일 상세 정보 ✨ 23일차 추가
 * - 파일 미리보기 (이미지, PDF) ✨ 23일차 추가
 * - 파일 다운로드
 * - 파일 삭제 (권한 체크)
 * - 통계 정보 표시 (ADMIN/MANAGER)
 * 
 * @author KM Portal Team
 * @since 2025-11-13
 * 수정일: 2025-11-14 (21일차) - 파일 검색 기능 추가
 * 수정일: 2025-11-14 (22일차) - 대량 작업 기능 추가
 * 수정일: 2025-11-15 (23일차) - 파일 상세 정보 및 미리보기 추가 ⭐ NEW!
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  Upload,
  Download,
  Delete,
  List,
  Refresh,
  RefreshLeft,
  Loading,
  DocumentCopy,
  Document,
  Coin,
  Search,
  Edit,
  InfoFilled,  // ✨ 23일차: 상세 정보 아이콘
  View        // ✨ 23일차: 미리보기 아이콘
} from '@element-plus/icons-vue'
import FileUpload from '@/components/common/FileUpload.vue'
import {
  getFiles,
  searchFiles,
  getMyFiles,
  downloadFile,
  deleteFile,
  getFileStatistics,
  formatFileSize,
  getFileExtension,
  getFileTypeIcon,
  downloadMultipleFiles,
  deleteMultipleFiles,
  updateMultipleFileCategories
} from '@/services/fileApi'

// ================== Vuex Store ==================
const store = useStore()

// ================== 반응형 데이터 ==================

// 파일 목록
const fileList = ref([])
const loading = ref(false)

// 페이지네이션
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 정렬
const sortField = ref('createdAt')
const sortOrder = ref('desc')

// ✨ 21일차: 검색 폼
const searchForm = ref({
  keyword: '',
  category: '',
  dateRange: null
})

// 검색 모드 여부
const isSearchMode = computed(() => {
  return !!(searchForm.value.keyword || 
           searchForm.value.category || 
           searchForm.value.dateRange)
})

// 날짜 범위 선택 단축키
const dateShortcuts = [
  {
    text: '최근 1주일',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    }
  },
  {
    text: '최근 1개월',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      return [start, end]
    }
  },
  {
    text: '최근 3개월',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    }
  }
]

// 통계 정보
const statistics = ref({
  totalFiles: 0,
  totalActiveFiles: 0,
  totalDeletedFiles: 0,
  totalSize: 0
})

// ✨ 22일차: 선택된 파일들 (체크박스)
const selectedFiles = ref([])

// ✨ 22일차: 테이블 참조 (선택 해제용)
const fileTableRef = ref(null)

// ✨ 22일차: 대량 작업 로딩
const batchActionLoading = ref(false)

// ✨ 22일차: 대량 카테고리 변경 대화상자
const showBatchCategoryDialog = ref(false)
const batchCategoryForm = ref({
  category: ''
})

// ✨ 23일차: 파일 상세 정보 대화상자
const showDetailDialog = ref(false)
const currentFile = ref(null)
const thumbnailUrl = ref('')

// ✨ 23일차: 파일 미리보기 대화상자
const showPreviewDialog = ref(false)
const previewUrl = ref('')
const previewLoading = ref(false)

// ================== Computed Properties ==================

/**
 * ✨ 22일차: 선택된 파일 개수
 */
const selectedCount = computed(() => selectedFiles.value.length)

/**
 * ✨ 22일차: 대량 작업 가능 여부
 * 파일이 선택되어 있고, 로딩 중이 아닐 때만 가능
 */
const canBatchAction = computed(() => {
  return selectedCount.value > 0 && !batchActionLoading.value
})

/**
 * 권한 확인 헬퍼
 */
const hasPermission = (roles) => {
  const userRoles = store.getters['auth/userRoles'] || []
  return roles.some(role => userRoles.includes(role))
}

/**
 * 파일 삭제 권한 확인
 */
const canDeleteFile = (file) => {
  // ADMIN 또는 MANAGER는 모든 파일 삭제 가능
  if (hasPermission(['ADMIN', 'MANAGER'])) {
    return true
  }
  
  // 본인이 업로드한 파일만 삭제 가능
  const currentUserId = store.state.auth.user?.id
  return file.uploadedBy?.id === currentUserId
}

/**
 * ✨ 23일차: 파일 미리보기 가능 여부
 * 이미지 또는 PDF 파일만 미리보기 가능
 */
const canPreview = (file) => {
  if (!file) return false
  return isImageFile(file) || isPdfFile(file)
}

/**
 * ✨ 23일차: 이미지 파일 여부 확인
 */
const isImageFile = (file) => {
  if (!file || !file.contentType) return false
  return file.contentType.startsWith('image/')
}

/**
 * ✨ 23일차: PDF 파일 여부 확인
 */
const isPdfFile = (file) => {
  if (!file || !file.contentType) return false
  return file.contentType === 'application/pdf'
}

// ================== 메서드 ==================

/**
 * 파일 목록 로드
 */
const loadFiles = async () => {
  try {
    loading.value = true
    
    // 정렬 설정
    const sort = `${sortField.value},${sortOrder.value}`
    
    let response
    
    // ✨ 21일차: 검색 모드인 경우
    if (isSearchMode.value) {
      // 검색 파라미터 구성
      const searchParams = {}
      
      if (searchForm.value.keyword) {
        searchParams.keyword = searchForm.value.keyword
      }
      
      if (searchForm.value.category) {
        searchParams.category = searchForm.value.category
      }
      
      if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
        searchParams.startDate = searchForm.value.dateRange[0]
        searchParams.endDate = searchForm.value.dateRange[1]
      }
      
      console.log('🔍 검색 실행:', searchParams)
      
      // 검색 API 호출
      response = await searchFiles(
        searchParams,
        currentPage.value - 1,
        pageSize.value,
        sort
      )
    } else {
      // 일반 목록 조회
      response = await getFiles(
        currentPage.value - 1,
        pageSize.value,
        sort
      )
    }
    
    // 응답 데이터 설정
    fileList.value = response.data.content || []
    total.value = response.data.totalElements || 0
    
    console.log('파일 목록 로드 완료:', fileList.value.length, '개')
    
  } catch (error) {
    console.error('파일 목록 로드 실패:', error)
    ElMessage.error('파일 목록을 불러오는데 실패했습니다')
  } finally {
    loading.value = false
  }
}

/**
 * ✨ 21일차: 검색 실행
 */
const handleSearch = () => {
  console.log('검색 실행:', searchForm.value)
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 파일 목록 로드
  loadFiles()
}

/**
 * ✨ 21일차: 검색 초기화
 */
const resetSearch = () => {
  console.log('검색 초기화')
  
  // 검색 폼 초기화
  searchForm.value = {
    keyword: '',
    category: '',
    dateRange: null
  }
  
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 파일 목록 로드
  loadFiles()
}

/**
 * ✨ 21일차: 특정 검색 조건 제거
 */
const clearSearchCondition = (field) => {
  if (field === 'keyword') {
    searchForm.value.keyword = ''
  } else if (field === 'category') {
    searchForm.value.category = ''
  } else if (field === 'dateRange') {
    searchForm.value.dateRange = null
  }
  
  // 재검색
  handleSearch()
}

/**
 * ✨ 21일차: 카테고리 레이블 가져오기
 */
const getCategoryLabel = (category) => {
  const labels = {
    'DOCUMENT': '문서',
    'IMAGE': '이미지',
    'SPREADSHEET': '스프레드시트',
    'PRESENTATION': '프레젠테이션',
    'ETC': '기타'
  }
  return labels[category] || category
}

/**
 * ✨ 21일차: 검색 날짜 포맷팅
 */
const formatSearchDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * ✨ 22일차: 파일 선택 변경 핸들러
 * 
 * el-table의 @selection-change 이벤트에서 호출됩니다.
 * 체크박스로 선택한 파일 목록이 변경될 때마다 실행됩니다.
 */
const handleSelectionChange = (selection) => {
  selectedFiles.value = selection
  console.log(`📋 선택된 파일: ${selectedFiles.value.length}개`, selectedFiles.value)
}

/**
 * ✨ 22일차: 선택 취소
 * 
 * 모든 체크박스 선택을 해제합니다.
 */
const clearSelection = () => {
  if (fileTableRef.value) {
    fileTableRef.value.clearSelection()
  }
  selectedFiles.value = []
  console.log('✅ 선택 취소됨')
}

/**
 * ✨ 22일차: 대량 다운로드 (ZIP)
 * 
 * 선택한 파일들을 ZIP 파일로 압축하여 다운로드합니다.
 */
const handleBatchDownload = async () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('파일을 선택해주세요')
    return
  }

  // 최대 50개 제한 (서버 설정과 동일)
  if (selectedCount.value > 50) {
    ElMessage.warning('한 번에 최대 50개까지만 다운로드할 수 있습니다')
    return
  }

  try {
    // 로딩 시작
    batchActionLoading.value = true
    
    console.log(`📥 대량 다운로드 시작: ${selectedCount.value}개 파일`)
    
    ElMessage.info(`${selectedCount.value}개 파일을 ZIP으로 압축 중...`)
    
    // 파일 ID 추출
    const fileIds = selectedFiles.value.map(file => file.id)
    
    // API 호출 (ZIP 파일 반환)
    const response = await downloadMultipleFiles(fileIds)
    
    // Blob 생성
    const blob = new Blob([response.data], { type: 'application/zip' })
    
    // 다운로드 링크 생성 및 클릭
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 파일명: files_YYYYMMDD_HHMMSS.zip
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 19).replace(/[-:T]/g, '')
    link.download = `files_${dateStr}.zip`
    
    document.body.appendChild(link)
    link.click()
    
    // 정리
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`${selectedCount.value}개 파일 다운로드 완료`)
    console.log('✅ 대량 다운로드 완료')
    
    // 선택 취소
    clearSelection()
    
  } catch (error) {
    console.error('❌ 대량 다운로드 실패:', error)
    
    if (error.response?.status === 400) {
      ElMessage.error(error.response.data?.message || '잘못된 요청입니다')
    } else {
      ElMessage.error('파일 다운로드 중 오류가 발생했습니다')
    }
  } finally {
    // 로딩 종료
    batchActionLoading.value = false
  }
}

/**
 * ✨ 22일차: 대량 삭제
 * 
 * 선택한 파일들을 삭제합니다 (Soft Delete).
 */
const handleBatchDelete = async () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('파일을 선택해주세요')
    return
  }

  try {
    // 삭제 확인
    await ElMessageBox.confirm(
      `선택한 ${selectedCount.value}개 파일을 삭제하시겠습니까?`,
      '파일 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )
    
    // 로딩 시작
    batchActionLoading.value = true
    
    console.log(`🗑️ 대량 삭제 시작: ${selectedCount.value}개 파일`)
    
    // 파일 ID 추출
    const fileIds = selectedFiles.value.map(file => file.id)
    
    // API 호출
    const response = await deleteMultipleFiles(fileIds)
    
    ElMessage.success(`${response.data.deletedCount}개 파일이 삭제되었습니다`)
    console.log('✅ 대량 삭제 완료')
    
    // 선택 취소
    clearSelection()
    
    // 목록 새로고침
    loadFiles()
    
    // 통계 새로고침
    loadStatistics()
    
  } catch (error) {
    // 취소한 경우
    if (error === 'cancel') {
      console.log('❌ 대량 삭제 취소')
      return
    }

    console.error('❌ 대량 삭제 실패:', error)
    ElMessage.error('파일 삭제 중 오류가 발생했습니다')
  } finally {
    // 로딩 종료
    batchActionLoading.value = false
  }
}

/**
 * ✨ 22일차: 대량 카테고리 변경
 * 
 * 선택한 파일들의 카테고리를 변경합니다.
 */
const handleBatchUpdateCategory = async () => {
  if (!batchCategoryForm.value.category) {
    ElMessage.warning('카테고리를 선택해주세요')
    return
  }

  try {
    // 로딩 시작
    batchActionLoading.value = true
    
    console.log(`📝 대량 카테고리 변경 시작: ${selectedCount.value}개 파일 → ${batchCategoryForm.value.category}`)
    
    // 파일 ID 추출
    const fileIds = selectedFiles.value.map(file => file.id)
    
    // API 호출
    const response = await updateMultipleFileCategories(
      fileIds,
      batchCategoryForm.value.category
    )
    
    ElMessage.success(`${response.data.updatedCount}개 파일의 카테고리가 변경되었습니다`)
    console.log('✅ 대량 카테고리 변경 완료')
    
    // 대화상자 닫기
    showBatchCategoryDialog.value = false
    
    // 폼 초기화
    batchCategoryForm.value.category = ''
    
    // 선택 취소
    clearSelection()
    
    // 목록 새로고침
    loadFiles()
    
  } catch (error) {
    console.error('❌ 대량 카테고리 변경 실패:', error)
    ElMessage.error('카테고리 변경 중 오류가 발생했습니다')
  } finally {
    // 로딩 종료
    batchActionLoading.value = false
  }
}

/**
 * ✨ 23일차: 파일 상세 정보 표시
 * 
 * 파일의 상세 정보를 대화상자로 표시합니다.
 * 이미지 파일의 경우 작은 썸네일도 함께 표시합니다.
 */
const handleShowDetail = async (file) => {
  try {
    console.log('📄 파일 상세 정보:', file.originalName)
    
    currentFile.value = file
    showDetailDialog.value = true
    
    // 이미지 파일인 경우 썸네일 로드
    if (isImageFile(file)) {
      await loadThumbnail(file)
    }
    
  } catch (error) {
    console.error('❌ 파일 상세 정보 로드 실패:', error)
    ElMessage.error('파일 정보를 불러오는데 실패했습니다')
  }
}

/**
 * ✨ 23일차: 썸네일 이미지 로드
 * 
 * 상세 정보 대화상자에 표시할 작은 썸네일 이미지를 로드합니다.
 */
const loadThumbnail = async (file) => {
  try {
    console.log('🖼️ 썸네일 로드:', file.originalName)
    
    // 파일 다운로드
    const response = await downloadFile(file.id)
    
    // Blob 생성
    const blob = new Blob([response.data], { type: file.contentType })
    
    // URL 생성 (썸네일용)
    thumbnailUrl.value = window.URL.createObjectURL(blob)
    
  } catch (error) {
    console.error('❌ 썸네일 로드 실패:', error)
  }
}

/**
 * ✨ 23일차: 파일 미리보기
 * 
 * 이미지 또는 PDF 파일을 미리보기 대화상자로 표시합니다.
 * 
 * 지원 파일 타입:
 * - 이미지: jpg, jpeg, png, gif, webp, svg 등
 * - PDF: application/pdf
 */
const handlePreview = async (file) => {
  try {
    // 미리보기 가능 여부 확인
    if (!canPreview(file)) {
      ElMessage.warning('이 파일은 미리보기를 지원하지 않습니다')
      return
    }
    
    console.log('👀 파일 미리보기:', file.originalName)
    
    // 현재 파일 설정
    currentFile.value = file
    
    // 대화상자 표시
    showPreviewDialog.value = true
    
    // 로딩 시작
    previewLoading.value = true
    
    // 파일 다운로드
    const response = await downloadFile(file.id)
    
    // Blob 생성
    const blob = new Blob([response.data], { type: file.contentType })
    
    // URL 생성 (미리보기용)
    previewUrl.value = window.URL.createObjectURL(blob)
    
    console.log('✅ 미리보기 로드 완료')
    
  } catch (error) {
    console.error('❌ 미리보기 로드 실패:', error)
    ElMessage.error('파일을 불러오는데 실패했습니다')
  } finally {
    // 로딩 종료
    previewLoading.value = false
  }
}

/**
 * ✨ 23일차: 미리보기 닫기
 * 
 * 미리보기 대화상자를 닫고 메모리를 정리합니다.
 * URL.createObjectURL()로 생성한 URL은 반드시 revokeObjectURL()로 해제해야 합니다.
 */
const closePreview = () => {
  // URL 메모리 해제 (중요!)
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  
  // 대화상자 닫기
  showPreviewDialog.value = false
  currentFile.value = null
  
  console.log('✅ 미리보기 닫기 및 메모리 정리 완료')
}

/**
 * 통계 정보 로드
 */
const loadStatistics = async () => {
  // ADMIN 또는 MANAGER만 통계 조회 가능
  if (!hasPermission(['ADMIN', 'MANAGER'])) {
    return
  }
  
  try {
    const response = await getFileStatistics()
    statistics.value = response.data
    console.log('통계 정보 로드 완료:', statistics.value)
  } catch (error) {
    console.error('통계 정보 로드 실패:', error)
    // 통계는 필수가 아니므로 에러 메시지 표시 안 함
  }
}

/**
 * 업로드 성공 핸들러
 */
const handleUploadSuccess = (data) => {
  console.log('파일 업로드 성공:', data)
  ElMessage.success(`${data.file.name} 업로드 완료`)
}

/**
 * 업로드 에러 핸들러
 */
const handleUploadError = (data) => {
  console.error('파일 업로드 실패:', data)
}

/**
 * 모든 업로드 완료 핸들러
 */
const handleUploadComplete = (data) => {
  console.log('모든 업로드 완료:', data)
  
  // 파일 목록 새로고침
  loadFiles()
  
  // 통계 새로고침
  loadStatistics()
}

/**
 * 파일 다운로드
 */
const handleDownload = async (file) => {
  try {
    console.log('파일 다운로드 시작:', file.originalName)
    
    ElMessage.info('파일 다운로드 중...')
    
    // API 호출
    const response = await downloadFile(file.id)
    
    // Blob 생성
    const blob = new Blob([response.data])
    
    // 다운로드 링크 생성 및 클릭
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    
    // 정리
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success(`${file.originalName} 다운로드 완료`)
    console.log('파일 다운로드 완료')
    
  } catch (error) {
    console.error('파일 다운로드 실패:', error)
    ElMessage.error('파일 다운로드에 실패했습니다')
  }
}

/**
 * 파일 삭제
 */
const handleDelete = async (file) => {
  try {
    // 삭제 확인
    await ElMessageBox.confirm(
      `"${file.originalName}" 파일을 삭제하시겠습니까?`,
      '파일 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )
    
    console.log('파일 삭제 시작:', file.id)
    
    // API 호출
    await deleteFile(file.id)
    
    ElMessage.success('파일이 삭제되었습니다')
    console.log('파일 삭제 완료')
    
    // 목록 새로고침
    loadFiles()
    
    // 통계 새로고침
    loadStatistics()
    
  } catch (error) {
    // 취소한 경우
    if (error === 'cancel') {
      console.log('파일 삭제 취소')
      return
    }
    
    console.error('파일 삭제 실패:', error)
    ElMessage.error('파일 삭제에 실패했습니다')
  }
}

/**
 * 페이지 크기 변경
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadFiles()
}

/**
 * 페이지 변경
 */
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadFiles()
}

/**
 * 정렬 변경
 */
const handleSortChange = ({ prop, order }) => {
  if (prop) {
    sortField.value = prop
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
    loadFiles()
  }
}

/**
 * 날짜 포맷팅
 */
const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 파일 아이콘 가져오기
 */
const getFileIcon = (filename) => {
  return getFileTypeIcon(filename)
}

/**
 * 파일 타입별 색상
 */
const getFileColor = (filename) => {
  const ext = getFileExtension(filename)
  
  const colorMap = {
    // 이미지
    jpg: '#67C23A',
    jpeg: '#67C23A',
    png: '#67C23A',
    gif: '#67C23A',
    svg: '#67C23A',
    
    // 문서
    pdf: '#F56C6C',
    doc: '#409EFF',
    docx: '#409EFF',
    txt: '#909399',
    
    // 스프레드시트
    xls: '#67C23A',
    xlsx: '#67C23A',
    csv: '#67C23A',
    
    // 프레젠테이션
    ppt: '#E6A23C',
    pptx: '#E6A23C',
    
    // 압축
    zip: '#909399',
    rar: '#909399',
    '7z': '#909399',
    
    // 기본
    default: '#909399'
  }
  
  return colorMap[ext] || colorMap.default
}

// ================== 라이프사이클 훅 ==================

/**
 * 컴포넌트 마운트 시
 */
onMounted(() => {
  console.log('FileManagementView 마운트됨')
  
  // 파일 목록 로드
  loadFiles()
  
  // 통계 로드
  loadStatistics()
})

/**
 * ✨ 23일차: 컴포넌트 언마운트 시
 * 
 * 메모리 누수 방지를 위해 생성한 URL을 모두 해제합니다.
 */
onUnmounted(() => {
  console.log('FileManagementView 언마운트됨')
  
  // 미리보기 URL 정리
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
  }
  
  // 썸네일 URL 정리
  if (thumbnailUrl.value) {
    window.URL.revokeObjectURL(thumbnailUrl.value)
  }
  
  console.log('✅ 메모리 정리 완료')
})
</script>

<style scoped lang="scss">
.file-management {
  padding: 20px;
  
  // 페이지 헤더
  .page-header {
    margin-bottom: 24px;
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .page-description {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }
  
  // 통계 카드
  .statistics-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          font-size: 40px;
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }
  
  // 업로드 카드
  .upload-card {
    margin-bottom: 24px;
  }
  
  // 파일 목록 카드
  .file-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      > span {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        
        .selection-tag {
          margin-right: 8px;
        }
      }
    }
  }
  
  // 검색 및 필터 섹션
  .search-filter-section {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .search-form {
      .search-buttons {
        display: flex;
        gap: 10px;
      }
    }
    
    .search-result-info {
      margin-top: 16px;
      
      .search-conditions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
    }
  }
  
  // 로딩 컨테이너
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    
    p {
      margin-top: 16px;
      color: #909399;
      font-size: 14px;
    }
  }
  
  // 파일 정보 (테이블 내)
  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .file-details {
      flex: 1;
      min-width: 0;
      
      .file-name {
        font-weight: 500;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .file-description {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  // 페이지네이션
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  
  // ✨ 23일차: 파일 상세 정보 스타일
  .file-detail-content {
    .file-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid #EBEEF5;
      margin-bottom: 20px;
      
      .file-header-info {
        flex: 1;
        
        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
    
    .file-descriptions {
      margin-bottom: 20px;
    }
    
    .image-thumbnail {
      margin-top: 20px;
      text-align: center;
      
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #606266;
        text-align: left;
      }
      
      img {
        border: 1px solid #DCDFE6;
      }
      
      .text-muted {
        color: #909399;
      }
    }
  }
  
  // ✨ 23일차: 미리보기 대화상자 스타일
  .preview-content {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .image-preview {
      text-align: center;
      width: 100%;
      
      .preview-image {
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: 4px;
      }
    }
    
    .pdf-preview {
      width: 100%;
      
      iframe {
        border: 1px solid #DCDFE6;
        border-radius: 4px;
      }
    }
  }
  
  // 공통 텍스트 스타일
  .text-muted {
    color: #909399;
  }
}

// ✨ 23일차: 미리보기 대화상자 전역 스타일
:deep(.preview-dialog) {
  .el-dialog__body {
    padding: 20px;
  }
}

// 반응형 디자인
@media (max-width: 768px) {
  .file-management {
    padding: 12px;
    
    .statistics-cards {
      grid-template-columns: 1fr;
    }
    
    .header-actions {
      flex-direction: column;
      align-items: stretch !important;
      
      .el-button {
        width: 100%;
      }
    }
    
    .search-filter-section {
      padding: 12px;
      
      .search-form {
        .el-col {
          padding: 0 !important;
        }
      }
    }
  }
}
</style>