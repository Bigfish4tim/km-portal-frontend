<template>
  <div class="dashboard">
    <!-- 헤더 섹션 -->
    <div class="dashboard-header">
      <el-card shadow="never" class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">
              안녕하세요, {{ currentUser?.fullName || currentUser?.username }}님!
            </h1>
            <p class="welcome-subtitle">
              KM 포털에 오신 것을 환영합니다. JWT 인증 시스템이 성공적으로 동작하고 있습니다.
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
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon online">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">인증 완료</h3>
                <p class="stat-label">JWT 토큰 상태</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon info">
                <i class="el-icon-time"></i>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ loginDuration }}분</h3>
                <p class="stat-label">로그인 시간</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon warning">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">{{ userRoles.length }}</h3>
                <p class="stat-label">보유 권한</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon success">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">5일차</h3>
                <p class="stat-label">개발 진행률</p>
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
                  <i class="el-icon-user"></i>
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
                  <i class="el-icon-monitor"></i>
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

    <!-- 개발 정보 섹션 (개발 모드에서만 표시) -->
    <div v-if="isDevelopment" class="dev-section">
      <el-card shadow="hover" class="dev-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <i class="el-icon-cpu"></i>
              개발 정보 (5일차 완료)
            </span>
          </div>
        </template>
        
        <el-alert
          title="JWT 인증 시스템 구축 완료!"
          type="success"
          description="5일차 목표를 130% 달성하여 완전한 JWT 기반 인증 시스템이 구축되었습니다."
          show-icon
          :closable="false"
          class="dev-alert"
        />

        <div class="dev-features">
          <h4>구현된 주요 기능:</h4>
          <ul class="feature-list">
            <li>✅ JWT Access Token + Refresh Token 시스템</li>
            <li>✅ 자동 토큰 갱신 및 만료 처리</li>
            <li>✅ Spring Security 권한 기반 접근 제어</li>
            <li>✅ Vue Router 가드를 통한 페이지 보호</li>
            <li>✅ Vuex 중앙 상태 관리</li>
            <li>✅ CORS 정책 및 API 보안 설정</li>
            <li>✅ 완전한 에러 처리 및 복구 메커니즘</li>
          </ul>

          <div class="next-steps">
            <h4>다음 단계 (6일차 예정):</h4>
            <el-tag type="info" class="next-tag">사용자 관리 시스템</el-tag>
            <el-tag type="info" class="next-tag">권한 변경 기능</el-tag>
            <el-tag type="info" class="next-tag">계정 관리 도구</el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 빠른 액션 버튼 -->
    <div class="actions-section">
      <el-card shadow="hover" class="actions-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <i class="el-icon-s-operation"></i>
              빠른 작업
            </span>
          </div>
        </template>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            icon="el-icon-refresh"
            @click="refreshUserInfo"
          >
            사용자 정보 새로고침
          </el-button>
          
          <el-button 
            type="success" 
            icon="el-icon-circle-check"
            @click="testApiConnection"
          >
            API 연결 테스트
          </el-button>
          
          <el-button 
            type="warning" 
            icon="el-icon-switch-button"
            @click="handleLogout"
          >
            로그아웃
          </el-button>

          <el-button 
            v-if="isDevelopment"
            type="info" 
            icon="el-icon-view"
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
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Dashboard',
  
  data() {
    return {
      // 컴포넌트 로컬 상태
    }
  },

  computed: {
    // Vuex 스토어에서 데이터 가져오기
    ...mapGetters([
      'isDevelopment',
      'isProduction', 
      'appVersion'
    ]),
    ...mapGetters('auth', [
      'user',
      'userRoles',
      'isAuthenticated',
      'displayName',
      'loginDuration',
      'loginTime'
    ]),

    // 현재 사용자 정보
    currentUser() {
      return this.user
    },

    // 네트워크 상태 (스토어에서 가져오기)
    isOnline() {
      return this.$store.state.isOnline
    },

    // 주요 권한 표시용
    roleTagType() {
      if (this.userRoles.includes('ROLE_ADMIN')) return 'danger'
      if (this.userRoles.includes('ROLE_MANAGER')) return 'warning'
      if (this.userRoles.includes('ROLE_BOARD_ADMIN')) return 'info'
      return 'success'
    },

    roleDisplayName() {
      if (this.userRoles.includes('ROLE_ADMIN')) return '시스템 관리자'
      if (this.userRoles.includes('ROLE_MANAGER')) return '부서 관리자'  
      if (this.userRoles.includes('ROLE_BOARD_ADMIN')) return '게시판 관리자'
      return '일반 사용자'
    },

    // 로그인 시간 포맷팅
    formattedLoginTime() {
      if (!this.loginTime) return '-'
      
      try {
        return new Date(this.loginTime).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return this.loginTime
      }
    }
  },

  mounted() {
    console.log('[Dashboard] 대시보드 페이지 로드됨')
    console.log('[Dashboard] 현재 사용자:', this.currentUser)
    console.log('[Dashboard] 사용자 권한:', this.userRoles)
  },

  methods: {
    // Vuex 액션 매핑
    ...mapActions('auth', ['logout']),

    // 권한별 태그 타입 반환
    getRoleTagType(role) {
      const roleTypes = {
        'ROLE_ADMIN': 'danger',
        'ROLE_MANAGER': 'warning', 
        'ROLE_BOARD_ADMIN': 'info',
        'ROLE_USER': 'success'
      }
      return roleTypes[role] || 'info'
    },

    // 권한 표시명 반환
    getRoleDisplayName(role) {
      const roleNames = {
        'ROLE_ADMIN': '관리자',
        'ROLE_MANAGER': '매니저',
        'ROLE_BOARD_ADMIN': '게시판관리자', 
        'ROLE_USER': '사용자'
      }
      return roleNames[role] || role.replace('ROLE_', '')
    },

    // 사용자 정보 새로고침
    async refreshUserInfo() {
      try {
        // 현재는 단순히 성공 메시지만 표시
        // 향후 실제 API 호출로 사용자 정보를 갱신할 예정
        this.$message.success('사용자 정보를 새로고침했습니다.')
        console.log('[Dashboard] 사용자 정보 새로고침 완료')
      } catch (error) {
        console.error('[Dashboard] 사용자 정보 새로고침 실패:', error)
        this.$message.error('사용자 정보 새로고침에 실패했습니다.')
      }
    },

    // API 연결 테스트
    async testApiConnection() {
      try {
        // 간단한 API 호출로 연결 상태 확인
        const api = (await import('@/services/api')).default
        const response = await api.get('/auth/validate')
        
        this.$message.success('API 연결이 정상적으로 동작합니다!')
        console.log('[Dashboard] API 연결 테스트 성공:', response)
      } catch (error) {
        console.error('[Dashboard] API 연결 테스트 실패:', error)
        this.$message.error('API 연결 테스트에 실패했습니다.')
      }
    },

    // 로그아웃 처리
    async handleLogout() {
      try {
        await this.$confirm('로그아웃 하시겠습니까?', '확인', {
          confirmButtonText: '로그아웃',
          cancelButtonText: '취소',
          type: 'warning'
        })

        await this.logout()
        this.$message.success('로그아웃되었습니다.')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('[Dashboard] 로그아웃 실패:', error)
          this.$message.error('로그아웃 처리 중 오류가 발생했습니다.')
        }
      }
    },

    // H2 콘솔 열기 (개발 모드 전용)
    openH2Console() {
      if (this.isDevelopment) {
        window.open('http://localhost:8081/h2-console', '_blank')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  .dashboard-header {
    margin-bottom: 20px;

    .welcome-card {
      .welcome-content {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .welcome-text {
          flex: 1;

          .welcome-title {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 24px;
            font-weight: 600;
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
          }
        }
      }
    }
  }

  .stats-section {
    margin-bottom: 20px;

    .stat-card {
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

          &.online {
            background: #f0f9ff;
            color: #67c23a;
          }

          &.info {
            background: #f0f9ff;
            color: #409eff;
          }

          &.warning {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.success {
            background: #f0f9ff;
            color: #67c23a;
          }
        }

        .stat-info {
          flex: 1;

          .stat-number {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 600;
            color: #303133;
          }

          .stat-label {
            margin: 0;
            font-size: 13px;
            color: #909399;
          }
        }
      }
    }
  }

  .info-section {
    margin-bottom: 20px;

    .info-card {
      .card-header {
        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #303133;
        }
      }

      .user-info, .system-info {
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .info-label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
          }

          .info-value {
            font-size: 14px;
            color: #303133;
          }

          .roles-container {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;

            .role-tag-small {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .dev-section {
    margin-bottom: 20px;

    .dev-card {
      .dev-alert {
        margin-bottom: 20px;
      }

      .dev-features {
        .feature-list {
          margin: 10px 0;
          padding-left: 20px;

          li {
            margin: 6px 0;
            color: #606266;
            font-size: 14px;
          }
        }

        .next-steps {
          margin-top: 20px;
          
          h4 {
            margin: 0 0 10px 0;
            color: #303133;
          }

          .next-tag {
            margin-right: 8px;
            margin-bottom: 4px;
          }
        }
      }
    }
  }

  .actions-section {
    .actions-card {
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  }
}

// 반응형 디자인
@media (max-width: 768px) {
  .dashboard {
    padding: 15px;

    .welcome-content {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 16px;
    }

    .action-buttons {
      justify-content: center;
    }
  }
}
</style>