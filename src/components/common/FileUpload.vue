<template>
  <!-- 
    FileUpload 컴포넌트
    
    파일 업로드 기능을 제공하는 재사용 가능한 컴포넌트입니다.
    Element Plus의 el-upload 컴포넌트를 래핑하여 사용합니다.
    
    주요 기능 (19-20일차에 구현 예정):
    1. 파일 선택 (버튼 클릭)
    2. 드래그 앤 드롭
    3. 업로드 진행률 표시
    4. 파일 타입 검증
    5. 파일 크기 검증
    6. 다중 파일 업로드
    
    현재 상태 (18일차):
    - 기본 구조만 구현됨
    - 실제 업로드 기능은 19-20일차에 구현 예정
    
    작성일: 2025년 11월 12일 (18일차)
    작성자: 18일차 개발 담당자
  -->
  <div class="file-upload-container">
    <!-- 제목 -->
    <div class="upload-header">
      <h3>{{ title }}</h3>
      <p class="upload-description">{{ description }}</p>
    </div>

    <!-- 
      Element Plus Upload 컴포넌트
      
      주요 속성:
      - action: 업로드 URL (19-20일차에 실제 API URL로 변경 예정)
      - auto-upload: 자동 업로드 여부 (false로 설정하여 수동 업로드)
      - drag: 드래그 앤 드롭 활성화 (19-20일차에 구현 예정)
      - multiple: 다중 파일 선택 허용
      - file-list: 선택된 파일 목록
      - on-change: 파일 선택 시 이벤트
      - before-upload: 업로드 전 검증
    -->
    <el-upload
      ref="uploadRef"
      class="upload-area"
      action="#"
      :auto-upload="false"
      :multiple="multiple"
      :file-list="fileList"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :before-upload="beforeUpload"
      :limit="limit"
      :on-exceed="handleExceed"
    >
      <!-- 업로드 버튼 영역 -->
      <template #trigger>
        <el-button type="primary" :icon="Upload">
          파일 선택
        </el-button>
      </template>

      <!-- 파일 선택 후 업로드 버튼 (19-20일차에 활성화 예정) -->
      <el-button 
        type="success" 
        :icon="Check"
        :disabled="fileList.length === 0"
        @click="submitUpload"
        style="margin-left: 10px"
      >
        업로드
      </el-button>

      <!-- 도움말 텍스트 -->
      <template #tip>
        <div class="el-upload__tip">
          <!-- 허용된 파일 타입 안내 -->
          <p>
            <el-icon><InfoFilled /></el-icon>
            허용된 파일: {{ allowedTypes.join(', ') }}
          </p>
          <!-- 파일 크기 제한 안내 -->
          <p>
            <el-icon><InfoFilled /></el-icon>
            최대 파일 크기: {{ maxSizeMB }}MB
          </p>
          <!-- 다중 파일 업로드 안내 -->
          <p v-if="multiple">
            <el-icon><InfoFilled /></el-icon>
            최대 {{ limit }}개 파일까지 선택 가능합니다.
          </p>
        </div>
      </template>
    </el-upload>

    <!-- 선택된 파일 목록 표시 (상세 정보) -->
    <div v-if="fileList.length > 0" class="file-list-detail">
      <h4>선택된 파일 ({{ fileList.length }}개)</h4>
      <el-table :data="fileList" style="width: 100%" size="small">
        <!-- 파일명 -->
        <el-table-column prop="name" label="파일명" min-width="200">
          <template #default="{ row }">
            <el-icon><Document /></el-icon>
            {{ row.name }}
          </template>
        </el-table-column>
        
        <!-- 파일 크기 -->
        <el-table-column label="크기" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <!-- 상태 -->
        <el-table-column label="상태" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'ready'" type="info" size="small">
              대기
            </el-tag>
            <el-tag v-else-if="row.status === 'uploading'" type="warning" size="small">
              업로드 중
            </el-tag>
            <el-tag v-else-if="row.status === 'success'" type="success" size="small">
              완료
            </el-tag>
            <el-tag v-else type="danger" size="small">
              실패
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 삭제 버튼 -->
        <el-table-column label="작업" width="80" align="center">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleRemoveFile($index)"
              link
            >
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- TODO: 19-20일차에 구현 예정
    - 드래그 앤 드롭 영역
    - 업로드 진행률 표시 (Progress Bar)
    - 이미지 미리보기
    - 업로드 실패 시 재시도 기능
    -->
  </div>
</template>

<script setup>
/**
 * FileUpload 컴포넌트 스크립트
 * 
 * Vue 3 Composition API를 사용합니다.
 * Element Plus의 Upload 컴포넌트를 활용합니다.
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Delete, Document, Check, InfoFilled } from '@element-plus/icons-vue'

/**
 * Props 정의
 * 부모 컴포넌트로부터 받는 속성들입니다.
 */
const props = defineProps({
  // 컴포넌트 제목
  title: {
    type: String,
    default: '파일 업로드'
  },
  // 설명 텍스트
  description: {
    type: String,
    default: '업로드할 파일을 선택하세요'
  },
  // 다중 파일 업로드 허용 여부
  multiple: {
    type: Boolean,
    default: true
  },
  // 최대 업로드 파일 개수
  limit: {
    type: Number,
    default: 10
  },
  // 최대 파일 크기 (MB)
  maxSizeMB: {
    type: Number,
    default: 10
  },
  // 허용된 파일 타입 (확장자)
  allowedTypes: {
    type: Array,
    default: () => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
  }
})

/**
 * Emits 정의
 * 부모 컴포넌트로 전달하는 이벤트들입니다.
 */
const emit = defineEmits(['upload-success', 'upload-error', 'file-change'])

/**
 * 반응형 데이터
 */
// Upload 컴포넌트 참조
const uploadRef = ref(null)

// 선택된 파일 목록
const fileList = ref([])

/**
 * 파일 선택 시 이벤트 핸들러
 * 
 * @param {Object} file - 선택된 파일 정보
 * @param {Array} files - 전체 파일 목록
 */
const handleFileChange = (file, files) => {
  console.log('파일 선택됨:', file.name, file.size)
  
  // 파일 목록 업데이트
  fileList.value = files
  
  // 부모 컴포넌트에 파일 변경 이벤트 전달
  emit('file-change', files)
}

/**
 * 파일 삭제 시 이벤트 핸들러
 * 
 * @param {Object} file - 삭제할 파일 정보
 * @param {Array} files - 남은 파일 목록
 */
const handleFileRemove = (file, files) => {
  console.log('파일 삭제됨:', file.name)
  fileList.value = files
}

/**
 * 테이블에서 파일 삭제
 * 
 * @param {Number} index - 삭제할 파일의 인덱스
 */
const handleRemoveFile = (index) => {
  fileList.value.splice(index, 1)
  ElMessage.success('파일이 목록에서 제거되었습니다')
}

/**
 * 업로드 전 검증
 * 파일 크기와 타입을 검증합니다.
 * 
 * @param {Object} file - 업로드할 파일
 * @returns {Boolean} 검증 통과 여부
 */
const beforeUpload = (file) => {
  console.log('업로드 전 검증:', file.name)
  
  // 1. 파일 크기 검증
  const maxSize = props.maxSizeMB * 1024 * 1024 // MB를 bytes로 변환
  if (file.size > maxSize) {
    ElMessage.error(`파일 크기는 ${props.maxSizeMB}MB를 초과할 수 없습니다.`)
    return false
  }
  
  // 2. 파일 타입 검증 (확장자)
  const fileExtension = file.name.split('.').pop().toLowerCase()
  if (!props.allowedTypes.includes(fileExtension)) {
    ElMessage.error(
      `허용되지 않은 파일 형식입니다. (${fileExtension})\n` +
      `허용된 형식: ${props.allowedTypes.join(', ')}`
    )
    return false
  }
  
  // 검증 통과
  return true
}

/**
 * 파일 개수 초과 시 이벤트 핸들러
 */
const handleExceed = () => {
  ElMessage.warning(`최대 ${props.limit}개의 파일만 선택할 수 있습니다.`)
}

/**
 * 파일 업로드 실행
 * 19-20일차에 실제 API 연동 예정
 */
const submitUpload = () => {
  // TODO: 19-20일차에 구현 예정
  console.log('업로드 시작 (구현 예정):', fileList.value)
  
  ElMessage.info('파일 업로드 기능은 19-20일차에 구현 예정입니다.')
  
  // 실제 구현 시 아래 코드 참고:
  // uploadRef.value.submit()
  // 또는 axios를 사용한 직접 업로드
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * 
 * @param {Number} bytes - 파일 크기 (bytes)
 * @returns {String} 포맷된 파일 크기 (예: "1.5 MB")
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

/**
 * 파일 목록 초기화
 * 부모 컴포넌트에서 호출 가능하도록 expose
 */
const clearFiles = () => {
  fileList.value = []
  uploadRef.value?.clearFiles()
}

// 부모 컴포넌트에서 접근 가능하도록 노출
defineExpose({
  clearFiles,
  fileList
})
</script>

<style scoped lang="scss">
/**
 * FileUpload 컴포넌트 스타일
 * SCSS를 사용합니다.
 */
.file-upload-container {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;

  .upload-header {
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }

    .upload-description {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .upload-area {
    margin-bottom: 20px;

    :deep(.el-upload__tip) {
      margin-top: 10px;
      
      p {
        margin: 5px 0;
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 5px;
      }
    }
  }

  .file-list-detail {
    margin-top: 20px;
    padding: 15px;
    background-color: white;
    border-radius: 4px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 10px 0;
    }

    :deep(.el-table) {
      .el-icon {
        margin-right: 5px;
        vertical-align: middle;
      }
    }
  }
}

/**
 * 반응형 디자인 (모바일)
 * TODO: 19-20일차에 모바일 최적화 추가 예정
 */
@media (max-width: 768px) {
  .file-upload-container {
    padding: 15px;
  }
}
</style>