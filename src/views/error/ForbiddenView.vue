<!-- ==============================================
📁 src/views/error/ForbiddenView.vue
403 권한 없음 페이지
============================================== -->

<template>
  <div class="error-page forbidden">
    <div class="error-container">
      <div class="error-illustration">
        <div class="error-code">403</div>
        <el-icon :size="120" color="#F56C6C">
          <Lock />
        </el-icon>
      </div>
      
      <div class="error-content">
        <h1>접근 권한이 없습니다</h1>
        <p>이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하세요.</p>
        
        <div class="permission-info">
          <el-alert
            title="권한 안내"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>현재 권한: <strong>{{ userRoles.join(', ') || '없음' }}</strong></p>
              <p>필요 권한: <strong>{{ requiredPermission || '관리자 권한' }}</strong></p>
            </template>
          </el-alert>
        </div>
        
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            홈으로 돌아가기
          </el-button>
          <el-button @click="goBack">
            이전 페이지
          </el-button>
          <el-button type="info" @click="contactAdmin">
            관리자 문의
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'

export default {
  name: 'ForbiddenView',
  components: {
    Lock
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    const userRoles = computed(() => store.getters['auth/userRoles'])
    const requiredPermission = computed(() => route.meta.roles?.join(', '))

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.go(-1)
    }

    const contactAdmin = () => {
      ElMessage.info('관리자 문의 기능은 개발 중입니다.')
    }

    return {
      userRoles,
      requiredPermission,
      goHome,
      goBack,
      contactAdmin
    }
  }
}
</script>

<style lang="scss" scoped>
.error-page.forbidden {
  .error-container {
    .error-content {
      .permission-info {
        margin: 24px 0;
        text-align: left;

        .el-alert {
          p {
            margin: 4px 0;
          }
        }
      }
    }
  }
}
</style>