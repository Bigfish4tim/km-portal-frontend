<template>
  <!-- 
    로그인 페이지 메인 컨테이너
    화면 전체를 차지하며 중앙 정렬된 로그인 폼을 표시합니다.
  -->
  <div class="login-container">
    <!-- 로그인 카드 -->
    <el-card class="login-card" shadow="hover">
      <!-- 로고 및 제목 영역 -->
      <div class="login-header">
        <div class="logo">
          <i class="el-icon-office-building"></i>
        </div>
        <h1 class="title">KM 업무 포털</h1>
        <p class="subtitle">지식관리 통합 업무 시스템</p>
      </div>

      <!-- 로그인 폼 -->
      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form"
        size="large"
        @submit.native.prevent="handleLogin"
      >
        <!-- 사용자명 입력 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            prefix-icon="el-icon-user"
            placeholder="사용자명을 입력하세요"
            clearable
            @keyup.enter.native="handleLogin"
            :disabled="isLoading"
          />
        </el-form-item>

        <!-- 비밀번호 입력 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            prefix-icon="el-icon-lock"
            placeholder="비밀번호를 입력하세요"
            show-password
            clearable
            @keyup.enter.native="handleLogin"
            :disabled="isLoading"
          />
        </el-form-item>

        <!-- 로그인 옵션 -->
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe" :disabled="isLoading">
              로그인 정보 기억
            </el-checkbox>
            <el-link type="primary" :underline="false" disabled>
              비밀번호 찾기
            </el-link>
          </div>
        </el-form-item>

        <!-- 로그인 버튼 -->
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="isLoading"
            @click="handleLogin"
            native-type="submit"
          >
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </el-button>
        </el-form-item>

        <!-- 에러 메시지 표시 -->
        <div v-if="errorMessage" class="error-message">
          <i class="el-icon-warning-outline"></i>
          {{ errorMessage }}
        </div>
      </el-form>

      <!-- 회원가입 섹션 -->
      <div class="register-section">
        <el-divider content-position="center">또는</el-divider>
        <p class="register-text">아직 계정이 없으신가요?</p>
        <el-button
          class="register-button"
          size="large"
          @click="goToRegister"
        >
          <i class="el-icon-user-solid"></i>
          회원가입
        </el-button>
      </div>

      <!-- 테스트 계정 정보 (개발 모드에서만 표시) -->
      <div v-if="isDevelopment" class="test-accounts">
        <el-divider content-position="center">테스트 계정</el-divider>
        <div class="account-list">
          <el-tag
            v-for="account in testAccounts"
            :key="account.username"
            class="account-tag"
            :type="account.type"
            @click="fillTestAccount(account)"
          >
            {{ account.label }}
          </el-tag>
        </div>
        <p class="test-note">
          <i class="el-icon-info"></i>
          개발 모드: 위 계정들을 클릭하면 자동으로 입력됩니다.
        </p>
      </div>
    </el-card>

    <!-- 시스템 정보 푸터 -->
    <div class="login-footer">
      <p>© 2025 KM Portal Team. All rights reserved.</p>
      <p>문의: support@kmportal.com | Tel: 02-1234-5678</p>
    </div>
  </div>
</template>

<script>
/**
 * 로그인 페이지 컴포넌트
 * 
 * 사용자 인증을 위한 로그인 폼을 제공하는 Vue.js 컴포넌트입니다.
 * 
 * 주요 기능:
 * - 사용자명/비밀번호 입력 폼
 * - 실시간 입력값 검증
 * - 로그인 처리 및 에러 표시
 * - 로그인 정보 기억 옵션
 * - 개발 모드에서 테스트 계정 자동 입력
 * - 반응형 디자인 지원
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-09-24
 */

import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Login',
  
  /**
   * 컴포넌트 데이터 정의
   * 
   * 로그인 폼의 상태와 UI 상태를 관리하는 reactive 데이터들입니다.
   */
  data() {
    return {
      // 로그인 폼 데이터
      loginForm: {
        username: '', // 사용자명
        password: ''  // 비밀번호
      },
      
      // 로그인 정보 기억 여부
      rememberMe: false,
      
      // 로딩 상태 (로그인 처리 중)
      isLoading: false,
      
      // 에러 메시지
      errorMessage: '',
      
      // 폼 검증 규칙
      loginRules: {
        // 사용자명 검증 규칙
        username: [
          {
            required: true,
            message: '사용자명을 입력해주세요',
            trigger: 'blur'
          },
          {
            min: 2,
            max: 50,
            message: '사용자명은 2-50자 사이여야 합니다',
            trigger: 'blur'
          }
        ],
        
        // 비밀번호 검증 규칙  
        password: [
          {
            required: true,
            message: '비밀번호를 입력해주세요',
            trigger: 'blur'
          },
          {
            min: 4,
            message: '비밀번호는 최소 4자 이상이어야 합니다',
            trigger: 'blur'
          }
        ]
      },
      
      // 개발 모드용 테스트 계정 목록
      testAccounts: [
        {
          username: 'admin',
          password: 'admin123',
          label: '관리자 (admin)',
          type: 'danger'
        },
        {
          username: 'manager',
          password: 'manager123',
          label: '매니저 (manager)',
          type: 'warning'
        },
        {
          username: 'board_admin',
          password: 'board123',
          label: '게시판 관리자 (board_admin)',
          type: 'info'
        },
        {
          username: 'user01',
          password: 'user123',
          label: '일반 사용자 (user01)',
          type: 'success'
        }
      ]
    }
  },

  /**
   * 계산된 속성 (Computed Properties)
   * 
   * 다른 데이터를 기반으로 계산되는 반응형 속성들입니다.
   */
  computed: {
    // Vuex 스토어의 인증 관련 getters 매핑
    ...mapGetters('auth', [
      'lastError'
    ]),
    
    /**
     * 개발 모드 여부를 반환
     * 
     * @returns {boolean} 개발 모드인 경우 true
     */
    isDevelopment() {
      return process.env.NODE_ENV === 'development'
    }
  },

  /**
   * 컴포넌트가 마운트될 때 실행되는 생명주기 훅
   * 
   * 페이지 진입시 필요한 초기화 작업을 수행합니다.
   */
  mounted() {
    // 이미 로그인된 사용자는 메인 페이지로 리디렉션
    this.checkExistingAuth()
    
    // 저장된 로그인 정보가 있으면 복원
    this.loadRememberedCredentials()
    
    // 포커스를 사용자명 입력 필드에 설정
    this.$nextTick(() => {
      if (this.$refs.loginFormRef && this.$refs.loginFormRef.$el) {
        const usernameInput = this.$refs.loginFormRef.$el.querySelector('input')
        if (usernameInput) {
          usernameInput.focus()
        }
      }
    })
  },

  /**
   * Vuex 스토어의 인증 관련 액션들을 컴포넌트 메서드로 매핑
   */
  methods: {
    ...mapActions('auth', [
      'login'
    ]),

    /**
     * 기존 인증 상태를 확인하고 적절히 처리하는 메서드
     * 
     * 이미 로그인된 사용자가 로그인 페이지에 접근했을 때
     * 메인 페이지로 자동 리디렉션합니다.
     */
    async checkExistingAuth() {
      try {
        // authService를 통해 현재 인증 상태 확인
        const authService = (await import('@/services/authService')).default
        
        if (authService.isAuthenticated()) {
          console.log('[Login] 이미 인증된 사용자, 메인 페이지로 이동')
          
          // 이전 페이지가 있으면 그곳으로, 없으면 대시보드로 이동
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
        }
      } catch (error) {
        console.error('[Login] 기존 인증 확인 오류:', error)
        // 오류가 발생해도 로그인 페이지는 정상 표시
      }
    },

    /**
     * 저장된 로그인 정보를 불러오는 메서드
     * 
     * '로그인 정보 기억' 옵션이 활성화되어 있었다면
     * 이전에 저장된 사용자명을 복원합니다.
     */
    loadRememberedCredentials() {
      try {
        const remembered = localStorage.getItem('km_portal_remember_me')
        
        if (remembered === 'true') {
          const savedUsername = localStorage.getItem('km_portal_saved_username')
          
          if (savedUsername) {
            this.loginForm.username = savedUsername
            this.rememberMe = true
            
            console.log('[Login] 저장된 로그인 정보 복원:', savedUsername)
          }
        }
      } catch (error) {
        console.error('[Login] 저장된 로그인 정보 불러오기 실패:', error)
        // 오류가 발생해도 계속 진행
      }
    },

    /**
     * 로그인 정보를 저장하거나 제거하는 메서드
     * 
     * @param {string} username - 저장할 사용자명
     */
    saveOrClearCredentials(username) {
      try {
        if (this.rememberMe) {
          // 로그인 정보 기억 옵션이 활성화된 경우 저장
          localStorage.setItem('km_portal_remember_me', 'true')
          localStorage.setItem('km_portal_saved_username', username)
          
          console.log('[Login] 로그인 정보 저장됨')
        } else {
          // 옵션이 비활성화된 경우 저장된 정보 제거
          localStorage.removeItem('km_portal_remember_me')
          localStorage.removeItem('km_portal_saved_username')
          
          console.log('[Login] 저장된 로그인 정보 제거됨')
        }
      } catch (error) {
        console.error('[Login] 로그인 정보 저장/제거 실패:', error)
        // 오류가 발생해도 로그인은 계속 진행
      }
    },

    /**
     * 로그인 처리를 담당하는 메인 메서드
     * 
     * 폼 검증, API 호출, 결과 처리, 페이지 이동 등
     * 로그인과 관련된 전체 플로우를 관리합니다.
     */
    async handleLogin() {
      try {
        // 이미 로딩 중이면 중복 처리 방지
        if (this.isLoading) {
          return
        }
        
        // 에러 메시지 초기화
        this.errorMessage = ''
        
        // 폼 검증 실행
        const isValid = await this.validateForm()
        if (!isValid) {
          return
        }
        
        // 로딩 상태 시작
        this.isLoading = true
        
        console.log('[Login] 로그인 시도:', this.loginForm.username)
        
        // Vuex 액션을 통한 로그인 처리
        const result = await this.login({
          username: this.loginForm.username,
          password: this.loginForm.password
        })
        
        if (result.success) {
          // 로그인 성공 처리
          console.log('[Login] 로그인 성공:', result.userInfo.username)
          
          // 로그인 정보 저장/제거 처리
          this.saveOrClearCredentials(this.loginForm.username)
          
          // 성공 메시지 표시
          this.$message.success({
            message: `환영합니다, ${result.userInfo.fullName}님!`,
            duration: 2000
          })
          
          // 페이지 이동 (0.5초 후)
          setTimeout(() => {
            this.navigateAfterLogin()
          }, 500)
          
        } else {
          // 로그인 실패 처리
          this.errorMessage = result.message || '로그인에 실패했습니다.'
          
          console.warn('[Login] 로그인 실패:', this.errorMessage)
          
          // 비밀번호 필드 초기화 (보안)
          this.loginForm.password = ''
          
          // 사용자명 필드에 포커스
          this.$nextTick(() => {
            const usernameInput = this.$refs.loginFormRef.$el.querySelector('input')
            if (usernameInput) {
              usernameInput.focus()
              usernameInput.select()
            }
          })
        }
        
      } catch (error) {
        // 예외 발생시 에러 처리
        console.error('[Login] 로그인 처리 오류:', error)
        
        this.errorMessage = error.message || '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        
        // 비밀번호 필드 초기화
        this.loginForm.password = ''
        
      } finally {
        // 로딩 상태 종료
        this.isLoading = false
      }
    },

    /**
     * 폼 검증을 수행하는 메서드
     * 
     * @returns {Promise<boolean>} 검증 성공시 true, 실패시 false
     */
    async validateForm() {
      try {
        // Element UI 폼 검증 실행
        await this.$refs.loginFormRef.validate()
        return true
        
      } catch (error) {
        // 검증 실패시 첫 번째 오류 필드에 포커스
        this.$nextTick(() => {
          const errorField = this.$refs.loginFormRef.$el.querySelector('.is-error input')
          if (errorField) {
            errorField.focus()
          }
        })
        
        return false
      }
    },

    /**
     * 로그인 성공 후 페이지 이동을 처리하는 메서드
     * 
     * 이전 페이지 정보가 있으면 그곳으로, 없으면 기본 대시보드로 이동합니다.
     */
    navigateAfterLogin() {
      try {
        // URL 쿼리 파라미터에서 리디렉션 경로 확인
        const redirect = this.$route.query.redirect
        
        if (redirect && redirect !== '/login') {
          // 이전 페이지로 이동
          console.log('[Login] 이전 페이지로 이동:', redirect)
          this.$router.push(redirect)
        } else {
          // 기본 페이지 (대시보드)로 이동
          console.log('[Login] 대시보드로 이동')
          this.$router.push('/')
        }
        
      } catch (error) {
        console.error('[Login] 페이지 이동 오류:', error)
        
        // 이동 실패시 기본 경로로 강제 이동
        window.location.href = '/'
      }
    },

    /**
     * 회원가입 페이지로 이동하는 메서드
     * 
     * 사용자를 회원가입 페이지로 리디렉션합니다.
     */
    goToRegister() {
      console.log('[Login] 회원가입 페이지로 이동')
      this.$router.push('/auth/register')
    },

    /**
     * 테스트 계정 정보를 자동으로 입력하는 메서드 (개발 모드 전용)
     * 
     * @param {Object} account - 테스트 계정 정보
     * @param {string} account.username - 사용자명
     * @param {string} account.password - 비밀번호
     */
    fillTestAccount(account) {
      // 개발 모드에서만 동작
      if (!this.isDevelopment) {
        return
      }
      
      console.log('[Login] 테스트 계정 자동 입력:', account.username)
      
      // 폼에 계정 정보 입력
      this.loginForm.username = account.username
      this.loginForm.password = account.password
      
      // 에러 메시지 초기화
      this.errorMessage = ''
      
      // 폼 검증 상태 초기화
      this.$nextTick(() => {
        this.$refs.loginFormRef.clearValidate()
      })
      
      // 사용 편의성을 위한 알림
      this.$message.info({
        message: `${account.label} 계정 정보가 입력되었습니다.`,
        duration: 1500
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * 로그인 페이지 스타일 정의
 * 
 * SCSS를 사용하여 컴포넌트 스타일을 정의합니다.
 * 반응형 디자인과 다크 모드를 지원하는 모던한 UI를 구현합니다.
 */

/* 메인 컨테이너 스타일 */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* 다크 모드 지원 */
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
}

/* 로그인 카드 스타일 */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 30px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  
  /* 카드 내부 여백 제거 */
  ::v-deep .el-card__body {
    padding: 0;
  }
}

/* 로그인 헤더 스타일 */
.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo {
    font-size: 48px;
    color: #667eea;
    margin-bottom: 20px;
    
    i {
      display: inline-block;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  }
  
  .title {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    font-size: 14px;
    color: #7f8c8d;
    margin: 0;
    font-weight: 400;
  }
}

/* 로그인 폼 스타일 */
.login-form {
  .el-form-item {
    margin-bottom: 24px;
    
    /* 마지막 폼 아이템의 하단 여백 제거 */
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* 입력 필드 스타일 커스터마이징 */
  ::v-deep .el-input {
    .el-input__inner {
      height: 48px;
      line-height: 48px;
      border-radius: 8px;
      border: 2px solid #e8ecf0;
      font-size: 15px;
      transition: all 0.3s ease;
      
      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
      }
    }
    
    /* 아이콘 스타일 */
    .el-input__prefix {
      color: #95a3b9;
    }
  }
}

/* 로그인 옵션 스타일 */
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .el-checkbox {
    ::v-deep .el-checkbox__label {
      font-size: 14px;
      color: #5a6c7d;
    }
  }
  
  .el-link {
    font-size: 14px;
  }
}

/* 로그인 버튼 스타일 */
.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

/* 에러 메시지 스타일 */
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
  
  i {
    margin-right: 6px;
    font-size: 16px;
  }
}

/* 회원가입 섹션 스타일 */
.register-section {
  margin-top: 30px;
  padding-top: 20px;
  text-align: center;
  
  .el-divider {
    margin: 0 0 20px 0;
    
    ::v-deep .el-divider__text {
      font-size: 13px;
      color: #95a3b9;
      font-weight: 500;
    }
  }
  
  .register-text {
    color: #7f8c8d;
    font-size: 14px;
    margin: 16px 0;
    font-weight: 400;
  }
  
  .register-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    border: 2px dashed #e8ecf0;
    background: white;
    color: #667eea;
    transition: all 0.3s ease;
    
    i {
      margin-right: 8px;
      font-size: 18px;
    }
    
    &:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

/* 테스트 계정 영역 스타일 (개발 모드) */
.test-accounts {
  margin-top: 30px;
  padding-top: 20px;
  
  .el-divider {
    margin: 0 0 20px 0;
    
    ::v-deep .el-divider__text {
      font-size: 13px;
      color: #95a3b9;
      font-weight: 500;
    }
  }
  
  .account-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 16px;
    
    .account-tag {
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      padding: 6px 12px;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
  
  .test-note {
    font-size: 12px;
    color: #95a3b9;
    text-align: center;
    margin: 0;
    line-height: 1.4;
    
    i {
      margin-right: 4px;
    }
  }
}

/* 푸터 스타일 */
.login-footer {
  margin-top: 30px;
  text-align: center;
  
  p {
    margin: 4px 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.4;
    
    &:first-child {
      font-weight: 500;
    }
  }
}

/* 반응형 디자인 - 태블릿 */
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
  }
  
  .login-card {
    max-width: 100%;
    padding: 30px 20px;
  }
  
  .login-header {
    .logo {
      font-size: 40px;
    }
    
    .title {
      font-size: 24px;
    }
  }
}

/* 반응형 디자인 - 모바일 */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
    min-height: 100vh;
  }
  
  .login-card {
    padding: 25px 15px;
    border-radius: 8px;
  }
  
  .login-header {
    margin-bottom: 30px;
    
    .logo {
      font-size: 36px;
    }
    
    .title {
      font-size: 20px;
    }
    
    .subtitle {
      font-size: 13px;
    }
  }
  
  .login-form {
    ::v-deep .el-input .el-input__inner {
      height: 44px;
      line-height: 44px;
      font-size: 14px;
    }
  }
  
  .login-button {
    height: 44px;
    font-size: 15px;
  }
  
  .test-accounts {
    .account-list {
      .account-tag {
        font-size: 11px;
        padding: 5px 10px;
      }
    }
  }
}
</style>