<!-- 
============================================
📁 src/views/error/ForbiddenView.vue
403 권한 없음 페이지 (개선 버전)

14-15일차 권한 관리 업무 완료:
- 접근하려던 페이지 경로 표시
- 필요한 권한과 현재 권한 비교
- 역할명 한글 변환
- 사용자 친화적인 안내 메시지
============================================
-->

<template>
  <div class="error-page forbidden">
    <div class="error-container">
      <!-- 에러 일러스트레이션 -->
      <div class="error-illustration">
        <div class="error-code">403</div>
        <el-icon :size="120" color="#F56C6C">
          <Lock />
        </el-icon>
      </div>
      
      <!-- 에러 내용 -->
      <div class="error-content">
        <h1>접근 권한이 없습니다</h1>
        <p class="main-description">
          요청하신 페이지에 접근할 권한이 없습니다.<br />
          관리자에게 권한 부여를 요청하거나, 이전 페이지로 돌아가세요.
        </p>
        
        <!-- ⭐ 상세 권한 정보 (14-15일차 추가) -->
        <div class="permission-info">
          <el-alert
            title="상세 정보"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="info-item">
                <span class="label">📍 접근하려던 페이지:</span>
                <span class="value">{{ attemptedPath }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">🔑 필요한 권한:</span>
                <span class="value required-roles">{{ requiredRolesText }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">👤 현재 보유 권한:</span>
                <span class="value current-roles">{{ currentRolesText }}</span>
              </div>

              <!-- 권한 차이 시각화 -->
              <div class="permission-comparison" v-if="showComparison">
                <el-divider />
                <p class="comparison-title">권한 비교:</p>
                <div class="role-tags">
                  <el-tag
                    v-for="role in comparisonData.missing"
                    :key="role"
                    type="danger"
                    effect="dark"
                  >
                    {{ role }} (부족)
                  </el-tag>
                  <el-tag
                    v-for="role in comparisonData.existing"
                    :key="role"
                    type="success"
                    effect="dark"
                  >
                    {{ role }} (보유)
                  </el-tag>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
        
        <!-- 액션 버튼들 -->
        <div class="error-actions">
          <el-button type="primary" size="large" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            홈으로 돌아가기
          </el-button>
          
          <el-button size="large" @click="goBack">
            <el-icon><Back /></el-icon>
            이전 페이지
          </el-button>
          
          <el-button type="info" size="large" @click="contactAdmin">
            <el-icon><Message /></el-icon>
            관리자 문의
          </el-button>
        </div>

        <!-- 도움말 -->
        <div class="help-text">
          <el-collapse accordion>
            <el-collapse-item title="❓ 권한이 필요한 이유는 무엇인가요?" name="1">
              <p>
                이 페이지는 민감한 정보나 중요한 기능을 포함하고 있어,
                특정 권한을 가진 사용자만 접근할 수 있도록 제한되어 있습니다.
              </p>
            </el-collapse-item>
            <el-collapse-item title="🔓 권한을 받으려면 어떻게 해야 하나요?" name="2">
              <p>
                관리자에게 문의하여 필요한 권한을 요청하세요.<br />
                관리자 이메일: <strong>admin@kmportal.com</strong>
              </p>
            </el-collapse-item>
            <el-collapse-item title="🛡️ 보안상 이유로 접근이 제한되었나요?" name="3">
              <p>
                네, 시스템 보안을 위해 권한이 없는 사용자의 접근을 차단하고 있습니다.
                이는 정보 보호와 시스템 안정성을 위한 조치입니다.
              </p>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * ForbiddenView.vue
 * 
 * 403 권한 없음 에러 페이지
 * 
 * 주요 개선 사항 (14-15일차):
 * 1. 접근하려던 페이지 경로 표시
 * 2. 필요한 권한과 현재 권한 비교
 * 3. 역할명 한글 변환 (사용자 친화적)
 * 4. 권한 차이 시각화
 * 5. 도움말 섹션 추가
 * 
 * @author KM Portal Team
 * @version 2.0 (상세 정보 표시 개선)
 * @since 2025-11-06
 */

import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Lock, HomeFilled, Back, Message } from '@element-plus/icons-vue'

export default {
  name: 'ForbiddenView',

  components: {
    Lock,
    HomeFilled,
    Back,
    Message
  },

  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    /**
     * 역할명 한글 변환 매핑 객체
     * 
     * 기술적인 역할명(ROLE_ADMIN)을 사용자 친화적인 한글명으로 변환
     */
    const roleNameMap = {
      'ROLE_ADMIN': '시스템 관리자',
      'ROLE_MANAGER': '부서 관리자',
      'ROLE_BOARD_ADMIN': '게시판 관리자',
      'ROLE_USER': '일반 사용자'
    }

    /**
     * Computed: 현재 사용자의 권한 목록
     */
    const userRoles = computed(() => store.getters['auth/userRoles'] || [])

    /**
     * Computed: 접근하려던 페이지 경로
     * 
     * 라우터 가드에서 query 파라미터로 전달받음
     * 예: /403?from=/admin/users
     */
    const attemptedPath = computed(() => {
      return route.query.from || '알 수 없는 페이지'
    })

    /**
     * Computed: 필요한 권한 목록 (한글 변환)
     * 
     * 라우터 가드에서 query 파라미터로 전달받은 권한을 한글로 변환
     * 예: ROLE_ADMIN,ROLE_MANAGER → 시스템 관리자, 부서 관리자
     */
    const requiredRolesText = computed(() => {
      if (route.query.required) {
        return route.query.required
          .split(',')
          .map(role => roleNameMap[role.trim()] || role)
          .join(', ')
      }
      return '관리자 권한'
    })

    /**
     * Computed: 현재 보유 권한 목록 (한글 변환)
     * 
     * 현재 사용자가 가진 권한을 한글로 변환하여 표시
     */
    const currentRolesText = computed(() => {
      if (!userRoles.value || userRoles.value.length === 0) {
        return '권한 없음'
      }

      return userRoles.value
        .map(role => roleNameMap[role] || role)
        .join(', ')
    })

    /**
     * Computed: 권한 비교 데이터
     * 
     * 필요한 권한 중에서:
     * - 보유하고 있는 권한
     * - 부족한 권한
     * 을 구분하여 반환
     */
    const comparisonData = computed(() => {
      const required = route.query.required
        ? route.query.required.split(',').map(r => r.trim())
        : []

      const missing = []    // 부족한 권한
      const existing = []   // 보유한 권한

      required.forEach(role => {
        const koreanName = roleNameMap[role] || role

        if (userRoles.value.includes(role)) {
          existing.push(koreanName)
        } else {
          missing.push(koreanName)
        }
      })

      return { missing, existing }
    })

    /**
     * Computed: 권한 비교 섹션 표시 여부
     * 
     * 필요한 권한이 있을 때만 비교 섹션 표시
     */
    const showComparison = computed(() => {
      return route.query.required && route.query.required.length > 0
    })

    /**
     * 홈으로 이동
     */
    const goHome = () => {
      router.push('/')
    }

    /**
     * 이전 페이지로 이동
     */
    const goBack = () => {
      router.go(-1)
    }

    /**
     * 관리자 문의
     * 
     * 실제 프로젝트에서는:
     * 1. 이메일 클라이언트 열기
     * 2. 사내 메신저 연동
     * 3. 문의 티켓 생성 페이지로 이동
     * 등으로 구현 가능
     */
    const contactAdmin = () => {
      ElMessage.info({
        message: '관리자 이메일: admin@kmportal.com',
        duration: 5000,
        showClose: true
      })

      // 선택사항: 이메일 클라이언트 자동 열기
      // window.location.href = 'mailto:admin@kmportal.com?subject=권한 요청&body=페이지: ' + attemptedPath.value
    }

    return {
      userRoles,
      attemptedPath,
      requiredRolesText,
      currentRolesText,
      comparisonData,
      showComparison,
      goHome,
      goBack,
      contactAdmin
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * 403 에러 페이지 스타일
 */

// 색상 변수
$error-color: #F56C6C;
$warning-color: #E6A23C;
$success-color: #67C23A;

.error-page.forbidden {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .error-container {
    max-width: 800px;
    width: 100%;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 60px 40px;
    text-align: center;

    /**
     * 에러 일러스트레이션
     */
    .error-illustration {
      margin-bottom: 30px;

      .error-code {
        font-size: 120px;
        font-weight: bold;
        color: $error-color;
        line-height: 1;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    /**
     * 에러 내용
     */
    .error-content {
      h1 {
        font-size: 32px;
        color: #303133;
        margin: 0 0 16px 0;
      }

      .main-description {
        font-size: 16px;
        color: #606266;
        line-height: 1.6;
        margin-bottom: 32px;
      }

      /**
       * ⭐ 권한 정보 섹션 (14-15일차 추가)
       */
      .permission-info {
        margin: 32px 0;
        text-align: left;

        .info-item {
          display: flex;
          align-items: flex-start;
          margin: 12px 0;
          padding: 8px 0;

          .label {
            font-weight: 600;
            color: #606266;
            min-width: 180px;
            flex-shrink: 0;
          }

          .value {
            color: #303133;
            flex: 1;

            &.required-roles {
              color: $error-color;
              font-weight: 600;
            }

            &.current-roles {
              color: $success-color;
              font-weight: 600;
            }
          }
        }

        /**
         * 권한 비교 섹션
         */
        .permission-comparison {
          margin-top: 16px;

          .comparison-title {
            font-weight: 600;
            margin-bottom: 12px;
            color: #606266;
          }

          .role-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .el-tag {
              font-size: 14px;
            }
          }
        }
      }

      /**
       * 액션 버튼들
       */
      .error-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        margin: 32px 0;

        .el-button {
          min-width: 160px;
        }
      }

      /**
       * 도움말 섹션
       */
      .help-text {
        margin-top: 40px;
        text-align: left;

        :deep(.el-collapse) {
          border: none;
        }

        :deep(.el-collapse-item__header) {
          background-color: #f5f7fa;
          padding: 12px 16px;
          border-radius: 4px;
          font-weight: 600;
        }

        :deep(.el-collapse-item__content) {
          padding: 16px;
          color: #606266;
          line-height: 1.6;
        }

        p {
          margin: 0;
        }

        strong {
          color: #409EFF;
        }
      }
    }
  }
}

/**
 * 반응형 디자인 - 모바일
 */
@media (max-width: 768px) {
  .error-page.forbidden {
    padding: 10px;

    .error-container {
      padding: 40px 20px;

      .error-illustration {
        .error-code {
          font-size: 80px;
        }

        .el-icon {
          font-size: 80px !important;
        }
      }

      .error-content {
        h1 {
          font-size: 24px;
        }

        .main-description {
          font-size: 14px;
        }

        .permission-info {
          .info-item {
            flex-direction: column;
            gap: 4px;

            .label {
              min-width: auto;
            }
          }
        }

        .error-actions {
          flex-direction: column;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>