<!-- ==============================================
📁 src/views/auth/LoginView.vue
로그인 페이지
============================================== -->

<template>
  <div class="login-view">
    <div class="login-form-container">
      <div class="form-header">
        <h2>로그인</h2>
        <p>계정에 로그인하세요</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <!-- 사용자명 입력 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="사용자명을 입력하세요"
            prefix-icon="User"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- 비밀번호 입력 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- 로그인 옵션 -->
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="loginForm.rememberMe">
              로그인 정보 기억하기
            </el-checkbox>
            <el-link type="primary" @click="handleForgotPassword">
              비밀번호를 잊으셨나요?
            </el-link>
          </div>
        </el-form-item>

        <!-- 로그인 버튼 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="isLoading"
            @click="handleLogin"
            native-type="submit"
          >
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </el-button>
        </el-form-item>

        <!-- 에러 메시지 -->
        <el-alert
          v-if="loginError"
          :title="loginError"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />
      </el-form>

      <!-- 회원가입 링크 -->
      <div class="register-link">
        <span>계정이 없으신가요?</span>
        <el-link type="primary" @click="goToRegister">
          회원가입
        </el-link>
      </div>

      <!-- 개발 단계 테스트 계정 (개발 환경에서만 표시) -->
      <div v-if="isDevelopment" class="test-accounts">
        <el-divider>개발 테스트 계정</el-divider>
        <div class="test-account-grid">
          <el-button
            v-for="account in testAccounts"
            :key="account.username"
            size="small"
            plain
            @click="fillTestAccount(account)"
          >
            {{ account.label }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginView',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    // 폼 참조
    const loginFormRef = ref(null)

    // 반응형 데이터
    const loginForm = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    // 유효성 검사 규칙
    const loginRules = {
      username: [
        { required: true, message: '사용자명을 입력해주세요', trigger: 'blur' },
        { min: 3, max: 50, message: '사용자명은 3-50자여야 합니다', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ]
    }

    // 계산된 속성
    const isLoading = computed(() => store.getters['auth/isLoginLoading'])
    const loginError = computed(() => store.getters['auth/loginError'])
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // 개발 테스트 계정들
    const testAccounts = [
      { username: 'admin', password: 'password123', label: '관리자' },
      { username: 'itmanager', password: 'password123', label: 'IT매니저' },
      { username: 'hrmanager', password: 'password123', label: '인사매니저' },
      { username: 'boardadmin', password: 'password123', label: '게시판관리자' },
      { username: 'user1', password: 'password123', label: '일반사용자1' }
    ]

    // 메서드들
    const handleLogin = async () => {
      if (!loginFormRef.value) return

      try {
        // 폼 유효성 검사
        const valid = await loginFormRef.value.validate()
        if (!valid) return

        // 로그인 요청
        const result = await store.dispatch('auth/login', {
          username: loginForm.username,
          password: loginForm.password
        })

        if (result.success) {
          ElMessage.success('로그인에 성공했습니다!')
          
          // 리다이렉트 처리
          const redirectPath = route.query.redirect || '/'
          await router.push(redirectPath)
          
        } else {
          // 에러는 store에서 자동으로 설정됨
        }

      } catch (error) {
        console.error('로그인 처리 중 오류:', error)
        ElMessage.error('로그인 처리 중 오류가 발생했습니다.')
      }
    }

    const handleForgotPassword = () => {
      ElMessage.info('비밀번호 재설정 기능은 개발 중입니다.')
    }

    const goToRegister = () => {
      router.push('/auth/register')
    }

    const fillTestAccount = (account) => {
      loginForm.username = account.username
      loginForm.password = account.password
      ElMessage.info(`${account.label} 계정 정보가 입력되었습니다.`)
    }

    // 라이프사이클
    onMounted(() => {
      // 이미 로그인된 사용자는 홈으로 리다이렉트
      if (store.getters['auth/isAuthenticated']) {
        router.push('/')
      }
      
      // 저장된 사용자명 복원 (remember me 기능)
      const rememberedUsername = localStorage.getItem('km_portal_remembered_username')
      if (rememberedUsername) {
        loginForm.username = rememberedUsername
        loginForm.rememberMe = true
      }
    })

    return {
      // 참조
      loginFormRef,
      
      // 반응형 데이터
      loginForm,
      loginRules,
      testAccounts,
      
      // 계산된 속성
      isLoading,
      loginError,
      isDevelopment,
      
      // 메서드
      handleLogin,
      handleForgotPassword,
      goToRegister,
      fillTestAccount
    }
  }
}
</script>

<style lang="scss" scoped>
.login-view {
  padding: 40px;

  .login-form-container {
    max-width: 400px;
    margin: 0 auto;

    .form-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: var(--el-text-color-primary);
      }

      p {
        color: var(--el-text-color-regular);
        margin: 0;
      }
    }

    .login-form {
      .login-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .login-button {
        width: 100%;
        height: 44px;
        font-size: 16px;
        font-weight: 600;
      }

      .error-alert {
        margin-top: 16px;
      }
    }

    .register-link {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color-lighter);

      span {
        color: var(--el-text-color-regular);
        margin-right: 8px;
      }
    }

    .test-accounts {
      margin-top: 32px;

      .test-account-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        margin-top: 16px;
      }
    }
  }

  // 반응형 디자인
  @media (max-width: 480px) {
    padding: 20px;
    
    .login-form-container {
      .login-form .login-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  }
}
</style>