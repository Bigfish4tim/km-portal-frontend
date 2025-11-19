<!--
  BoardFormView.vue
  게시글 작성 및 수정 폼 컴포넌트
  
  기능:
  - 게시글 작성 모드 (URL: /board/create)
  - 게시글 수정 모드 (URL: /board/:id/edit)
  - Quill Editor를 사용한 HTML 에디터
  - 폼 유효성 검증
  - 권한 체크 (수정 모드)
  - XSS 방지 (백엔드에서 처리)
  
  26일차 작업: 게시판 작성 및 수정 기능 구현
  작성일: 2025-11-19
  작성자: 26일차 개발 담당자
-->

<template>
  <div class="board-form-container">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">
        {{ isEditMode ? '게시글 수정' : '게시글 작성' }}
      </h1>
      <p class="page-description">
        {{ isEditMode 
          ? '게시글 내용을 수정합니다. 제목, 카테고리, 내용을 변경할 수 있습니다.' 
          : '새로운 게시글을 작성합니다. 제목, 카테고리, 내용을 입력해주세요.' 
        }}
      </p>
    </div>

    <!-- 게시글 작성/수정 폼 -->
    <el-card class="form-card" shadow="hover">
      <!-- 
        Element Plus Form 컴포넌트
        - ref: 폼 참조 (유효성 검증용)
        - model: 폼 데이터 바인딩
        - rules: 유효성 검증 규칙
        - label-position: 레이블 위치 (top: 레이블이 입력창 위에)
        - label-width: 레이블 너비
        - size: 폼 크기
      -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        label-width="100px"
        size="large"
      >
        <!-- 
          제목 입력 필드
          - prop: 유효성 검증에 사용할 필드명 (formRules의 키와 일치)
          - required: 필수 입력 표시 (빨간 별)
        -->
        <el-form-item label="제목" prop="title" required>
          <el-input
            v-model="formData.title"
            placeholder="게시글 제목을 입력하세요 (1-200자)"
            :maxlength="200"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- 
          카테고리 선택 필드
          - el-select: 드롭다운 선택 컴포넌트
          - placeholder: 선택 전 표시 텍스트
          - clearable: X 버튼으로 선택 취소 가능
        -->
        <el-form-item label="카테고리" prop="category" required>
          <el-select
            v-model="formData.category"
            placeholder="카테고리를 선택하세요"
            style="width: 100%"
            clearable
          >
            <!-- 카테고리 옵션 목록 -->
            <el-option
              v-for="cat in categories"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            >
              <!-- 옵션 내용 (아이콘 + 레이블) -->
              <span>
                <el-tag :type="cat.type" size="small" style="margin-right: 8px">
                  {{ cat.label }}
                </el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 
          내용 입력 필드 (Quill Editor)
          - QuillEditor: HTML 에디터 컴포넌트
          - v-model:content: 양방향 바인딩 (content 속성)
          - theme: 테마 (snow: 기본 스타일)
          - toolbar: 에디터 도구 모음 (아래 editorOptions 참고)
          - placeholder: 입력 전 표시 텍스트
        -->
        <el-form-item label="내용" prop="content" required>
          <QuillEditor
            v-model:content="formData.content"
            theme="snow"
            :options="editorOptions"
            placeholder="게시글 내용을 입력하세요..."
            content-type="html"
            style="height: 400px"
          />
        </el-form-item>

        <!-- 
          버튼 그룹
          - 취소, 저장 버튼
        -->
        <el-form-item style="margin-top: 60px">
          <div class="button-group">
            <!-- 취소 버튼 -->
            <el-button 
              size="large" 
              @click="handleCancel"
            >
              <el-icon><Close /></el-icon>
              취소
            </el-button>

            <!-- 저장 버튼 -->
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
            >
              <el-icon v-if="!loading"><Check /></el-icon>
              {{ isEditMode ? '수정 완료' : '작성 완료' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 
      작성 안내
      - 게시글 작성 시 주의사항 표시
    -->
    <el-alert
      v-if="!isEditMode"
      title="게시글 작성 안내"
      type="info"
      :closable="false"
      style="margin-top: 20px"
    >
      <ul style="margin: 0; padding-left: 20px">
        <li>제목은 1자 이상 200자 이하로 입력해주세요.</li>
        <li>카테고리를 반드시 선택해주세요.</li>
        <li>내용은 1자 이상 입력해주세요.</li>
        <li>작성된 게시글은 모든 사용자가 볼 수 있습니다.</li>
        <li>부적절한 내용이 포함된 경우 관리자에 의해 삭제될 수 있습니다.</li>
      </ul>
    </el-alert>

    <!-- 
      수정 권한 안내
      - 게시글 수정 시 권한 안내
    -->
    <el-alert
      v-if="isEditMode"
      title="게시글 수정 안내"
      type="warning"
      :closable="false"
      style="margin-top: 20px"
    >
      <ul style="margin: 0; padding-left: 20px">
        <li>본인이 작성한 게시글만 수정할 수 있습니다.</li>
        <li>관리자는 모든 게시글을 수정할 수 있습니다.</li>
        <li>수정 시 수정일시가 자동으로 기록됩니다.</li>
      </ul>
    </el-alert>
  </div>
</template>

<script setup>
/**
 * Vue 3 Composition API imports
 * - ref: 반응형 변수 생성
 * - reactive: 반응형 객체 생성
 * - computed: 계산된 속성
 * - onMounted: 컴포넌트 마운트 시 실행
 */
import { ref, reactive, computed, onMounted } from 'vue'

/**
 * Vue Router imports
 * - useRoute: 현재 라우트 정보 가져오기
 * - useRouter: 라우터 네비게이션
 */
import { useRoute, useRouter } from 'vue-router'

/**
 * Element Plus 컴포넌트 imports
 * - ElMessage: 토스트 메시지
 * - ElMessageBox: 확인 대화상자
 */
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * Element Plus 아이콘 imports
 */
import { Check, Close } from '@element-plus/icons-vue'

/**
 * Quill Editor imports
 * - QuillEditor: HTML 에디터 컴포넌트
 * - CSS: 에디터 스타일
 * 
 * 설치 방법:
 * npm install @vueup/vue-quill
 */
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

/**
 * API 서비스 imports
 * - boardApi: 게시판 API 함수들
 */
import * as boardApi from '@/services/boardApi'

/**
 * 인증 서비스 imports
 * - authService: 권한 체크 함수들
 */
import authService from '@/services/authService'

/* ========================================
 * 라우터 및 라우트 초기화
 * ======================================== */

const route = useRoute()
const router = useRouter()

/**
 * 게시글 ID (수정 모드에서만 사용)
 * - 라우트 파라미터에서 가져옴 (예: /board/123/edit → 123)
 */
const boardId = computed(() => route.params.id)

/**
 * 수정 모드 여부
 * - 현재 라우트가 'BoardEdit'이면 수정 모드
 * - 'BoardCreate'이면 작성 모드
 */
const isEditMode = computed(() => route.name === 'BoardEdit')

/* ========================================
 * 폼 데이터 및 상태 관리
 * ======================================== */

/**
 * 폼 참조
 * - Element Plus Form 컴포넌트의 ref
 * - 유효성 검증에 사용
 */
const formRef = ref(null)

/**
 * 로딩 상태
 * - true: 저장 중 (버튼 비활성화)
 * - false: 대기 중
 */
const loading = ref(false)

/**
 * 폼 데이터 (반응형 객체)
 * - title: 게시글 제목
 * - category: 카테고리 코드 (예: 'FREE', 'NOTICE')
 * - content: 게시글 내용 (HTML)
 */
const formData = reactive({
  title: '',
  category: '',
  content: ''
})

/**
 * 카테고리 목록
 * - value: 백엔드로 전송할 카테고리 코드
 * - label: 사용자에게 표시할 한글명
 * - type: Element Plus Tag 색상 (success, warning, danger, info)
 */
const categories = [
  { value: 'NOTICE', label: '공지사항', type: 'danger' },
  { value: 'FREE', label: '자유게시판', type: 'success' },
  { value: 'QNA', label: 'Q&A', type: 'warning' },
  { value: 'TECH', label: '기술', type: 'primary' },
  { value: 'REVIEW', label: '후기', type: 'info' },
  { value: 'ETC', label: '기타', type: '' }
]

/* ========================================
 * 폼 유효성 검증 규칙
 * ======================================== */

/**
 * Element Plus Form 유효성 검증 규칙
 * - 각 필드별 검증 규칙 정의
 * - required: 필수 입력
 * - min/max: 최소/최대 길이
 * - message: 에러 메시지
 * - trigger: 검증 시점 ('blur': 포커스 벗어날 때, 'change': 값 변경 시)
 */
const formRules = {
  // 제목 검증 규칙
  title: [
    { 
      required: true, 
      message: '제목을 입력해주세요', 
      trigger: 'blur' 
    },
    { 
      min: 1, 
      max: 200, 
      message: '제목은 1자 이상 200자 이하로 입력해주세요', 
      trigger: 'blur' 
    }
  ],
  
  // 카테고리 검증 규칙
  category: [
    { 
      required: true, 
      message: '카테고리를 선택해주세요', 
      trigger: 'change' 
    }
  ],
  
  // 내용 검증 규칙
  content: [
    { 
      required: true, 
      message: '내용을 입력해주세요', 
      trigger: 'blur' 
    },
    {
      // 커스텀 검증: HTML 태그를 제거한 텍스트가 1자 이상인지 확인
      validator: (rule, value, callback) => {
        // HTML 태그를 제거하고 공백을 제거한 텍스트
        const textOnly = value.replace(/<[^>]*>/g, '').trim()
        
        if (!textOnly || textOnly.length === 0) {
          callback(new Error('내용을 입력해주세요'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

/* ========================================
 * Quill Editor 설정
 * ======================================== */

/**
 * Quill Editor 옵션
 * - modules: 에디터 모듈 설정
 * - toolbar: 도구 모음 구성
 */
const editorOptions = {
  modules: {
    // 도구 모음 설정
    toolbar: [
      // 헤딩 (h1, h2, h3)
      [{ 'header': [1, 2, 3, false] }],
      
      // 굵게, 기울임, 밑줄, 취소선
      ['bold', 'italic', 'underline', 'strike'],
      
      // 글자색, 배경색
      [{ 'color': [] }, { 'background': [] }],
      
      // 번호 목록, 점 목록
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      
      // 들여쓰기
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      
      // 정렬
      [{ 'align': [] }],
      
      // 링크, 이미지
      ['link', 'image'],
      
      // 코드 블록, 인용구
      ['code-block', 'blockquote'],
      
      // 모두 지우기
      ['clean']
    ]
  },
  placeholder: '게시글 내용을 입력하세요...',
  theme: 'snow'
}

/* ========================================
 * 컴포넌트 마운트 시 실행
 * ======================================== */

/**
 * 컴포넌트가 마운트되면 실행되는 함수
 * - 수정 모드인 경우: 기존 게시글 조회
 * - 작성 모드인 경우: 아무 작업 안 함
 */
onMounted(async () => {
  console.log('[BoardFormView] 컴포넌트 마운트')
  console.log('[BoardFormView] 모드:', isEditMode.value ? '수정' : '작성')
  
  // 수정 모드인 경우
  if (isEditMode.value) {
    console.log('[BoardFormView] 게시글 ID:', boardId.value)
    
    // 게시글 조회
    await loadBoardData()
  }
})

/* ========================================
 * 함수 정의
 * ======================================== */

/**
 * 게시글 데이터 로드 (수정 모드 전용)
 * 
 * 기능:
 * - 게시글 ID로 게시글 조회
 * - 권한 체크 (본인 또는 관리자만 수정 가능)
 * - 폼 데이터에 채우기
 * 
 * @returns {Promise<void>}
 */
async function loadBoardData() {
  try {
    console.log('[BoardFormView] 게시글 데이터 로드 시작...')
    
    // 1. 게시글 조회 API 호출
    const board = await boardApi.getBoardById(boardId.value)
    
    console.log('[BoardFormView] 게시글 조회 성공:', board)
    
    // 2. 권한 체크
    // - 본인이 작성한 게시글인지 확인
    // - 관리자는 모든 게시글 수정 가능
    const currentUser = authService.getCurrentUser()
    const isAuthor = board.userId === currentUser.userId
    const isAdmin = authService.isAdmin()
    
    console.log('[BoardFormView] 권한 체크:')
    console.log('  - 현재 사용자 ID:', currentUser.userId)
    console.log('  - 게시글 작성자 ID:', board.userId)
    console.log('  - 본인 여부:', isAuthor)
    console.log('  - 관리자 여부:', isAdmin)
    
    // 권한이 없으면 에러
    if (!isAuthor && !isAdmin) {
      console.error('[BoardFormView] 수정 권한 없음')
      
      ElMessage.error('이 게시글을 수정할 권한이 없습니다')
      
      // 상세 페이지로 이동
      router.push({
        name: 'BoardDetail',
        params: { id: boardId.value }
      })
      
      return
    }
    
    // 3. 폼 데이터에 채우기
    formData.title = board.title
    formData.category = board.category
    formData.content = board.content
    
    console.log('[BoardFormView] 폼 데이터 로드 완료')
    
  } catch (error) {
    console.error('[BoardFormView] 게시글 로드 실패:', error)
    
    ElMessage.error('게시글을 불러오는 중 오류가 발생했습니다')
    
    // 목록으로 이동
    router.push({ name: 'BoardList' })
  }
}

/**
 * 폼 제출 처리
 * 
 * 기능:
 * - 폼 유효성 검증
 * - 작성 모드: 게시글 생성 API 호출
 * - 수정 모드: 게시글 수정 API 호출
 * - 성공 시 상세 페이지로 이동
 * 
 * @returns {Promise<void>}
 */
async function handleSubmit() {
  try {
    console.log('[BoardFormView] 폼 제출 시작')
    
    // 1. 폼 유효성 검증
    // - formRef.value.validate(): Promise를 반환
    // - 검증 성공: true
    // - 검증 실패: false (에러 메시지 자동 표시)
    const valid = await formRef.value.validate()
    
    if (!valid) {
      console.warn('[BoardFormView] 폼 유효성 검증 실패')
      return
    }
    
    console.log('[BoardFormView] 폼 유효성 검증 통과')
    
    // 2. 로딩 상태 시작
    loading.value = true
    
    // 3. 작성 모드 또는 수정 모드에 따라 다른 API 호출
    if (isEditMode.value) {
      // ===== 수정 모드 =====
      console.log('[BoardFormView] 게시글 수정 API 호출...')
      
      // 게시글 수정 API 호출
      const updatedBoard = await boardApi.updateBoard(boardId.value, formData)
      
      console.log('[BoardFormView] 게시글 수정 성공:', updatedBoard)
      
      // 성공 메시지
      ElMessage.success('게시글이 수정되었습니다')
      
      // 상세 페이지로 이동
      router.push({
        name: 'BoardDetail',
        params: { id: boardId.value }
      })
      
    } else {
      // ===== 작성 모드 =====
      console.log('[BoardFormView] 게시글 작성 API 호출...')
      
      // 게시글 작성 API 호출
      const createdBoard = await boardApi.createBoard(formData)
      
      console.log('[BoardFormView] 게시글 작성 성공:', createdBoard)
      
      // 성공 메시지
      ElMessage.success('게시글이 작성되었습니다')
      
      // 상세 페이지로 이동
      router.push({
        name: 'BoardDetail',
        params: { id: createdBoard.id }
      })
    }
    
  } catch (error) {
    console.error('[BoardFormView] 폼 제출 실패:', error)
    
    // 에러 메시지
    if (isEditMode.value) {
      ElMessage.error('게시글 수정에 실패했습니다')
    } else {
      ElMessage.error('게시글 작성에 실패했습니다')
    }
    
  } finally {
    // 로딩 상태 종료
    loading.value = false
  }
}

/**
 * 취소 버튼 클릭 처리
 * 
 * 기능:
 * - 확인 대화상자 표시
 * - 확인 시: 이전 페이지로 이동
 * - 취소 시: 아무 작업 안 함
 * 
 * @returns {Promise<void>}
 */
async function handleCancel() {
  try {
    console.log('[BoardFormView] 취소 버튼 클릭')
    
    // 확인 대화상자 표시
    await ElMessageBox.confirm(
      isEditMode.value
        ? '게시글 수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.'
        : '게시글 작성을 취소하시겠습니까? 작성한 내용이 저장되지 않습니다.',
      '확인',
      {
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )
    
    console.log('[BoardFormView] 취소 확인됨')
    
    // 이전 페이지로 이동
    if (isEditMode.value) {
      // 수정 모드: 상세 페이지로 이동
      router.push({
        name: 'BoardDetail',
        params: { id: boardId.value }
      })
    } else {
      // 작성 모드: 목록으로 이동
      router.push({ name: 'BoardList' })
    }
    
  } catch (error) {
    // 취소 버튼 클릭 시 여기로 옴 (에러가 아님)
    console.log('[BoardFormView] 취소 대화상자에서 취소됨')
  }
}
</script>

<style scoped lang="scss">
/**
 * 스타일 정의
 * - scoped: 이 컴포넌트에만 적용되는 스타일
 * - lang="scss": SCSS 문법 사용 (변수, 중첩 등)
 */

/* ========================================
 * 컨테이너 스타일
 * ======================================== */

.board-form-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

/* ========================================
 * 페이지 헤더 스타일
 * ======================================== */

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* ========================================
 * 폼 카드 스타일
 * ======================================== */

.form-card {
  margin-bottom: 20px;
  
  // Element Plus Card의 body 패딩 조정
  :deep(.el-card__body) {
    padding: 30px;
  }
}

/* ========================================
 * 버튼 그룹 스타일
 * ======================================== */

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  
  // 모바일에서는 버튼을 세로로 배치
  @media (max-width: 768px) {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}

/* ========================================
 * Quill Editor 스타일 커스터마이징
 * ======================================== */

// Quill Editor 컨테이너
:deep(.ql-container) {
  // 에디터 높이 설정
  min-height: 400px;
  
  // 폰트 크기 조정
  font-size: 15px;
  line-height: 1.6;
}

// Quill Editor 도구 모음
:deep(.ql-toolbar) {
  background-color: #fafafa;
  border-radius: 4px 4px 0 0;
  border-color: #dcdfe6;
}

// Quill Editor 입력 영역
:deep(.ql-editor) {
  border-radius: 0 0 4px 4px;
  border-color: #dcdfe6;
  
  // placeholder 스타일
  &.ql-blank::before {
    color: #c0c4cc;
    font-style: normal;
  }
  
  // 이미지 최대 너비 설정 (반응형)
  img {
    max-width: 100%;
    height: auto;
  }
}

/* ========================================
 * 반응형 디자인
 * ======================================== */

// 태블릿 이하 (768px)
@media (max-width: 768px) {
  .board-form-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .form-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
  }
  
  // Quill Editor 높이 줄이기
  :deep(.ql-container) {
    min-height: 300px;
  }
}

// 모바일 (480px)
@media (max-width: 480px) {
  .board-form-container {
    padding: 12px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .form-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
  
  // Quill Editor 높이 더 줄이기
  :deep(.ql-container) {
    min-height: 250px;
  }
}
</style>