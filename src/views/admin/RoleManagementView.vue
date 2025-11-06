<template>
  <!-- 
    역할 관리 페이지 컴포넌트
    - 시스템의 모든 역할(Role)을 관리하는 페이지
    - 역할 생성, 수정, 삭제 및 권한 설정 기능 제공
    - RBAC(Role-Based Access Control) 시스템의 핵심 관리 페이지
  -->
  <div class="role-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-unlock"></i>
          역할 관리
        </h1>
        <p class="page-description">
          시스템의 역할(Role)을 생성, 수정, 삭제하고 권한을 관리할 수 있습니다.
        </p>
      </div>
      <div class="header-right">
        <!-- 새 역할 생성 버튼 -->
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="handleCreate"
          :loading="isLoading">
          새 역할 생성
        </el-button>
        
        <!-- 통계 보기 버튼 -->
        <el-button 
          type="info" 
          icon="el-icon-data-analysis"
          @click="showStatisticsDialog = true">
          통계 보기
        </el-button>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <!-- 검색창 -->
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="역할명으로 검색..."
            prefix-icon="el-icon-search"
            clearable
            @clear="handleSearch">
            <el-button 
              slot="append" 
              icon="el-icon-search"
              @click="handleSearch">
              검색
            </el-button>
          </el-input>
        </el-col>

        <!-- 필터 -->
        <el-col :span="8">
          <el-select 
            v-model="filterType" 
            placeholder="역할 유형 필터"
            clearable
            @change="loadRoles">
            <el-option label="전체 역할" value="all"></el-option>
            <el-option label="시스템 역할" value="system"></el-option>
            <el-option label="사용자 정의 역할" value="custom"></el-option>
            <el-option label="활성 역할만" value="active"></el-option>
          </el-select>
        </el-col>

        <!-- 새로고침 버튼 -->
        <el-col :span="8" style="text-align: right;">
          <el-button 
            icon="el-icon-refresh"
            @click="loadRoles"
            :loading="isLoading">
            새로고침
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 역할 목록 테이블 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="displayRoles"
        v-loading="isLoading"
        stripe
        style="width: 100%"
        @row-click="handleRowClick">
        
        <!-- 역할 ID -->
        <el-table-column
          prop="roleId"
          label="ID"
          width="80"
          align="center">
        </el-table-column>

        <!-- 역할명 -->
        <el-table-column
          prop="roleName"
          label="역할명"
          width="180">
          <template slot-scope="scope">
            <el-tag :type="getRoleTagType(scope.row)" size="medium">
              {{ scope.row.roleName }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 표시명 -->
        <el-table-column
          prop="displayName"
          label="표시명"
          width="150">
          <template slot-scope="scope">
            <strong>{{ scope.row.displayName }}</strong>
          </template>
        </el-table-column>

        <!-- 설명 -->
        <el-table-column
          prop="description"
          label="설명"
          min-width="250">
          <template slot-scope="scope">
            <span class="description-text">
              {{ scope.row.description || '설명 없음' }}
            </span>
          </template>
        </el-table-column>

        <!-- 우선순위 -->
        <el-table-column
          prop="priority"
          label="우선순위"
          width="100"
          align="center"
          sortable>
          <template slot-scope="scope">
            <el-tag 
              :type="getPriorityTagType(scope.row.priority)" 
              size="small">
              {{ scope.row.priority }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 유형 -->
        <el-table-column
          label="유형"
          width="120"
          align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="scope.row.isSystemRole ? 'warning' : 'success'" 
              size="small">
              {{ scope.row.isSystemRole ? '시스템' : '사용자정의' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 상태 -->
        <el-table-column
          label="상태"
          width="100"
          align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="scope.row.isActive ? 'success' : 'info'" 
              size="small">
              {{ scope.row.isActive ? '활성' : '비활성' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 작업 버튼 -->
        <el-table-column
          label="작업"
          width="200"
          align="center"
          fixed="right">
          <template slot-scope="scope">
            <!-- 수정 버튼 (시스템 역할은 비활성화) -->
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-edit"
              @click.stop="handleEdit(scope.row)"
              :disabled="scope.row.isSystemRole">
              수정
            </el-button>
            
            <!-- 삭제 버튼 (시스템 역할은 비활성화) -->
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click.stop="handleDelete(scope.row)"
              :disabled="scope.row.isSystemRole">
              삭제
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 역할 생성/수정 다이얼로그 -->
    <el-dialog
      :title="dialogMode === 'create' ? '새 역할 생성' : '역할 수정'"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose">
      
      <el-form
        ref="roleForm"
        :model="roleForm"
        :rules="formRules"
        label-width="120px">
        
        <!-- 역할명 -->
        <el-form-item label="역할명" prop="roleName">
          <el-input
            v-model="roleForm.roleName"
            placeholder="ROLE_로 시작 (예: ROLE_MANAGER)"
            :disabled="dialogMode === 'edit'"
            @blur="validateRoleName">
            <template slot="prepend">ROLE_</template>
          </el-input>
          <span class="form-tip">
            * 대문자와 언더스코어만 사용 가능 (예: ROLE_BOARD_ADMIN)
          </span>
        </el-form-item>

        <!-- 표시명 -->
        <el-form-item label="표시명" prop="displayName">
          <el-input
            v-model="roleForm.displayName"
            placeholder="사용자에게 보여질 이름 (예: 게시판 관리자)">
          </el-input>
          <span class="form-tip">
            * 한글로 역할의 의미를 명확하게 작성해주세요
          </span>
        </el-form-item>

        <!-- 설명 -->
        <el-form-item label="설명" prop="description">
          <el-input
            type="textarea"
            v-model="roleForm.description"
            :rows="3"
            placeholder="이 역할의 권한과 책임을 설명해주세요"
            maxlength="500"
            show-word-limit>
          </el-input>
        </el-form-item>

        <!-- 우선순위 -->
        <el-form-item label="우선순위" prop="priority">
          <el-input-number
            v-model="roleForm.priority"
            :min="1"
            :max="999"
            :step="10">
          </el-input-number>
          <span class="form-tip">
            * 숫자가 낮을수록 높은 권한 (1=최고 관리자, 100=일반 사용자)
          </span>
        </el-form-item>

        <!-- 활성화 상태 -->
        <el-form-item label="활성화 상태">
          <el-switch
            v-model="roleForm.isActive"
            active-text="활성"
            inactive-text="비활성">
          </el-switch>
          <span class="form-tip">
            * 비활성화된 역할은 사용자에게 할당할 수 없습니다
          </span>
        </el-form-item>
      </el-form>

      <!-- 다이얼로그 하단 버튼 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">취소</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="isSubmitting">
          {{ dialogMode === 'create' ? '생성' : '수정' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 통계 다이얼로그 -->
    <el-dialog
      title="역할 통계 정보"
      :visible.sync="showStatisticsDialog"
      width="700px">
      
      <div v-if="statistics" class="statistics-content">
        <!-- 기본 통계 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ statistics.totalRoles }}</div>
              <div class="stat-label">전체 역할</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card active">
              <div class="stat-value">{{ statistics.activeRoles }}</div>
              <div class="stat-label">활성 역할</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card system">
              <div class="stat-value">{{ statistics.systemRoles }}</div>
              <div class="stat-label">시스템 역할</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card custom">
              <div class="stat-value">{{ statistics.customRoles }}</div>
              <div class="stat-label">사용자정의</div>
            </div>
          </el-col>
        </el-row>

        <!-- 역할별 사용자 수 -->
        <div class="role-user-stats">
          <h3>역할별 사용자 수</h3>
          <el-table
            :data="statistics.roleUserStats"
            style="width: 100%">
            <el-table-column
              prop="0"
              label="역할명">
            </el-table-column>
            <el-table-column
              prop="1"
              label="사용자 수"
              width="120"
              align="center">
              <template slot-scope="scope">
                <el-tag type="success">{{ scope.row[1] }}명</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 사용자 없는 역할 -->
        <div v-if="statistics.emptyRoles && statistics.emptyRoles.length > 0" 
             class="empty-roles">
          <el-alert
            title="사용자가 할당되지 않은 역할"
            type="warning"
            :closable="false">
            <div v-for="role in statistics.emptyRoles" :key="role.roleId">
              • {{ role.displayName }} ({{ role.roleName }})
            </div>
          </el-alert>
        </div>
      </div>

      <div v-else class="statistics-loading">
        <el-spin></el-spin>
        <p>통계 정보를 불러오는 중...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * RoleManagementView.vue
 * 
 * 역할 관리 페이지 컴포넌트
 * 
 * 작성일: 2025년 11월 6일
 * 상태: 완전 구현
 * 
 * 주요 기능:
 * 1. 역할 CRUD - 생성, 조회, 수정, 삭제
 * 2. 역할 검색 - 표시명 기준 검색
 * 3. 역할 필터링 - 시스템/사용자정의 구분
 * 4. 역할 통계 - 역할별 사용자 수 등
 * 5. 유효성 검증 - 역할명 중복 확인, 입력값 검증
 * 
 * 보안:
 * - 시스템 역할은 수정/삭제 불가
 * - 관리자(ADMIN) 권한 필요
 */

import { mapState, mapActions, mapGetters } from 'vuex'
import roleService from '@/services/roleService'

export default {
  name: 'RoleManagementView',
  
  data() {
    return {
      // 로딩 상태
      isLoading: false,
      isSubmitting: false,
      
      // 검색 및 필터
      searchKeyword: '',
      filterType: 'all',  // all, system, custom, active
      
      // 다이얼로그 제어
      dialogVisible: false,
      dialogMode: 'create',  // 'create' or 'edit'
      showStatisticsDialog: false,
      
      // 역할 목록
      roles: [],
      
      // 통계 정보
      statistics: null,
      
      // 역할 폼 데이터
      roleForm: {
        roleId: null,
        roleName: '',
        displayName: '',
        description: '',
        priority: 100,
        isSystemRole: false,
        isActive: true
      },
      
      // 폼 검증 규칙
      formRules: {
        roleName: [
          { required: true, message: '역할명을 입력해주세요', trigger: 'blur' },
          { 
            pattern: /^ROLE_[A-Z][A-Z_]*$/, 
            message: 'ROLE_로 시작하고 대문자와 언더스코어만 사용 가능', 
            trigger: 'blur' 
          },
          {
            validator: this.validateRoleNameUnique,
            trigger: 'blur'
          }
        ],
        displayName: [
          { required: true, message: '표시명을 입력해주세요', trigger: 'blur' },
          { max: 100, message: '표시명은 100자를 초과할 수 없습니다', trigger: 'blur' }
        ],
        description: [
          { max: 500, message: '설명은 500자를 초과할 수 없습니다', trigger: 'blur' }
        ],
        priority: [
          { required: true, message: '우선순위를 입력해주세요', trigger: 'blur' },
          { type: 'number', min: 1, max: 999, message: '1-999 사이의 값을 입력해주세요', trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    /**
     * 필터링 및 검색이 적용된 역할 목록
     */
    displayRoles() {
      let filtered = this.roles

      // 검색 키워드 적용
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(role => 
          role.displayName.toLowerCase().includes(keyword) ||
          role.roleName.toLowerCase().includes(keyword) ||
          (role.description && role.description.toLowerCase().includes(keyword))
        )
      }

      return filtered
    }
  },

  created() {
    console.log('[RoleManagementView] 컴포넌트가 생성되었습니다')
    
    // 컴포넌트 생성 시 역할 목록 로드
    this.loadRoles()
  },

  methods: {
    // ================================
    // 데이터 로드 메서드
    // ================================

    /**
     * 역할 목록 로드
     * 필터 타입에 따라 다른 API 호출
     */
    async loadRoles() {
      try {
        this.isLoading = true
        
        let roles = []
        
        switch (this.filterType) {
          case 'system':
            roles = await roleService.getSystemRoles()
            break
          case 'custom':
            roles = await roleService.getCustomRoles()
            break
          case 'active':
            roles = await roleService.getActiveRoles()
            break
          default:
            roles = await roleService.getAllRoles()
        }
        
        this.roles = roles
        
        this.$message.success(`${roles.length}개의 역할을 불러왔습니다`)
        
      } catch (error) {
        console.error('[RoleManagementView] 역할 목록 로드 오류:', error)
        this.$message.error(error.message || '역할 목록을 불러오는데 실패했습니다')
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 통계 정보 로드
     */
    async loadStatistics() {
      try {
        this.statistics = null
        this.statistics = await roleService.getRoleStatistics()
        
      } catch (error) {
        console.error('[RoleManagementView] 통계 로드 오류:', error)
        this.$message.error('통계 정보를 불러오는데 실패했습니다')
      }
    },

    // ================================
    // 이벤트 핸들러
    // ================================

    /**
     * 검색 실행
     */
    handleSearch() {
      console.log('[RoleManagementView] 검색 실행:', this.searchKeyword)
      // displayRoles computed가 자동으로 필터링됨
    },

    /**
     * 테이블 행 클릭
     */
    handleRowClick(row) {
      console.log('[RoleManagementView] 역할 선택:', row.displayName)
      // 필요시 상세 페이지로 이동하거나 정보 표시
    },

    /**
     * 새 역할 생성 다이얼로그 열기
     */
    handleCreate() {
      console.log('[RoleManagementView] 새 역할 생성 다이얼로그 열기')
      
      this.dialogMode = 'create'
      this.resetForm()
      this.dialogVisible = true
    },

    /**
     * 역할 수정 다이얼로그 열기
     */
    handleEdit(role) {
      console.log('[RoleManagementView] 역할 수정 다이얼로그 열기:', role.displayName)
      
      // 시스템 역할은 수정 불가
      if (role.isSystemRole) {
        this.$message.warning('시스템 역할은 수정할 수 없습니다')
        return
      }
      
      this.dialogMode = 'edit'
      
      // 폼에 기존 데이터 채우기
      this.roleForm = {
        roleId: role.roleId,
        roleName: role.roleName,
        displayName: role.displayName,
        description: role.description,
        priority: role.priority,
        isSystemRole: role.isSystemRole,
        isActive: role.isActive
      }
      
      this.dialogVisible = true
    },

    /**
     * 역할 생성/수정 제출
     */
    async handleSubmit() {
      try {
        // 1. 폼 유효성 검증
        await this.$refs.roleForm.validate()
        
        this.isSubmitting = true
        
        // 2. API 호출
        let result
        if (this.dialogMode === 'create') {
          // 역할 생성
          console.log('[RoleManagementView] 역할 생성 요청')
          result = await roleService.createRole(this.roleForm)
          this.$message.success('역할이 생성되었습니다')
          
        } else {
          // 역할 수정
          console.log('[RoleManagementView] 역할 수정 요청:', this.roleForm.roleId)
          result = await roleService.updateRole(this.roleForm.roleId, this.roleForm)
          this.$message.success('역할이 수정되었습니다')
        }
        
        // 3. 다이얼로그 닫기 및 목록 새로고침
        this.dialogVisible = false
        await this.loadRoles()
        
      } catch (error) {
        console.error('[RoleManagementView] 역할 저장 오류:', error)
        
        if (error.errors) {
          // 유효성 검증 오류
          console.warn('[RoleManagementView] 유효성 검증 실패')
        } else {
          // API 오류
          this.$message.error(error.message || '역할 저장에 실패했습니다')
        }
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * 역할 삭제 (소프트 삭제)
     */
    async handleDelete(role) {
      try {
        // 1. 시스템 역할 삭제 방지
        if (role.isSystemRole) {
          this.$message.warning('시스템 역할은 삭제할 수 없습니다')
          return
        }
        
        // 2. 확인 다이얼로그
        await this.$confirm(
          `"${role.displayName}" 역할을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
          '역할 삭제 확인',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        // 3. 삭제 API 호출
        console.log('[RoleManagementView] 역할 삭제 요청:', role.roleId)
        await roleService.deleteRole(role.roleId)
        
        this.$message.success('역할이 삭제되었습니다')
        
        // 4. 목록 새로고침
        await this.loadRoles()
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('[RoleManagementView] 역할 삭제 오류:', error)
          this.$message.error(error.message || '역할 삭제에 실패했습니다')
        }
      }
    },

    /**
     * 다이얼로그 닫기 핸들러
     */
    handleDialogClose() {
      console.log('[RoleManagementView] 다이얼로그 닫기')
      this.resetForm()
    },

    // ================================
    // 유효성 검증 메서드
    // ================================

    /**
     * 역할명 입력 시 자동으로 ROLE_ 접두사 추가
     */
    validateRoleName() {
      if (this.roleForm.roleName && !this.roleForm.roleName.startsWith('ROLE_')) {
        this.roleForm.roleName = 'ROLE_' + this.roleForm.roleName
      }
    },

    /**
     * 역할명 중복 확인 (비동기 validator)
     */
    async validateRoleNameUnique(rule, value, callback) {
      // 수정 모드에서는 중복 확인 안 함
      if (this.dialogMode === 'edit') {
        callback()
        return
      }
      
      if (!value) {
        callback()
        return
      }
      
      try {
        const result = await roleService.checkRoleName(value)
        
        if (!result.available) {
          callback(new Error('이미 사용 중인 역할명입니다'))
        } else {
          callback()
        }
      } catch (error) {
        console.error('[RoleManagementView] 역할명 중복 확인 오류:', error)
        callback()  // 오류 발생 시 통과
      }
    },

    // ================================
    // 유틸리티 메서드
    // ================================

    /**
     * 폼 초기화
     */
    resetForm() {
      this.roleForm = {
        roleId: null,
        roleName: '',
        displayName: '',
        description: '',
        priority: 100,
        isSystemRole: false,
        isActive: true
      }
      
      // 폼 검증 상태 초기화
      if (this.$refs.roleForm) {
        this.$refs.roleForm.resetFields()
      }
    },

    /**
     * 역할 태그 타입 결정
     */
    getRoleTagType(role) {
      if (role.isSystemRole) {
        return 'warning'
      }
      return 'success'
    },

    /**
     * 우선순위 태그 타입 결정
     */
    getPriorityTagType(priority) {
      if (priority <= 10) {
        return 'danger'  // 최고 권한
      } else if (priority <= 50) {
        return 'warning'  // 관리자급
      } else {
        return 'info'  // 일반
      }
    }
  },

  // ================================
  // 라이프사이클 훅
  // ================================

  watch: {
    /**
     * 통계 다이얼로그 열릴 때 통계 로드
     */
    showStatisticsDialog(newVal) {
      if (newVal) {
        this.loadStatistics()
      }
    }
  }
}
</script>

<style scoped lang="scss">
/**
 * 역할 관리 페이지 스타일링
 */

.role-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

// ===== 페이지 헤더 =====

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 10px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    color: #409EFF;
  }
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.6;
}

// ===== 검색 및 필터 카드 =====

.search-card {
  margin-bottom: 20px;
}

// ===== 테이블 카드 =====

.table-card {
  margin-bottom: 20px;
}

.description-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

// ===== 폼 스타일 =====

.form-tip {
  display: block;
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

// ===== 통계 다이얼로그 =====

.statistics-content {
  padding: 10px 0;
}

.stats-row {
  margin-bottom: 30px;
}

.stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-align: center;
  color: white;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  &.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.system {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.custom {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    opacity: 0.9;
  }
}

.role-user-stats {
  margin-bottom: 20px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #303133;
  }
}

.empty-roles {
  margin-top: 20px;
}

.statistics-loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

// ===== 반응형 디자인 =====

@media (max-width: 768px) {
  .role-management {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    padding: 16px;
  }

  .header-right {
    width: 100%;
    margin-top: 15px;

    .el-button {
      flex: 1;
    }
  }
  
  .page-title {
    font-size: 20px;
  }

  .stats-row {
    .el-col {
      margin-bottom: 10px;
    }
  }
}

// ===== 테이블 행 호버 효과 =====

::v-deep .el-table__row {
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa !important;
  }
}

// ===== 다이얼로그 스타일 조정 =====

::v-deep .el-dialog__body {
  padding: 20px 30px;
}

::v-deep .el-form-item__label {
  font-weight: 500;
  color: #606266;
}
</style>