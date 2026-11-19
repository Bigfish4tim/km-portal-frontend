<template>
  <!-- 
    마이페이지 컴포넌트
    - 사용자 개인정보 관리 및 설정
    - 프로필 수정, 비밀번호 변경, 알림 설정
    - 활동 내역, 통계 정보 제공
    - 향후 구현 예정 (2-3주차)
  -->
  <div class="mypage">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">마이페이지</h1>
      <p class="page-description">
        개인정보를 확인하고 수정할 수 있으며, 계정 설정을 관리할 수 있습니다.
      </p>
    </div>

    <el-row :gutter="20">
      <!-- 왼쪽 프로필 영역 -->
      <el-col :span="8">
        <!-- 프로필 카드 -->
        <el-card class="profile-card">
          <div class="profile-section">
            <!-- 프로필 이미지 -->
            <div class="avatar-section">
              <el-avatar :size="120" :src="userProfile.avatarUrl" icon="el-icon-user-solid"></el-avatar>
              <div class="avatar-upload">
                <el-upload
                  class="avatar-uploader"
                  :action="avatarUploadUrl"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-success="handleAvatarSuccess">
                  <el-button size="mini" type="text" icon="el-icon-camera">사진 변경</el-button>
                </el-upload>
              </div>
            </div>

            <!-- 기본 정보 -->
            <div class="basic-info">
              <h3 class="user-name">{{ userProfile.fullName }}</h3>
              <p class="user-title">{{ userProfile.position }} / {{ userProfile.department }}</p>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="label">가입일</span>
                  <span class="value">{{ formatDate(userProfile.joinDate) }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">최근 로그인</span>
                  <span class="value">{{ formatDateTime(userProfile.lastLoginAt) }}</span>
                </div>
              </div>
            </div>

            <!-- 역할 및 권한 -->
            <div class="role-section">
              <h4>역할 및 권한</h4>
              <div class="roles">
                <el-tag
                  v-for="role in userProfile.roles"
                  :key="role.roleId"
                  :type="getRoleTagType(role.roleName)"
                  size="small">
                  {{ role.displayName }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 활동 통계 -->
        <el-card class="activity-card">
          <div slot="header">
            <span>활동 통계</span>
          </div>
          <div class="activity-stats">
            <div class="activity-item">
              <div class="activity-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="activity-details">
                <div class="activity-count">{{ activityStats.postsCount }}</div>
                <div class="activity-label">작성한 게시글</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i class="el-icon-chat-line-square"></i>
              </div>
              <div class="activity-details">
                <div class="activity-count">{{ activityStats.commentsCount }}</div>
                <div class="activity-label">작성한 댓글</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i class="el-icon-folder"></i>
              </div>
              <div class="activity-details">
                <div class="activity-count">{{ activityStats.filesCount }}</div>
                <div class="activity-label">업로드한 파일</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i class="el-icon-download"></i>
              </div>
              <div class="activity-details">
                <div class="activity-count">{{ activityStats.downloadsCount }}</div>
                <div class="activity-label">다운로드 횟수</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 오른쪽 설정 영역 -->
      <el-col :span="16">
        <!-- 탭 메뉴 -->
        <el-card class="settings-card">
          <el-tabs v-model="activeTab" class="settings-tabs">
            <!-- 개인정보 수정 탭 -->
            <el-tab-pane label="개인정보 수정" name="profile">
              <!-- 개발 중 안내 -->
              <el-alert
                title="개인정보 수정 기능은 현재 개발 중입니다"
                type="info"
                description="개인정보 수정, 비밀번호 변경 등의 기능은 2-3주차에 구현될 예정입니다."
                show-icon
                :closable="false"
                style="margin-bottom: 20px;">
              </el-alert>

              <el-form
                ref="profileForm"
                :model="profileForm"
                :rules="profileRules"
                label-width="120px"
                class="profile-form">
                
                <el-form-item label="사용자명" prop="username">
                  <el-input v-model="profileForm.username" disabled>
                    <template slot="append">변경 불가</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="성명" prop="fullName">
                  <el-input v-model="profileForm.fullName" placeholder="성명을 입력하세요"></el-input>
                </el-form-item>

                <el-form-item label="이메일" prop="email">
                  <el-input v-model="profileForm.email" placeholder="이메일을 입력하세요">
                    <el-button slot="append" @click="verifyEmail" :disabled="!profileForm.email">
                      인증
                    </el-button>
                  </el-input>
                </el-form-item>

                <el-form-item label="전화번호" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="전화번호를 입력하세요"></el-input>
                </el-form-item>

                <el-form-item label="부서" prop="department">
                  <el-select v-model="profileForm.department" placeholder="부서를 선택하세요">
                    <el-option
                      v-for="dept in departments"
                      :key="dept.value"
                      :label="dept.label"
                      :value="dept.value">
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="직급" prop="position">
                  <el-select v-model="profileForm.position" placeholder="직급을 선택하세요">
                    <el-option
                      v-for="pos in positions"
                      :key="pos.value"
                      :label="pos.label"
                      :value="pos.value">
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="자기소개">
                  <el-input
                    type="textarea"
                    v-model="profileForm.bio"
                    :rows="4"
                    placeholder="간단한 자기소개를 입력하세요"
                    maxlength="500"
                    show-word-limit>
                  </el-input>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="updateProfile" :loading="updating">
                    정보 수정
                  </el-button>
                  <el-button @click="resetProfileForm">초기화</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 비밀번호 변경 탭 -->
            <el-tab-pane label="비밀번호 변경" name="password">
              <el-form
                ref="passwordForm"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="150px"
                class="password-form">
                
                <el-form-item label="현재 비밀번호" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    placeholder="현재 비밀번호를 입력하세요"
                    show-password>
                  </el-input>
                </el-form-item>

                <el-form-item label="새 비밀번호" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="새 비밀번호를 입력하세요"
                    show-password>
                  </el-input>
                  <div class="password-strength">
                    <span class="strength-label">비밀번호 강도:</span>
                    <div class="strength-bar">
                      <div class="strength-fill" :class="passwordStrengthClass"></div>
                    </div>
                    <span class="strength-text">{{ passwordStrengthText }}</span>
                  </div>
                </el-form-item>

                <el-form-item label="비밀번호 확인" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="새 비밀번호를 다시 입력하세요"
                    show-password>
                  </el-input>
                </el-form-item>

                <div class="password-requirements">
                  <h4>비밀번호 요구사항:</h4>
                  <ul>
                    <li :class="{ 'valid': passwordChecks.length }">8자리 이상</li>
                    <li :class="{ 'valid': passwordChecks.uppercase }">대문자 포함</li>
                    <li :class="{ 'valid': passwordChecks.lowercase }">소문자 포함</li>
                    <li :class="{ 'valid': passwordChecks.number }">숫자 포함</li>
                    <li :class="{ 'valid': passwordChecks.special }">특수문자 포함</li>
                  </ul>
                </div>

                <el-form-item>
                  <el-button type="primary" @click="changePassword" :loading="changingPassword">
                    비밀번호 변경
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 알림 설정 탭 -->
            <el-tab-pane label="알림 설정" name="notifications">
              <div class="notification-settings">
                <h3>알림 수신 설정</h3>
                <p class="settings-description">받고 싶은 알림 유형을 선택하세요.</p>

                <div class="notification-groups">
                  <div class="notification-group">
                    <h4>이메일 알림</h4>
                    <el-checkbox-group v-model="notificationSettings.email">
                      <el-checkbox label="newPost">새 게시글 알림</el-checkbox>
                      <el-checkbox label="newComment">새 댓글 알림</el-checkbox>
                      <el-checkbox label="mention">멘션 알림</el-checkbox>
                      <el-checkbox label="systemNotice">시스템 공지</el-checkbox>
                    </el-checkbox-group>
                  </div>

                  <div class="notification-group">
                    <h4>브라우저 알림</h4>
                    <el-checkbox-group v-model="notificationSettings.browser">
                      <el-checkbox label="newMessage">새 메시지</el-checkbox>
                      <el-checkbox label="taskReminder">업무 리마인더</el-checkbox>
                      <el-checkbox label="meetingReminder">회의 알림</el-checkbox>
                    </el-checkbox-group>
                  </div>

                  <div class="notification-group">
                    <h4>모바일 푸시 알림</h4>
                    <el-checkbox-group v-model="notificationSettings.push">
                      <el-checkbox label="urgent">긴급 알림</el-checkbox>
                      <el-checkbox label="daily">일일 요약</el-checkbox>
                      <el-checkbox label="weekly">주간 리포트</el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>

                <div class="notification-schedule">
                  <h4>알림 수신 시간</h4>
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="시작 시간">
                        <el-time-picker
                          v-model="notificationSettings.startTime"
                          format="HH:mm"
                          placeholder="시작 시간 선택">
                        </el-time-picker>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="종료 시간">
                        <el-time-picker
                          v-model="notificationSettings.endTime"
                          format="HH:mm"
                          placeholder="종료 시간 선택">
                        </el-time-picker>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>

                <el-button type="primary" @click="updateNotificationSettings" :loading="updatingNotifications">
                  알림 설정 저장
                </el-button>
              </div>
            </el-tab-pane>

            <!-- 활동 내역 탭 -->
            <el-tab-pane label="활동 내역" name="activity">
              <div class="activity-history">
                <div class="activity-filters">
                  <el-date-picker
                    v-model="activityDateRange"
                    type="daterange"
                    range-separator="~"
                    start-placeholder="시작일"
                    end-placeholder="종료일"
                    format="yyyy-MM-dd"
                    value-format="yyyy-MM-dd">
                  </el-date-picker>
                  <el-select v-model="activityType" placeholder="활동 유형" clearable>
                    <el-option label="전체" value=""></el-option>
                    <el-option label="게시글" value="post"></el-option>
                    <el-option label="댓글" value="comment"></el-option>
                    <el-option label="파일" value="file"></el-option>
                    <el-option label="로그인" value="login"></el-option>
                  </el-select>
                  <el-button @click="fetchActivityHistory" icon="el-icon-search">조회</el-button>
                </div>

                <el-timeline class="activity-timeline">
                  <el-timeline-item
                    v-for="activity in activityHistory"
                    :key="activity.id"
                    :timestamp="formatDateTime(activity.createdAt)"
                    :type="getActivityType(activity.type)">
                    <div class="activity-content">
                      <div class="activity-title">
                        <i :class="getActivityIcon(activity.type)"></i>
                        {{ activity.title }}
                      </div>
                      <div class="activity-description">{{ activity.description }}</div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>

            <!-- 계정 설정 탭 -->
            <el-tab-pane label="계정 설정" name="account">
              <div class="account-settings">
                <div class="setting-section">
                  <h3>언어 및 지역</h3>
                  <el-form label-width="120px">
                    <el-form-item label="언어">
                      <el-select v-model="accountSettings.language">
                        <el-option label="한국어" value="ko"></el-option>
                        <el-option label="English" value="en"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="시간대">
                      <el-select v-model="accountSettings.timezone">
                        <el-option label="Asia/Seoul" value="Asia/Seoul"></el-option>
                        <el-option label="UTC" value="UTC"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>

                <div class="setting-section">
                  <h3>개인정보 설정</h3>
                  <el-form label-width="120px">
                    <el-form-item>
                      <el-checkbox v-model="accountSettings.showProfile">
                        다른 사용자에게 프로필 공개
                      </el-checkbox>
                    </el-form-item>
                    <el-form-item>
                      <el-checkbox v-model="accountSettings.showActivity">
                        활동 내역 공개
                      </el-checkbox>
                    </el-form-item>
                    <el-form-item>
                      <el-checkbox v-model="accountSettings.allowContact">
                        다른 사용자의 연락 허용
                      </el-checkbox>
                    </el-form-item>
                  </el-form>
                </div>

                <div class="setting-section danger-section">
                  <h3>계정 관리</h3>
                  <p class="danger-text">주의: 아래 작업들은 되돌릴 수 없습니다.</p>
                  <el-button type="warning" @click="exportUserData">
                    개인 데이터 내보내기
                  </el-button>
                  <el-button type="danger" @click="deactivateAccount">
                    계정 비활성화
                  </el-button>
                </div>

                <el-button type="primary" @click="updateAccountSettings" :loading="updatingAccount">
                  설정 저장
                </el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
/**
 * MyPageView.vue
 * 
 * 마이페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (2-3주차에 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 개인정보 수정 - 프로필 정보, 연락처, 부서/직급
 * 2. 비밀번호 변경 - 보안 강화, 복잡도 체크
 * 3. 프로필 이미지 - 업로드, 크롭, 썸네일 생성
 * 4. 알림 설정 - 이메일, 브라우저, 모바일 푸시
 * 5. 활동 내역 - 게시글, 댓글, 파일 업로드 기록
 * 6. 계정 설정 - 언어, 시간대, 개인정보 공개 설정
 * 7. 보안 설정 - 2FA, 로그인 기록, 세션 관리
 * 
 * 보안 고려사항:
 * - 비밀번호 변경 시 현재 비밀번호 확인
 * - 중요 정보 변경 시 이메일 인증
 * - 활동 로그 및 감사 추적
 * - 개인정보 처리 방침 준수
 */

export default {
  name: 'MyPageView',
  
  data() {
    return {
      // 활성 탭
      activeTab: 'profile',
      
      // 아바타 업로드 URL
      avatarUploadUrl: '/api/user/avatar',
      
      // 사용자 프로필 정보 (임시 데이터)
      userProfile: {
        userId: 1,
        username: 'user01',
        fullName: '홍길동',
        email: 'user01@kmportal.com',
        phone: '010-1234-5678',
        department: 'IT팀',
        position: '대리',
        bio: '안녕하세요. IT팀에서 백엔드 개발을 담당하고 있는 홍길동입니다.',
        avatarUrl: '',
        joinDate: new Date('2024-01-15'),
        lastLoginAt: new Date('2024-09-24T09:30:00'),
        roles: [
          { roleId: 1, roleName: 'ROLE_USER', displayName: '일반 사용자' },
          { roleId: 2, roleName: 'ROLE_DEVELOPER', displayName: '개발자' }
        ]
      },
      
      // 활동 통계
      activityStats: {
        postsCount: 12,
        commentsCount: 45,
        filesCount: 23,
        downloadsCount: 156
      },
      
      // 프로필 수정 폼
      profileForm: {
        username: 'user01',
        fullName: '홍길동',
        email: 'user01@kmportal.com',
        phone: '010-1234-5678',
        department: 'IT팀',
        position: '대리',
        bio: '안녕하세요. IT팀에서 백엔드 개발을 담당하고 있는 홍길동입니다.'
      },
      
      // 프로필 폼 유효성 검사 규칙
      profileRules: {
        fullName: [
          { required: true, message: '성명을 입력하세요', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
          { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
        ]
      },
      
      // 비밀번호 변경 폼
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      
      // 비밀번호 폼 유효성 검사 규칙
      passwordRules: {
        currentPassword: [
          { required: true, message: '현재 비밀번호를 입력하세요', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '새 비밀번호를 입력하세요', trigger: 'blur' },
          { min: 8, message: '비밀번호는 8자리 이상이어야 합니다', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '비밀번호를 다시 입력하세요', trigger: 'blur' },
          { validator: this.validatePasswordConfirm, trigger: 'blur' }
        ]
      },
      
      // 알림 설정
      notificationSettings: {
        email: ['systemNotice'],
        browser: ['newMessage'],
        push: ['urgent'],
        startTime: new Date(2024, 0, 1, 9, 0),
        endTime: new Date(2024, 0, 1, 18, 0)
      },
      
      // 계정 설정
      accountSettings: {
        language: 'ko',
        timezone: 'Asia/Seoul',
        showProfile: true,
        showActivity: false,
        allowContact: true
      },
      
      // 활동 내역
      activityDateRange: [],
      activityType: '',
      activityHistory: [
        {
          id: 1,
          type: 'login',
          title: '로그인',
          description: '시스템에 로그인했습니다.',
          createdAt: new Date('2024-09-24T09:30:00')
        },
        {
          id: 2,
          type: 'post',
          title: '게시글 작성',
          description: '"프로젝트 진행 상황 공유" 게시글을 작성했습니다.',
          createdAt: new Date('2024-09-23T14:20:00')
        },
        {
          id: 3,
          type: 'comment',
          title: '댓글 작성',
          description: '"업무 효율성 개선 방안" 게시글에 댓글을 작성했습니다.',
          createdAt: new Date('2024-09-23T10:15:00')
        },
        {
          id: 4,
          type: 'file',
          title: '파일 업로드',
          description: '"회의록_20240923.pdf" 파일을 업로드했습니다.',
          createdAt: new Date('2024-09-23T09:45:00')
        }
      ],
      
      // 부서 목록
      departments: [
        { label: 'IT팀', value: 'IT팀' },
        { label: '기획팀', value: '기획팀' },
        { label: '영업팀', value: '영업팀' },
        { label: '마케팅팀', value: '마케팅팀' },
        { label: '인사팀', value: '인사팀' },
        { label: '재무팀', value: '재무팀' }
      ],
      
      // 직급 목록
      positions: [
        { label: '사원', value: '사원' },
        { label: '주임', value: '주임' },
        { label: '대리', value: '대리' },
        { label: '과장', value: '과장' },
        { label: '차장', value: '차장' },
        { label: '부장', value: '부장' }
      ],
      
      // 상태 변수들
      updating: false,
      changingPassword: false,
      updatingNotifications: false,
      updatingAccount: false
    }
  },

  computed: {
    /**
     * 비밀번호 강도 체크
     */
    passwordChecks() {
      const password = this.passwordForm.newPassword;
      return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
    },

    /**
     * 비밀번호 강도 클래스
     */
    passwordStrengthClass() {
      const validCount = Object.values(this.passwordChecks).filter(Boolean).length;
      if (validCount < 2) return 'weak';
      if (validCount < 4) return 'medium';
      return 'strong';
    },

    /**
     * 비밀번호 강도 텍스트
     */
    passwordStrengthText() {
      const validCount = Object.values(this.passwordChecks).filter(Boolean).length;
      if (validCount < 2) return '약함';
      if (validCount < 4) return '보통';
      return '강함';
    }
  },

  created() {
    console.log('[MyPageView] 컴포넌트가 생성되었습니다');
    console.log('[MyPageView] 마이페이지 기능 - 2-3주차에 본격 개발됩니다');
    
    // 초기 데이터 설정
    this.initializeProfileForm();
  },

  methods: {
    /**
     * 프로필 폼 초기화
     */
    initializeProfileForm() {
      this.profileForm = { ...this.userProfile };
    },

    /**
     * 프로필 정보 업데이트
     */
    updateProfile() {
      this.$refs.profileForm.validate((valid) => {
        if (valid) {
          this.updating = true;
          
          console.log('[MyPageView] 프로필 업데이트:', this.profileForm);
          
          // 실제 구현 시 사용할 API 호출
          setTimeout(() => {
            this.updating = false;
            this.$message.success('개인정보가 성공적으로 수정되었습니다');
            
            // 프로필 정보 동기화
            Object.assign(this.userProfile, this.profileForm);
          }, 2000);
          
          // 실제 구현: this.$api.user.updateProfile(this.profileForm)
        }
      });
    },

    /**
     * 프로필 폼 초기화
     */
    resetProfileForm() {
      this.initializeProfileForm();
      this.$refs.profileForm.clearValidate();
    },

    /**
     * 이메일 인증
     */
    verifyEmail() {
      console.log('[MyPageView] 이메일 인증:', this.profileForm.email);
      this.$message.info('이메일 인증 기능은 구현 예정입니다');
    },

    /**
     * 비밀번호 확인 유효성 검사
     */
    validatePasswordConfirm(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('비밀번호가 일치하지 않습니다'));
      } else {
        callback();
      }
    },

    /**
     * 비밀번호 변경
     */
    changePassword() {
      this.$refs.passwordForm.validate((valid) => {
        if (valid) {
          this.changingPassword = true;
          
          console.log('[MyPageView] 비밀번호 변경 요청');
          
          // 실제 구현 시 사용할 API 호출
          setTimeout(() => {
            this.changingPassword = false;
            this.$message.success('비밀번호가 성공적으로 변경되었습니다');
            
            // 폼 초기화
            this.passwordForm = {
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            };
            this.$refs.passwordForm.clearValidate();
          }, 2000);
          
          // 실제 구현: this.$api.user.changePassword(this.passwordForm)
        }
      });
    },

    /**
     * 아바타 업로드 전 검사
     */
    beforeAvatarUpload(file) {
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$message.error('이미지 파일만 업로드 가능합니다');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('이미지 크기는 2MB를 초과할 수 없습니다');
        return false;
      }
      return true;
    },

    /**
     * 아바타 업로드 성공 처리
     */
    handleAvatarSuccess(response) {
      console.log('[MyPageView] 아바타 업로드 성공:', response);
      this.userProfile.avatarUrl = response.url;
      this.$message.success('프로필 사진이 변경되었습니다');
    },

    /**
     * 알림 설정 업데이트
     */
    updateNotificationSettings() {
      this.updatingNotifications = true;
      
      console.log('[MyPageView] 알림 설정 업데이트:', this.notificationSettings);
      
      setTimeout(() => {
        this.updatingNotifications = false;
        this.$message.success('알림 설정이 저장되었습니다');
      }, 1000);
      
      // 실제 구현: this.$api.user.updateNotificationSettings(this.notificationSettings)
    },

    /**
     * 계정 설정 업데이트
     */
    updateAccountSettings() {
      this.updatingAccount = true;
      
      console.log('[MyPageView] 계정 설정 업데이트:', this.accountSettings);
      
      setTimeout(() => {
        this.updatingAccount = false;
        this.$message.success('계정 설정이 저장되었습니다');
      }, 1000);
      
      // 실제 구현: this.$api.user.updateAccountSettings(this.accountSettings)
    },

    /**
     * 활동 내역 조회
     */
    fetchActivityHistory() {
      console.log('[MyPageView] 활동 내역 조회:', {
        dateRange: this.activityDateRange,
        type: this.activityType
      });
      
      // 실제 구현 시 API 호출로 활동 내역 가져오기
      // this.$api.user.getActivityHistory({
      //   startDate: this.activityDateRange[0],
      //   endDate: this.activityDateRange[1],
      //   type: this.activityType
      // })
    },

    /**
     * 개인 데이터 내보내기
     */
    exportUserData() {
      this.$confirm('개인 데이터를 내보내시겠습니까?', '데이터 내보내기', {
        confirmButtonText: '내보내기',
        cancelButtonText: '취소',
        type: 'info'
      }).then(() => {
        console.log('[MyPageView] 개인 데이터 내보내기 요청');
        this.$message.success('데이터 내보내기 요청이 처리되었습니다');
        // 실제 구현: this.$api.user.exportUserData()
      }).catch(() => {
        console.log('[MyPageView] 데이터 내보내기 취소됨');
      });
    },

    /**
     * 계정 비활성화
     */
    deactivateAccount() {
      this.$confirm('정말로 계정을 비활성화하시겠습니까? 이 작업은 되돌릴 수 없습니다.', '계정 비활성화', {
        confirmButtonText: '비활성화',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        console.log('[MyPageView] 계정 비활성화 요청');
        this.$message.warning('계정 비활성화 기능은 구현 예정입니다');
        // 실제 구현: this.$api.user.deactivateAccount()
      }).catch(() => {
        console.log('[MyPageView] 계정 비활성화 취소됨');
      });
    },

    /**
     * 역할에 따른 태그 타입 반환
     */
    getRoleTagType(roleName) {
      const typeMap = {
        'ROLE_ADMIN': 'danger',
        'ROLE_MANAGER': 'warning',
        'ROLE_BOARD_ADMIN': 'info',
        'ROLE_USER': 'success',
        'ROLE_DEVELOPER': 'info'
      };
      return typeMap[roleName] || '';
    },

    /**
     * 활동 유형에 따른 타임라인 타입 반환
     */
    getActivityType(type) {
      const typeMap = {
        'login': 'success',
        'post': 'primary',
        'comment': 'info',
        'file': 'warning'
      };
      return typeMap[type] || '';
    },

    /**
     * 활동 유형에 따른 아이콘 반환
     */
    getActivityIcon(type) {
      const iconMap = {
        'login': 'el-icon-user',
        'post': 'el-icon-document',
        'comment': 'el-icon-chat-line-square',
        'file': 'el-icon-folder'
      };
      return iconMap[type] || 'el-icon-info';
    },

    /**
     * 날짜 포맷팅 (간단)
     */
    formatDate(date) {
      if (!(date instanceof Date)) return '';
      return date.toLocaleDateString('ko-KR');
    },

    /**
     * 날짜시간 포맷팅 (상세)
     */
    formatDateTime(date) {
      if (!(date instanceof Date)) return '';
      return date.toLocaleString('ko-KR');
    }
  }
}
</script>

<style scoped>
/* 마이페이지 스타일링 */

.mypage {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.page-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

/* 프로필 카드 */
.profile-card {
  margin-bottom: 20px;
}

.profile-section {
  text-align: center;
}

.avatar-section {
  margin-bottom: 20px;
}

.avatar-upload {
  margin-top: 10px;
}

.basic-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.user-name {
  margin: 0 0 5px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.user-title {
  margin: 0 0 15px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-item .label {
  color: #7f8c8d;
}

.stat-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.role-section h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

/* 활동 카드 */
.activity-card {
  margin-bottom: 20px;
}

.activity-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-radius: 6px;
  background-color: #fafbfc;
}

.activity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  font-size: 16px;
}

.activity-details {
  flex: 1;
}

.activity-count {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
}

.activity-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

/* 설정 카드 */
.settings-card {
  min-height: 600px;
}

.settings-tabs ::v-deep .el-tabs__content {
  padding: 20px 0;
}

/* 프로필 폼 */
.profile-form {
  max-width: 600px;
}

/* 비밀번호 폼 */
.password-form {
  max-width: 500px;
}

.password-strength {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-label {
  font-size: 12px;
  color: #7f8c8d;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: #e1e8ed;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.strength-fill.weak {
  width: 33%;
  background-color: #f56c6c;
}

.strength-fill.medium {
  width: 66%;
  background-color: #e6a23c;
}

.strength-fill.strong {
  width: 100%;
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
}

.password-requirements {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.password-requirements h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
}

.password-requirements ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.password-requirements li {
  padding: 2px 0;
  font-size: 13px;
  color: #909399;
}

.password-requirements li.valid {
  color: #67c23a;
}

.password-requirements li::before {
  content: '✗';
  margin-right: 8px;
  color: #f56c6c;
}

.password-requirements li.valid::before {
  content: '✓';
  color: #67c23a;
}

/* 알림 설정 */
.notification-settings {
  max-width: 700px;
}

.settings-description {
  color: #7f8c8d;
  margin-bottom: 25px;
}

.notification-groups {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-bottom: 30px;
}

.notification-group h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.notification-group ::v-deep .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-schedule {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.notification-schedule h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

/* 활동 내역 */
.activity-history {
  max-width: 800px;
}

.activity-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.activity-timeline {
  max-height: 500px;
  overflow-y: auto;
}

.activity-content {
  padding-left: 10px;
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 5px;
}

.activity-description {
  color: #7f8c8d;
  font-size: 13px;
}

/* 계정 설정 */
.account-settings {
  max-width: 600px;
}

.setting-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.setting-section:last-child {
  border-bottom: none;
}

.setting-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.danger-section {
  border-color: #f56c6c;
}

.danger-text {
  color: #f56c6c;
  margin-bottom: 15px;
  font-size: 14px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .mypage {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .activity-filters {
    flex-direction: column;
  }
  
  .notification-groups {
    gap: 20px;
  }
  
  .user-stats {
    gap: 5px;
  }
  
  .activity-item {
    gap: 10px;
  }
}

@media (max-width: 992px) {
  .mypage ::v-deep .el-col {
    margin-bottom: 20px;
  }
}
</style>