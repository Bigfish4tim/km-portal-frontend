<!-- 
============================================
📁 src/components/common/NoPermission.vue
권한 없음 안내 컴포넌트

페이지 내에서 권한이 없는 섹션을 표시할 때 사용하는
재사용 가능한 컴포넌트입니다.

사용법:
<NoPermission :required-roles="['ROLE_ADMIN']" />
============================================
-->

<template>
  <div class="no-permission">
    <!-- Empty 컴포넌트를 사용한 깔끔한 디자인 -->
    <el-empty :description="description">
      <!-- 커스텀 이미지 슬롯 -->
      <template #image>
        <div class="permission-icon">
          <el-icon :size="80" color="#909399">
            <Lock />
          </el-icon>
        </div>
      </template>

      <!-- 커스텀 설명 슬롯 -->
      <template #description>
        <div class="description-content">
          <h3 class="title">{{ title }}</h3>
          <p class="message">{{ message }}</p>
          
          <!-- 필요한 권한 정보 표시 -->
          <div v-if="requiredRoles && requiredRoles.length > 0" class="required-roles">
            <p class="label">필요한 권한:</p>
            <div class="role-tags">
              <el-tag
                v-for="role in formattedRoles"
                :key="role"
                type="warning"
                size="large"
                effect="dark"
              >
                {{ role }}
              </el-tag>
            </div>
          </div>

          <!-- 연락처 정보 -->
          <div class="contact-info">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                권한이 필요하신가요?
              </template>
              <template #default>
                <p>관리자에게 문의하여 필요한 권한을 요청하세요.</p>
                <p><strong>관리자 이메일:</strong> {{ adminEmail }}</p>
              </template>
            </el-alert>
          </div>
        </div>
      </template>

      <!-- 액션 버튼 슬롯 (기본값) -->
      <template #default>
        <div class="actions">
          <el-button type="primary" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            홈으로 이동
          </el-button>
          
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>
            이전 페이지
          </el-button>

          <el-button type="info" @click="contactAdmin">
            <el-icon><Message /></el-icon>
            관리자 문의
          </el-button>
        </div>
      </template>
    </el-empty>
  </div>
</template>

<script>
/**
 * NoPermission.vue
 * 
 * 권한 없음 안내 컴포넌트
 * 
 * 페이지 내에서 특정 섹션에 권한이 없을 때 표시하는
 * 재사용 가능한 컴포넌트입니다.
 * 
 * Props:
 * - requiredRoles: 필요한 권한 목록 (배열)
 * - title: 제목 (선택사항)
 * - message: 메시지 (선택사항)
 * - adminEmail: 관리자 이메일 (선택사항)
 * 
 * 사용 예시:
 * ```vue
 * <NoPermission 
 *   :required-roles="['ROLE_ADMIN', 'ROLE_MANAGER']"
 *   title="사용자 관리 권한 필요"
 *   message="이 기능은 관리자만 사용할 수 있습니다."
 * />
 * ```
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-06
 */

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, HomeFilled, Back, Message } from '@element-plus/icons-vue'

export default {
  name: 'NoPermission',

  components: {
    Lock,
    HomeFilled,
    Back,
    Message
  },

  props: {
    /**
     * 필요한 권한 목록
     * 
     * @type {Array}
     * @example ['ROLE_ADMIN', 'ROLE_MANAGER']
     */
    requiredRoles: {
      type: Array,
      default: () => []
    },

    /**
     * 제목
     * 
     * @type {String}
     * @default '접근 권한이 없습니다'
     */
    title: {
      type: String,
      default: '접근 권한이 없습니다'
    },

    /**
     * 메시지
     * 
     * @type {String}
     * @default '이 기능을 사용하려면 관리자에게 권한을 요청하세요.'
     */
    message: {
      type: String,
      default: '이 기능을 사용하려면 관리자에게 권한을 요청하세요.'
    },

    /**
     * 관리자 이메일
     * 
     * @type {String}
     * @default 'admin@kmportal.com'
     */
    adminEmail: {
      type: String,
      default: 'admin@kmportal.com'
    }
  },

  setup(props) {
    const router = useRouter()

    /**
     * 역할명 한글 변환 매핑
     */
    const roleNameMap = {
      'ROLE_ADMIN': '시스템 관리자',
      'ROLE_MANAGER': '부서 관리자',
      'ROLE_BOARD_ADMIN': '게시판 관리자',
      'ROLE_USER': '일반 사용자'
    }

    /**
     * Computed: 한글로 변환된 권한 목록
     * 
     * 예: ['ROLE_ADMIN', 'ROLE_MANAGER']
     *  → ['시스템 관리자', '부서 관리자']
     */
    const formattedRoles = computed(() => {
      return props.requiredRoles.map(role => 
        roleNameMap[role] || role
      )
    })

    /**
     * 설명 텍스트 (기본값)
     */
    const description = computed(() => {
      return '이 페이지에 접근할 권한이 없습니다'
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
     */
    const contactAdmin = () => {
      ElMessage.info({
        message: `관리자 이메일: ${props.adminEmail}`,
        duration: 5000,
        showClose: true
      })

      // 선택사항: 이메일 클라이언트 열기
      // window.location.href = `mailto:${props.adminEmail}?subject=권한 요청`
    }

    return {
      description,
      formattedRoles,
      goHome,
      goBack,
      contactAdmin
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * 권한 없음 컴포넌트 스타일
 */

.no-permission {
  padding: 60px 20px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;

  /**
   * 권한 아이콘
   */
  .permission-icon {
    margin-bottom: 20px;
  }

  /**
   * 설명 내용
   */
  .description-content {
    max-width: 600px;
    margin: 0 auto;

    .title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 16px 0;
    }

    .message {
      font-size: 16px;
      color: #606266;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }

    /**
     * 필요한 권한 섹션
     */
    .required-roles {
      margin: 24px 0;

      .label {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
        margin-bottom: 12px;
      }

      .role-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;

        .el-tag {
          font-size: 14px;
        }
      }
    }

    /**
     * 연락처 정보
     */
    .contact-info {
      margin-top: 32px;
      text-align: left;

      :deep(.el-alert) {
        p {
          margin: 4px 0;
          font-size: 14px;
        }

        strong {
          color: #409EFF;
        }
      }
    }
  }

  /**
   * 액션 버튼
   */
  .actions {
    margin-top: 32px;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;

    .el-button {
      min-width: 140px;
    }
  }
}

/**
 * 반응형 디자인 - 모바일
 */
@media (max-width: 768px) {
  .no-permission {
    padding: 40px 10px;
    min-height: 300px;

    .description-content {
      .title {
        font-size: 20px;
      }

      .message {
        font-size: 14px;
      }
    }

    .actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>