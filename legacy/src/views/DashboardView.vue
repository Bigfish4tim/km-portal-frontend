<!-- ==============================================
📁 src/views/DashboardView.vue
대시보드 페이지
============================================== -->

<template>
  <div class="dashboard-view">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1>대시보드</h1>
      <p>시스템 현황 및 주요 지표를 확인하세요</p>
    </div>

    <!-- 통계 카드 섹션 -->
    <div class="stats-section">
      <div class="stats-grid">
        <el-card
          v-for="stat in stats"
          :key="stat.id"
          class="stat-card"
          shadow="hover"
        >
          <div class="stat-content">
            <div class="stat-icon" :style="{ color: stat.color }">
              <el-icon :size="32">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stat.value }}</h3>
              <p>{{ stat.label }}</p>
            </div>
          </div>
          <div class="stat-trend" :class="stat.trend.type">
            <el-icon>
              <component :is="stat.trend.icon" />
            </el-icon>
            <span>{{ stat.trend.value }}</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 차트 및 활동 섹션 -->
    <div class="content-section">
      <el-row :gutter="24">
        <!-- 최근 게시글 -->
        <el-col :lg="12" :md="24">
          <el-card class="content-card" header="최근 게시글">
            <div class="recent-posts">
              <div 
                v-for="post in recentPosts"
                :key="post.id"
                class="post-item"
                @click="goToPost(post.id)"
              >
                <div class="post-info">
                  <h4>{{ post.title }}</h4>
                  <p>{{ post.author }} · {{ formatDate(post.createdAt) }}</p>
                </div>
                <el-tag :type="post.category === '공지' ? 'danger' : 'info'" size="small">
                  {{ post.category }}
                </el-tag>
              </div>
              
              <div v-if="recentPosts.length === 0" class="no-posts">
                <el-empty description="최근 게시글이 없습니다." />
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 시스템 정보 -->
        <el-col :lg="12" :md="24">
          <el-card class="content-card" header="시스템 정보">
            <div class="system-info">
              <div class="info-item">
                <span class="label">서버 상태:</span>
                <el-tag type="success">정상</el-tag>
              </div>
              <div class="info-item">
                <span class="label">데이터베이스:</span>
                <el-tag type="success">연결됨</el-tag>
              </div>
              <div class="info-item">
                <span class="label">마지막 백업:</span>
                <span>{{ lastBackupTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">서버 시간:</span>
                <span>{{ currentTime }}</span>
              </div>
            </div>

            <!-- 시스템 액션 버튼들 (관리자만) -->
            <div v-if="isAdmin" class="system-actions">
              <el-button size="small" @click="checkSystemHealth">
                시스템 점검
              </el-button>
              <el-button size="small" @click="viewSystemLogs">
                로그 보기
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 빠른 액션 버튼들 -->
    <div class="quick-actions">
      <el-button type="primary" @click="goToBoard">
        게시글 작성
      </el-button>
      <el-button @click="goToFiles">
        파일 업로드
      </el-button>
      <el-button v-if="isManager" @click="goToUserManagement">
        사용자 관리
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, Document, Upload, TrendCharts,
  ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

export default {
  name: 'DashboardView',
  components: {
    User, Document, Upload, TrendCharts,
    ArrowUp, ArrowDown
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    // 반응형 데이터
    const currentTime = ref('')
    const timeInterval = ref(null)
    const recentPosts = ref([])

    // 계산된 속성
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    const isManager = computed(() => store.getters['auth/isManager'])

    // 통계 데이터 (임시)
    const stats = computed(() => [
      {
        id: 'users',
        label: '전체 사용자',
        value: '387',
        color: '#409EFF',
        icon: 'User',
        trend: {
          type: 'positive',
          icon: 'ArrowUp',
          value: '+12 이번 달'
        }
      },
      {
        id: 'posts',
        label: '총 게시글',
        value: '1,247',
        color: '#67C23A',
        icon: 'Document',
        trend: {
          type: 'positive',
          icon: 'ArrowUp',
          value: '+38 이번 주'
        }
      },
      {
        id: 'files',
        label: '업로드된 파일',
        value: '2,891',
        color: '#E6A23C',
        icon: 'Upload',
        trend: {
          type: 'positive',
          icon: 'ArrowUp',
          value: '+156 이번 달'
        }
      },
      {
        id: 'activity',
        label: '일일 활성 사용자',
        value: '234',
        color: '#F56C6C',
        icon: 'TrendCharts',
        trend: {
          type: 'negative',
          icon: 'ArrowDown',
          value: '-5 어제 대비'
        }
      }
    ])

    const lastBackupTime = computed(() => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      return yesterday.toLocaleString('ko-KR')
    })

    // 메서드들
    const updateCurrentTime = () => {
      currentTime.value = new Date().toLocaleString('ko-KR')
    }

    const loadRecentPosts = () => {
      // 임시 데이터 (추후 API에서 로드)
      recentPosts.value = [
        {
          id: 1,
          title: 'KM 포털 시스템 업데이트 안내',
          author: '시스템 관리자',
          category: '공지',
          createdAt: new Date()
        },
        {
          id: 2,
          title: '월간 회의 일정 안내',
          author: '김철수',
          category: '일반',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 3,
          title: '새로운 프로젝트 팀 구성',
          author: '이영희',
          category: '업무',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
      ]
    }

    const formatDate = (date) => {
      const now = new Date()
      const diff = now - date
      const hours = Math.floor(diff / (1000 * 60 * 60))
      
      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `${minutes}분 전`
      } else if (hours < 24) {
        return `${hours}시간 전`
      } else {
        return date.toLocaleDateString('ko-KR')
      }
    }

    const goToPost = (postId) => {
      router.push(`/board/${postId}`)
    }

    const goToBoard = () => {
      router.push('/board/create')
    }

    const goToFiles = () => {
      router.push('/files')
    }

    const goToUserManagement = () => {
      router.push('/admin/users')
    }

    const checkSystemHealth = async () => {
      try {
        // 헬스체크 API 호출 (임시)
        ElMessage.info('시스템 점검을 시작합니다...')
        
        // 실제로는 API 호출
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        ElMessage.success('시스템이 정상적으로 작동 중입니다.')
      } catch (error) {
        ElMessage.error('시스템 점검 중 오류가 발생했습니다.')
      }
    }

    const viewSystemLogs = () => {
      ElMessage.info('시스템 로그 기능은 개발 중입니다.')
    }

    // 라이프사이클
    onMounted(() => {
      updateCurrentTime()
      timeInterval.value = setInterval(updateCurrentTime, 1000)
      loadRecentPosts()
      
      // 환영 메시지
      if (currentUser.value) {
        store.dispatch('ui/showInfo', '대시보드에 오신 것을 환영합니다!')
      }
    })

    onUnmounted(() => {
      if (timeInterval.value) {
        clearInterval(timeInterval.value)
      }
    })

    return {
      // 반응형 데이터
      currentTime,
      recentPosts,
      
      // 계산된 속성
      currentUser,
      isAdmin,
      isManager,
      stats,
      lastBackupTime,
      
      // 메서드
      formatDate,
      goToPost,
      goToBoard,
      goToFiles,
      goToUserManagement,
      checkSystemHealth,
      viewSystemLogs
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-view {
  max-width: 1200px;
  margin: 0 auto;

  // 페이지 헤더
  .page-header {
    margin-bottom: 32px;

    h1 {
      font-size: 28px;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    p {
      color: var(--el-text-color-regular);
      margin: 0;
    }
  }

  // 통계 섹션
  .stats-section {
    margin-bottom: 32px;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;

          .stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: var(--el-fill-color-lighter);
          }

          .stat-info {
            h3 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 4px 0;
              color: var(--el-text-color-primary);
            }

            p {
              color: var(--el-text-color-regular);
              margin: 0;
              font-size: 14px;
            }
          }
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.positive {
            color: var(--el-color-success);
          }

          &.negative {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }

  // 콘텐츠 섹션
  .content-section {
    margin-bottom: 32px;

    .content-card {
      height: 400px;

      .recent-posts {
        .post-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background: var(--el-fill-color-lighter);
            margin: 0 -16px;
            padding: 12px 16px;
            border-radius: 6px;
          }

          &:last-child {
            border-bottom: none;
          }

          .post-info {
            flex: 1;

            h4 {
              margin: 0 0 4px 0;
              color: var(--el-text-color-primary);
              font-size: 14px;
            }

            p {
              margin: 0;
              color: var(--el-text-color-secondary);
              font-size: 12px;
            }
          }
        }

        .no-posts {
          text-align: center;
          padding: 40px 0;
        }
      }

      .system-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
        }
      }

      .system-actions {
        margin-top: 20px;
        display: flex;
        gap: 8px;
      }
    }
  }

  // 빠른 액션
  .quick-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  // 반응형 디자인
  @media (max-width: 768px) {
    .stats-section .stats-grid {
      grid-template-columns: 1fr;
    }

    .content-section .content-card {
      margin-bottom: 20px;
    }

    .quick-actions {
      flex-direction: column;
    }
  }
}
</style>