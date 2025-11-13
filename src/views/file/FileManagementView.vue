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
            <!-- 새로고침 버튼 -->
            <el-button
              size="small"
              :icon="Refresh"
              :loading="loading"
              @click="loadFiles"
            >
              새로고침
            </el-button>
            
            <!-- 내 파일만 보기 토글 -->
            <el-switch
              v-model="showMyFilesOnly"
              active-text="내 파일만"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </template>

      <!-- 로딩 스피너 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" :size="50"><Loading /></el-icon>
        <p>파일 목록을 불러오는 중...</p>
      </div>

      <!-- 파일 테이블 -->
      <el-table
        v-else
        :data="fileList"
        style="width: 100%"
        stripe
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        @sort-change="handleSortChange"
      >
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

        <!-- 업로드한 사용자 -->
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
        <el-table-column label="작업" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
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
        description="업로드된 파일이 없습니다"
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
 * - 파일 다운로드
 * - 파일 삭제 (권한 체크)
 * - 통계 정보 표시 (ADMIN/MANAGER)
 * 
 * @author KM Portal Team
 * @since 2025-11-13
 */

import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  Upload,
  Download,
  Delete,
  List,
  Refresh,
  Loading,
  Document,
  DocumentCopy,
  Coin,
  Picture,
  VideoCamera,
  Headset,
  FolderOpened
} from '@element-plus/icons-vue'
import FileUpload from '@/components/common/FileUpload.vue'
import {
  getFiles,
  getMyFiles,
  downloadFile,
  deleteFile,
  getFileStatistics,
  formatFileSize,
  getFileExtension,
  getFileTypeIcon
} from '@/services/fileApi'

// Vuex Store
const store = useStore()

// 현재 사용자 정보
const currentUser = computed(() => store.state.auth.user)

// 반응형 데이터
const loading = ref(false)               // 로딩 상태
const fileList = ref([])                 // 파일 목록
const currentPage = ref(1)               // 현재 페이지
const pageSize = ref(10)                 // 페이지 크기
const total = ref(0)                     // 전체 파일 수
const showMyFilesOnly = ref(false)       // 내 파일만 보기
const sortField = ref('createdAt')       // 정렬 필드
const sortOrder = ref('desc')            // 정렬 순서

// 통계 데이터
const statistics = ref({
  totalFiles: 0,
  totalSize: 0,
  totalActiveFiles: 0,
  totalDeletedFiles: 0
})

/**
 * 권한 확인
 * 
 * @param {Array<string>} roles - 필요한 권한 배열
 * @returns {boolean} 권한 보유 여부
 */
const hasPermission = (roles) => {
  if (!currentUser.value || !currentUser.value.roles) return false
  return currentUser.value.roles.some(role => roles.includes(role.name))
}

/**
 * 파일 삭제 권한 확인
 * 
 * 자신이 업로드한 파일이거나 ADMIN/MANAGER 권한이 있어야 함
 * 
 * @param {Object} file - 파일 객체
 * @returns {boolean} 삭제 가능 여부
 */
const canDeleteFile = (file) => {
  // ADMIN 또는 MANAGER 권한이 있으면 모든 파일 삭제 가능
  if (hasPermission(['ADMIN', 'MANAGER'])) {
    return true
  }
  
  // 자신이 업로드한 파일인 경우 삭제 가능
  return file.uploadedBy?.id === currentUser.value?.id
}

/**
 * 파일 목록 로드
 */
const loadFiles = async () => {
  loading.value = true
  
  try {
    // 정렬 파라미터 생성
    const sort = `${sortField.value},${sortOrder.value}`
    
    // API 호출 (내 파일만 or 전체 파일)
    const response = showMyFilesOnly.value
      ? await getMyFiles(currentPage.value - 1, pageSize.value, sort)
      : await getFiles(currentPage.value - 1, pageSize.value, sort)
    
    // 데이터 설정
    fileList.value = response.data.content || []
    total.value = response.data.totalElements || 0
    
    console.log(`파일 목록 로드 완료: ${fileList.value.length}개`)
    
  } catch (error) {
    console.error('파일 목록 로드 실패:', error)
    ElMessage.error('파일 목록을 불러오는데 실패했습니다')
  } finally {
    loading.value = false
  }
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
 * 필터 변경 핸들러
 */
const handleFilterChange = () => {
  // 첫 페이지로 이동
  currentPage.value = 1
  
  // 목록 새로고침
  loadFiles()
}

/**
 * 정렬 변경 핸들러
 */
const handleSortChange = ({ prop, order }) => {
  if (prop && order) {
    sortField.value = prop
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
    
    // 첫 페이지로 이동
    currentPage.value = 1
    
    // 목록 새로고침
    loadFiles()
  }
}

/**
 * 페이지 크기 변경 핸들러
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadFiles()
}

/**
 * 페이지 변경 핸들러
 */
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadFiles()
}

/**
 * 파일 아이콘 가져오기
 */
const getFileIcon = (filename) => {
  const iconName = getFileTypeIcon(filename)
  
  const icons = {
    'Picture': Picture,
    'Document': Document,
    'FolderOpened': FolderOpened,
    'VideoCamera': VideoCamera,
    'Headset': Headset
  }
  
  return icons[iconName] || Document
}

/**
 * 파일 타입별 색상
 */
const getFileColor = (filename) => {
  const ext = getFileExtension(filename)
  
  const colors = {
    // 이미지
    'jpg': '#67C23A',
    'jpeg': '#67C23A',
    'png': '#67C23A',
    'gif': '#67C23A',
    
    // 문서
    'pdf': '#F56C6C',
    'doc': '#409EFF',
    'docx': '#409EFF',
    
    // 스프레드시트
    'xls': '#67C23A',
    'xlsx': '#67C23A',
    
    // 프레젠테이션
    'ppt': '#E6A23C',
    'pptx': '#E6A23C',
    
    // 압축
    'zip': '#909399',
    'rar': '#909399',
    
    // 기본
    'default': '#606266'
  }
  
  return colors[ext] || colors['default']
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

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadFiles()
  loadStatistics()
})
</script>

<style scoped lang="scss">
/**
 * FileManagementView 페이지 스타일
 */

.file-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

// 페이지 헤더
.page-header {
  margin-bottom: 30px;
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
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

// 통계 카드
.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  .stat-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .stat-icon {
        font-size: 48px;
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 32px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
          margin-bottom: 8px;
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
  margin-bottom: 30px;
}

// 파일 목록 카드
.file-list-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }
  }
}

// 로딩 컨테이너
.loading-container {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  
  .el-icon {
    margin-bottom: 20px;
  }
  
  p {
    font-size: 14px;
  }
}

// 파일 정보
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-description {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 페이지네이션
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

// 반응형 디자인
@media (max-width: 768px) {
  .file-management {
    padding: 15px;
  }
  
  .page-header {
    .page-title {
      font-size: 24px;
    }
  }
  
  .statistics-cards {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 15px;
    
    .header-actions {
      width: 100%;
      flex-direction: column;
      align-items: stretch !important;
      
      .el-button {
        width: 100%;
      }
    }
  }
  
  // 테이블을 카드 형태로 변경
  :deep(.el-table) {
    .el-table__body-wrapper {
      overflow-x: auto;
    }
  }
}
</style>