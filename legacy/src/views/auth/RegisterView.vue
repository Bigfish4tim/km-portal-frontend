<!-- ==============================================
📁 src/views/auth/RegisterView.vue
회원가입 페이지 (2일차 수정 버전)

【2일차 수정 내역】
- Role 선택 드롭다운 추가 (12개 Role 지원)
- ROLE_OPTIONS를 constants.js에서 import
- 기본값: ROLE_EMPLOYEE (일반사원)
- 그룹별 옵션 표시 (관리/임원/팀장/조사자/기타)
============================================== -->

<template>
    <div class="register-view">
        <div class="register-form-container">
            <!-- 페이지 헤더 -->
            <div class="form-header">
                <h2>회원가입</h2>
                <p>새로운 계정을 생성하세요</p>
            </div>

            <!-- 회원가입 폼 -->
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
                    <el-input v-model="registerForm.username" placeholder="영문, 숫자, 언더스코어만 사용 가능" clearable />
                </el-form-item>

                <!-- 이메일 -->
                <el-form-item prop="email" label="이메일">
                    <el-input v-model="registerForm.email" type="email" placeholder="이메일 주소를 입력하세요" clearable />
                </el-form-item>

                <!-- 실명 -->
                <el-form-item prop="fullName" label="실명">
                    <el-input v-model="registerForm.fullName" placeholder="실명을 입력하세요" clearable />
                </el-form-item>

                <!-- 부서 -->
                <el-form-item prop="department" label="부서">
                    <el-select v-model="registerForm.department" placeholder="부서를 선택하세요" style="width: 100%" clearable>
                        <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
                    </el-select>
                </el-form-item>

                <!-- 직급 -->
                <el-form-item prop="position" label="직급">
                    <el-select v-model="registerForm.position" placeholder="직급을 선택하세요" style="width: 100%" clearable>
                        <el-option v-for="pos in positions" :key="pos" :label="pos" :value="pos" />
                    </el-select>
                </el-form-item>

                <!-- 
          =========================================
          【2일차 신규】 역할(Role) 선택 드롭다운
          =========================================
          - 12개 Role 시스템 지원
          - 그룹별로 구분하여 표시
          - 기본값: ROLE_EMPLOYEE (일반사원)
          - 선택사항 (미선택 시 일반사원으로 등록)
        -->
                <el-form-item prop="roleName" label="역할">
                    <el-select v-model="registerForm.roleName" placeholder="역할을 선택하세요 (선택사항)" style="width: 100%" clearable>
                        <!-- 관리 그룹 -->
                        <el-option-group label="관리">
                            <el-option v-for="role in roleGroups.management" :key="role.value" :label="role.label" :value="role.value">
                                <span style="float: left">{{ role.label }}</span>
                                <span style="float: right; color: #8492a6; font-size: 12px">
                                    {{ role.description }}
                                </span>
                            </el-option>
                        </el-option-group>

                        <!-- 임원 그룹 -->
                        <el-option-group label="임원">
                            <el-option v-for="role in roleGroups.executive" :key="role.value" :label="role.label" :value="role.value">
                                <span style="float: left">{{ role.label }}</span>
                                <span style="float: right; color: #8492a6; font-size: 12px">
                                    {{ role.description }}
                                </span>
                            </el-option>
                        </el-option-group>

                        <!-- 팀장 그룹 -->
                        <el-option-group label="팀장">
                            <el-option v-for="role in roleGroups.teamLeader" :key="role.value" :label="role.label" :value="role.value">
                                <span style="float: left">{{ role.label }}</span>
                                <span style="float: right; color: #8492a6; font-size: 12px">
                                    {{ role.description }}
                                </span>
                            </el-option>
                        </el-option-group>

                        <!-- 조사자 그룹 -->
                        <el-option-group label="조사자">
                            <el-option v-for="role in roleGroups.investigator" :key="role.value" :label="role.label" :value="role.value">
                                <span style="float: left">{{ role.label }}</span>
                                <span style="float: right; color: #8492a6; font-size: 12px">
                                    {{ role.description }}
                                </span>
                            </el-option>
                        </el-option-group>

                        <!-- 기타 그룹 -->
                        <el-option-group label="기타">
                            <el-option v-for="role in roleGroups.other" :key="role.value" :label="role.label" :value="role.value">
                                <span style="float: left">{{ role.label }}</span>
                                <span style="float: right; color: #8492a6; font-size: 12px">
                                    {{ role.description }}
                                </span>
                            </el-option>
                        </el-option-group>
                    </el-select>

                    <!-- 역할 선택 도움말 -->
                    <div class="role-help-text">
                        <el-icon><InfoFilled /></el-icon>
                        <span>미선택 시 '일반사원'으로 등록됩니다. 관리자가 나중에 변경할 수 있습니다.</span>
                    </div>
                </el-form-item>

                <!-- 전화번호 -->
                <el-form-item prop="phoneNumber" label="전화번호">
                    <el-input v-model="registerForm.phoneNumber" placeholder="전화번호를 입력하세요 (선택사항)" clearable />
                </el-form-item>

                <!-- 비밀번호 -->
                <el-form-item prop="password" label="비밀번호">
                    <el-input v-model="registerForm.password" type="password" placeholder="비밀번호를 입력하세요" show-password clearable />
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
                <el-alert v-if="registerError" :title="registerError" type="error" :closable="false" show-icon class="error-alert" />
            </el-form>

            <!-- 로그인 링크 -->
            <div class="login-link">
                <span>이미 계정이 있으신가요?</span>
                <el-link type="primary" @click="goToLogin"> 로그인 </el-link>
            </div>

            <!-- 개발 환경 안내 -->
            <div v-if="isDevelopment" class="dev-notice">
                <el-alert title="개발 환경 안내" type="info" :closable="false" show-icon>
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
/**
 * =============================================================================
 * RegisterView.vue - 회원가입 페이지 (2일차 수정 버전)
 * =============================================================================
 *
 * 【2일차 수정 내역】
 * - Role 선택 드롭다운 추가 (12개 Role 지원)
 * - roleGroups 객체로 그룹별 Role 정의
 * - 회원가입 API 호출 시 roleName 포함
 *
 * @author KM Portal Team
 * @version 2.0 (2일차 Role 시스템 수정)
 * @since 2025-09-24
 * @modified 2026-01-30 - 12개 Role 시스템 반영
 */

import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import authService from '@/services/authService'

// 【2일차 수정】 Role 상수 import (constants.js에서)
// 만약 constants.js에 ROLES가 정의되어 있다면 아래처럼 import
// import { ROLES, ROLE_DISPLAY_NAMES } from '@/utils/constants'

export default {
    name: 'RegisterView',

    // Element Plus 아이콘 컴포넌트 등록
    components: {
        InfoFilled,
    },

    setup() {
        const router = useRouter()
        const store = useStore()

        // ========================================
        // 폼 참조 및 상태
        // ========================================

        // 폼 참조
        const registerFormRef = ref(null)

        // 반응형 데이터
        const isLoading = ref(false)
        const registerError = ref('')

        /**
         * 회원가입 폼 데이터
         *
         * 【2일차 수정】 roleName 필드 추가
         * - 기본값: 빈 문자열 (미선택 시 백엔드에서 ROLE_EMPLOYEE 할당)
         */
        const registerForm = reactive({
            username: '',
            email: '',
            fullName: '',
            department: '',
            position: '',
            roleName: '', // 【2일차 신규】 역할 선택
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            agreeToTerms: false,
        })

        // ========================================
        // 드롭다운 옵션 정의
        // ========================================

        // 부서 옵션
        const departments = [
            'IT팀',
            '인사팀',
            '기획팀',
            '영업팀',
            '마케팅팀',
            '재무팀',
            '법무팀',
            '운영팀',
            '연구개발팀',
            // 【2일차 추가】 손해사정 관련 부서
            '경영지원',
            '1종팀',
            '4종팀',
            '조사1팀',
            '조사2팀',
        ]

        // 직급 옵션
        const positions = ['사원', '주임', '대리', '과장', '차장', '부장', '상무', '전무', '대표']

        /**
         * 【2일차 신규】 역할 그룹별 옵션
         *
         * 12개 Role을 그룹별로 구분하여 드롭다운에 표시합니다.
         * 각 Role은 value(roleName)과 label(displayName)을 가집니다.
         */
        const roleGroups = {
            // 관리 그룹
            management: [
                {
                    value: 'ROLE_ADMIN',
                    label: '관리자',
                    description: '시스템 전체 관리',
                },
                {
                    value: 'ROLE_BUSINESS_SUPPORT',
                    label: '경영지원',
                    description: '전체 업무 접근',
                },
            ],

            // 임원 그룹
            executive: [
                {
                    value: 'ROLE_EXECUTIVE_ALL',
                    label: '임원(1/4종)',
                    description: '1종+4종 전체',
                },
                {
                    value: 'ROLE_EXECUTIVE_TYPE1',
                    label: '임원(1종)',
                    description: '1종 전체',
                },
                {
                    value: 'ROLE_EXECUTIVE_TYPE4',
                    label: '임원(4종)',
                    description: '4종 전체',
                },
            ],

            // 팀장 그룹
            teamLeader: [
                {
                    value: 'ROLE_TEAM_LEADER_ALL',
                    label: '팀장(1/4종)',
                    description: '자기 팀 1종+4종',
                },
                {
                    value: 'ROLE_TEAM_LEADER_TYPE1',
                    label: '팀장(1종)',
                    description: '자기 팀 1종',
                },
                {
                    value: 'ROLE_TEAM_LEADER_TYPE4',
                    label: '팀장(4종)',
                    description: '자기 팀 4종',
                },
            ],

            // 조사자 그룹
            investigator: [
                {
                    value: 'ROLE_INVESTIGATOR_ALL',
                    label: '조사자(1/4종)',
                    description: '자기 배당 1종+4종',
                },
                {
                    value: 'ROLE_INVESTIGATOR_TYPE1',
                    label: '조사자(1종)',
                    description: '자기 배당 1종',
                },
                {
                    value: 'ROLE_INVESTIGATOR_TYPE4',
                    label: '조사자(4종)',
                    description: '자기 배당 4종',
                },
            ],

            // 기타 그룹
            other: [
                {
                    value: 'ROLE_EMPLOYEE',
                    label: '일반사원',
                    description: '권한 없음',
                },
            ],
        }

        // ========================================
        // 유효성 검사 규칙
        // ========================================

        const registerRules = {
            username: [
                { required: true, message: '사용자명을 입력해주세요', trigger: 'blur' },
                { min: 3, max: 50, message: '사용자명은 3-50자여야 합니다', trigger: 'blur' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '영문, 숫자, 언더스코어만 사용 가능합니다', trigger: 'blur' },
            ],
            email: [
                { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' },
            ],
            fullName: [
                { required: true, message: '실명을 입력해주세요', trigger: 'blur' },
                { min: 2, max: 100, message: '실명은 2-100자여야 합니다', trigger: 'blur' },
            ],
            department: [{ required: true, message: '부서를 선택해주세요', trigger: 'change' }],
            position: [{ required: true, message: '직급을 선택해주세요', trigger: 'change' }],
            // 【2일차 신규】 역할은 선택사항이므로 required: false
            roleName: [
                // 선택사항 - 미선택 시 백엔드에서 ROLE_EMPLOYEE 할당
            ],
            password: [
                { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
                { min: 8, message: '비밀번호는 최소 8자 이상이어야 합니다', trigger: 'blur' },
                {
                    pattern: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: '영문, 숫자, 특수문자를 포함해야 합니다',
                    trigger: 'blur',
                },
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
                    trigger: 'blur',
                },
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
                    trigger: 'change',
                },
            ],
        }

        // ========================================
        // 계산된 속성
        // ========================================

        // 개발 환경 여부
        const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

        // ========================================
        // 메서드
        // ========================================

        /**
         * 회원가입 처리
         *
         * 【2일차 수정】 roleName을 API 요청에 포함
         */
        const handleRegister = async () => {
            if (!registerFormRef.value) return

            try {
                // 폼 유효성 검사
                const valid = await registerFormRef.value.validate()
                if (!valid) return

                isLoading.value = true
                registerError.value = ''

                // 【2일차 수정】 회원가입 API 호출 (roleName 포함)
                const result = await authService.register({
                    username: registerForm.username,
                    email: registerForm.email,
                    fullName: registerForm.fullName,
                    department: registerForm.department,
                    position: registerForm.position,
                    phoneNumber: registerForm.phoneNumber,
                    password: registerForm.password,
                    // 【2일차 신규】 역할 전송 (빈 문자열이면 백엔드에서 ROLE_EMPLOYEE 할당)
                    roleName: registerForm.roleName || null,
                })

                // 회원가입 결과 처리
                if (!result.success) {
                    throw new Error(result.message || '회원가입에 실패했습니다.')
                }

                // 회원가입 성공 - 선택된 역할 표시
                const roleLabel = getRoleLabel(registerForm.roleName) || '일반사원'
                ElMessage.success(`회원가입이 완료되었습니다! (역할: ${roleLabel})`)

                // 로그인 페이지로 이동
                router.push('/login')
            } catch (error) {
                registerError.value = error.message || '회원가입 처리 중 오류가 발생했습니다.'
                ElMessage.error(registerError.value)
            } finally {
                isLoading.value = false
            }
        }

        /**
         * 【2일차 신규】 Role 값에 해당하는 레이블 반환
         *
         * @param {string} roleValue - Role 값 (예: 'ROLE_ADMIN')
         * @returns {string} Role 레이블 (예: '관리자')
         */
        const getRoleLabel = (roleValue) => {
            if (!roleValue) return null

            // 모든 그룹에서 해당 Role 찾기
            const allRoles = [
                ...roleGroups.management,
                ...roleGroups.executive,
                ...roleGroups.teamLeader,
                ...roleGroups.investigator,
                ...roleGroups.other,
            ]

            const found = allRoles.find((role) => role.value === roleValue)
            return found ? found.label : roleValue
        }

        /**
         * 이용약관 표시
         */
        const showTerms = async () => {
            await ElMessageBox.alert('이용약관 내용이 여기에 표시됩니다. (개발 중)', '이용약관', { confirmButtonText: '확인' })
        }

        /**
         * 개인정보처리방침 표시
         */
        const showPrivacyPolicy = async () => {
            await ElMessageBox.alert('개인정보처리방침 내용이 여기에 표시됩니다. (개발 중)', '개인정보처리방침', {
                confirmButtonText: '확인',
            })
        }

        /**
         * 로그인 페이지로 이동
         */
        const goToLogin = () => {
            router.push('/login')
        }

        // ========================================
        // 템플릿에 노출할 데이터 및 메서드
        // ========================================

        return {
            // 참조
            registerFormRef,

            // 반응형 데이터
            registerForm,
            registerRules,
            isLoading,
            registerError,

            // 드롭다운 옵션
            departments,
            positions,
            roleGroups, // 【2일차 신규】

            // 계산된 속성
            isDevelopment,

            // 메서드
            handleRegister,
            showTerms,
            showPrivacyPolicy,
            goToLogin,
            getRoleLabel, // 【2일차 신규】
        }
    },
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

            /* 【2일차 신규】 역할 선택 도움말 스타일 */
            .role-help-text {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 4px;
                font-size: 12px;
                color: var(--el-text-color-secondary);

                .el-icon {
                    font-size: 14px;
                }
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

/* 【2일차 신규】 Role 드롭다운 옵션 스타일 */
:deep(.el-select-dropdown__item) {
    height: auto;
    padding: 8px 20px;
    line-height: 1.5;
}

:deep(.el-select-group__title) {
    font-weight: 600;
    color: var(--el-text-color-primary);
}
</style>
