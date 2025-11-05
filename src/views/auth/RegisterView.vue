<!-- ==============================================
📁 src/views/auth/RegisterView.vue
회원가입 페이지
============================================== -->

<template>
  <div class="register-view">
    <div class="register-form-container">
      <div class="form-header">
        <h2>회원가입</h2>
        <p>새로운 계정을 생성하세요</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        size="large"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <!-- 사용자명 -->
        <el-form-item prop="username" label="사용자명">
          <el-input
            v-model="registerForm.username"
            placeholder="영문, 숫자, 언더스코어만 사용 가능"
            clearable
          />
        </el-form-item>

        <!-- 이메일 -->
        <el-form-item prop="email" label="이메일">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="이메일 주소를 입력하세요"
            clearable
          />
        </el-form-item>

        <!-- 실명 -->
        <el-form-item prop="fullName" label="실명">
          <el-input
            v-model="registerForm.fullName"
            placeholder="실명을 입력하세요"
            clearable
          />
        </el-form-item>

        <!-- 부서 -->
        <el-form-item prop="department" label="부서">
          <el-select
            v-model="registerForm.department"
            placeholder="부서를 선택하세요"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>

        <!-- 직급 -->
        <el-form-item prop="position" label="직급">
          <el-select
            v-model="registerForm.position"
            placeholder="직급을 선택하세요"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="pos in positions"
              :key="pos"
              :label="pos"
              :value="pos"
            />
          </el-select>
        </el-form-item>

        <!-- 전화번호 -->
        <el-form-item prop="phoneNumber" label="전화번호">
          <el-input
            v-model="registerForm.phoneNumber"
            placeholder="전화번호를 입력하세요 (선택사항)"
            clearable
          />
        </el-form-item>

        <!-- 비밀번호 -->
        <el-form-item prop="password" label="비밀번호">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 비밀번호 확인 -->
        <el-form-item prop="confirmPassword" label="비밀번호 확인">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 약관 동의 -->
        <el-form-item prop="agreeToTerms">
          <el-checkbox v-model="registerForm.agreeToTerms">
            <span>
              <el-link type="primary" @click="showTerms">이용약관</el-link>
              및
              <el-link type="primary" @click="showPrivacyPolicy">개인정보처리방침</el-link>
              에 동의합니다
            </span>
          </el-checkbox>
        </el-form-item>

        <!-- 회원가입 버튼 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-button"
            :loading="isLoading"
            @click="handleRegister"
            native-type="submit"
          >
            {{ isLoading ? '처리 중...' : '회원가입' }}
          </el-button>
        </el-form-item>

        <!-- 에러 메시지 -->
        <el-alert
          v-if="registerError"
          :title="registerError"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />
      </el-form>

      <!-- 로그인 링크 -->
      <div class="login-link">
        <span>이미 계정이 있으신가요?</span>
        <el-link type="primary" @click="goToLogin">
          로그인
        </el-link>
      </div>

      <!-- 개발 환경 안내 -->
      <div v-if="isDevelopment" class="dev-notice">
        <el-alert
          title="개발 환경 안내"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>현재 개발 환경에서는 회원가입 시 관리자 승인 없이 바로 활성화됩니다.</p>
            <p>운영 환경에서는 관리자 승인 후 계정이 활성화됩니다.</p>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import authService from '@/services/authService'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const store = useStore()

    // 폼 참조
    const registerFormRef = ref(null)

    // 반응형 데이터
    const isLoading = ref(false)
    const registerError = ref('')

    const registerForm = reactive({
      username: '',
      email: '',
      fullName: '',
      department: '',
      position: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    })

    // 부서 및 직급 옵션
    const departments = [
      'IT팀', '인사팀', '기획팀', '영업팀', '마케팅팀', 
      '재무팀', '법무팀', '운영팀', '연구개발팀'
    ]

    const positions = [
      '사원', '주임', '대리', '과장', '차장', '부장', '상무', '전무', '대표'
    ]

    // 유효성 검사 규칙
    const registerRules = {
      username: [
        { required: true, message: '사용자명을 입력해주세요', trigger: 'blur' },
        { min: 3, max: 50, message: '사용자명은 3-50자여야 합니다', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '영문, 숫자, 언더스코어만 사용 가능합니다', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      fullName: [
        { required: true, message: '실명을 입력해주세요', trigger: 'blur' },
        { min: 2, max: 100, message: '실명은 2-100자여야 합니다', trigger: 'blur' }
      ],
      department: [
        { required: true, message: '부서를 선택해주세요', trigger: 'change' }
      ],
      position: [
        { required: true, message: '직급을 선택해주세요', trigger: 'change' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
        { min: 8, message: '비밀번호는 최소 8자 이상이어야 합니다', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
          message: '영문, 숫자, 특수문자를 포함해야 합니다', 
          trigger: 'blur' 
        }
      ],
      confirmPassword: [
        { required: true, message: '비밀번호 확인을 입력해주세요', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (value !== registerForm.password) {
              callback(new Error('비밀번호가 일치하지 않습니다'))
            } else {
              callback()
            }
          }, 
          trigger: 'blur' 
        }
      ],
      agreeToTerms: [
        { 
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('이용약관에 동의해주세요'))
            } else {
              callback()
            }
          }, 
          trigger: 'change' 
        }
      ]
    }

    // 계산된 속성
    const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

    // 메서드들
    const handleRegister = async () => {
      if (!registerFormRef.value) return

      try {
        // 폼 유효성 검사
        const valid = await registerFormRef.value.validate()
        if (!valid) return

        isLoading.value = true
        registerError.value = ''

        // 실제 회원가입 API 호출
        const result = await authService.register({
          username: registerForm.username,
          email: registerForm.email,
          fullName: registerForm.fullName,
          department: registerForm.department,
          position: registerForm.position,
          phoneNumber: registerForm.phoneNumber,
          password: registerForm.password
        })

        // 회원가입 결과 처리
        if (!result.success) {
          throw new Error(result.message || '회원가입에 실패했습니다.')
        }

        // 회원가입 성공
        ElMessage.success(result.message || '회원가입이 완료되었습니다!')
        
        // 로그인 페이지로 이동
        router.push('/login')

      } catch (error) {
        registerError.value = error.message || '회원가입 처리 중 오류가 발생했습니다.'
        ElMessage.error(registerError.value)
      } finally {
        isLoading.value = false
      }
    }

    const showTerms = async () => {
      await ElMessageBox.alert(
        '이용약관 내용이 여기에 표시됩니다. (개발 중)',
        '이용약관',
        { confirmButtonText: '확인' }
      )
    }

    const showPrivacyPolicy = async () => {
      await ElMessageBox.alert(
        '개인정보처리방침 내용이 여기에 표시됩니다. (개발 중)',
        '개인정보처리방침',
        { confirmButtonText: '확인' }
      )
    }

    const goToLogin = () => {
      router.push('/login')
    }

    return {
      // 참조
      registerFormRef,
      
      // 반응형 데이터
      registerForm,
      registerRules,
      isLoading,
      registerError,
      departments,
      positions,
      
      // 계산된 속성
      isDevelopment,
      
      // 메서드
      handleRegister,
      showTerms,
      showPrivacyPolicy,
      goToLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.register-view {
  padding: 40px;

  .register-form-container {
    max-width: 500px;
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

    .register-form {
      .register-button {
        width: 100%;
        height: 44px;
        font-size: 16px;
        font-weight: 600;
      }

      .error-alert {
        margin-top: 16px;
      }
    }

    .login-link {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color-lighter);

      span {
        color: var(--el-text-color-regular);
        margin-right: 8px;
      }
    }

    .dev-notice {
      margin-top: 24px;
    }
  }

  // 반응형 디자인
  @media (max-width: 480px) {
    padding: 20px;
  }
}
</style>