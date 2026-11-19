<template>
  <div class="dashboard">
    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <p>통계 데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 메시지 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="error-alert"
    >
      <template #default>
        <el-button type="primary" size="small" @click="loadStatistics">
          <el-icon><Refresh /></el-icon>
          다시 시도
        </el-button>
      </template>
    </el-alert>

    <!-- 헤더 섹션 -->
    <div class="dashboard-header">
      <el-card shadow="never" class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">
              안녕하세요, {{ currentUser?.fullName || currentUser?.username }}님!
            </h1>
            <p class="welcome-subtitle">
              KM 포털에 오신 것을 환영합니다. 시스템 현황을 한눈에 확인하세요.
            </p>
          </div>
          <div class="welcome-badge">
            <el-tag 
              :type="roleTagType" 
              size="large"
              class="role-tag"
            >
              {{ roleDisplayName }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 통계 카드 섹션 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <!-- 총 사용자 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div v-if="loading" class="stat-skeleton">
              <el-skeleton :rows="1" animated />
            </div>
            <div v-else class="stat-content">
              <div class="stat-icon users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ statistics.userCount }}</h3>
                <p class="stat-label">총 사용자</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 총 게시글 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div v-if="loading" class="stat-skeleton">
              <el-skeleton :rows="1" animated />
            </div>
            <div v-else class="stat-content">
              <div class="stat-icon boards">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ statistics.boardCount }}</h3>
                <p class="stat-label">총 게시글</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 총 댓글 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div v-if="loading" class="stat-skeleton">
              <el-skeleton :rows="1" animated />
            </div>
            <div v-else class="stat-content">
              <div class="stat-icon comments">
                <el-icon><ChatLineRound /></el-icon>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ statistics.commentCount }}</h3>
                <p class="stat-label">총 댓글</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 총 파일 -->
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div v-if="loading" class="stat-skeleton">
              <el-skeleton :rows="1" animated />
            </div>
            <div v-else class="stat-content">
              <div class="stat-icon files">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ statistics.fileCount }}</h3>
                <p class="stat-label">총 파일</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 최근 활동 섹션 -->
    <div class="activity-section">
      <el-row :gutter="20">
        <!-- 최근 게시글 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="activity-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Document /></el-icon>
                  최근 게시글
                </span>
                <el-button
                  text
                  @click="loadStatistics"
                  :loading="loading"
                  size="small"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="5" animated />
            </div>
            
            <div v-else-if="recentBoards.length === 0" class="empty-container">
              <el-empty description="최근 게시글이 없습니다" :image-size="100" />
            </div>
            
            <div v-else class="activity-list">
              <div 
                v-for="board in recentBoards" 
                :key="board.id" 
                class="activity-item"
                @click="goToBoard(board.id)"
              >
                <div class="activity-title">{{ board.title }}</div>
                <div class="activity-meta">
                  <span class="activity-author">
                    <el-icon><User /></el-icon>
                    {{ board.authorName }}
                  </span>
                  <span class="activity-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(board.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 최근 댓글 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="activity-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><ChatLineRound /></el-icon>
                  최근 댓글
                </span>
                <el-button
                  text
                  @click="loadStatistics"
                  :loading="loading"
                  size="small"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="5" animated />
            </div>
            
            <div v-else-if="recentComments.length === 0" class="empty-container">
              <el-empty description="최근 댓글이 없습니다" :image-size="100" />
            </div>
            
            <div v-else class="activity-list">
              <div 
                v-for="comment in recentComments" 
                :key="comment.id" 
                class="activity-item"
                @click="goToBoard(comment.boardId)"
              >
                <div class="activity-content">{{ truncate(comment.content, 50) }}</div>
                <div class="activity-meta">
                  <span class="activity-author">
                    <el-icon><User /></el-icon>
                    {{ comment.authorName }}
                  </span>
                  <span class="activity-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 정보 섹션 -->
    <div class="info-section">
      <el-row :gutter="20">
        <!-- 사용자 정보 카드 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="info-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><User /></el-icon>
                  사용자 정보
                </span>
              </div>
            </template>
            
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">사용자 ID:</span>
                <span class="info-value">{{ currentUser?.userId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">사용자명:</span>
                <span class="info-value">{{ currentUser?.username }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">이메일:</span>
                <span class="info-value">{{ currentUser?.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">부서:</span>
                <span class="info-value">{{ currentUser?.department }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">권한:</span>
                <div class="roles-container">
                  <el-tag 
                    v-for="role in userRoles" 
                    :key="role" 
                    class="role-tag-small"
                    :type="getRoleTagType(role)"
                    size="small"
                  >
                    {{ getRoleDisplayName(role) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 시스템 정보 카드 -->
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="info-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Monitor /></el-icon>
                  시스템 정보
                </span>
              </div>
            </template>
            
            <div class="system-info">
              <div class="info-row">
                <span class="info-label">애플리케이션:</span>
                <span class="info-value">{{ appVersion }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">환경:</span>
                <el-tag :type="isDevelopment ? 'warning' : 'success'" size="small">
                  {{ isDevelopment ? '개발 환경' : '프로덕션 환경' }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">네트워크:</span>
                <el-tag :type="isOnline ? 'success' : 'danger'" size="small">
                  {{ isOnline ? '온라인' : '오프라인' }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">로그인 시간:</span>
                <span class="info-value">{{ formattedLoginTime }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">JWT 상태:</span>
                <el-tag type="success" size="small">활성</el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 빠른 액션 버튼 -->
    <div class="actions-section">
      <el-card shadow="hover" class="actions-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Operation /></el-icon>
              빠른 작업
            </span>
          </div>
        </template>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            :icon="Refresh"
            @click="loadStatistics"
            :loading="loading"
          >
            통계 새로고침
          </el-button>
          
          <el-button 
            type="success" 
            :icon="CircleCheck"
            @click="testApiConnection"
          >
            API 연결 테스트
          </el-button>
          
          <el-button 
            type="warning" 
            :icon="SwitchButton"
            @click="handleLogout"
          >
            로그아웃
          </el-button>

          <el-button 
            v-if="isDevelopment"
            type="info" 
            :icon="View"
            @click="openH2Console"
          >
            H2 콘솔 열기
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
/**
 * 대시보드 메인 페이지 컴포넌트 (32일차 개선 버전)
 * 
 * 사용자가 로그인 후 첫 번째로 보는 메인 페이지입니다.
 * 실제 백엔드 통계 데이터를 표시하며, 최근 활동 내역을 확인할 수 있습니다.
 * 
 * 주요 기능:
 * - 사용자 환영 메시지 및 기본 정보 표시
 * - 실시간 시스템 통계 (사용자, 게시글, 댓글, 파일)
 * - 최근 게시글 5개 표시 (클릭 시 해당 게시글로 이동)
 * - 최근 댓글 5개 표시 (클릭 시 해당 게시글로 이동)
 * - 로딩 상태 및 에러 처리
 * - 통계 새로고침 기능
 * 
 * 작성일: 2025년 11월 25일 (32일차)
 * 작성자: 32일차 개발 담당자
 * 
 * @author KM Portal Dev Team
 * @version 2.0
 * @since 2025-11-25
 */

import { mapGetters, mapActions } from 'vuex'
import { getDashboardStatistics } from '@/services/statisticsApi'
import {
  User,
  Document,
  ChatLineRound,
  Folder,
  Refresh,
  Clock,
  Monitor,
  Operation,
  CircleCheck,
  SwitchButton,
  View,
  Loading
} from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  
  components: {
    User,
    Document,
    ChatLineRound,
    Folder,
    Refresh,
    Clock,
    Monitor,
    Operation,
    CircleCheck,
    SwitchButton,
    View,
    Loading
  },
  
  data() {
    return {
      // 로딩 상태
      loading: false,
      
      // 통계 데이터
      statistics: {
        userCount: 0,
        boardCount: 0,
        commentCount: 0,
        fileCount: 0
      },
      
      // 최근 활동
      recentBoards: [],
      recentComments: [],
      
      // 에러 상태
      error: null
    }
  },

  computed: {
    ...mapGetters([
      'isDevelopment',
      'isOnline'
    ]),
    
    ...mapGetters('auth', {
      currentUser: 'user',
      userRoles: 'roles',
      isAuthenticated: 'isAuthenticated'
    }),
    
    roleDisplayName() {
      if (!this.userRoles || this.userRoles.length === 0) return 'GUEST'
      return this.userRoles[0]
    },
    
    roleTagType() {
      const role = this.roleDisplayName
      if (role === 'ADMIN') return 'danger'
      if (role === 'MANAGER') return 'warning'
      return 'info'
    },
    
    appVersion() {
      return 'KM Portal v1.0.0 (32일차)'
    },
    
    formattedLoginTime() {
      return new Date().toLocaleString('ko-KR')
    }
  },

  async mounted() {
    // 컴포넌트 마운트 시 통계 데이터 로드
    await this.loadStatistics()
  },

  methods: {
    ...mapActions('auth', ['logout']),
    
    /**
     * 통계 데이터 로드
     * 
     * 백엔드 API를 호출하여 대시보드 통계 데이터를 가져옵니다.
     * 한 번의 API 호출로 모든 데이터를 가져와 효율성을 높입니다.
     */
    async loadStatistics() {
      console.log('[Dashboard] 통계 데이터 로드 시작')
      
      this.loading = true
      this.error = null
      
      try {
        // 통합 대시보드 통계 API 호출
        const data = await getDashboardStatistics()
        
        // 통계 데이터 설정
        this.statistics = data.statistics
        
        // 최근 활동 설정
        this.recentBoards = data.recentBoards || []
        this.recentComments = data.recentComments || []
        
        console.log('[Dashboard] 통계 데이터 로드 성공')
        console.log('[Dashboard] 사용자:', this.statistics.userCount)
        console.log('[Dashboard] 게시글:', this.statistics.boardCount)
        console.log('[Dashboard] 댓글:', this.statistics.commentCount)
        console.log('[Dashboard] 파일:', this.statistics.fileCount)
        
        // 성공 메시지 (선택사항)
        // this.$message.success('통계 데이터를 불러왔습니다.')
        
      } catch (error) {
        console.error('[Dashboard] 통계 데이터 로드 실패:', error)
        
        this.error = '통계 데이터를 불러오는데 실패했습니다.'
        
        // 에러 메시지 표시
        this.$message.error('통계 데이터를 불러오는데 실패했습니다.')
        
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 게시글로 이동
     * 
     * @param {number} boardId - 게시글 ID
     */
    goToBoard(boardId) {
      this.$router.push(`/board/${boardId}`)
    },
    
    /**
     * 날짜 포맷팅
     * 
     * 상대적인 시간으로 표시 (예: "2시간 전", "3일 전")
     * 
     * @param {string} dateString - 날짜 문자열
     * @returns {string} 포맷된 날짜 문자열
     */
    formatDate(dateString) {
      if (!dateString) return '-'
      
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      // 1분 이내
      if (diff < 60 * 1000) {
        return '방금 전'
      }
      
      // 1시간 이내
      if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000))
        return `${minutes}분 전`
      }
      
      // 24시간 이내
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000))
        return `${hours}시간 전`
      }
      
      // 7일 이내
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000))
        return `${days}일 전`
      }
      
      // 그 외
      return date.toLocaleDateString('ko-KR')
    },
    
    /**
     * 텍스트 자르기
     * 
     * 긴 텍스트를 지정된 길이로 자르고 "..." 추가
     * 
     * @param {string} text - 원본 텍스트
     * @param {number} length - 최대 길이
     * @returns {string} 잘린 텍스트
     */
    truncate(text, length) {
      if (!text) return ''
      if (text.length <= length) return text
      return text.substring(0, length) + '...'
    },
    
    /**
     * 역할 표시 이름 가져오기
     * 
     * @param {string} role - 역할 코드
     * @returns {string} 역할 표시 이름
     */
    getRoleDisplayName(role) {
      const roleMap = {
        'ADMIN': '관리자',
        'MANAGER': '매니저',
        'USER': '일반 사용자'
      }
      return roleMap[role] || role
    },
    
    /**
     * 역할 태그 타입 가져오기
     * 
     * @param {string} role - 역할 코드
     * @returns {string} Element Plus 태그 타입
     */
    getRoleTagType(role) {
      if (role === 'ADMIN') return 'danger'
      if (role === 'MANAGER') return 'warning'
      return 'info'
    },
    
    /**
     * API 연결 테스트
     */
    async testApiConnection() {
      try {
        await this.loadStatistics()
        this.$message.success('API 연결 정상!')
      } catch (error) {
        this.$message.error('API 연결 실패')
      }
    },
    
    /**
     * 로그아웃 처리
     */
    async handleLogout() {
      try {
        await this.$confirm('로그아웃하시겠습니까?', '확인', {
          confirmButtonText: '로그아웃',
          cancelButtonText: '취소',
          type: 'warning'
        })
        
        await this.logout()
        this.$router.push('/login')
      } catch (error) {
        // 취소된 경우 무시
      }
    },
    
    /**
     * H2 콘솔 열기 (개발 모드)
     */
    openH2Console() {
      window.open('http://localhost:8080/h2-console', '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: #f5f7fa;

  /* 로딩 오버레이 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    
    .is-loading {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #606266;
    }
  }

  /* 에러 알림 */
  .error-alert {
    margin-bottom: 20px;
  }

  /* 헤더 섹션 */
  .dashboard-header {
    margin-bottom: 20px;

    .welcome-card {
      border: none;
      
      .welcome-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;

        .welcome-text {
          flex: 1;
          
          .welcome-title {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            line-height: 1.3;
          }

          .welcome-subtitle {
            margin: 0;
            color: #606266;
            font-size: 14px;
            line-height: 1.5;
          }
        }

        .welcome-badge {
          .role-tag {
            font-size: 14px;
            padding: 8px 16px;
            font-weight: 600;
            border-radius: 6px;
          }
        }
      }
    }
  }

  /* 통계 카드 섹션 */
  .stats-section {
    margin-bottom: 20px;

    .stat-card {
      height: 100%;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-skeleton {
        padding: 10px 0;
      }

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          flex-shrink: 0;

          &.users {
            background: rgba(64, 158, 255, 0.1);
            color: #409eff;
          }

          &.boards {
            background: rgba(103, 194, 58, 0.1);
            color: #67c23a;
          }

          &.comments {
            background: rgba(230, 162, 60, 0.1);
            color: #e6a23c;
          }

          &.files {
            background: rgba(245, 108, 108, 0.1);
            color: #f56c6c;
          }
        }

        .stat-info {
          flex: 1;
          min-width: 0;

          .stat-number {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            line-height: 1.2;
          }

          .stat-label {
            margin: 0;
            font-size: 13px;
            color: #909399;
            line-height: 1.2;
          }
        }
      }
    }
  }

  /* 최근 활동 섹션 */
  .activity-section {
    margin-bottom: 20px;

    .activity-card {
      height: 100%;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #303133;
          font-size: 16px;
        }
      }

      .loading-container {
        padding: 20px 0;
      }

      .empty-container {
        padding: 40px 0;
      }

      .activity-list {
        .activity-item {
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: all 0.2s ease;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: #f5f7fa;
            padding-left: 8px;
            padding-right: 8px;
            margin-left: -8px;
            margin-right: -8px;
            border-radius: 4px;
          }

          .activity-title,
          .activity-content {
            font-size: 14px;
            color: #303133;
            margin-bottom: 6px;
            font-weight: 500;
          }

          .activity-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: #909399;

            span {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .activity-author {
              color: #606266;
            }
          }
        }
      }
    }
  }

  /* 정보 카드 섹션 */
  .info-section {
    margin-bottom: 20px;

    .info-card {
      height: 100%;

      .card-header {
        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #303133;
          font-size: 16px;
        }
      }

      .user-info, .system-info {
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .info-label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
            flex-shrink: 0;
            margin-right: 12px;
          }

          .info-value {
            font-size: 14px;
            color: #303133;
            text-align: right;
            word-break: break-all;
          }

          .roles-container {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            justify-content: flex-end;

            .role-tag-small {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  /* 액션 버튼 섹션 */
  .actions-section {
    .actions-card {
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        
        .el-button {
          flex: 1;
          min-width: 140px;
        }
      }
    }
  }
}

/* 반응형 디자인 - 태블릿 */
@media (max-width: 768px) {
  .dashboard {
    padding: 15px;

    .dashboard-header {
      .welcome-content {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 16px;

        .welcome-text .welcome-title {
          font-size: 20px;
        }

        .welcome-badge {
          align-self: stretch;
          text-align: left;
        }
      }
    }

    .stats-section {
      .stat-card {
        margin-bottom: 15px;
      }
    }

    .activity-section {
      .activity-card {
        margin-bottom: 15px;
      }
    }

    .info-section {
      .info-card {
        margin-bottom: 15px;
      }
    }

    .actions-section {
      .action-buttons {
        justify-content: stretch;

        .el-button {
          flex: 1 1 calc(50% - 6px);
          min-width: auto;
        }
      }
    }
  }
}

/* 반응형 디자인 - 모바일 */
@media (max-width: 480px) {
  .dashboard {
    padding: 10px;

    .welcome-text .welcome-title {
      font-size: 18px;
    }

    .info-row {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 6px;

      .info-label {
        margin-right: 0 !important;
      }

      .info-value, .roles-container {
        text-align: left !important;
        justify-content: flex-start !important;
      }
    }

    .actions-section {
      .action-buttons {
        .el-button {
          flex: 1 1 100%;
        }
      }
    }
  }
}
</style>