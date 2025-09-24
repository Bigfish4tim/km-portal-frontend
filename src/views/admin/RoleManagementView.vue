<template>
  <!-- 
    역할 관리 페이지 컴포넌트
    - 시스템의 모든 역할(Role)을 관리하는 페이지
    - 역할 생성, 수정, 삭제 및 권한 설정 기능 제공
    - RBAC(Role-Based Access Control) 시스템의 핵심 관리 페이지
    - 향후 구현 예정 (4일차 이후)
  -->
  <div class="role-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h1 class="page-title">역할 관리</h1>
      <p class="page-description">
        시스템의 역할(Role)을 생성, 수정, 삭제하고 권한을 관리할 수 있습니다.
      </p>
    </div>

    <!-- 개발 중 안내 -->
    <el-card class="development-notice">
      <div slot="header" class="clearfix">
        <span>🔐 권한 관리 시스템</span>
      </div>
      <div class="notice-content">
        <el-alert
          title="이 페이지는 현재 개발 중입니다"
          type="warning"
          description="역할 관리 기능은 보안이 중요한 기능으로, 신중하게 설계하여 구현될 예정입니다."
          show-icon
          :closable="false">
        </el-alert>
        
        <!-- RBAC 시스템 설명 -->
        <div class="rbac-explanation">
          <h3>RBAC (Role-Based Access Control) 시스템:</h3>
          <p>역할 기반 접근 제어는 사용자의 역할에 따라 시스템 접근 권한을 관리하는 보안 모델입니다.</p>
          <div class="rbac-flow">
            <el-steps :active="3" finish-status="success">
              <el-step title="사용자" description="개별 사용자 계정"></el-step>
              <el-step title="역할 할당" description="사용자에게 역할 부여"></el-step>
              <el-step title="역할" description="권한들의 집합"></el-step>
              <el-step title="권한" description="특정 기능 접근 허가"></el-step>
            </el-steps>
          </div>
        </div>

        <!-- 현재 시스템의 역할 구조 -->
        <div class="role-hierarchy">
          <h3>현재 시스템 역할 구조:</h3>
          <el-tree
            :data="roleTreeData"
            :props="defaultProps"
            default-expand-all
            node-key="id">
            <span class="custom-tree-node" slot-scope="{ node, data }">
              <span class="role-info">
                <i :class="data.icon"></i>
                <span class="role-name">{{ data.label }}</span>
                <el-tag :type="data.type" size="mini">우선순위: {{ data.priority }}</el-tag>
              </span>
            </span>
          </el-tree>
        </div>

        <!-- 구현 예정 기능 -->
        <div class="feature-preview">
          <h3>구현 예정 기능:</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <ul>
                <li>✅ 역할 목록 조회 및 관리</li>
                <li>✅ 새로운 역할 생성</li>
                <li>✅ 역할 수정 및 삭제</li>
                <li>✅ 권한 매트릭스 관리</li>
              </ul>
            </el-col>
            <el-col :span="12">
              <ul>
                <li>✅ 역할 계층 구조 설정</li>
                <li>✅ 권한 상속 관리</li>
                <li>✅ 역할별 사용자 현황</li>
                <li>✅ 권한 변경 이력 추적</li>
              </ul>
            </el-col>
          </el-row>
        </div>

        <!-- 임시 권한 매트릭스 -->
        <div class="permission-matrix">
          <h3>권한 매트릭스 (샘플):</h3>
          <el-table :data="permissionMatrix" style="width: 100%">
            <el-table-column prop="feature" label="기능" width="150"></el-table-column>
            <el-table-column label="시스템 관리자" width="120" align="center">
              <template slot-scope="scope">
                <i class="el-icon-check" style="color: #67c23a;" v-if="scope.row.admin"></i>
                <i class="el-icon-close" style="color: #f56c6c;" v-else></i>
              </template>
            </el-table-column>
            <el-table-column label="부서 관리자" width="120" align="center">
              <template slot-scope="scope">
                <i class="el-icon-check" style="color: #67c23a;" v-if="scope.row.manager"></i>
                <i class="el-icon-close" style="color: #f56c6c;" v-else></i>
              </template>
            </el-table-column>
            <el-table-column label="게시판 관리자" width="130" align="center">
              <template slot-scope="scope">
                <i class="el-icon-check" style="color: #67c23a;" v-if="scope.row.boardAdmin"></i>
                <i class="el-icon-close" style="color: #f56c6c;" v-else></i>
              </template>
            </el-table-column>
            <el-table-column label="일반 사용자" width="120" align="center">
              <template slot-scope="scope">
                <i class="el-icon-check" style="color: #67c23a;" v-if="scope.row.user"></i>
                <i class="el-icon-close" style="color: #f56c6c;" v-else></i>
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
 * RoleManagementView.vue
 * 
 * 역할 관리 페이지 컴포넌트
 * 
 * 작성일: 2025년 9월 24일 (3일차)
 * 상태: 임시 플레이스홀더 (4일차 이후 본격 개발 예정)
 * 
 * 주요 기능 (구현 예정):
 * 1. 역할 CRUD - 생성, 조회, 수정, 삭제
 * 2. 권한 매트릭스 관리 - 역할별 권한 설정
 * 3. 역할 계층 구조 - 상위/하위 역할 관계 설정
 * 4. 권한 상속 - 상위 역할의 권한 자동 상속
 * 5. 사용자 현황 - 각 역할에 속한 사용자 수 확인
 * 6. 변경 이력 - 권한 변경 내역 추적 및 감사
 * 
 * 보안 고려사항:
 * - 시스템 관리자만 접근 가능
 * - 중요한 변경사항은 이중 확인 필요
 * - 모든 변경사항은 로그로 기록
 * - 역할 삭제 시 연관된 사용자 처리 방안 필요
 */

export default {
  name: 'RoleManagementView',
  
  data() {
    return {
      // 역할 트리 구조 데이터
      roleTreeData: [
        {
          id: 1,
          label: '시스템 관리자',
          icon: 'el-icon-s-custom',
          type: 'danger',
          priority: 1,
          children: []
        },
        {
          id: 2,
          label: '부서 관리자',
          icon: 'el-icon-user-solid',
          type: 'warning',
          priority: 10,
          children: []
        },
        {
          id: 3,
          label: '게시판 관리자',
          icon: 'el-icon-document',
          type: 'info',
          priority: 20,
          children: []
        },
        {
          id: 4,
          label: '일반 사용자',
          icon: 'el-icon-user',
          type: 'success',
          priority: 100,
          children: []
        }
      ],
      
      // 트리 컴포넌트 설정
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      
      // 권한 매트릭스 샘플 데이터
      permissionMatrix: [
        {
          feature: '사용자 관리',
          admin: true,
          manager: false,
          boardAdmin: false,
          user: false
        },
        {
          feature: '역할 관리',
          admin: true,
          manager: false,
          boardAdmin: false,
          user: false
        },
        {
          feature: '게시판 관리',
          admin: true,
          manager: true,
          boardAdmin: true,
          user: false
        },
        {
          feature: '파일 업로드',
          admin: true,
          manager: true,
          boardAdmin: true,
          user: true
        },
        {
          feature: '파일 다운로드',
          admin: true,
          manager: true,
          boardAdmin: true,
          user: true
        },
        {
          feature: '게시글 작성',
          admin: true,
          manager: true,
          boardAdmin: true,
          user: true
        },
        {
          feature: '댓글 삭제',
          admin: true,
          manager: true,
          boardAdmin: true,
          user: false
        },
        {
          feature: '시스템 설정',
          admin: true,
          manager: false,
          boardAdmin: false,
          user: false
        }
      ]
    }
  },

  created() {
    console.log('[RoleManagementView] 컴포넌트가 생성되었습니다');
    console.log('[RoleManagementView] RBAC 시스템 관리 페이지 - 4일차부터 본격 개발됩니다');
  },

  methods: {
    /**
     * 역할 목록을 서버에서 가져오는 메서드 (구현 예정)
     */
    fetchRoles() {
      console.log('[RoleManagementView] fetchRoles 호출됨 - 구현 예정');
      // 실제 구현 시 사용할 API 호출 로직
      // this.$api.role.getList()
    },

    /**
     * 새로운 역할을 생성하는 메서드 (구현 예정)
     * @param {Object} roleData - 역할 정보
     */
    createRole(roleData) {
      console.log('[RoleManagementView] createRole 호출됨 - 구현 예정', roleData);
      // 실제 구현 시 사용할 역할 생성 로직
      // this.$api.role.create(roleData)
    },

    /**
     * 역할을 수정하는 메서드 (구현 예정)
     * @param {Number} roleId - 역할 ID
     * @param {Object} updateData - 수정할 데이터
     */
    updateRole(roleId, updateData) {
      console.log(`[RoleManagementView] updateRole 호출됨 - 역할 ${roleId} 수정 예정`, updateData);
      // 실제 구현 시 사용할 역할 수정 로직
      // this.$api.role.update(roleId, updateData)
    },

    /**
     * 역할을 삭제하는 메서드 (구현 예정)
     * @param {Number} roleId - 역할 ID
     */
    deleteRole(roleId) {
      console.log(`[RoleManagementView] deleteRole 호출됨 - 역할 ${roleId} 삭제 예정`);
      // 실제 구현 시 사용할 역할 삭제 로직
      // this.$api.role.delete(roleId)
      // 주의: 역할 삭제 시 해당 역할을 가진 사용자들 처리 필요
    },

    /**
     * 권한 매트릭스를 업데이트하는 메서드 (구현 예정)
     * @param {Array} permissionMatrix - 권한 매트릭스 데이터
     */
    updatePermissionMatrix(permissionMatrix) {
      console.log('[RoleManagementView] updatePermissionMatrix 호출됨 - 권한 매트릭스 업데이트 예정', permissionMatrix);
      // 실제 구현 시 사용할 권한 매트릭스 업데이트 로직
      // this.$api.role.updatePermissions(permissionMatrix)
    }
  }
}
</script>

<style scoped>
/* 역할 관리 페이지 스타일링 */

.role-management {
  padding: 20px;
  background-color: #f5f5f5;
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

.development-notice {
  margin-top: 20px;
}

.notice-content {
  padding: 10px 0;
}

.rbac-explanation {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.rbac-explanation h3 {
  margin: 0 0 10px 0;
  color: #1e40af;
  font-size: 16px;
}

.rbac-explanation p {
  margin: 0 0 15px 0;
  color: #64748b;
  line-height: 1.6;
}

.rbac-flow {
  margin-top: 15px;
}

.role-hierarchy {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.role-hierarchy h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-name {
  font-weight: 500;
}

.feature-preview {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

.feature-preview h3 {
  margin: 0 0 15px 0;
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

.permission-matrix {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.permission-matrix h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .role-management {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .rbac-explanation,
  .role-hierarchy,
  .feature-preview,
  .permission-matrix {
    padding: 10px;
  }
}
</style>