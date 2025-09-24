<template>
  <!-- 
    파일 관리 페이지 컴포넌트
    - 업로드된 파일들을 조회, 관리하는 페이지
    - 파일 업로드, 다운로드, 삭제, 검색, 카테고리 분류
    - 파일 미리보기, 공유, 권한 관리 기능
    - 향후 구현 예정 (4-5주차)
  -->
  <div class="file-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">파일 관리</h1>
      <p class="page-description">
        업로드된 파일들을 조회하고 관리할 수 있습니다. 파일 검색, 분류, 다운로드 기능을 제공합니다.
      </p>
    </div>

    <!-- 파일 업로드 및 검색 영역 -->
    <el-card class="control-card">
      <div class="control-area">
        <el-row :gutter="20" align="middle">
          <!-- 파일 업로드 -->
          <el-col :span="6">
            <el-upload
              class="upload-btn"
              :action="uploadUrl"
              :before-upload="beforeFileUpload"
              :on-success="handleUploadSuccess"
              :show-file-list="false"
              multiple>
              <el-button type="primary" icon="el-icon-upload">
                파일 업로드
              </el-button>
            </el-upload>
          </el-col>
          
          <!-- 카테고리 필터 -->
          <el-col :span="4">
            <el-select v-model="searchParams.category" placeholder="카테고리" clearable>
              <el-option
                v-for="category in fileCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value">
              </el-option>
            </el-select>
          </el-col>
          
          <!-- 파일 타입 필터 -->
          <el-col :span="4">
            <el-select v-model="searchParams.fileType" placeholder="파일 타입" clearable>
              <el-option
                v-for="type in fileTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value">
              </el-option>
            </el-select>
          </el-col>
          
          <!-- 검색 -->
          <el-col :span="6">
            <el-input
              v-model="searchParams.keyword"
              placeholder="파일명 검색"
              @keyup.enter="searchFiles"
              clearable>
              <el-button slot="append" icon="el-icon-search" @click="searchFiles"></el-button>
            </el-input>
          </el-col>
          
          <!-- 보기 방식 -->
          <el-col :span="4">
            <el-button-group>
              <el-button 
                :type="viewMode === 'grid' ? 'primary' : ''"
                @click="viewMode = 'grid'"
                icon="el-icon-menu">
              </el-button>
              <el-button 
                :type="viewMode === 'list' ? 'primary' : ''"
                @click="viewMode = 'list'"
                icon="el-icon-s-grid">
              </el-button>
            </el-button-group>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 개발 중 안내 -->
    <el-alert
      title="파일 관리 시스템은 현재 개발 중입니다"
      type="info"
      description="파일 업로드, 다운로드, 미리보기, 권한 관리 기능은 4-5주차에 구현될 예정입니다."
      show-icon
      :closable="false"
      style="margin: 20px 0;">
    </el-alert>

    <!-- 파일 목록 영역 -->
    <el-card class="file-list-card">
      <div slot="header" class="card-header">
        <span>파일 목록 ({{ pagination.total }}개)</span>
        <div class="header-actions">
          <el-select v-model="sortOption" @change="handleSortChange" size="small">
            <el-option label="최신순" value="latest"></el-option>
            <el-option label="이름순" value="name"></el-option>
            <el-option label="크기순" value="size"></el-option>
            <el-option label="다운로드순" value="downloads"></el-option>
          </el-select>
          <el-button size="small" @click="refreshFileList" icon="el-icon-refresh">새로고침</el-button>
        </div>
      </div>

      <!-- 그리드 보기 -->
      <div v-if="viewMode === 'grid'" class="file-grid">
        <div
          v-for="file in sampleFiles"
          :key="file.id"
          class="file-card"
          @click="selectFile(file)"
          :class="{ 'selected': selectedFiles.includes(file.id) }">
          
          <!-- 파일 아이콘/썸네일 -->
          <div class="file-thumbnail">
            <el-image
              v-if="file.isImage"
              :src="file.thumbnailUrl"
              fit="cover"
              class="thumbnail-image">
              <div slot="error" class="image-error">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
            <i v-else :class="getFileIcon(file.extension)" class="file-icon"></i>
          </div>
          
          <!-- 파일 정보 -->
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.uploadedAt) }}</span>
            </div>
          </div>
          
          <!-- 파일 액션 -->
          <div class="file-actions">
            <el-dropdown @command="handleFileAction" trigger="click">
              <el-button size="mini" type="text" icon="el-icon-more"></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{action: 'download', file: file}">
                  <i class="el-icon-download"></i> 다운로드
                </el-dropdown-item>
                <el-dropdown-item :command="{action: 'preview', file: file}" v-if="file.canPreview">
                  <i class="el-icon-view"></i> 미리보기
                </el-dropdown-item>
                <el-dropdown-item :command="{action: 'share', file: file}">
                  <i class="el-icon-share"></i> 공유
                </el-dropdown-item>
                <el-dropdown-item :command="{action: 'move', file: file}">
                  <i class="el-icon-folder"></i> 이동
                </el-dropdown-item>
                <el-dropdown-item :command="{action: 'rename', file: file}">
                  <i class="el-icon-edit"></i> 이름 변경
                </el-dropdown-item>
                <el-dropdown-item :command="{action: 'delete', file: file}" divided>
                  <i class="el-icon-delete" style="color: #f56c6c;"></i> 삭제
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 리스트 보기 -->
      <div v-else class="file-list">
        <el-table
          :data="sampleFiles"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          style="width: 100%">
          
          <el-table-column type="selection" width="55"></el-table-column>
          
          <!-- 파일명 -->
          <el-table-column label="파일명" min-width="300">
            <template slot-scope="scope">
              <div class="file-name-cell">
                <i :class="getFileIcon(scope.row.extension)" class="file-icon-small"></i>
                <span class="file-name">{{ scope.row.name }}</span>
                <el-tag v-if="scope.row.isNew" type="danger" size="mini">NEW</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <!-- 카테고리 -->
          <el-table-column label="카테고리" width="120" align="center">
            <template slot-scope="scope">
              <el-tag size="small">{{ scope.row.category }}</el-tag>
            </template>
          </el-table-column>
          
          <!-- 크기 -->
          <el-table-column label="크기" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ formatFileSize(scope.row.size) }}</span>
            </template>
          </el-table-column>
          
          <!-- 업로드자 -->
          <el-table-column prop="uploader" label="업로드자" width="120" align="center"></el-table-column>
          
          <!-- 업로드일 -->
          <el-table-column label="업로드일" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ formatDate(scope.row.uploadedAt) }}</span>
            </template>
          </el-table-column>
          
          <!-- 다운로드 수 -->
          <el-table-column prop="downloadCount" label="다운로드" width="100" align="center"></el-table-column>
          
          <!-- 액션 -->
          <el-table-column label="작업" width="120" align="center">
            <template slot-scope="scope">
              <el-button-group>
                <el-button size="mini" @click="downloadFile(scope.row)" icon="el-icon-download"></el-button>
                <el-button size="mini" @click="previewFile(scope.row)" icon="el-icon-view" v-if="scope.row.canPreview"></el-button>
                <el-button size="mini" @click="deleteFile(scope.row)" icon="el-icon-delete" type="danger"></el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 페이징 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[12, 24, 48, 96]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 파일 통계 -->
    <el-row :gutter="20" class="file-statistics">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalFiles }}</div>
            <div class="stat-label">전체 파일</div>
          </div>
          <i class="el-icon-document stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ formatFileSize(statistics.totalSize) }}</div>
            <div class="stat-label">총 용량</div>
          </div>
          <i class="el-icon-folder stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayUploads }}</div>
            <div class="stat-label">오늘 업로드</div>
          </div>
          <i class="el-icon-upload stat-icon"></i>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalDownloads }}</div>
            <div class="stat-label">총 다운로드</div>
          </div>
          <i class="el-icon-download stat-icon"></i>
        </el-card>
      </el-col>
    </el-row>

    <!-- 파일 미리보기 다이얼로그 -->
    <el-dialog
      title="파일 미리보기"
      :visible.sync="previewVisible"
      width="70%"
      @close="closePreview">
      <div class="preview-container">
        <div v-if="previewFile && previewFile.isImage" class="image-preview">
          <el-image :src="previewFile.url" fit="contain" style="width: 100%; max-height: 500px;"></el-image>
        </div>
        <div v-else-if="previewFile && previewFile.isText" class="text-preview">
          <pre>{{ previewFile.content }}</pre>
        </div>
        <div v-else class="unsupported-preview">
          <i class="el-icon-warning"></i>
          <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * FileManagementView.vue
 * 
 * 파일 관리 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (4-5주차에 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 파일 업로드 - 드래그 앤 드롭, 멀티 업로드, 진행률 표시
 * 2. 파일 조회 - 그리드/리스트 뷰, 검색, 필터링, 정렬
 * 3. 파일 다운로드 - 개별/일괄 다운로드, 압축 다운로드
 * 4. 파일 관리 - 이름 변경, 이동, 복사, 삭제
 * 5. 파일 미리보기 - 이미지, 텍스트, PDF 등
 * 6. 공유 및 권한 - 링크 공유, 접근 권한 설정
 * 7. 카테고리 관리 - 폴더 구조, 태그 시스템
 * 
 * 기술적 고려사항:
 * - 대용량 파일 업로드 (청크 업로드)
 * - 중복 파일 체크 및 처리
 * - 바이러스 검사 연동
 * - CDN 연동 최적화
 */

export default {
  name: 'FileManagementView',
  
  data() {
    return {
      // 검색 및 필터 조건
      searchParams: {
        keyword: '',
        category: '',
        fileType: '',
        dateRange: []
      },
      
      // 보기 모드
      viewMode: 'grid', // grid, list
      
      // 정렬 옵션
      sortOption: 'latest',
      
      // 파일 카테고리
      fileCategories: [
        { label: '전체', value: '' },
        { label: '문서', value: 'document' },
        { label: '이미지', value: 'image' },
        { label: '영상', value: 'video' },
        { label: '음악', value: 'audio' },
        { label: '압축파일', value: 'archive' },
        { label: '기타', value: 'other' }
      ],
      
      // 파일 타입
      fileTypes: [
        { label: '전체', value: '' },
        { label: 'PDF', value: 'pdf' },
        { label: 'Word', value: 'doc,docx' },
        { label: 'Excel', value: 'xls,xlsx' },
        { label: 'PowerPoint', value: 'ppt,pptx' },
        { label: '이미지', value: 'jpg,jpeg,png,gif' },
        { label: '텍스트', value: 'txt,md' }
      ],
      
      // 업로드 URL
      uploadUrl: '/api/files/upload',
      
      // 페이징 정보
      pagination: {
        currentPage: 1,
        pageSize: 24,
        total: 48 // 임시 데이터
      },
      
      // 선택된 파일들
      selectedFiles: [],
      
      // 미리보기
      previewVisible: false,
      previewFile: null,
      
      // 통계 정보
      statistics: {
        totalFiles: 1248,
        totalSize: 2147483648, // 2GB
        todayUploads: 15,
        totalDownloads: 5432
      },
      
      // 임시 파일 데이터
      sampleFiles: [
        {
          id: 1,
          name: '프로젝트_제안서.pdf',
          extension: 'pdf',
          size: 2048576, // 2MB
          category: '문서',
          uploader: '김매니저',
          uploadedAt: new Date('2024-09-24'),
          downloadCount: 15,
          isImage: false,
          canPreview: true,
          isNew: true,
          url: '',
          thumbnailUrl: ''
        },
        {
          id: 2,
          name: '회사로고.png',
          extension: 'png',
          size: 512000, // 500KB
          category: '이미지',
          uploader: '디자이너',
          uploadedAt: new Date('2024-09-23'),
          downloadCount: 8,
          isImage: true,
          canPreview: true,
          isNew: true,
          url: '/images/sample-logo.png',
          thumbnailUrl: '/images/sample-logo-thumb.png'
        },
        {
          id: 3,
          name: '업무_매뉴얼.docx',
          extension: 'docx',
          size: 1024000, // 1MB
          category: '문서',
          uploader: '관리자',
          uploadedAt: new Date('2024-09-22'),
          downloadCount: 32,
          isImage: false,
          canPreview: false,
          isNew: false,
          url: '',
          thumbnailUrl: ''
        },
        {
          id: 4,
          name: '월간보고서.xlsx',
          extension: 'xlsx',
          size: 768000, // 750KB
          category: '문서',
          uploader: '홍길동',
          uploadedAt: new Date('2024-09-21'),
          downloadCount: 12,
          isImage: false,
          canPreview: false,
          isNew: false,
          url: '',
          thumbnailUrl: ''
        },
        {
          id: 5,
          name: '회의자료.pptx',
          extension: 'pptx',
          size: 3072000, // 3MB
          category: '문서',
          uploader: '박과장',
          uploadedAt: new Date('2024-09-20'),
          downloadCount: 25,
          isImage: false,
          canPreview: false,
          isNew: false,
          url: '',
          thumbnailUrl: ''
        },
        {
          id: 6,
          name: '사무실_전경.jpg',
          extension: 'jpg',
          size: 1536000, // 1.5MB
          category: '이미지',
          uploader: '사진사',
          uploadedAt: new Date('2024-09-19'),
          downloadCount: 6,
          isImage: true,
          canPreview: true,
          isNew: false,
          url: '/images/sample-office.jpg',
          thumbnailUrl: '/images/sample-office-thumb.jpg'
        }
      ]
    }
  },

  created() {
    console.log('[FileManagementView] 컴포넌트가 생성되었습니다');
    console.log('[FileManagementView] 파일 관리 시스템 - 4-5주차에 본격 개발됩니다');
    
    // 실제 구현 시에는 여기서 파일 목록을 불러올 예정
    // this.fetchFiles();
  },

  methods: {
    /**
     * 파일 목록을 서버에서 가져오는 메서드 (구현 예정)
     */
    fetchFiles() {
      console.log('[FileManagementView] fetchFiles 호출됨 - 구현 예정');
      console.log('검색 조건:', this.searchParams);
      console.log('정렬 옵션:', this.sortOption);
      console.log('페이징:', this.pagination);
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.file.getList({
      //   ...this.searchParams,
      //   sort: this.sortOption,
      //   page: this.pagination.currentPage,
      //   size: this.pagination.pageSize
      // })
    },

    /**
     * 파일 검색 실행
     */
    searchFiles() {
      console.log('[FileManagementView] 파일 검색 실행:', this.searchParams);
      this.pagination.currentPage = 1;
      this.fetchFiles();
    },

    /**
     * 파일 목록 새로고침
     */
    refreshFileList() {
      console.log('[FileManagementView] 파일 목록 새로고침');
      this.fetchFiles();
    },

    /**
     * 정렬 옵션 변경 처리
     */
    handleSortChange() {
      console.log('[FileManagementView] 정렬 변경:', this.sortOption);
      this.fetchFiles();
    },

    /**
     * 페이지 크기 변경 처리
     */
    handleSizeChange(newSize) {
      console.log('[FileManagementView] 페이지 크기 변경:', newSize);
      this.pagination.pageSize = newSize;
      this.pagination.currentPage = 1;
      this.fetchFiles();
    },

    /**
     * 현재 페이지 변경 처리
     */
    handleCurrentChange(newPage) {
      console.log('[FileManagementView] 페이지 변경:', newPage);
      this.pagination.currentPage = newPage;
      this.fetchFiles();
    },

    /**
     * 파일 업로드 전 검사
     */
    beforeFileUpload(file) {
      console.log('[FileManagementView] 파일 업로드 전 검사:', file.name);
      
      // 파일 크기 검사 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.$message.error('파일 크기는 10MB를 초과할 수 없습니다');
        return false;
      }
      
      return true;
    },

    /**
     * 파일 업로드 성공 처리
     */
    handleUploadSuccess(response, file) {
      console.log('[FileManagementView] 파일 업로드 성공:', response);
      this.$message.success(`${file.name} 업로드 완료`);
      this.refreshFileList();
    },

    /**
     * 파일 선택 (그리드 모드)
     */
    selectFile(file) {
      const index = this.selectedFiles.indexOf(file.id);
      if (index > -1) {
        this.selectedFiles.splice(index, 1);
      } else {
        this.selectedFiles.push(file.id);
      }
      console.log('[FileManagementView] 선택된 파일들:', this.selectedFiles);
    },

    /**
     * 파일 선택 변경 (리스트 모드)
     */
    handleSelectionChange(selection) {
      this.selectedFiles = selection.map(file => file.id);
      console.log('[FileManagementView] 선택 변경:', this.selectedFiles);
    },

    /**
     * 테이블 행 클릭 처리
     */
    handleRowClick(row) {
      console.log('[FileManagementView] 파일 클릭:', row.name);
      // 더블클릭으로 다운로드하거나 미리보기 실행 가능
    },

    /**
     * 파일 액션 처리
     */
    handleFileAction(command) {
      const { action, file } = command;
      console.log(`[FileManagementView] 파일 액션: ${action}`, file.name);
      
      switch (action) {
        case 'download':
          this.downloadFile(file);
          break;
        case 'preview':
          this.previewFile(file);
          break;
        case 'share':
          this.shareFile(file);
          break;
        case 'move':
          this.moveFile(file);
          break;
        case 'rename':
          this.renameFile(file);
          break;
        case 'delete':
          this.deleteFile(file);
          break;
      }
    },

    /**
     * 파일 다운로드
     */
    downloadFile(file) {
      console.log('[FileManagementView] 파일 다운로드:', file.name);
      // 실제 구현 시 사용할 다운로드 로직
      // this.$api.file.download(file.id)
      this.$message.success(`${file.name} 다운로드를 시작합니다`);
    },

    /**
     * 파일 미리보기
     */
    previewFile(file) {
      console.log('[FileManagementView] 파일 미리보기:', file.name);
      this.previewFile = file;
      this.previewVisible = true;
      
      // 실제 구현 시에는 파일 내용을 로드
      // if (file.isText) {
      //   this.$api.file.getContent(file.id).then(content => {
      //     this.previewFile.content = content;
      //   });
      // }
    },

    /**
     * 미리보기 닫기
     */
    closePreview() {
      this.previewVisible = false;
      this.previewFile = null;
    },

    /**
     * 파일 공유
     */
    shareFile(file) {
      console.log('[FileManagementView] 파일 공유:', file.name);
      // 실제 구현 시 공유 다이얼로그 표시
      this.$message.info('파일 공유 기능은 구현 예정입니다');
    },

    /**
     * 파일 이동
     */
    moveFile(file) {
      console.log('[FileManagementView] 파일 이동:', file.name);
      // 실제 구현 시 폴더 선택 다이얼로그 표시
      this.$message.info('파일 이동 기능은 구현 예정입니다');
    },

    /**
     * 파일 이름 변경
     */
    renameFile(file) {
      console.log('[FileManagementView] 파일 이름 변경:', file.name);
      this.$prompt('새 파일명을 입력하세요', '파일명 변경', {
        confirmButtonText: '변경',
        cancelButtonText: '취소',
        inputValue: file.name,
        inputPattern: /^.+$/,
        inputErrorMessage: '파일명을 입력하세요'
      }).then(({ value }) => {
        console.log('[FileManagementView] 새 파일명:', value);
        // 실제 구현 시 API 호출
        // this.$api.file.rename(file.id, value)
        this.$message.success('파일명이 변경되었습니다');
      }).catch(() => {
        console.log('[FileManagementView] 파일명 변경 취소됨');
      });
    },

    /**
     * 파일 삭제
     */
    deleteFile(file) {
      this.$confirm(`${file.name} 파일을 삭제하시겠습니까?`, '파일 삭제', {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        console.log('[FileManagementView] 파일 삭제:', file.name);
        // 실제 구현 시 사용할 삭제 API
        // this.$api.file.delete(file.id)
        this.$message.success('파일이 삭제되었습니다');
        this.refreshFileList();
      }).catch(() => {
        console.log('[FileManagementView] 파일 삭제 취소됨');
      });
    },

    /**
     * 파일 확장자에 따른 아이콘 반환
     */
    getFileIcon(extension) {
      const iconMap = {
        'pdf': 'el-icon-document',
        'doc': 'el-icon-document',
        'docx': 'el-icon-document',
        'xls': 'el-icon-s-grid',
        'xlsx': 'el-icon-s-grid',
        'ppt': 'el-icon-picture-outline',
        'pptx': 'el-icon-picture-outline',
        'txt': 'el-icon-document',
        'md': 'el-icon-document',
        'jpg': 'el-icon-picture',
        'jpeg': 'el-icon-picture',
        'png': 'el-icon-picture',
        'gif': 'el-icon-picture',
        'mp4': 'el-icon-video-camera',
        'avi': 'el-icon-video-camera',
        'mp3': 'el-icon-headset',
        'wav': 'el-icon-headset',
        'zip': 'el-icon-folder',
        'rar': 'el-icon-folder'
      };
      return iconMap[extension.toLowerCase()] || 'el-icon-document';
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
/* 파일 관리 페이지 스타일링 */

.file-management {
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

.control-card {
  margin-bottom: 20px;
}

.control-area {
  padding: 10px 0;
}

.file-list-card {
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
  align-items: center;
}

/* 그리드 뷰 스타일 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.file-card {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.file-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.file-card.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.file-thumbnail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  margin-bottom: 10px;
  background-color: #fafbfc;
  border-radius: 6px;
}

.thumbnail-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #c0c4cc;
  font-size: 24px;
}

.file-icon {
  font-size: 36px;
  color: #909399;
}

.file-info {
  text-align: center;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #7f8c8d;
}

.file-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.file-card:hover .file-actions {
  opacity: 1;
}

/* 리스트 뷰 스타일 */
.file-list {
  margin: 10px 0;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon-small {
  font-size: 18px;
  color: #909399;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 통계 카드 스타일 */
.file-statistics {
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

/* 미리보기 스타일 */
.preview-container {
  max-height: 600px;
  overflow: auto;
}

.image-preview {
  text-align: center;
}

.text-preview {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  max-height: 400px;
  overflow: auto;
}

.text-preview pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #2c3e50;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.unsupported-preview {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.unsupported-preview i {
  font-size: 48px;
  margin-bottom: 15px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .file-management {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .control-area ::v-deep .el-col {
    margin-bottom: 10px;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .file-statistics ::v-deep .el-col {
    margin-bottom: 15px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>