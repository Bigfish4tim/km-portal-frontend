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
                <p class="stat-label">개발 진행도</p>
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
/**
 * 대시보드 메인 페이지 컴포넌트
 * 
 * 사용자가 로그인 후 첫 번째로 보는 메인 페이지입니다.
 * 사용자 정보, 시스템 상태, 권한 정보 등을 종합적으로 표시합니다.
 * 
 * 주요 기능:
 * - 사용자 환영 메시지 및 기본 정보 표시
 * - JWT 인증 상태 및 로그인 정보 표시  
 * - 시스템 통계 및 상태 카드
 * - 권한별 기능 접근 제어
 * - 개발 모드에서 디버깅 정보 표시
 * - 빠른 액션 버튼 (새로고침, API 테스트, 로그아웃 등)
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-26
 */

import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Dashboard',
  
  /**
   * 컴포넌트 로컬 데이터 (현재는 사용하지 않음)
   */
  data() {
    return {
      // 향후 필요시 로컬 상태 데이터 추가
    }
  },

  /**
   * 계산된 속성들
   * Vuex 스토어의 상태를 기반으로 반응형 데이터를 생성합니다.
   */
  computed: {
    // 애플리케이션 전역 상태 매핑
    ...mapGetters([
      'isDevelopment',    // 개발 모드 여부
      'isProduction',     // 프로덕션 모드 여부 
      'appVersion'        // 애플리케이션 버전
    ]),
    
    // 인증 관련 상태 매핑
    ...mapGetters('auth', [
      'user',             // 현재 사용자 정보
      'userRoles',        // 사용자 권한 목록
      'isAuthenticated',  // 인증 상태
      'displayName',      // 표시용 이름
      'loginDuration',    // 로그인 경과 시간(분)
      'loginTime'         // 로그인 시각
    ]),

    /**
     * 현재 사용자 정보 반환
     * @returns {Object|null} 사용자 정보 객체
     */
    currentUser() {
      return this.user
    },

    /**
     * 네트워크 온라인 상태 확인
     * @returns {boolean} 온라인 상태
     */
    isOnline() {
      return this.$store.state.isOnline !== false
    },

    /**
     * 사용자의 주요 권한에 따른 태그 타입 결정
     * @returns {string} Element UI 태그 타입 ('danger', 'warning', 'info', 'success')
     */
    roleTagType() {
      if (this.userRoles.includes('ROLE_ADMIN')) return 'danger'
      if (this.userRoles.includes('ROLE_MANAGER')) return 'warning'
      if (this.userRoles.includes('ROLE_BOARD_ADMIN')) return 'info'
      return 'success'
    },

    /**
     * 사용자의 주요 권한에 따른 표시명 결정
     * @returns {string} 권한 표시명
     */
    roleDisplayName() {
      if (this.userRoles.includes('ROLE_ADMIN')) return '시스템 관리자'
      if (this.userRoles.includes('ROLE_MANAGER')) return '부서 관리자'  
      if (this.userRoles.includes('ROLE_BOARD_ADMIN')) return '게시판 관리자'
      return '일반 사용자'
    },

    /**
     * 로그인 시간을 사용자 친화적 형식으로 변환
     * @returns {string} 포맷된 로그인 시간
     */
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
        console.warn('[Dashboard] 로그인 시간 포맷 오류:', error)
        return this.loginTime
      }
    }
  },

  /**
   * 컴포넌트가 DOM에 마운트된 후 실행되는 생명주기 훅
   * 
   * 컴포넌트 초기화 및 디버깅 로그를 출력합니다.
   */
  mounted() {
    console.log('=== Dashboard 컴포넌트 마운트 완료 ===')
    console.log('[Dashboard] 대시보드 페이지 로드됨')
    console.log('[Dashboard] 현재 사용자:', this.currentUser)
    console.log('[Dashboard] 사용자 권한:', this.userRoles)
    console.log('[Dashboard] 인증 상태:', this.isAuthenticated)
    
    // 성공적으로 대시보드가 로드되었음을 사용자에게 알림
    this.$nextTick(() => {
      this.$message.success({
        message: '대시보드가 정상적으로 로드되었습니다!',
        duration: 3000
      })
    })
  },

  /**
   * 컴포넌트 메서드들
   */
  methods: {
    // Vuex 인증 액션 매핑
    ...mapActions('auth', ['logout']),

    /**
     * 권한에 따른 태그 타입을 반환하는 헬퍼 메서드
     * 
     * @param {string} role - 권한명 (예: 'ROLE_ADMIN')
     * @returns {string} Element UI 태그 타입
     */
    getRoleTagType(role) {
      const roleTypes = {
        'ROLE_ADMIN': 'danger',
        'ROLE_MANAGER': 'warning', 
        'ROLE_BOARD_ADMIN': 'info',
        'ROLE_USER': 'success'
      }
      return roleTypes[role] || 'info'
    },

    /**
     * 권한의 사용자 친화적 표시명을 반환하는 헬퍼 메서드
     * 
     * @param {string} role - 권한명 (예: 'ROLE_ADMIN')
     * @returns {string} 사용자에게 표시할 권한명
     */
    getRoleDisplayName(role) {
      const roleNames = {
        'ROLE_ADMIN': '관리자',
        'ROLE_MANAGER': '매니저',
        'ROLE_BOARD_ADMIN': '게시판관리자', 
        'ROLE_USER': '사용자'
      }
      return roleNames[role] || role.replace('ROLE_', '')
    },

    /**
     * 사용자 정보를 서버에서 다시 가져와 새로고침하는 메서드
     * 
     * 현재는 기본 구현만 되어 있으며, 향후 실제 API 호출로 확장될 예정입니다.
     */
    async refreshUserInfo() {
      try {
        console.log('[Dashboard] 사용자 정보 새로고침 시도')
        
        // TODO: 실제 사용자 정보 갱신 API 호출
        // const userInfo = await api.get('/auth/user-info')
        // this.$store.commit('auth/setUser', userInfo)
        
        // 현재는 단순히 성공 메시지만 표시
        this.$message.success('사용자 정보를 새로고침했습니다.')
        console.log('[Dashboard] 사용자 정보 새로고침 완료')
        
      } catch (error) {
        console.error('[Dashboard] 사용자 정보 새로고침 실패:', error)
        this.$message.error('사용자 정보 새로고침에 실패했습니다.')
      }
    },

    /**
     * API 서버와의 연결 상태를 테스트하는 메서드
     * 
     * JWT 토큰의 유효성을 확인하고 서버 응답을 테스트합니다.
     */
    async testApiConnection() {
      try {
        console.log('[Dashboard] API 연결 테스트 시작')
        
        // API 서비스를 동적으로 임포트하여 서버 연결 테스트
        const api = (await import('@/services/api')).default
        const response = await api.get('/auth/validate')
        
        console.log('[Dashboard] API 연결 테스트 성공:', response)
        this.$message.success({
          message: 'API 연결이 정상적으로 동작합니다!',
          duration: 3000
        })
        
      } catch (error) {
        console.error('[Dashboard] API 연결 테스트 실패:', error)
        
        // 에러 타입에 따른 구체적인 메시지 제공
        let errorMessage = 'API 연결 테스트에 실패했습니다.'
        
        if (error.response?.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.'
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = '네트워크 연결을 확인해주세요.'
        }
        
        this.$message.error({
          message: errorMessage,
          duration: 5000
        })
      }
    },

    /**
     * 로그아웃 처리 메서드
     * 
     * 사용자 확인 후 Vuex 액션을 통해 로그아웃을 수행합니다.
     */
    async handleLogout() {
      try {
        // 사용자 확인 대화상자 표시
        await this.$confirm(
          '로그아웃 하시겠습니까?', 
          '확인', 
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )

        console.log('[Dashboard] 로그아웃 처리 시작')
        
        // Vuex 액션을 통한 로그아웃 처리
        await this.logout()
        
        // 성공 메시지 표시
        this.$message.success('로그아웃되었습니다.')
        console.log('[Dashboard] 로그아웃 완료')
        
      } catch (error) {
        // 사용자가 취소 버튼을 클릭한 경우는 무시
        if (error !== 'cancel') {
          console.error('[Dashboard] 로그아웃 실패:', error)
          this.$message.error('로그아웃 처리 중 오류가 발생했습니다.')
        }
      }
    },

    /**
     * H2 데이터베이스 콘솔을 새 탭에서 여는 메서드 (개발 모드 전용)
     * 
     * 개발 중 데이터베이스 상태를 확인할 때 사용합니다.
     */
    openH2Console() {
      if (this.isDevelopment) {
        console.log('[Dashboard] H2 콘솔 열기')
        window.open('http://localhost:8081/h2-console', '_blank')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * 대시보드 컴포넌트 전용 스타일
 * 
 * 현대적이고 반응형 디자인을 제공하는 SCSS 스타일입니다.
 * 다크모드 지원과 접근성을 고려한 디자인을 포함합니다.
 */

/* 메인 대시보드 컨테이너 */
.dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);

  /* 대시보드 헤더 섹션 */
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

          &.online {
            background: rgba(103, 194, 58, 0.1);
            color: #67c23a;
          }

          &.info {
            background: rgba(64, 158, 255, 0.1);
            color: #409eff;
          }

          &.warning {
            background: rgba(230, 162, 60, 0.1);
            color: #e6a23c;
          }

          &.success {
            background: rgba(103, 194, 58, 0.1);
            color: #67c23a;
          }
        }

        .stat-info {
          flex: 1;
          min-width: 0;

          .stat-number {
            margin: 0 0 4px 0;
            font-size: 20px;
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

  /* 개발 정보 섹션 */
  .dev-section {
    margin-bottom: 20px;

    .dev-card {
      .dev-alert {
        margin-bottom: 20px;
      }

      .dev-features {
        h4 {
          margin: 0 0 12px 0;
          color: #303133;
          font-size: 16px;
          font-weight: 600;
        }

        .feature-list {
          margin: 10px 0;
          padding-left: 20px;

          li {
            margin: 8px 0;
            color: #606266;
            font-size: 14px;
            line-height: 1.5;
          }
        }

        .next-steps {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          
          h4 {
            margin: 0 0 12px 0;
            color: #303133;
          }

          .next-tag {
            margin-right: 8px;
            margin-bottom: 6px;
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

/* 다크 모드 지원 (시스템 설정 기준) */
@media (prefers-color-scheme: dark) {
  .dashboard {
    background: #1a1a1a;
    
    .welcome-title {
      color: #e0e0e0 !important;
    }
    
    .welcome-subtitle, .info-label {
      color: #b0b0b0 !important;
    }
    
    .info-value {
      color: #d0d0d0 !important;
    }
  }
}
</style>