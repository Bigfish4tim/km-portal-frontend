<template>
  <div class="file-upload-container">
    <!-- 업로드 영역 -->
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      class="upload-demo"
      drag
      multiple
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :limit="maxFiles"
      :accept="acceptedTypes"
      :before-upload="beforeUpload"
    >
      <!-- 드래그 앤 드롭 영역 -->
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        파일을 드래그하거나 <em>클릭하여 업로드</em>
      </div>
      
      <!-- 업로드 안내 -->
      <template #tip>
        <div class="el-upload__tip">
          <p>
            <el-icon><InfoFilled /></el-icon>
            최대 {{ maxSize }}MB, {{ maxFiles }}개 파일까지 업로드 가능
          </p>
          <p>
            <el-icon><DocumentChecked /></el-icon>
            허용 파일: {{ acceptedExtensions.join(', ').toUpperCase() }}
          </p>
        </div>
      </template>
    </el-upload>

    <!-- 파일 설명 입력 (선택사항) -->
    <el-input
      v-if="showDescription && fileList.length > 0"
      v-model="description"
      type="textarea"
      :rows="3"
      placeholder="파일 설명을 입력하세요 (선택사항)"
      class="description-input"
      maxlength="500"
      show-word-limit
    />

    <!-- 업로드 버튼 영역 -->
    <div v-if="fileList.length > 0" class="upload-actions">
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="fileList.length === 0"
        @click="submitUpload"
      >
        <el-icon v-if="!uploading"><Upload /></el-icon>
        {{ uploading ? '업로드 중...' : '업로드 시작' }}
      </el-button>
      
      <el-button
        :disabled="uploading"
        @click="clearFiles"
      >
        <el-icon><Delete /></el-icon>
        전체 취소
      </el-button>
    </div>

    <!-- 업로드 진행률 표시 -->
    <div v-if="uploading" class="upload-progress">
      <div
        v-for="file in fileList"
        :key="file.uid"
        class="progress-item"
      >
        <div class="progress-info">
          <el-icon><Document /></el-icon>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        
        <el-progress
          :percentage="file.percentage || 0"
          :status="file.status === 'success' ? 'success' : file.status === 'fail' ? 'exception' : undefined"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * FileUpload 컴포넌트
 * 
 * 파일 업로드 기능을 제공하는 재사용 가능한 컴포넌트입니다.
 * Element Plus의 el-upload 컴포넌트를 기반으로 만들어졌습니다.
 * 
 * 주요 기능:
 * - 드래그 앤 드롭 파일 업로드
 * - 다중 파일 선택
 * - 파일 크기 및 확장자 검증
 * - 업로드 진행률 표시
 * - 파일 설명 입력 (선택사항)
 * 
 * @author KM Portal Team
 * @since 2025-11-13
 */

import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UploadFilled,
  Upload,
  Delete,
  Document,
  InfoFilled,
  DocumentChecked
} from '@element-plus/icons-vue'
import { uploadFile, formatFileSize } from '@/services/fileApi'

// Props 정의
const props = defineProps({
  // 최대 파일 크기 (MB)
  maxSize: {
    type: Number,
    default: 50
  },
  // 최대 파일 개수
  maxFiles: {
    type: Number,
    default: 10
  },
  // 허용 파일 확장자 배열
  acceptedExtensions: {
    type: Array,
    default: () => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']
  },
  // 파일 설명 입력창 표시 여부
  showDescription: {
    type: Boolean,
    default: true
  }
})

// Emits 정의
const emit = defineEmits([
  'upload-success',  // 업로드 성공 시
  'upload-error',    // 업로드 실패 시
  'upload-complete'  // 모든 업로드 완료 시
])

// 반응형 데이터
const uploadRef = ref(null)           // el-upload 컴포넌트 참조
const fileList = ref([])              // 선택된 파일 목록
const uploading = ref(false)          // 업로드 진행 중 여부
const description = ref('')           // 파일 설명

// Computed: 허용 파일 타입 (accept 속성용)
const acceptedTypes = computed(() => {
  return props.acceptedExtensions.map(ext => `.${ext}`).join(',')
})

/**
 * 파일 선택 시 호출되는 핸들러
 * 
 * el-upload의 on-change 이벤트 핸들러입니다.
 * 파일이 선택되거나 제거될 때마다 호출됩니다.
 * 
 * @param {Object} file - 변경된 파일 객체
 * @param {Array} files - 전체 파일 목록
 */
const handleFileChange = (file, files) => {
  console.log('파일 변경:', file.name)
  
  // 파일에 초기 percentage 속성 추가
  file.percentage = 0
  file.status = 'ready'
}

/**
 * 파일 제거 핸들러
 * 
 * @param {Object} file - 제거할 파일
 * @param {Array} files - 남은 파일 목록
 */
const handleRemove = (file, files) => {
  console.log('파일 제거:', file.name)
  ElMessage.info(`${file.name} 파일이 제거되었습니다`)
}

/**
 * 파일 개수 초과 핸들러
 * 
 * @param {Array} files - 초과된 파일들
 */
const handleExceed = (files) => {
  ElMessage.warning(`최대 ${props.maxFiles}개의 파일만 업로드할 수 있습니다`)
}

/**
 * 업로드 전 검증
 * 
 * 파일 크기와 확장자를 검증합니다.
 * false를 반환하면 업로드가 중단됩니다.
 * 
 * @param {Object} rawFile - 업로드할 원본 파일
 * @returns {boolean} 검증 통과 여부
 */
const beforeUpload = (rawFile) => {
  // 1. 파일 크기 검증
  const fileSizeMB = rawFile.size / 1024 / 1024
  if (fileSizeMB > props.maxSize) {
    ElMessage.error(`${rawFile.name}의 크기가 ${props.maxSize}MB를 초과합니다`)
    return false
  }

  // 2. 파일 확장자 검증
  const fileName = rawFile.name
  const fileExtension = fileName.split('.').pop().toLowerCase()
  
  if (!props.acceptedExtensions.includes(fileExtension)) {
    ElMessage.error(
      `${rawFile.name}은(는) 허용되지 않는 파일 형식입니다. ` +
      `허용 형식: ${props.acceptedExtensions.join(', ').toUpperCase()}`
    )
    return false
  }

  console.log(`파일 검증 통과: ${rawFile.name}`)
  return true
}

/**
 * 업로드 시작
 * 
 * 선택된 모든 파일을 순차적으로 업로드합니다.
 * 각 파일의 업로드 진행률을 추적하고 결과를 emit합니다.
 */
const submitUpload = async () => {
  // 파일이 없으면 리턴
  if (fileList.value.length === 0) {
    ElMessage.warning('업로드할 파일을 선택해주세요')
    return
  }

  // 업로드 시작
  uploading.value = true
  let successCount = 0
  let failCount = 0
  const uploadResults = []

  try {
    // 각 파일을 순차적으로 업로드
    for (const file of fileList.value) {
      try {
        console.log(`업로드 시작: ${file.name}`)
        
        // file.raw는 실제 File 객체
        // el-upload가 File 객체를 래핑하여 관리하므로 raw 속성 사용
        const response = await uploadFile(
          file.raw,
          description.value,
          // 진행률 콜백 함수
          (progressEvent) => {
            // 진행률 계산 (0-100)
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            
            // Vue의 반응성을 위해 직접 속성 업데이트
            file.percentage = percentCompleted
            
            console.log(`${file.name} 업로드 진행률: ${percentCompleted}%`)
          }
        )

        // 업로드 성공
        file.status = 'success'
        file.percentage = 100
        successCount++
        uploadResults.push({
          file: file,
          success: true,
          data: response.data
        })

        console.log(`업로드 성공: ${file.name}`, response.data)

        // 개별 파일 업로드 성공 이벤트
        emit('upload-success', {
          file: file,
          response: response.data
        })

      } catch (error) {
        // 업로드 실패
        console.error(`업로드 실패: ${file.name}`, error)
        
        file.status = 'fail'
        failCount++
        uploadResults.push({
          file: file,
          success: false,
          error: error
        })

        // 개별 파일 업로드 실패 이벤트
        emit('upload-error', {
          file: file,
          error: error
        })

        // 에러 메시지 표시
        const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류'
        ElMessage.error(`${file.name} 업로드 실패: ${errorMessage}`)
      }
    }

    // 결과 메시지
    if (successCount > 0 && failCount === 0) {
      ElMessage.success(`${successCount}개 파일이 성공적으로 업로드되었습니다`)
    } else if (successCount > 0 && failCount > 0) {
      ElMessage.warning(
        `${successCount}개 성공, ${failCount}개 실패`
      )
    } else {
      ElMessage.error('모든 파일 업로드에 실패했습니다')
    }

    // 모든 업로드 완료 이벤트
    emit('upload-complete', {
      successCount,
      failCount,
      results: uploadResults
    })

    // 성공한 파일이 있으면 목록 초기화
    if (successCount > 0) {
      // 1초 후 초기화 (사용자가 결과를 볼 수 있도록)
      setTimeout(() => {
        clearFiles()
      }, 1000)
    }

  } catch (error) {
    console.error('업로드 중 예상치 못한 오류:', error)
    ElMessage.error('업로드 중 오류가 발생했습니다')
  } finally {
    uploading.value = false
  }
}

/**
 * 파일 목록 초기화
 * 
 * 선택된 모든 파일을 제거하고 초기 상태로 되돌립니다.
 */
const clearFiles = () => {
  if (uploading.value) {
    ElMessageBox.confirm(
      '업로드가 진행 중입니다. 정말 취소하시겠습니까?',
      '확인',
      {
        type: 'warning'
      }
    )
      .then(() => {
        fileList.value = []
        description.value = ''
        uploading.value = false
        console.log('파일 목록 초기화')
      })
      .catch(() => {
        // 취소
      })
  } else {
    fileList.value = []
    description.value = ''
    console.log('파일 목록 초기화')
  }
}

// 외부에서 호출 가능한 메서드 노출 (필요시)
defineExpose({
  clearFiles,
  submitUpload
})
</script>

<style scoped lang="scss">
/**
 * FileUpload 컴포넌트 스타일
 */

.file-upload-container {
  width: 100%;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

// 업로드 영역
.upload-demo {
  width: 100%;
  
  :deep(.el-upload-dragger) {
    width: 100%;
    height: 200px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background-color: #fafafa;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
      background-color: #ecf5ff;
    }
  }
  
  .el-icon--upload {
    font-size: 67px;
    color: #c0c4cc;
    margin: 40px 0 16px;
    line-height: 50px;
  }
  
  .el-upload__text {
    color: #606266;
    font-size: 14px;
    
    em {
      color: #409eff;
      font-style: normal;
      text-decoration: underline;
    }
  }
}

// 업로드 안내
.el-upload__tip {
  margin-top: 15px;
  font-size: 13px;
  color: #909399;
  line-height: 1.8;
  
  p {
    margin: 5px 0;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .el-icon {
    font-size: 16px;
  }
}

// 파일 설명 입력
.description-input {
  margin-top: 20px;
}

// 버튼 영역
.upload-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  
  .el-button {
    min-width: 120px;
  }
}

// 업로드 진행률
.upload-progress {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  
  .progress-item {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .progress-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      font-size: 14px;
      color: #606266;
      
      .el-icon {
        font-size: 18px;
        color: #909399;
      }
      
      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .file-size {
        color: #909399;
        font-size: 12px;
      }
    }
    
    .el-progress {
      width: 100%;
    }
  }
}

// 반응형 디자인
@media (max-width: 768px) {
  .file-upload-container {
    padding: 15px;
  }
  
  .upload-demo {
    :deep(.el-upload-dragger) {
      height: 150px;
    }
    
    .el-icon--upload {
      font-size: 50px;
      margin: 20px 0 10px;
    }
  }
  
  .upload-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}

// 다크 모드 지원 (선택사항)
@media (prefers-color-scheme: dark) {
  .file-upload-container {
    background-color: #2c2c2c;
  }
  
  .upload-demo {
    :deep(.el-upload-dragger) {
      background-color: #1e1e1e;
      border-color: #4c4c4c;
      
      &:hover {
        background-color: #2a2a2a;
      }
    }
  }
  
  .upload-progress {
    background-color: #1e1e1e;
  }
}
</style>