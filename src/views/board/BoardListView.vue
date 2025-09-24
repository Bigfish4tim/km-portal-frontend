<template>
  <!-- 
    게시판 목록 페이지 컴포넌트
    - 시스템의 모든 게시글을 목록 형태로 표시
    - 페이징, 검색, 정렬, 필터링 기능 제공
    - 게시글 작성, 수정, 삭제 접근점 제공
    - 향후 구현 예정 (5-6주차)
  -->
  <div class="board-list">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">게시판</h1>
      <p class="page-description">
        공지사항, 자료실, 자유게시판 등 다양한 게시글을 확인할 수 있습니다.
      </p>
    </div>

    <!-- 검색 및 필터 영역 -->
    <el-card class="search-card">
      <div class="search-area">
        <el-row :gutter="20" align="middle">
          <el-col :span="6">
            <el-select v-model="searchParams.category" placeholder="카테고리 선택" clearable>
              <el-option
                v-for="category in boardCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value">
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchParams.searchType" placeholder="검색 유형">
              <el-option label="제목" value="title"></el-option>
              <el-option label="내용" value="content"></el-option>
              <el-option label="작성자" value="author"></el-option>
              <el-option label="제목+내용" value="titleContent"></el-option>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchParams.keyword"
              placeholder="검색어를 입력하세요"
              @keyup.enter="searchPosts"
              clearable>
              <el-button slot="append" icon="el-icon-search" @click="searchPosts"></el-button>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" icon="el-icon-plus" @click="goToCreatePost">
              글 작성
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 게시글 목록 -->
    <el-card class="board-card">
      <div slot="header" class="card-header">
        <span>게시글 목록</span>
        <div class="header-actions">
          <el-select v-model="sortOption" @change="handleSortChange" size="small">
            <el-option label="최신순" value="latest"></el-option>
            <el-option label="조회수순" value="views"></el-option>
            <el-option label="댓글순" value="comments"></el-option>
            <el-option label="추천순" value="likes"></el-option>
          </el-select>
        </div>
      </div>

      <!-- 개발 중 안내 -->
      <el-alert
        title="게시판 시스템은 현재 개발 중입니다"
        type="info"
        description="게시글 목록, 작성, 댓글 기능은 5-6주차에 구현될 예정입니다."
        show-icon
        :closable="false"
        style="margin-bottom: 20px;">
      </el-alert>

      <!-- 임시 게시글 목록 테이블 -->
      <el-table
        :data="samplePosts"
        style="width: 100%"
        @row-click="goToPostDetail"
        class="board-table">
        
        <!-- 카테고리 -->
        <el-table-column label="분류" width="100" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="getCategoryTagType(scope.row.category)"
              size="small">
              {{ scope.row.category }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 제목 -->
        <el-table-column label="제목" min-width="300">
          <template slot-scope="scope">
            <div class="post-title">
              <span class="title-text" @click="goToPostDetail(scope.row)">
                {{ scope.row.title }}
              </span>
              <span v-if="scope.row.commentCount > 0" class="comment-count">
                [{{ scope.row.commentCount }}]
              </span>
              <el-tag v-if="scope.row.isNew" type="danger" size="mini" class="new-badge">
                NEW
              </el-tag>
              <i v-if="scope.row.hasAttachment" class="el-icon-paperclip attachment-icon"></i>
            </div>
          </template>
        </el-table-column>

        <!-- 작성자 -->
        <el-table-column prop="author" label="작성자" width="120" align="center"></el-table-column>

        <!-- 작성일 -->
        <el-table-column label="작성일" width="120" align="center">
          <template slot-scope="scope">
            <span>{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>

        <!-- 조회수 -->
        <el-table-column prop="viewCount" label="조회" width="80" align="center"></el-table-column>

        <!-- 추천수 -->
        <el-table-column prop="likeCount" label="추천" width="80" align="center"></el-table-column>
      </el-table>

      <!-- 페이징 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 통계 정보 -->
    <el-row :gutter="20" class="statistics">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalPosts }}</div>
            <div class="stat-label">전체 게시글</div>
          </div>
          <i class="el-icon-document stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayPosts }}</div>
            <div class="stat-label">오늘 게시글</div>
          </div>
          <i class="el-icon-edit-outline stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalComments }}</div>
            <div class="stat-label">전체 댓글</div>
          </div>
          <i class="el-icon-chat-line-square stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.activeUsers }}</div>
            <div class="stat-label">활성 사용자</div>
          </div>
          <i class="el-icon-user stat-icon"></i>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
/**
 * BoardListView.vue
 * 
 * 게시판 목록 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (5-6주차에 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 게시글 목록 조회 - 페이징, 정렬, 필터링
 * 2. 게시글 검색 - 제목, 내용, 작성자별 검색
 * 3. 카테고리별 분류 - 공지, 자료실, 자유게시판 등
 * 4. 게시글 상세 조회 - 클릭 시 상세 페이지로 이동
 * 5. 게시글 작성 - 새 글 작성 페이지로 이동
 * 6. 통계 정보 - 전체 게시글 수, 오늘 게시글 수 등
 * 
 * 사용자 경험(UX) 고려사항:
 * - 직관적인 검색 및 필터링
 * - 반응형 디자인으로 모든 디바이스 지원
 * - 로딩 상태 표시 및 에러 처리
 * - 즐겨찾기, 북마크 기능
 */

export default {
  name: 'BoardListView',
  
  data() {
    return {
      // 검색 및 필터 조건
      searchParams: {
        category: '', // 선택된 카테고리
        searchType: 'title', // 검색 유형 (title, content, author, titleContent)
        keyword: '' // 검색 키워드
      },
      
      // 정렬 옵션
      sortOption: 'latest', // latest, views, comments, likes
      
      // 게시판 카테고리 목록
      boardCategories: [
        { label: '전체', value: '' },
        { label: '공지사항', value: 'notice' },
        { label: '자료실', value: 'data' },
        { label: '자유게시판', value: 'free' },
        { label: 'QnA', value: 'qna' },
        { label: '건의사항', value: 'suggestion' }
      ],
      
      // 페이징 정보
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 156 // 임시 데이터
      },
      
      // 통계 정보
      statistics: {
        totalPosts: 156,
        todayPosts: 8,
        totalComments: 342,
        activeUsers: 28
      },
      
      // 임시 게시글 데이터
      samplePosts: [
        {
          id: 1,
          category: '공지사항',
          title: 'KM 포털 시스템 오픈 안내',
          content: '새로운 업무 포털 시스템이 오픈되었습니다.',
          author: '관리자',
          createdAt: new Date('2024-09-24'),
          viewCount: 145,
          likeCount: 12,
          commentCount: 8,
          isNew: true,
          hasAttachment: false
        },
        {
          id: 2,
          category: '자료실',
          title: '업무 매뉴얼 및 가이드라인 배포',
          content: '신규 업무 매뉴얼을 첨부파일로 제공합니다.',
          author: '김매니저',
          createdAt: new Date('2024-09-23'),
          viewCount: 89,
          likeCount: 5,
          commentCount: 3,
          isNew: true,
          hasAttachment: true
        },
        {
          id: 3,
          category: '자유게시판',
          title: '점심시간 메뉴 추천 받습니다',
          content: '사무실 근처 맛집 추천해주세요!',
          author: '홍길동',
          createdAt: new Date('2024-09-22'),
          viewCount: 67,
          likeCount: 8,
          commentCount: 15,
          isNew: false,
          hasAttachment: false
        },
        {
          id: 4,
          category: 'QnA',
          title: '파일 업로드가 안되는데 도움 필요합니다',
          content: '큰 용량의 파일을 업로드할 때 오류가 발생합니다.',
          author: '이직원',
          createdAt: new Date('2024-09-21'),
          viewCount: 34,
          likeCount: 2,
          commentCount: 6,
          isNew: false,
          hasAttachment: false
        },
        {
          id: 5,
          category: '건의사항',
          title: '모바일 앱 개발 건의',
          content: '업무 효율성을 위해 모바일 앱이 있으면 좋겠습니다.',
          author: '박과장',
          createdAt: new Date('2024-09-20'),
          viewCount: 78,
          likeCount: 15,
          commentCount: 12,
          isNew: false,
          hasAttachment: false
        }
      ]
    }
  },

  created() {
    console.log('[BoardListView] 컴포넌트가 생성되었습니다');
    console.log('[BoardListView] 게시판 시스템 - 5-6주차에 본격 개발됩니다');
    
    // 실제 구현 시에는 여기서 게시글 목록을 불러올 예정
    // this.fetchPosts();
  },

  methods: {
    /**
     * 게시글 목록을 서버에서 가져오는 메서드 (구현 예정)
     */
    fetchPosts() {
      console.log('[BoardListView] fetchPosts 호출됨 - 구현 예정');
      console.log('검색 조건:', this.searchParams);
      console.log('정렬 옵션:', this.sortOption);
      console.log('페이징:', this.pagination);
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.board.getList({
      //   ...this.searchParams,
      //   sort: this.sortOption,
      //   page: this.pagination.currentPage,
      //   size: this.pagination.pageSize
      // })
    },

    /**
     * 게시글 검색 실행
     */
    searchPosts() {
      console.log('[BoardListView] 검색 실행:', this.searchParams);
      this.pagination.currentPage = 1; // 검색 시 첫 페이지로 이동
      this.fetchPosts();
    },

    /**
     * 정렬 옵션 변경 처리
     */
    handleSortChange() {
      console.log('[BoardListView] 정렬 변경:', this.sortOption);
      this.fetchPosts();
    },

    /**
     * 페이지 크기 변경 처리
     */
    handleSizeChange(newSize) {
      console.log('[BoardListView] 페이지 크기 변경:', newSize);
      this.pagination.pageSize = newSize;
      this.pagination.currentPage = 1;
      this.fetchPosts();
    },

    /**
     * 현재 페이지 변경 처리
     */
    handleCurrentChange(newPage) {
      console.log('[BoardListView] 페이지 변경:', newPage);
      this.pagination.currentPage = newPage;
      this.fetchPosts();
    },

    /**
     * 게시글 상세 페이지로 이동
     */
    goToPostDetail(post) {
      console.log('[BoardListView] 게시글 상세로 이동:', post.id);
      // 실제 구현 시 사용할 라우터 이동 로직
      this.$router.push({
        name: 'BoardDetail',
        params: { id: post.id }
      });
    },

    /**
     * 게시글 작성 페이지로 이동
     */
    goToCreatePost() {
      console.log('[BoardListView] 게시글 작성 페이지로 이동');
      // 실제 구현 시 사용할 라우터 이동 로직
      this.$router.push({ name: 'BoardCreate' });
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
     * 날짜 포맷팅
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
/* 게시판 목록 페이지 스타일링 */

.board-list {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
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

.search-card {
  margin-bottom: 20px;
}

.search-area {
  padding: 10px 0;
}

.board-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.board-table {
  cursor: pointer;
}

.board-table ::v-deep .el-table__row:hover {
  background-color: #f5f7fa;
}

.post-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.title-text {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.title-text:hover {
  color: #409eff;
  text-decoration: underline;
}

.comment-count {
  color: #f56c6c;
  font-size: 12px;
  font-weight: bold;
}

.new-badge {
  margin-left: 5px;
}

.attachment-icon {
  color: #909399;
  margin-left: 5px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 통계 카드 스타일 */
.statistics {
  margin-top: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card ::v-deep .el-card__body {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.stat-icon {
  font-size: 36px;
  color: #e1e8ed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .board-list {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .search-area ::v-deep .el-col {
    margin-bottom: 10px;
  }
  
  .statistics ::v-deep .el-col {
    margin-bottom: 15px;
  }
  
  .board-table {
    font-size: 14px;
  }
  
  .post-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style>