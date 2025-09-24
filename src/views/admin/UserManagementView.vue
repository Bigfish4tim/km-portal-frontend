<template>
  <!-- 
    사용자 관리 페이지 컴포넌트
    - 관리자가 시스템의 모든 사용자를 조회, 수정, 삭제할 수 있는 페이지
    - 사용자 권한 변경, 계정 활성화/비활성화 기능 제공
    - 향후 구현 예정 (4일차 이후)
  -->
  <div class="user-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">사용자 관리</h1>
      <p class="page-description">
        시스템 사용자를 조회하고 권한을 관리할 수 있습니다.
      </p>
    </div>

    <!-- 개발 중 안내 -->
    <el-card class="development-notice">
      <div slot="header" class="clearfix">
        <span>🚧 개발 중인 기능</span>
      </div>
      <div class="notice-content">
        <el-alert
          title="이 페이지는 현재 개발 중입니다"
          type="info"
          description="사용자 관리 기능은 4일차부터 본격적으로 구현될 예정입니다."
          show-icon
          :closable="false">
        </el-alert>
        
        <!-- 예정된 기능 목록 -->
        <div class="feature-preview">
          <h3>구현 예정 기능:</h3>
          <ul>
            <li>✅ 사용자 목록 조회 및 검색</li>
            <li>✅ 사용자 상세 정보 조회</li>
            <li>✅ 사용자 권한(Role) 변경</li>
            <li>✅ 계정 활성화/비활성화</li>
            <li>✅ 사용자 등록 승인/거부</li>
            <li>✅ 부서별 사용자 필터링</li>
          </ul>
        </div>

        <!-- 임시 데이터 표시 -->
        <div class="temp-data">
          <h3>샘플 사용자 데이터:</h3>
          <el-table :data="sampleUsers" style="width: 100%">
            <el-table-column prop="username" label="사용자명" width="120"></el-table-column>
            <el-table-column prop="fullName" label="성명" width="120"></el-table-column>
            <el-table-column prop="email" label="이메일" width="200"></el-table-column>
            <el-table-column prop="department" label="부서" width="100"></el-table-column>
            <el-table-column prop="roleName" label="권한" width="120"></el-table-column>
            <el-table-column prop="isActive" label="상태" width="80">
              <template slot-scope="scope">
                <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                  {{ scope.row.isActive ? '활성' : '비활성' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
/**
 * UserManagementView.vue
 * 
 * 사용자 관리 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (4일차 이후 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 사용자 목록 조회 - 페이징, 검색, 필터링
 * 2. 사용자 상세 정보 조회 및 수정
 * 3. 권한 관리 - 역할 변경, 권한 부여/회수
 * 4. 계정 관리 - 활성화/비활성화, 잠금 해제
 * 5. 신규 사용자 승인 - 회원가입 요청 승인/거부
 */

export default {
  name: 'UserManagementView',
  
  data() {
    return {
      // 임시 샘플 데이터 - 실제 구현 시 API에서 가져올 데이터
      sampleUsers: [
        {
          userId: 1,
          username: 'admin',
          fullName: '시스템 관리자',
          email: 'admin@kmportal.com',
          department: 'IT팀',
          roleName: '시스템 관리자',
          isActive: true
        },
        {
          userId: 2,
          username: 'manager01',
          fullName: '김매니저',
          email: 'manager@kmportal.com',
          department: '기획팀',
          roleName: '부서 관리자',
          isActive: true
        },
        {
          userId: 3,
          username: 'user01',
          fullName: '홍길동',
          email: 'user01@kmportal.com',
          department: '개발팀',
          roleName: '일반 사용자',
          isActive: false
        }
      ]
    }
  },

  created() {
    console.log('[UserManagementView] 컴포넌트가 생성되었습니다');
    console.log('[UserManagementView] 이 페이지는 4일차부터 본격 개발됩니다');
  },

  methods: {
    /**
     * 사용자 목록을 서버에서 가져오는 메서드 (구현 예정)
     * @param {Object} searchParams - 검색 조건
     */
    fetchUsers(searchParams = {}) {
      console.log('[UserManagementView] fetchUsers 호출됨 - 구현 예정');
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.user.getList(searchParams)
    },

    /**
     * 사용자 권한을 변경하는 메서드 (구현 예정)
     * @param {Number} userId - 사용자 ID
     * @param {String} newRole - 새로운 권한
     */
    changeUserRole(userId, newRole) {
      console.log(`[UserManagementView] changeUserRole 호출됨 - 사용자 ${userId}의 권한을 ${newRole}로 변경 예정`);
      // 실제 구현 시 사용할 권한 변경 로직
      // this.$api.user.updateRole(userId, newRole)
    },

    /**
     * 사용자 계정을 활성화/비활성화하는 메서드 (구현 예정)
     * @param {Number} userId - 사용자 ID
     * @param {Boolean} isActive - 활성화 여부
     */
    toggleUserStatus(userId, isActive) {
      console.log(`[UserManagementView] toggleUserStatus 호출됨 - 사용자 ${userId}를 ${isActive ? '활성화' : '비활성화'} 예정`);
      // 실제 구현 시 사용할 상태 변경 로직
      // this.$api.user.updateStatus(userId, isActive)
    }
  }
}
</script>

<style scoped>
/* 사용자 관리 페이지 스타일링 */

.user-management {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px); /* 헤더 높이 제외 */
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

.development-notice {
  margin-top: 20px;
}

.notice-content {
  padding: 10px 0;
}

.feature-preview {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.feature-preview h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.feature-preview ul {
  margin: 0;
  padding-left: 20px;
}

.feature-preview li {
  margin-bottom: 5px;
  color: #5a6c7d;
}

.temp-data {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.temp-data h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

/* 반응형 디자인 - 모바일 대응 */
@media (max-width: 768px) {
  .user-management {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .feature-preview,
  .temp-data {
    padding: 10px;
  }
}
</style>