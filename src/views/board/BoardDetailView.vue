<template>
  <!-- 
    게시글 상세 페이지 컴포넌트
    - 선택된 게시글의 상세 내용을 표시
    - 댓글 시스템, 첨부파일 다운로드, 추천/비추천 기능
    - 게시글 수정/삭제 권한 관리
    - 향후 구현 예정 (5-6주차)
  -->
  <div class="board-detail">
    <!-- 네비게이션 (이전/다음 게시글) -->
    <el-card class="navigation-card">
      <div class="nav-buttons">
        <el-button @click="goToPreviousPost" :disabled="!previousPost" icon="el-icon-arrow-left">
          이전 글
        </el-button>
        <el-button @click="goToList" icon="el-icon-menu">
          목록
        </el-button>
        <el-button @click="goToNextPost" :disabled="!nextPost" icon="el-icon-arrow-right">
          다음 글
        </el-button>
      </div>
    </el-card>

    <!-- 게시글 상세 내용 -->
    <el-card class="post-detail-card">
      <!-- 게시글 헤더 -->
      <div class="post-header">
        <div class="post-meta">
          <el-tag :type="getCategoryTagType(currentPost.category)" size="medium">
            {{ currentPost.category }}
          </el-tag>
          <span class="post-id">No. {{ currentPost.id }}</span>
        </div>
        
        <h1 class="post-title">{{ currentPost.title }}</h1>
        
        <div class="post-info">
          <div class="author-info">
            <el-avatar :size="32" :src="currentPost.authorAvatar" icon="el-icon-user-solid"></el-avatar>
            <div class="author-details">
              <span class="author-name">{{ currentPost.author }}</span>
              <span class="author-dept">{{ currentPost.authorDepartment }}</span>
            </div>
          </div>
          
          <div class="post-stats">
            <span class="stat-item">
              <i class="el-icon-view"></i>
              조회 {{ currentPost.viewCount }}
            </span>
            <span class="stat-item">
              <i class="el-icon-time"></i>
              {{ formatFullDate(currentPost.createdAt) }}
            </span>
            <span class="stat-item" v-if="currentPost.updatedAt !== currentPost.createdAt">
              <i class="el-icon-edit"></i>
              수정 {{ formatFullDate(currentPost.updatedAt) }}
            </span>
          </div>
        </div>

        <!-- 게시글 액션 버튼 -->
        <div class="post-actions" v-if="canModifyPost">
          <el-button size="small" @click="editPost">수정</el-button>
          <el-button size="small" type="danger" @click="deletePost">삭제</el-button>
        </div>
      </div>

      <!-- 첨부파일 목록 -->
      <div class="attachments" v-if="currentPost.attachments && currentPost.attachments.length > 0">
        <h3>첨부파일</h3>
        <div class="file-list">
          <div
            v-for="file in currentPost.attachments"
            :key="file.id"
            class="file-item"
            @click="downloadFile(file)">
            <i class="el-icon-paperclip"></i>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">({{ formatFileSize(file.size) }})</span>
            <span class="download-count">다운로드: {{ file.downloadCount }}회</span>
          </div>
        </div>
      </div>

      <!-- 개발 중 안내 -->
      <el-alert
        title="게시글 상세 기능은 현재 개발 중입니다"
        type="info"
        description="게시글 내용 표시, 댓글 시스템, 추천 기능 등은 5-6주차에 구현될 예정입니다."
        show-icon
        :closable="false"
        style="margin: 20px 0;">
      </el-alert>

      <!-- 게시글 내용 -->
      <div class="post-content">
        <div v-html="currentPost.content" class="content-body"></div>
      </div>

      <!-- 추천/비추천 버튼 -->
      <div class="recommendation-section">
        <div class="recommendation-buttons">
          <el-button
            :type="isLiked ? 'primary' : ''"
            @click="toggleLike"
            icon="el-icon-thumb-up">
            추천 {{ currentPost.likeCount }}
          </el-button>
          <el-button
            :type="isDisliked ? 'danger' : ''"
            @click="toggleDislike"
            icon="el-icon-thumb-down">
            비추천 {{ currentPost.dislikeCount }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 댓글 섹션 -->
    <el-card class="comments-card">
      <div slot="header">
        <span>댓글 {{ currentPost.commentCount }}개</span>
      </div>

      <!-- 댓글 작성 폼 -->
      <div class="comment-form">
        <el-input
          type="textarea"
          v-model="newComment"
          :rows="3"
          placeholder="댓글을 입력하세요..."
          maxlength="1000"
          show-word-limit>
        </el-input>
        <div class="comment-actions">
          <el-button type="primary" @click="submitComment" :disabled="!newComment.trim()">
            댓글 등록
          </el-button>
        </div>
      </div>

      <!-- 댓글 목록 -->
      <div class="comments-list">
        <div
          v-for="comment in sampleComments"
          :key="comment.id"
          class="comment-item">
          <div class="comment-header">
            <el-avatar :size="28" :src="comment.authorAvatar" icon="el-icon-user-solid"></el-avatar>
            <div class="comment-author">
              <span class="author-name">{{ comment.author }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-actions" v-if="canModifyComment(comment)">
              <el-button size="mini" type="text" @click="editComment(comment)">수정</el-button>
              <el-button size="mini" type="text" @click="deleteComment(comment)">삭제</el-button>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          
          <!-- 대댓글 -->
          <div class="replies" v-if="comment.replies && comment.replies.length > 0">
            <div
              v-for="reply in comment.replies"
              :key="reply.id"
              class="reply-item">
              <div class="reply-header">
                <el-avatar :size="24" :src="reply.authorAvatar" icon="el-icon-user-solid"></el-avatar>
                <div class="reply-author">
                  <span class="author-name">{{ reply.author }}</span>
                  <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
                </div>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
          
          <!-- 답글 작성 버튼 -->
          <div class="reply-form-toggle">
            <el-button size="mini" type="text" @click="toggleReplyForm(comment)">
              답글
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
/**
 * BoardDetailView.vue
 * 
 * 게시글 상세 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (5-6주차에 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 게시글 상세 조회 - 제목, 내용, 작성자 정보, 첨부파일
 * 2. 댓글 시스템 - 댓글 작성, 수정, 삭제, 대댓글
 * 3. 추천/비추천 - 사용자 반응 수집
 * 4. 첨부파일 - 파일 다운로드 및 미리보기
 * 5. 권한 관리 - 작성자/관리자만 수정/삭제 가능
 * 6. 이전/다음 글 - 연속 조회 편의성
 * 
 * 보안 고려사항:
 * - XSS 방지를 위한 내용 sanitization
 * - 권한 기반 수정/삭제 버튼 표시
 * - 첨부파일 다운로드 권한 확인
 * - 댓글 스팸 방지 및 신고 기능
 */

export default {
  name: 'BoardDetailView',
  
  data() {
    return {
      // 현재 게시글 정보 (실제로는 라우트 파라미터나 API에서 가져올 데이터)
      currentPost: {
        id: 1,
        category: '공지사항',
        title: 'KM 포털 시스템 오픈 안내',
        content: `
          <p>안녕하세요. KM 포털 개발팀입니다.</p>
          <p>새로운 업무 포털 시스템이 정식 오픈되었음을 안내드립니다.</p>
          <h3>주요 기능</h3>
          <ul>
            <li>사용자 관리 시스템</li>
            <li>파일 업로드/다운로드</li>
            <li>게시판 시스템</li>
            <li>실시간 알림</li>
          </ul>
          <p>문의사항이 있으시면 IT팀으로 연락 부탁드립니다.</p>
          <p>감사합니다.</p>
        `,
        author: '관리자',
        authorDepartment: 'IT팀',
        authorAvatar: '',
        createdAt: new Date('2024-09-24T09:00:00'),
        updatedAt: new Date('2024-09-24T09:00:00'),
        viewCount: 145,
        likeCount: 12,
        dislikeCount: 1,
        commentCount: 8,
        attachments: [
          {
            id: 1,
            name: 'KM포털_사용자매뉴얼.pdf',
            size: 2048576, // 2MB
            downloadCount: 45
          },
          {
            id: 2,
            name: '시스템_주요기능_안내.docx',
            size: 1024000, // 1MB
            downloadCount: 23
          }
        ]
      },
      
      // 이전/다음 게시글 정보
      previousPost: {
        id: 0,
        title: '이전 게시글 제목'
      },
      nextPost: {
        id: 2,
        title: '다음 게시글 제목'
      },
      
      // 사용자 반응 상태
      isLiked: false,
      isDisliked: false,
      
      // 댓글 관련
      newComment: '',
      
      // 임시 댓글 데이터
      sampleComments: [
        {
          id: 1,
          author: '김매니저',
          authorAvatar: '',
          content: '새로운 시스템이 매우 직관적이고 사용하기 편리합니다. 좋은 시스템 만들어 주셔서 감사합니다!',
          createdAt: new Date('2024-09-24T10:30:00'),
          replies: [
            {
              id: 101,
              author: '관리자',
              authorAvatar: '',
              content: '좋은 평가해 주셔서 감사합니다. 더 나은 시스템이 되도록 계속 개선하겠습니다.',
              createdAt: new Date('2024-09-24T11:00:00')
            }
          ]
        },
        {
          id: 2,
          author: '홍길동',
          authorAvatar: '',
          content: '파일 업로드 속도가 빨라서 업무 효율성이 많이 향상되었습니다.',
          createdAt: new Date('2024-09-24T14:15:00'),
          replies: []
        },
        {
          id: 3,
          author: '이직원',
          authorAvatar: '',
          content: '모바일에서도 잘 작동하나요? 외근 중에도 사용할 수 있으면 좋겠습니다.',
          createdAt: new Date('2024-09-24T16:45:00'),
          replies: []
        }
      ]
    }
  },

  computed: {
    /**
     * 현재 사용자가 게시글을 수정할 수 있는 권한이 있는지 확인
     */
    canModifyPost() {
      // 실제 구현 시에는 Vuex store에서 현재 사용자 정보를 가져와서 확인
      const currentUser = this.$store?.state?.auth?.user;
      if (!currentUser) return false;
      
      // 작성자이거나 관리자인 경우 수정 가능
      return currentUser.username === this.currentPost.author || 
             currentUser.roles?.some(role => role.roleName === 'ROLE_ADMIN');
    }
  },

  created() {
    console.log('[BoardDetailView] 컴포넌트가 생성되었습니다');
    console.log('[BoardDetailView] 게시글 ID:', this.$route.params.id);
    console.log('[BoardDetailView] 게시글 상세 기능 - 5-6주차에 본격 개발됩니다');
    
    // 실제 구현 시에는 여기서 게시글 상세 정보를 불러올 예정
    // this.fetchPostDetail(this.$route.params.id);
    this.increaseViewCount();
  },

  methods: {
    /**
     * 게시글 상세 정보를 서버에서 가져오는 메서드 (구현 예정)
     */
    fetchPostDetail(postId) {
      console.log(`[BoardDetailView] fetchPostDetail 호출됨 - 게시글 ID: ${postId}`);
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.board.getDetail(postId)
    },

    /**
     * 조회수 증가
     */
    increaseViewCount() {
      console.log('[BoardDetailView] 조회수 증가');
      // 실제 구현 시에는 API 호출로 조회수 업데이트
      // this.$api.board.increaseViewCount(this.currentPost.id)
    },

    /**
     * 목록으로 돌아가기
     */
    goToList() {
      console.log('[BoardDetailView] 게시판 목록으로 이동');
      this.$router.push({ name: 'BoardList' });
    },

    /**
     * 이전 게시글로 이동
     */
    goToPreviousPost() {
      if (this.previousPost) {
        console.log('[BoardDetailView] 이전 게시글로 이동:', this.previousPost.id);
        this.$router.push({ name: 'BoardDetail', params: { id: this.previousPost.id } });
      }
    },

    /**
     * 다음 게시글로 이동
     */
    goToNextPost() {
      if (this.nextPost) {
        console.log('[BoardDetailView] 다음 게시글로 이동:', this.nextPost.id);
        this.$router.push({ name: 'BoardDetail', params: { id: this.nextPost.id } });
      }
    },

    /**
     * 게시글 수정
     */
    editPost() {
      console.log('[BoardDetailView] 게시글 수정 페이지로 이동');
      this.$router.push({ 
        name: 'BoardCreate', 
        params: { id: this.currentPost.id },
        query: { mode: 'edit' }
      });
    },

    /**
     * 게시글 삭제
     */
    deletePost() {
      this.$confirm('정말로 이 게시글을 삭제하시겠습니까?', '삭제 확인', {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        console.log('[BoardDetailView] 게시글 삭제 실행');
        // 실제 구현 시 사용할 삭제 API 호출
        // this.$api.board.delete(this.currentPost.id)
        this.$message.success('게시글이 삭제되었습니다');
        this.$router.push({ name: 'BoardList' });
      }).catch(() => {
        console.log('[BoardDetailView] 게시글 삭제 취소됨');
      });
    },

    /**
     * 추천 토글
     */
    toggleLike() {
      this.isLiked = !this.isLiked;
      if (this.isLiked && this.isDisliked) {
        this.isDisliked = false;
      }
      console.log('[BoardDetailView] 추천 상태:', this.isLiked);
      // 실제 구현 시 API 호출
      // this.$api.board.toggleLike(this.currentPost.id, this.isLiked)
    },

    /**
     * 비추천 토글
     */
    toggleDislike() {
      this.isDisliked = !this.isDisliked;
      if (this.isDisliked && this.isLiked) {
        this.isLiked = false;
      }
      console.log('[BoardDetailView] 비추천 상태:', this.isDisliked);
      // 실제 구현 시 API 호출
      // this.$api.board.toggleDislike(this.currentPost.id, this.isDisliked)
    },

    /**
     * 파일 다운로드
     */
    downloadFile(file) {
      console.log('[BoardDetailView] 파일 다운로드:', file.name);
      // 실제 구현 시 사용할 파일 다운로드 로직
      // this.$api.file.download(file.id)
      this.$message.success(`${file.name} 다운로드를 시작합니다`);
    },

    /**
     * 댓글 등록
     */
    submitComment() {
      if (!this.newComment.trim()) {
        this.$message.warning('댓글 내용을 입력하세요');
        return;
      }

      console.log('[BoardDetailView] 댓글 등록:', this.newComment);
      // 실제 구현 시 사용할 댓글 등록 API
      // this.$api.comment.create(this.currentPost.id, this.newComment)
      
      this.$message.success('댓글이 등록되었습니다');
      this.newComment = '';
    },

    /**
     * 댓글 수정 권한 확인
     */
    canModifyComment(comment) {
      // 실제 구현 시에는 현재 사용자와 댓글 작성자 비교
      const currentUser = this.$store?.state?.auth?.user;
      return currentUser?.username === comment.author;
    },

    /**
     * 댓글 수정
     */
    editComment(comment) {
      console.log('[BoardDetailView] 댓글 수정:', comment.id);
      // 실제 구현 시 댓글 수정 로직
    },

    /**
     * 댓글 삭제
     */
    deleteComment(comment) {
      this.$confirm('댓글을 삭제하시겠습니까?', '삭제 확인', {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        console.log('[BoardDetailView] 댓글 삭제:', comment.id);
        // 실제 구현 시 사용할 댓글 삭제 API
        // this.$api.comment.delete(comment.id)
        this.$message.success('댓글이 삭제되었습니다');
      }).catch(() => {
        console.log('[BoardDetailView] 댓글 삭제 취소됨');
      });
    },

    /**
     * 답글 작성 폼 토글
     */
    toggleReplyForm(comment) {
      console.log('[BoardDetailView] 답글 작성 폼 토글:', comment.id);
      // 실제 구현 시 답글 작성 폼 표시/숨김 로직
    },

    /**
     * 카테고리에 따른 태그 타입 반환
     */
    getCategoryTagType(category) {
      const typeMap = {
        '공지사항': 'danger',
        '자료실': 'warning',
        '자유게시판': 'info',
        'QnA': 'success',
        '건의사항': ''
      };
      return typeMap[category] || '';
    },

    /**
     * 파일 크기 포맷팅
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 전체 날짜 포맷팅
     */
    formatFullDate(date) {
      if (!(date instanceof Date)) return '';
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    /**
     * 간단 날짜 포맷팅
     */
    formatDate(date) {
      if (!(date instanceof Date)) return '';
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (diff < oneDay) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
      }
    }
  }
}
</script>

<style scoped>
/* 게시글 상세 페이지 스타일링 */

.board-detail {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  max-width: 1000px;
  margin: 0 auto;
}

.navigation-card {
  margin-bottom: 20px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-detail-card {
  margin-bottom: 20px;
}

.post-header {
  padding-bottom: 20px;
  border-bottom: 1px solid #e1e8ed;
  margin-bottom: 20px;
  position: relative;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.post-id {
  color: #909399;
  font-size: 12px;
}

.post-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.post-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  color: #2c3e50;
}

.author-dept {
  font-size: 12px;
  color: #7f8c8d;
}

.post-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 3px;
}

.post-actions {
  position: absolute;
  top: 0;
  right: 0;
}

.attachments {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.attachments h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #2c3e50;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-item:hover {
  background-color: #e3f2fd;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.file-size {
  color: #7f8c8d;
  font-size: 12px;
}

.download-count {
  color: #909399;
  font-size: 11px;
  margin-left: auto;
}

.post-content {
  margin: 20px 0;
  min-height: 200px;
}

.content-body {
  line-height: 1.8;
  color: #2c3e50;
}

.content-body h3 {
  color: #2c3e50;
  margin: 20px 0 10px 0;
}

.content-body ul {
  padding-left: 20px;
}

.content-body li {
  margin-bottom: 5px;
}

.recommendation-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #e1e8ed;
  border-bottom: 1px solid #e1e8ed;
  margin: 20px 0;
}

.recommendation-buttons {
  display: flex;
  gap: 10px;
}

.comments-card {
  margin-bottom: 20px;
}

.comment-form {
  margin-bottom: 20px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 15px;
  background-color: #fafbfc;
  border-radius: 8px;
  border-left: 3px solid #e1e8ed;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  flex: 1;
}

.comment-author .author-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #7f8c8d;
}

.comment-content {
  color: #2c3e50;
  line-height: 1.6;
  margin-left: 38px;
}

.replies {
  margin-top: 15px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 2px solid #e1e8ed;
}

.reply-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 6px;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.reply-author {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
}

.reply-author .author-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 13px;
}

.reply-date {
  font-size: 11px;
  color: #7f8c8d;
}

.reply-content {
  color: #2c3e50;
  line-height: 1.5;
  margin-left: 32px;
  font-size: 13px;
}

.reply-form-toggle {
  margin-top: 10px;
  margin-left: 38px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .board-detail {
    padding: 10px;
  }

  .nav-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .nav-buttons .el-button {
    width: 100%;
  }

  .post-title {
    font-size: 20px;
  }

  .post-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-stats {
    width: 100%;
  }

  .post-actions {
    position: static;
    margin-top: 10px;
  }

  .recommendation-buttons {
    flex-direction: column;
    gap: 5px;
  }

  .recommendation-buttons .el-button {
    width: 200px;
  }

  .comment-content,
  .reply-content {
    margin-left: 0;
    margin-top: 10px;
  }

  .reply-form-toggle {
    margin-left: 0;
  }
}
</style>