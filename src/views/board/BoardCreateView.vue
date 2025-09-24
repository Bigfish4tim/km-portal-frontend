<template>
  <!-- 
    게시글 작성/수정 페이지 컴포넌트
    - 새 게시글 작성 또는 기존 게시글 수정
    - 리치 텍스트 에디터, 첨부파일 업로드 지원
    - 임시저장, 미리보기 기능 제공
    - 향후 구현 예정 (5-6주차)
  -->
  <div class="board-create">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">{{ isEditMode ? '게시글 수정' : '게시글 작성' }}</h1>
      <p class="page-description">
        {{ isEditMode ? '게시글을 수정합니다.' : '새로운 게시글을 작성합니다.' }}
      </p>
    </div>

    <!-- 게시글 작성 폼 -->
    <el-card class="create-form-card">
      <!-- 개발 중 안내 -->
      <el-alert
        title="게시글 작성 기능은 현재 개발 중입니다"
        type="info"
        description="에디터, 첨부파일 업로드, 임시저장 기능 등은 5-6주차에 구현될 예정입니다."
        show-icon
        :closable="false"
        style="margin-bottom: 20px;">
      </el-alert>

      <el-form
        ref="postForm"
        :model="postForm"
        :rules="formRules"
        label-width="100px"
        class="post-form">
        
        <!-- 카테고리 선택 -->
        <el-form-item label="카테고리" prop="category">
          <el-select v-model="postForm.category" placeholder="카테고리를 선택하세요" style="width: 200px;">
            <el-option
              v-for="category in boardCategories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
              :disabled="!category.canWrite">
              <span style="float: left">{{ category.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px" v-if="!category.canWrite">
                권한 없음
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 제목 입력 -->
        <el-form-item label="제목" prop="title">
          <el-input
            v-model="postForm.title"
            placeholder="게시글 제목을 입력하세요"
            maxlength="200"
            show-word-limit
            clearable>
          </el-input>
        </el-form-item>

        <!-- 공지사항 설정 (권한이 있는 경우에만) -->
        <el-form-item label="공지 설정" v-if="canSetNotice">
          <el-checkbox v-model="postForm.isNotice">이 게시글을 공지사항으로 설정</el-checkbox>
          <el-checkbox v-model="postForm.isPinned" :disabled="!postForm.isNotice">상단 고정</el-checkbox>
        </el-form-item>

        <!-- 내용 입력 -->
        <el-form-item label="내용" prop="content">
          <!-- 임시 텍스트 에디터 (실제로는 리치 에디터 사용 예정) -->
          <div class="editor-placeholder">
            <el-input
              type="textarea"
              v-model="postForm.content"
              :rows="15"
              placeholder="게시글 내용을 입력하세요..."
              maxlength="5000"
              show-word-limit>
            </el-input>
            
            <div class="editor-info">
              <el-alert
                title="향후 리치 텍스트 에디터가 제공됩니다"
                type="info"
                description="텍스트 포맷팅, 이미지 삽입, 표 작성 등의 기능이 지원될 예정입니다."
                show-icon
                :closable="false">
              </el-alert>
            </div>
          </div>
        </el-form-item>

        <!-- 첨부파일 업로드 -->
        <el-form-item label="첨부파일">
          <div class="file-upload-section">
            <el-upload
              ref="upload"
              class="upload-demo"
              drag
              :action="uploadUrl"
              :before-upload="beforeFileUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :file-list="fileList"
              multiple
              :disabled="!canUploadFiles">
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">파일을 드래그하거나 <em>클릭하여 업로드</em></div>
              <div class="el-upload__tip" slot="tip">
                jpg/png/gif/pdf/doc/docx 파일만 업로드 가능하며, 파일 크기는 10MB를 초과할 수 없습니다.
              </div>
            </el-upload>
            
            <!-- 업로드 제한 안내 -->
            <div class="upload-limits">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="limit-item">
                    <i class="el-icon-document"></i>
                    <span>최대 {{ maxFileCount }}개</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="limit-item">
                    <i class="el-icon-folder"></i>
                    <span>개당 {{ maxFileSize }}MB</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="limit-item">
                    <i class="el-icon-files"></i>
                    <span>총 {{ maxTotalSize }}MB</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form-item>

        <!-- 태그 설정 -->
        <el-form-item label="태그">
          <el-tag
            v-for="tag in postForm.tags"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="removeTag(tag)">
            {{ tag }}
          </el-tag>
          <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm">
          </el-input>
          <el-button
            v-else
            class="button-new-tag"
            size="small"
            @click="showInput">+ 새 태그</el-button>
        </el-form-item>

        <!-- 예약 발행 (관리자만) -->
        <el-form-item label="발행 설정" v-if="canSchedulePost">
          <el-radio-group v-model="postForm.publishType">
            <el-radio label="immediate">즉시 발행</el-radio>
            <el-radio label="scheduled">예약 발행</el-radio>
            <el-radio label="draft">임시저장</el-radio>
          </el-radio-group>
          
          <div v-if="postForm.publishType === 'scheduled'" class="scheduled-datetime">
            <el-date-picker
              v-model="postForm.scheduledAt"
              type="datetime"
              placeholder="발행일시 선택"
              :picker-options="datePickerOptions">
            </el-date-picker>
          </div>
        </el-form-item>

        <!-- 댓글 설정 -->
        <el-form-item label="댓글 설정">
          <el-checkbox v-model="postForm.allowComments">댓글 허용</el-checkbox>
          <el-checkbox v-model="postForm.allowAnonymous" :disabled="!postForm.allowComments">
            익명 댓글 허용
          </el-checkbox>
        </el-form-item>

        <!-- 알림 설정 -->
        <el-form-item label="알림 설정">
          <el-checkbox v-model="postForm.sendNotification">새 댓글 시 이메일 알림</el-checkbox>
          <el-checkbox v-model="postForm.broadcastNotification" v-if="canBroadcast">
            전체 사용자 알림 발송
          </el-checkbox>
        </el-form-item>
      </el-form>

      <!-- 작업 버튼들 -->
      <div class="form-actions">
        <div class="left-actions">
          <el-button @click="goBack">취소</el-button>
          <el-button @click="saveAsDraft" :loading="saving">임시저장</el-button>
          <el-button @click="previewPost" type="info">미리보기</el-button>
        </div>
        <div class="right-actions">
          <el-button type="primary" @click="submitPost" :loading="saving">
            {{ isEditMode ? '수정 완료' : '게시글 작성' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 미리보기 다이얼로그 -->
    <el-dialog
      title="게시글 미리보기"
      :visible.sync="previewVisible"
      width="80%"
      :before-close="closePreview">
      <div class="preview-content">
        <div class="preview-header">
          <el-tag :type="getCategoryTagType(postForm.category)">{{ getCategoryLabel(postForm.category) }}</el-tag>
          <h2>{{ postForm.title || '제목 없음' }}</h2>
          <div class="preview-meta">
            <span>작성자: {{ currentUser.fullName }}</span>
            <span>작성일: {{ new Date().toLocaleString('ko-KR') }}</span>
          </div>
        </div>
        <div class="preview-body">
          <div v-html="getPreviewContent()"></div>
        </div>
        <div class="preview-attachments" v-if="fileList.length > 0">
          <h4>첨부파일</h4>
          <div v-for="file in fileList" :key="file.uid" class="preview-file">
            <i class="el-icon-paperclip"></i>
            {{ file.name }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * BoardCreateView.vue
 * 
 * 게시글 작성/수정 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (5-6주차에 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 게시글 작성 - 제목, 내용, 카테고리 설정
 * 2. 리치 텍스트 에디터 - WYSIWYG 편집기
 * 3. 첨부파일 업로드 - 드래그 앤 드롭 지원
 * 4. 임시저장 - 작성 중인 내용 자동/수동 저장
 * 5. 미리보기 - 발행 전 내용 확인
 * 6. 권한 관리 - 카테고리별 작성 권한 확인
 * 7. 예약 발행 - 지정된 시간에 자동 발행
 * 
 * 에디터 고려사항:
 * - 이미지 붙여넣기 및 업로드
 * - 표, 링크, 코드 블록 지원
 * - 맞춤법 검사 및 자동 완성
 * - 모바일 디바이스 최적화
 */

export default {
  name: 'BoardCreateView',
  
  data() {
    return {
      // 편집 모드 여부 (URL 파라미터로 결정)
      isEditMode: false,
      
      // 폼 데이터
      postForm: {
        category: '',
        title: '',
        content: '',
        isNotice: false,
        isPinned: false,
        tags: [],
        publishType: 'immediate', // immediate, scheduled, draft
        scheduledAt: null,
        allowComments: true,
        allowAnonymous: false,
        sendNotification: false,
        broadcastNotification: false
      },
      
      // 폼 유효성 검사 규칙
      formRules: {
        category: [
          { required: true, message: '카테고리를 선택하세요', trigger: 'change' }
        ],
        title: [
          { required: true, message: '제목을 입력하세요', trigger: 'blur' },
          { min: 2, max: 200, message: '제목은 2-200자 사이여야 합니다', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '내용을 입력하세요', trigger: 'blur' },
          { min: 10, message: '내용은 최소 10자 이상이어야 합니다', trigger: 'blur' }
        ]
      },
      
      // 게시판 카테고리 목록
      boardCategories: [
        { label: '공지사항', value: 'notice', canWrite: false }, // 관리자만
        { label: '자료실', value: 'data', canWrite: true },
        { label: '자유게시판', value: 'free', canWrite: true },
        { label: 'QnA', value: 'qna', canWrite: true },
        { label: '건의사항', value: 'suggestion', canWrite: true }
      ],
      
      // 파일 업로드 관련
      uploadUrl: '/api/files/upload', // 실제 업로드 API URL
      fileList: [],
      maxFileCount: 10,
      maxFileSize: 10, // MB
      maxTotalSize: 50, // MB
      
      // 태그 입력 관련
      inputVisible: false,
      inputValue: '',
      
      // 상태 관리
      saving: false,
      previewVisible: false,
      
      // 날짜 선택기 옵션
      datePickerOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now() - 8.64e7; // 과거 날짜 선택 불가
        }
      },
      
      // 현재 사용자 정보 (임시)
      currentUser: {
        fullName: '홍길동',
        roles: ['ROLE_USER']
      }
    }
  },

  computed: {
    /**
     * 공지사항 설정 권한 확인
     */
    canSetNotice() {
      return this.currentUser.roles?.includes('ROLE_ADMIN') || 
             this.currentUser.roles?.includes('ROLE_BOARD_ADMIN');
    },

    /**
     * 예약 발행 권한 확인
     */
    canSchedulePost() {
      return this.currentUser.roles?.includes('ROLE_ADMIN') || 
             this.currentUser.roles?.includes('ROLE_MANAGER');
    },

    /**
     * 전체 알림 발송 권한 확인
     */
    canBroadcast() {
      return this.currentUser.roles?.includes('ROLE_ADMIN');
    },

    /**
     * 파일 업로드 가능 여부
     */
    canUploadFiles() {
      return true; // 실제로는 권한 및 용량 체크
    }
  },

  created() {
    console.log('[BoardCreateView] 컴포넌트가 생성되었습니다');
    
    // 편집 모드 확인
    this.isEditMode = this.$route.query.mode === 'edit' && this.$route.params.id;
    
    if (this.isEditMode) {
      console.log('[BoardCreateView] 편집 모드 - 게시글 ID:', this.$route.params.id);
      // 실제 구현 시 기존 게시글 데이터 로드
      // this.loadPostData(this.$route.params.id);
    }
    
    // 권한에 따른 카테고리 필터링
    this.updateCategoryPermissions();
    
    console.log('[BoardCreateView] 게시글 작성/수정 기능 - 5-6주차에 본격 개발됩니다');
  },

  methods: {
    /**
     * 기존 게시글 데이터를 로드하는 메서드 (구현 예정)
     */
    loadPostData(postId) {
      console.log(`[BoardCreateView] loadPostData 호출됨 - 게시글 ID: ${postId}`);
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.board.getDetail(postId).then(response => {
      //   this.postForm = { ...this.postForm, ...response.data };
      //   this.fileList = response.data.attachments || [];
      // });
    },

    /**
     * 사용자 권한에 따른 카테고리 권한 업데이트
     */
    updateCategoryPermissions() {
      const userRoles = this.currentUser.roles || [];
      
      this.boardCategories = this.boardCategories.map(category => {
        if (category.value === 'notice') {
          category.canWrite = userRoles.includes('ROLE_ADMIN') || 
                             userRoles.includes('ROLE_BOARD_ADMIN');
        }
        return category;
      });
    },

    /**
     * 게시글 제출
     */
    submitPost() {
      this.$refs.postForm.validate((valid) => {
        if (valid) {
          this.saving = true;
          
          console.log('[BoardCreateView] 게시글 제출:', this.postForm);
          
          // 실제 구현 시 사용할 API 호출 로직
          setTimeout(() => {
            this.saving = false;
            
            if (this.isEditMode) {
              this.$message.success('게시글이 수정되었습니다');
            } else {
              this.$message.success('게시글이 작성되었습니다');
            }
            
            // 게시글 목록으로 이동
            this.$router.push({ name: 'BoardList' });
          }, 2000);
          
          // 실제 구현:
          // const apiMethod = this.isEditMode ? 
          //   this.$api.board.update(this.$route.params.id, this.postForm) :
          //   this.$api.board.create(this.postForm);
        } else {
          this.$message.error('필수 항목을 모두 입력해주세요');
        }
      });
    },

    /**
     * 임시저장
     */
    saveAsDraft() {
      this.saving = true;
      
      console.log('[BoardCreateView] 임시저장:', this.postForm);
      
      // 실제 구현 시 사용할 임시저장 API
      setTimeout(() => {
        this.saving = false;
        this.$message.success('임시저장되었습니다');
      }, 1000);
      
      // 실제 구현: this.$api.board.saveDraft(this.postForm);
    },

    /**
     * 미리보기 표시
     */
    previewPost() {
      if (!this.postForm.title && !this.postForm.content) {
        this.$message.warning('제목 또는 내용을 입력해주세요');
        return;
      }
      
      console.log('[BoardCreateView] 미리보기 표시');
      this.previewVisible = true;
    },

    /**
     * 미리보기 닫기
     */
    closePreview() {
      this.previewVisible = false;
    },

    /**
     * 미리보기 내용 생성
     */
    getPreviewContent() {
      return this.postForm.content.replace(/\n/g, '<br>');
    },

    /**
     * 이전 페이지로 돌아가기
     */
    goBack() {
      // 변경사항이 있는 경우 확인
      if (this.hasUnsavedChanges()) {
        this.$confirm('작성 중인 내용이 있습니다. 정말로 나가시겠습니까?', '확인', {
          confirmButtonText: '나가기',
          cancelButtonText: '계속 작성',
          type: 'warning'
        }).then(() => {
          this.$router.go(-1);
        }).catch(() => {
          console.log('[BoardCreateView] 계속 작성');
        });
      } else {
        this.$router.go(-1);
      }
    },

    /**
     * 저장되지 않은 변경사항 확인
     */
    hasUnsavedChanges() {
      return this.postForm.title || this.postForm.content || this.fileList.length > 0;
    },

    /**
     * 파일 업로드 전 검사
     */
    beforeFileUpload(file) {
      console.log('[BoardCreateView] 파일 업로드 전 검사:', file.name);
      
      // 파일 타입 검사
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.$message.error('허용되지 않는 파일 형식입니다');
        return false;
      }
      
      // 파일 크기 검사
      const isLessThanMaxSize = file.size / 1024 / 1024 < this.maxFileSize;
      if (!isLessThanMaxSize) {
        this.$message.error(`파일 크기는 ${this.maxFileSize}MB를 초과할 수 없습니다`);
        return false;
      }
      
      // 파일 개수 검사
      if (this.fileList.length >= this.maxFileCount) {
        this.$message.error(`최대 ${this.maxFileCount}개까지만 업로드 가능합니다`);
        return false;
      }
      
      return true;
    },

    /**
     * 파일 업로드 성공 처리
     */
    handleUploadSuccess(response, file, fileList) {
      console.log('[BoardCreateView] 파일 업로드 성공:', response);
      this.fileList = fileList;
      this.$message.success(`${file.name} 업로드 완료`);
    },

    /**
     * 파일 업로드 실패 처리
     */
    handleUploadError(err, file, fileList) {
      console.error('[BoardCreateView] 파일 업로드 실패:', err);
      this.$message.error(`${file.name} 업로드 실패`);
    },

    /**
     * 태그 제거
     */
    removeTag(tag) {
      this.postForm.tags.splice(this.postForm.tags.indexOf(tag), 1);
    },

    /**
     * 태그 입력 필드 표시
     */
    showInput() {
      this.inputVisible = true;
      this.$nextTick(() => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },

    /**
     * 태그 입력 확인
     */
    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue && this.postForm.tags.indexOf(inputValue) === -1) {
        this.postForm.tags.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    },

    /**
     * 카테고리 태그 타입 반환
     */
    getCategoryTagType(category) {
      const typeMap = {
        'notice': 'danger',
        'data': 'warning',
        'free': 'info',
        'qna': 'success',
        'suggestion': ''
      };
      return typeMap[category] || '';
    },

    /**
     * 카테고리 라벨 반환
     */
    getCategoryLabel(category) {
      const categoryItem = this.boardCategories.find(item => item.value === category);
      return categoryItem ? categoryItem.label : category;
    }
  },

  // 페이지 떠나기 전 확인
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges()) {
      this.$confirm('작성 중인 내용이 있습니다. 정말로 나가시겠습니까?', '확인', {
        confirmButtonText: '나가기',
        cancelButtonText: '계속 작성',
        type: 'warning'
      }).then(() => {
        next();
      }).catch(() => {
        next(false);
      });
    } else {
      next();
    }
  }
}
</script>

<style scoped>
/* 게시글 작성 페이지 스타일링 */

.board-create {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.page-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.create-form-card {
  margin-bottom: 20px;
}

.post-form {
  padding: 10px 0;
}

.post-form ::v-deep .el-form-item__label {
  font-weight: 500;
  color: #2c3e50;
}

.editor-placeholder {
  position: relative;
}

.editor-info {
  margin-top: 10px;
}

.file-upload-section {
  width: 100%;
}

.upload-demo ::v-deep .el-upload {
  width: 100%;
}

.upload-demo ::v-deep .el-upload-dragger {
  width: 100%;
  height: 120px;
}

.upload-limits {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7f8c8d;
  font-size: 13px;
}

.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.scheduled-datetime {
  margin-top: 10px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e1e8ed;
  margin-top: 20px;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

/* 미리보기 스타일 */
.preview-content {
  padding: 20px;
}

.preview-header {
  border-bottom: 1px solid #e1e8ed;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.preview-header h2 {
  margin: 10px 0;
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
}

.preview-meta {
  display: flex;
  gap: 15px;
  color: #7f8c8d;
  font-size: 13px;
}

.preview-body {
  line-height: 1.8;
  color: #2c3e50;
  min-height: 200px;
  margin-bottom: 20px;
}

.preview-attachments {
  border-top: 1px solid #e1e8ed;
  padding-top: 15px;
}

.preview-attachments h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.preview-file {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .board-create {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
  }

  .page-title {
    font-size: 20px;
  }

  .form-actions {
    flex-direction: column;
    gap: 15px;
  }

  .left-actions,
  .right-actions {
    width: 100%;
    justify-content: center;
  }

  .left-actions .el-button,
  .right-actions .el-button {
    flex: 1;
  }

  .upload-limits ::v-deep .el-col {
    margin-bottom: 10px;
  }

  .preview-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style>