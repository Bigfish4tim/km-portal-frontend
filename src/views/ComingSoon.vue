<!-- ==============================================
📁 src/views/ComingSoon.vue
준비 중 페이지 - 기존 프로젝트 스타일 완전 반영
============================================== -->

<template>
  <div class="coming-soon-view">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-icon">
        <el-icon :size="80" color="#E6A23C">
          <Tools />
        </el-icon>
      </div>
      <h1>서비스 준비 중입니다</h1>
      <p>더 나은 서비스를 제공하기 위해 열심히 개발하고 있습니다.</p>
    </div>

    <!-- 개발 진행 상황 -->
    <div class="progress-section">
      <el-card class="progress-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><TrendCharts /></el-icon>
              개발 진행 상황
            </span>
          </div>
        </template>

        <div class="progress-info">
          <div class="info-item">
            <span class="label">현재 단계:</span>
            <el-tag type="success">{{ currentPhase }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">진행률:</span>
            <span>{{ progressPercentage }}% 완료</span>
          </div>
          <div class="info-item">
            <span class="label">예상 완료일:</span>
            <span>{{ estimatedDate }}</span>
          </div>
        </div>

        <div class="progress-bar">
          <el-progress 
            :percentage="progressPercentage" 
            :color="progressColor"
            :stroke-width="12"
            text-inside
          />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </el-card>
    </div>

    <!-- 개발 예정 기능 -->
    <div class="features-section">
      <h2 class="section-title">개발 예정 기능</h2>
      <div class="features-grid">
        <el-card
          v-for="feature in upcomingFeatures"
          :key="feature.id"
          class="feature-card"
          shadow="hover"
        >
          <div class="feature-content">
            <div class="feature-icon" :style="{ color: feature.color }">
              <el-icon :size="32">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <div class="feature-info">
              <h3>{{ feature.name }}</h3>
              <p>{{ feature.description }}</p>
              <el-tag :type="getStatusType(feature.status)" size="small">
                {{ feature.status }}
              </el-tag>
            </div>
          </div>
          <div class="feature-timeline">
            <span class="timeline-text">{{ feature.timeline }}</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 현재 페이지 정보 -->
    <div class="page-info-section">
      <el-card class="info-card" shadow="hover">
        <el-alert
          title="페이지 정보"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="page-details">
              <p><strong>요청된 페이지:</strong> {{ $route.name || $route.path }}</p>
              <p><strong>현재 진행 단계:</strong> {{ currentDayInfo }}</p>
              <p><strong>다음 구현 예정:</strong> 사용자 관리 시스템 (6일차)</p>
            </div>
          </template>
        </el-alert>
      </el-card>
    </div>

    <!-- 액션 버튼들 -->
    <div class="actions-section">
      <div class="action-buttons">
        <el-button 
          type="primary" 
          @click="goToDashboard"
          :icon="House"
        >
          대시보드로 돌아가기
        </el-button>
        
        <el-button 
          @click="goBack"
          :icon="ArrowLeft"
        >
          이전 페이지
        </el-button>

        <el-button 
          type="info" 
          @click="requestNotification"
          :icon="Bell"
        >
          완성 알림 신청
        </el-button>

        <el-button 
          v-if="isDevelopment"
          type="warning" 
          @click="viewRoadmap"
          :icon="Document"
        >
          개발 로드맵 보기
        </el-button>
      </div>
    </div>

    <!-- 개발팀 정보 (개발 모드) -->
    <div v-if="isDevelopment" class="dev-info-section">
      <el-card class="dev-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Setting /></el-icon>
              개발팀 정보
            </span>
          </div>
        </template>

        <div class="dev-details">
          <div class="detail-item">
            <span class="label">프로젝트명:</span>
            <span>KM 업무 포털 시스템</span>
          </div>
          <div class="detail-item">
            <span class="label">개발 기간:</span>
            <span>47일 (입문자 최적화)</span>
          </div>
          <div class="detail-item">
            <span class="label">현재 진행:</span>
            <span>5일차 완료 (10.6%)</span>
          </div>
          <div class="detail-item">
            <span class="label">기술 스택:</span>
            <div class="tech-stack">
              <el-tag size="small">Vue 3</el-tag>
              <el-tag size="small" type="success">Spring Boot 3.5.5</el-tag>
              <el-tag size="small" type="warning">Element Plus</el-tag>
              <el-tag size="small" type="info">JWT</el-tag>
            </div>
          </div>
        </div>

        <div class="completed-features">
          <h4>✅ 완료된 주요 기능 (5일차)</h4>
          <ul>
            <li>JWT 기반 인증 시스템</li>
            <li>Spring Security 권한 제어</li>
            <li>Vue Router 가드</li>
            <li>Vuex 상태 관리</li>
            <li>자동 토큰 갱신</li>
            <li>에러 처리 시스템</li>
          </ul>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Tools, TrendCharts, House, ArrowLeft, Bell, Document, Setting,
  User, Upload, ChatDotSquare, PieChart
} from '@element-plus/icons-vue'

export default {
  name: 'ComingSoon',
  components: {
    Tools, TrendCharts, House, ArrowLeft, Bell, Document, Setting,
    User, Upload, ChatDotSquare, PieChart
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    // 반응형 데이터
    const progressPercentage = ref(35) // 현재 진행률
    const currentPhase = ref('JWT 인증 시스템 완료')

    // 계산된 속성
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')
    
    const estimatedDate = computed(() => {
      const date = new Date()
      date.setDate(date.getDate() + 14) // 2주 후
      return date.toLocaleDateString('ko-KR')
    })

    const progressColor = computed(() => {
      if (progressPercentage.value < 30) return '#E6A23C'
      if (progressPercentage.value < 70) return '#409EFF'
      return '#67C23A'
    })

    const progressText = computed(() => {
      return '기본 구조 완료, UI 구현 중...'
    })

    const currentDayInfo = computed(() => {
      return '5일차 완료 - JWT 인증 시스템 구축 (130% 달성)'
    })

    // 개발 예정 기능 목록
    const upcomingFeatures = ref([
      {
        id: 1,
        name: '사용자 관리',
        description: '사용자 CRUD, 권한 변경, 계정 관리',
        status: '개발 예정',
        timeline: '6-17일차',
        icon: 'User',
        color: '#409EFF'
      },
      {
        id: 2,
        name: '파일 관리',
        description: '파일 업로드, 다운로드, 검색 시스템',
        status: '설계 중',
        timeline: '18-23일차',
        icon: 'Upload',
        color: '#E6A23C'
      },
      {
        id: 3,
        name: '게시판 시스템',
        description: '게시글 작성, 댓글, 첨부파일',
        status: '계획 단계',
        timeline: '24-31일차',
        icon: 'ChatDotSquare',
        color: '#909399'
      },
      {
        id: 4,
        name: '대시보드',
        description: '통계, 차트, 실시간 알림',
        status: '계획 단계',
        timeline: '32-35일차',
        icon: 'PieChart',
        color: '#909399'
      }
    ])

    // 메서드들
    const getStatusType = (status) => {
      const statusTypes = {
        '개발 예정': 'warning',
        '개발 중': 'primary',
        '설계 중': 'info',
        '계획 단계': 'info',
        '완료': 'success'
      }
      return statusTypes[status] || 'info'
    }

    const goToDashboard = () => {
      router.push('/dashboard')
    }

    const goBack = () => {
      if (window.history.length > 1) {
        router.go(-1)
      } else {
        router.push('/dashboard')
      }
    }

    const requestNotification = async () => {
      try {
        await ElMessageBox.confirm(
          '개발 완료 시 이메일로 알림을 받으시겠습니까?',
          '알림 신청',
          {
            confirmButtonText: '신청',
            cancelButtonText: '취소',
            type: 'info'
          }
        )

        ElMessage({
          type: 'success',
          message: '완성 알림이 신청되었습니다! 개발 완료 시 알려드리겠습니다.',
          duration: 3000,
          showClose: true
        })

        // 실제 서비스에서는 서버에 알림 신청 요청
        console.log('알림 신청:', {
          feature: route.name || route.path,
          timestamp: new Date(),
          user: store.getters['auth/currentUser']?.username
        })

      } catch {
        // 사용자가 취소한 경우 (아무 동작 안함)
      }
    }

    const viewRoadmap = () => {
      ElMessage.info('개발 로드맵 페이지는 준비 중입니다.')
      // 향후 로드맵 페이지로 이동
      // router.push('/roadmap')
    }

    // 라이프사이클
    onMounted(() => {
      // 페이지 진입 로그
      console.log('[ComingSoon] 준비 중 페이지 진입:', route.path)
      
      // 환영 메시지 (선택적)
      if (store.getters['auth/isAuthenticated']) {
        setTimeout(() => {
          ElMessage({
            type: 'info',
            message: '해당 기능은 현재 개발 중입니다. 조금만 기다려 주세요!',
            duration: 2000
          })
        }, 500)
      }
    })

    return {
      // 반응형 데이터
      progressPercentage,
      currentPhase,
      upcomingFeatures,
      
      // 계산된 속성
      isDevelopment,
      estimatedDate,
      progressColor,
      progressText,
      currentDayInfo,
      
      // 메서드
      getStatusType,
      goToDashboard,
      goBack,
      requestNotification,
      viewRoadmap,
      
      // 아이콘들
      House,
      ArrowLeft,
      Bell,
      Document
    }
  }
}
</script>

<style lang="scss" scoped>
.coming-soon-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;

  // 페이지 헤더
  .page-header {
    text-align: center;
    margin-bottom: 40px;
    padding: 40px 0;

    .header-icon {
      margin-bottom: 20px;
    }

    h1 {
      font-size: 32px;
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    p {
      font-size: 16px;
      color: var(--el-text-color-regular);
      margin: 0;
      line-height: 1.6;
    }
  }

  // 진행 상황 섹션
  .progress-section {
    margin-bottom: 40px;

    .progress-card {
      .card-header {
        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .progress-info {
        margin-bottom: 24px;

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
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

      .progress-bar {
        .progress-text {
          text-align: center;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin: 8px 0 0 0;
        }
      }
    }
  }

  // 기능 섹션
  .features-section {
    margin-bottom: 40px;

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;

      .feature-card {
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
          transform: translateY(-2px);
        }

        .feature-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;

          .feature-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 8px;
            background: var(--el-fill-color-lighter);
            flex-shrink: 0;
          }

          .feature-info {
            flex: 1;

            h3 {
              margin: 0 0 8px 0;
              font-size: 16px;
              color: var(--el-text-color-primary);
              font-weight: 600;
            }

            p {
              margin: 0 0 12px 0;
              font-size: 14px;
              color: var(--el-text-color-regular);
              line-height: 1.5;
            }
          }
        }

        .feature-timeline {
          text-align: center;
          padding: 8px;
          background: var(--el-fill-color-extra-light);
          border-radius: 4px;

          .timeline-text {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
          }
        }
      }
    }
  }

  // 페이지 정보 섹션
  .page-info-section {
    margin-bottom: 40px;

    .info-card {
      .page-details {
        p {
          margin: 4px 0;
          line-height: 1.5;
        }
      }
    }
  }

  // 액션 버튼 섹션
  .actions-section {
    margin-bottom: 40px;

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  // 개발 정보 섹션
  .dev-info-section {
    .dev-card {
      .dev-details {
        margin-bottom: 24px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-weight: 500;
            color: var(--el-text-color-primary);
            flex-shrink: 0;
            margin-right: 16px;
          }

          .tech-stack {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
        }
      }

      .completed-features {
        border-top: 1px solid var(--el-border-color-lighter);
        padding-top: 20px;

        h4 {
          margin: 0 0 12px 0;
          color: var(--el-text-color-primary);
          font-size: 14px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          color: var(--el-text-color-regular);

          li {
            margin: 4px 0;
            font-size: 14px;
            line-height: 1.4;
          }
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
    .page-header {
      padding: 20px 0;

      h1 {
        font-size: 24px;
      }
    }

    .features-section .features-grid {
      grid-template-columns: 1fr;
    }

    .actions-section .action-buttons {
      flex-direction: column;
      align-items: center;

      .el-button {
        width: 200px;
      }
    }

    .progress-section .progress-info {
      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    .dev-info-section .dev-details .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .tech-stack {
        margin-top: 4px;
      }
    }
  }
}
</style>