<!-- ==============================================
📁 src/views/HomeView.vue
홈페이지 - 3일차 업데이트
============================================== -->

<template>
  <div class="home-view">
    <!-- 환영 메시지 섹션 -->
    <div class="welcome-section">
      <el-card class="welcome-card" shadow="hover">
        <div class="welcome-content">
          <h1 class="welcome-title">
            안녕하세요, {{ currentUser?.fullName }}님! 👋
          </h1>
          <p class="welcome-message">
            KM 포털에 오신 것을 환영합니다. 
            <br>
            오늘도 좋은 하루 되세요!
          </p>
          <div class="user-info">
            <el-tag type="primary">{{ currentUser?.department }}</el-tag>
            <el-tag type="success">{{ currentUser?.position }}</el-tag>
          </div>
        </div>
        <div class="welcome-actions">
          <el-button type="primary" @click="goToDashboard">
            대시보드 보기
          </el-button>
          <el-button @click="goToBoard">
            게시판 보기
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 빠른 액션 섹션 -->
    <div class="quick-actions-section">
      <h2 class="section-title">빠른 작업</h2>
      <div class="actions-grid">
        <el-card 
          v-for="action in quickActions" 
          :key="action.id"
          class="action-card"
          shadow="hover"
          @click="handleActionClick(action)"
        >
          <div class="action-content">
            <el-icon :size="32" :color="action.color">
              <component :is="action.icon" />
            </el-icon>
            <h3>{{ action.title }}</h3>
            <p>{{ action.description }}</p>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 최근 활동 섹션 -->
    <div class="recent-activity-section">
      <h2 class="section-title">최근 활동</h2>
      <el-card class="activity-card">
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="activity.timestamp"
            :color="activity.color"
          >
            <div class="activity-item">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <div v-if="recentActivities.length === 0" class="no-activity">
          <el-empty description="최근 활동이 없습니다." />
        </div>
      </el-card>
    </div>

    <!-- API 연결 테스트 섹션 (개발 단계용) -->
    <div class="test-section" v-if="isDevelopment">
      <h2 class="section-title">🔧 개발 테스트</h2>
      <el-card class="test-card">
        <div class="test-actions">
          <el-button 
            type="primary" 
            @click="testHealthCheck"
            :loading="testLoading"
          >
            헬스체크 테스트
          </el-button>
          <el-button 
            type="success" 
            @click="testDetailHealthCheck"
            :loading="testLoading"
          >
            상세 헬스체크 테스트
          </el-button>
          <el-button 
            type="info" 
            @click="testPostApi"
            :loading="testLoading"
          >
            POST API 테스트
          </el-button>
        </div>
        
        <div v-if="testResult" class="test-result">
          <h4>테스트 결과:</h4>
          <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Dashboard, Document, Upload, User, 
  Setting, ChatDotSquare 
} from '@element-plus/icons-vue'
import { api } from '@/services/api'

export default {
  name: 'HomeView',
  components: {
    Dashboard, Document, Upload, User, 
    Setting, ChatDotSquare
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    // 반응형 데이터
    const testLoading = ref(false)
    const testResult = ref(null)
    const recentActivities = ref([])

    // 계산된 속성
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // 빠른 액션 메뉴
    const quickActions = computed(() => [
      {
        id: 'dashboard',
        title: '대시보드',
        description: '시스템 현황 확인',
        icon: 'Dashboard',
        color: '#409EFF',
        route: '/dashboard'
      },
      {
        id: 'board',
        title: '게시글 작성',
        description: '새로운 게시글 작성',
        icon: 'Document',
        color: '#67C23A',
        route: '/board/create'
      },
      {
        id: 'files',
        title: '파일 업로드',
        description: '파일 업로드 및 관리',
        icon: 'Upload',
        color: '#E6A23C',
        route: '/files'
      },
      {
        id: 'profile',
        title: '내 정보',
        description: '개인정보 수정',
        icon: 'User',
        color: '#F56C6C',
        route: '/mypage'
      }
    ])

    // 메서드들
    const goToDashboard = () => {
      router.push('/dashboard')
    }

    const goToBoard = () => {
      router.push('/board')
    }

    const handleActionClick = (action) => {
      router.push(action.route)
    }

    // API 테스트 함수들 (개발 단계용)
    const testHealthCheck = async () => {
      testLoading.value = true
      testResult.value = null
      
      try {
        const response = await api.get('/health')
        testResult.value = response.data
        ElMessage.success('헬스체크 테스트 성공!')
      } catch (error) {
        testResult.value = { error: error.message }
        ElMessage.error('헬스체크 테스트 실패!')
      } finally {
        testLoading.value = false
      }
    }

    const testDetailHealthCheck = async () => {
      testLoading.value = true
      testResult.value = null
      
      try {
        const response = await api.get('/health/detail')
        testResult.value = response.data
        ElMessage.success('상세 헬스체크 테스트 성공!')
      } catch (error) {
        testResult.value = { error: error.message }
        ElMessage.error('상세 헬스체크 테스트 실패!')
      } finally {
        testLoading.value = false
      }
    }

    const testPostApi = async () => {
      testLoading.value = true
      testResult.value = null
      
      try {
        const response = await api.post('/health/test', {
          message: 'Hello from Frontend!',
          timestamp: new Date().toISOString(),
          user: currentUser.value?.username
        })
        testResult.value = response.data
        ElMessage.success('POST API 테스트 성공!')
      } catch (error) {
        testResult.value = { error: error.message }
        ElMessage.error('POST API 테스트 실패!')
      } finally {
        testLoading.value = false
      }
    }

    // 최근 활동 로드 (임시 데이터)
    const loadRecentActivities = () => {
      recentActivities.value = [
        {
          id: 1,
          title: 'KM 포털에 로그인했습니다',
          description: '새로운 세션이 시작되었습니다.',
          timestamp: new Date().toLocaleString('ko-KR'),
          color: '#409EFF'
        }
      ]
    }

    // 라이프사이클
    onMounted(() => {
      loadRecentActivities()
      
      // 환영 메시지 표시
      if (currentUser.value) {
        store.dispatch('ui/showSuccess', 
          `환영합니다, ${currentUser.value.fullName}님!`
        )
      }
    })

    return {
      // 반응형 데이터
      testLoading,
      testResult,
      recentActivities,
      
      // 계산된 속성
      currentUser,
      isDevelopment,
      quickActions,
      
      // 메서드
      goToDashboard,
      goToBoard,
      handleActionClick,
      testHealthCheck,
      testDetailHealthCheck,
      testPostApi
    }
  }
}
</script>

<style lang="scss" scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;

  // 환영 섹션
  .welcome-section {
    margin-bottom: 32px;

    .welcome-card {
      .welcome-content {
        .welcome-title {
          font-size: 28px;
          margin-bottom: 12px;
          color: var(--el-text-color-primary);
        }

        .welcome-message {
          font-size: 16px;
          color: var(--el-text-color-regular);
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .user-info {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
      }

      .welcome-actions {
        display: flex;
        gap: 12px;
      }
    }
  }

  // 빠른 액션 섹션
  .quick-actions-section {
    margin-bottom: 32px;

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;

      .action-card {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .action-content {
          text-align: center;

          h3 {
            margin: 12px 0 8px;
            color: var(--el-text-color-primary);
          }

          p {
            color: var(--el-text-color-regular);
            font-size: 14px;
            margin: 0;
          }
        }
      }
    }
  }

  // 최근 활동 섹션
  .recent-activity-section {
    margin-bottom: 32px;

    .activity-card {
      .activity-item {
        h4 {
          margin: 0 0 4px;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0;
          color: var(--el-text-color-regular);
          font-size: 14px;
        }
      }

      .no-activity {
        text-align: center;
        padding: 40px 0;
      }
    }
  }

  // 테스트 섹션
  .test-section {
    margin-bottom: 32px;

    .test-card {
      .test-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .test-result {
        background: var(--el-fill-color-lighter);
        padding: 16px;
        border-radius: 6px;
        border: 1px solid var(--el-border-color);

        h4 {
          margin: 0 0 12px;
          color: var(--el-text-color-primary);
        }

        pre {
          background: var(--el-bg-color-page);
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
          margin: 0;
          border: 1px solid var(--el-border-color-light);
        }
      }
    }
  }

  // 공통 섹션 제목
  .section-title {
    font-size: 20px;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  // 반응형 디자인
  @media (max-width: 768px) {
    .welcome-section .welcome-card .welcome-actions {
      flex-direction: column;
    }

    .quick-actions-section .actions-grid {
      grid-template-columns: 1fr;
    }

    .test-section .test-card .test-actions {
      flex-direction: column;
    }
  }
}
</style>