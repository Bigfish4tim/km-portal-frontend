<!-- 
============================================
📁 src/views/admin/UserManagementView.vue
사용자 관리 페이지 (16일차 완성 버전)

작성일: 2025-11-11
작성자: KM Portal Team
버전: 3.0 (16일차 최종 완성본)

주요 기능:
1. 사용자 목록 조회 - 페이징, 검색, 필터링 (부서, 상태)
2. 사용자 생성 - 다이얼로그 폼
3. 사용자 수정 - 다이얼로그 폼
4. 권한 관리 - 역할 변경 다이얼로그
5. 계정 관리 - 잠금/해제
6. 사용자 삭제 - 비활성화
7. 통계 정보 - 실시간 조회

권한 제어:
- 조회: ADMIN, MANAGER
- 수정/권한변경/잠금: ADMIN, MANAGER
- 생성/삭제: ADMIN만

백엔드 API:
- GET    /api/users             - 사용자 목록 조회
- GET    /api/users/statistics  - 통계 정보
- POST   /api/users             - 사용자 생성
- GET    /api/users/{id}        - 사용자 상세
- PUT    /api/users/{id}        - 사용자 수정
- DELETE /api/users/{id}        - 사용자 삭제
- POST   /api/users/{id}/lock   - 계정 잠금
- POST   /api/users/{id}/unlock - 계정 해제
- PUT    /api/users/{id}/roles  - 권한 변경
============================================
-->

<template>
  <div class="user-management">
    <!-- 
      =========================================
      페이지 헤더 영역
      =========================================
      - 페이지 제목과 설명을 표시합니다
      - 사용자에게 현재 페이지의 목적을 명확히 전달합니다
    -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><User /></el-icon>
        사용자 관리
      </h1>
      <p class="page-description">
        시스템 사용자를 조회하고 권한을 관리할 수 있습니다.
      </p>
    </div>

    <!-- 
      =========================================
      검색 및 필터 영역
      =========================================
      - 키워드 검색: 사용자명 또는 이메일로 검색
      - 부서 필터: 특정 부서의 사용자만 조회
      - 상태 필터: 활성/비활성/잠금 상태로 필터링
    -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <!-- 키워드 검색 -->
        <el-form-item label="검색어">
          <el-input
            v-model="searchForm.keyword"
            placeholder="사용자명 또는 이메일"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 부서 필터 -->
        <el-form-item label="부서">
          <el-select
            v-model="searchForm.department"
            placeholder="전체"
            clearable
            style="width: 150px"
          >
            <el-option label="전체" value=""></el-option>
            <el-option label="IT팀" value="IT팀"></el-option>
            <el-option label="개발팀" value="개발팀"></el-option>
            <el-option label="기획팀" value="기획팀"></el-option>
            <el-option label="영업팀" value="영업팀"></el-option>
            <el-option label="인사팀" value="인사팀"></el-option>
            <el-option label="재무팀" value="재무팀"></el-option>
          </el-select>
        </el-form-item>

        <!-- 상태 필터 -->
        <el-form-item label="상태">
          <el-select
            v-model="searchForm.status"
            placeholder="전체"
            clearable
            style="width: 120px"
          >
            <el-option label="전체" value=""></el-option>
            <el-option label="활성" value="active"></el-option>
            <el-option label="비활성" value="inactive"></el-option>
            <el-option label="잠금" value="locked"></el-option>
          </el-select>
        </el-form-item>

        <!-- 검색 버튼 -->
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            검색
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            초기화
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 
      =========================================
      통계 카드 영역
      =========================================
      - 4개의 통계 카드로 구성
      - 전체 사용자, 활성 사용자, 잠금 계정, 이번 주 가입자 수 표시
      - 실시간으로 업데이트됩니다
    -->
    <el-row :gutter="20" class="statistics-row">
      <!-- 전체 사용자 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#409EFF"><UserFilled /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalUsers }}</div>
              <div class="stat-label">전체 사용자</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 활성 사용자 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#67C23A"><SuccessFilled /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.activeUsers }}</div>
              <div class="stat-label">활성 사용자</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 잠금된 계정 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#E6A23C"><WarningFilled /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.lockedUsers }}</div>
              <div class="stat-label">잠금된 계정</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 이번 주 가입자 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#F56C6C"><StarFilled /></el-icon>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.newUsersThisWeek }}</div>
              <div class="stat-label">이번 주 가입</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 
      =========================================
      사용자 목록 테이블 영역
      =========================================
      - Element Plus Table 컴포넌트 사용
      - 정렬, 페이징, 필터링 기능 제공
      - 각 행마다 작업 버튼 표시 (권한에 따라 다름)
    -->
    <el-card class="table-card" shadow="never">
      <!-- 테이블 헤더 (버튼 영역) -->
      <div class="table-header">
        <div class="header-left">
          <span class="total-count">
            총 <strong>{{ pagination.total }}</strong>명
          </span>
        </div>
        <div class="header-right">
          <!-- ⭐ 새 사용자 생성 버튼 - ADMIN만 표시 -->
          <el-button
            v-if="isAdmin"
            type="primary"
            @click="handleCreate"
          >
            <el-icon><Plus /></el-icon>
            새 사용자 생성
          </el-button>

          <!-- 새로고침 버튼 -->
          <el-button @click="fetchUsers">
            <el-icon><Refresh /></el-icon>
            새로고침
          </el-button>
        </div>
      </div>

      <!-- 사용자 테이블 -->
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <!-- ID 열 -->
        <el-table-column 
          prop="userId" 
          label="ID" 
          width="80" 
          align="center" 
        />
        
        <!-- 사용자명 열 -->
        <el-table-column prop="username" label="사용자명" width="150">
          <template #default="scope">
            <el-tag>{{ scope.row.username }}</el-tag>
          </template>
        </el-table-column>
        
        <!-- 이름 열 -->
        <el-table-column prop="fullName" label="이름" width="120" />
        
        <!-- 이메일 열 -->
        <el-table-column prop="email" label="이메일" min-width="200" />
        
        <!-- 부서 열 -->
        <el-table-column prop="department" label="부서" width="100" />
        
        <!-- 직급 열 -->
        <el-table-column prop="position" label="직급" width="100" />
        
        <!-- 역할 열 -->
        <el-table-column label="역할" width="150">
          <template #default="scope">
            <el-tag
              v-for="role in scope.row.roles"
              :key="role.roleId"
              :type="getRoleTagType(role.roleName)"
              size="small"
              style="margin-right: 4px"
            >
              {{ role.displayName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 상태 열 -->
        <el-table-column label="상태" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isLocked" type="danger">잠금</el-tag>
            <el-tag v-else-if="scope.row.isActive" type="success">활성</el-tag>
            <el-tag v-else type="info">비활성</el-tag>
          </template>
        </el-table-column>
        
        <!-- 마지막 로그인 열 -->
        <el-table-column label="마지막 로그인" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.lastLoginAt) }}
          </template>
        </el-table-column>
        
        <!-- 
          ⭐ 작업 열 - 권한별 버튼 표시
          - ADMIN: 모든 버튼 표시
          - MANAGER: 삭제 버튼 제외
          - USER: 페이지 접근 불가
        -->
        <el-table-column label="작업" width="280" fixed="right" align="center">
          <template #default="scope">
            <!-- 수정 버튼 - ADMIN, MANAGER -->
            <el-button
              v-if="canManageUser"
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              수정
            </el-button>

            <!-- 권한 변경 버튼 - ADMIN, MANAGER -->
            <el-button
              v-if="canManageUser"
              size="small"
              type="warning"
              @click="handleChangeRole(scope.row)"
            >
              <el-icon><Key /></el-icon>
              권한
            </el-button>

            <!-- 잠금/해제 버튼 - ADMIN, MANAGER -->
            <el-button
              v-if="canManageUser"
              size="small"
              :type="scope.row.isLocked ? 'success' : 'warning'"
              @click="handleToggleLock(scope.row)"
            >
              <el-icon>
                <component :is="scope.row.isLocked ? 'Unlock' : 'Lock'" />
              </el-icon>
              {{ scope.row.isLocked ? '해제' : '잠금' }}
            </el-button>

            <!-- 삭제 버튼 - ADMIN만 -->
            <el-button
              v-if="isAdmin"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              삭제
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 페이징 컴포넌트 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 
      =========================================
      ⭐ 사용자 생성 다이얼로그 (16일차 신규)
      =========================================
      - ADMIN만 사용 가능
      - 새 사용자 계정 생성
      - 입력 필드: username, password, email, fullName, department, position
      - 유효성 검증: 필수 필드, 이메일 형식, 비밀번호 강도
    -->
    <el-dialog
      v-model="createDialogVisible"
      title="새 사용자 생성"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
      >
        <!-- 사용자명 입력 -->
        <el-form-item label="사용자명" prop="username">
          <el-input
            v-model="createForm.username"
            placeholder="영문, 숫자 4-20자"
            maxlength="20"
            show-word-limit
          />
          <span class="form-tip">* 로그인 시 사용됩니다</span>
        </el-form-item>

        <!-- 비밀번호 입력 -->
        <el-form-item label="비밀번호" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="영문, 숫자, 특수문자 조합 8자 이상"
            show-password
          />
          <span class="form-tip">* 영문, 숫자, 특수문자 포함 8자 이상</span>
        </el-form-item>

        <!-- 비밀번호 확인 -->
        <el-form-item label="비밀번호 확인" prop="passwordConfirm">
          <el-input
            v-model="createForm.passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            show-password
          />
        </el-form-item>

        <!-- 이메일 입력 -->
        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="createForm.email"
            placeholder="example@company.com"
          />
        </el-form-item>

        <!-- 이름 입력 -->
        <el-form-item label="이름" prop="fullName">
          <el-input
            v-model="createForm.fullName"
            placeholder="홍길동"
          />
        </el-form-item>

        <!-- 부서 선택 -->
        <el-form-item label="부서" prop="department">
          <el-select
            v-model="createForm.department"
            placeholder="부서를 선택하세요"
            style="width: 100%"
          >
            <el-option label="IT팀" value="IT팀"></el-option>
            <el-option label="개발팀" value="개발팀"></el-option>
            <el-option label="기획팀" value="기획팀"></el-option>
            <el-option label="영업팀" value="영업팀"></el-option>
            <el-option label="인사팀" value="인사팀"></el-option>
            <el-option label="재무팀" value="재무팀"></el-option>
          </el-select>
        </el-form-item>

        <!-- 직급 선택 -->
        <el-form-item label="직급" prop="position">
          <el-select
            v-model="createForm.position"
            placeholder="직급을 선택하세요"
            style="width: 100%"
          >
            <el-option label="사원" value="사원"></el-option>
            <el-option label="대리" value="대리"></el-option>
            <el-option label="과장" value="과장"></el-option>
            <el-option label="차장" value="차장"></el-option>
            <el-option label="부장" value="부장"></el-option>
            <el-option label="이사" value="이사"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 다이얼로그 하단 버튼 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">취소</el-button>
          <el-button type="primary" @click="submitCreate" :loading="createLoading">
            생성
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 
      =========================================
      ⭐ 사용자 수정 다이얼로그 (16일차 신규)
      =========================================
      - ADMIN, MANAGER 사용 가능
      - 기존 사용자 정보 수정
      - 수정 가능 필드: email, fullName, department, position
      - username과 password는 변경 불가 (보안상 이유)
    -->
    <el-dialog
      v-model="editDialogVisible"
      title="사용자 정보 수정"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <!-- 사용자명 (읽기 전용) -->
        <el-form-item label="사용자명">
          <el-input
            v-model="editForm.username"
            disabled
          />
          <span class="form-tip">* 사용자명은 변경할 수 없습니다</span>
        </el-form-item>

        <!-- 이메일 입력 -->
        <el-form-item label="이메일" prop="email">
          <el-input
            v-model="editForm.email"
            placeholder="example@company.com"
          />
        </el-form-item>

        <!-- 이름 입력 -->
        <el-form-item label="이름" prop="fullName">
          <el-input
            v-model="editForm.fullName"
            placeholder="홍길동"
          />
        </el-form-item>

        <!-- 부서 선택 -->
        <el-form-item label="부서" prop="department">
          <el-select
            v-model="editForm.department"
            placeholder="부서를 선택하세요"
            style="width: 100%"
          >
            <el-option label="IT팀" value="IT팀"></el-option>
            <el-option label="개발팀" value="개발팀"></el-option>
            <el-option label="기획팀" value="기획팀"></el-option>
            <el-option label="영업팀" value="영업팀"></el-option>
            <el-option label="인사팀" value="인사팀"></el-option>
            <el-option label="재무팀" value="재무팀"></el-option>
          </el-select>
        </el-form-item>

        <!-- 직급 선택 -->
        <el-form-item label="직급" prop="position">
          <el-select
            v-model="editForm.position"
            placeholder="직급을 선택하세요"
            style="width: 100%"
          >
            <el-option label="사원" value="사원"></el-option>
            <el-option label="대리" value="대리"></el-option>
            <el-option label="과장" value="과장"></el-option>
            <el-option label="차장" value="차장"></el-option>
            <el-option label="부장" value="부장"></el-option>
            <el-option label="이사" value="이사"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 다이얼로그 하단 버튼 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">취소</el-button>
          <el-button type="primary" @click="submitEdit" :loading="editLoading">
            수정
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 
      =========================================
      ⭐ 권한 변경 다이얼로그 (16일차 신규)
      =========================================
      - ADMIN, MANAGER 사용 가능
      - 사용자의 역할(Role)을 변경
      - 다중 선택 가능 (체크박스)
      - 기본 역할: ROLE_USER는 모든 사용자에게 자동 부여
    -->
    <el-dialog
      v-model="roleDialogVisible"
      title="사용자 권한 변경"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="role-dialog-content">
        <div class="current-user-info">
          <p><strong>사용자:</strong> {{ currentUser?.username }}</p>
          <p><strong>이름:</strong> {{ currentUser?.fullName }}</p>
        </div>

        <el-divider />

        <div class="role-selection">
          <p class="role-title">역할 선택 (복수 선택 가능)</p>
          
          <!-- 역할 체크박스 목록 -->
          <el-checkbox-group v-model="selectedRoles">
            <el-checkbox
              v-for="role in availableRoles"
              :key="role.roleId"
              :label="role.roleId"
              :value="role.roleId"
            >
              <span class="role-name">{{ role.displayName }}</span>
              <span class="role-description">{{ role.description }}</span>
            </el-checkbox>
          </el-checkbox-group>

          <div class="role-tip">
            <el-icon color="#E6A23C"><WarningFilled /></el-icon>
            <span>ROLE_USER는 모든 사용자에게 기본으로 부여됩니다</span>
          </div>
        </div>
      </div>

      <!-- 다이얼로그 하단 버튼 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">취소</el-button>
          <el-button type="primary" @click="submitRoleChange" :loading="roleLoading">
            변경
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 
      =========================================
      권한 없음 안내 컴포넌트
      =========================================
      - 일반 사용자(ROLE_USER)가 이 페이지에 접근한 경우 표시
      - 필요한 권한 안내
    -->
    <NoPermission
      v-if="!canManageUser"
      :required-roles="['ROLE_ADMIN', 'ROLE_MANAGER']"
    />
  </div>
</template>

<script>
/**
 * =============================================================================
 * UserManagementView.vue - 사용자 관리 페이지 (16일차 완성 버전)
 * =============================================================================
 * 
 * @description
 * 시스템 사용자를 관리하는 페이지입니다.
 * 사용자 조회, 생성, 수정, 삭제, 권한 변경, 계정 잠금/해제 기능을 제공합니다.
 * 
 * @author KM Portal Team
 * @version 3.0 (16일차 최종 완성본)
 * @since 2025-11-11
 * 
 * @requires vue - Vue 3 Composition API
 * @requires vuex - 상태 관리 (사용자 인증 정보)
 * @requires element-plus - UI 컴포넌트 라이브러리
 * @requires axios - HTTP 클라이언트
 * 
 * =============================================================================
 * 주요 기능
 * =============================================================================
 * 1. 사용자 목록 조회
 *    - 페이징 처리 (10, 20, 50, 100명 단위)
 *    - 키워드 검색 (사용자명, 이메일)
 *    - 부서 필터링
 *    - 상태 필터링 (활성/비활성/잠금)
 * 
 * 2. 사용자 생성 (ADMIN만)
 *    - 다이얼로그 폼으로 입력
 *    - 필수 필드 검증
 *    - 중복 확인 (username, email)
 *    - 비밀번호 강도 검증
 * 
 * 3. 사용자 수정 (ADMIN, MANAGER)
 *    - 이메일, 이름, 부서, 직급 수정
 *    - username과 password는 변경 불가
 * 
 * 4. 권한 변경 (ADMIN, MANAGER)
 *    - 역할(Role) 다중 선택
 *    - ROLE_USER는 자동 부여
 * 
 * 5. 계정 관리
 *    - 계정 잠금/해제 (ADMIN, MANAGER)
 *    - 사용자 삭제/비활성화 (ADMIN만)
 * 
 * 6. 통계 정보
 *    - 전체 사용자 수
 *    - 활성 사용자 수
 *    - 잠금된 계정 수
 *    - 이번 주 가입자 수
 * 
 * =============================================================================
 * 권한 제어
 * =============================================================================
 * - ADMIN: 모든 기능 사용 가능
 * - MANAGER: 생성, 삭제 제외한 모든 기능
 * - USER: 페이지 접근 불가
 * 
 * =============================================================================
 * API 엔드포인트
 * =============================================================================
 * - GET    /api/users               - 사용자 목록 조회
 * - GET    /api/users/statistics    - 통계 정보
 * - GET    /api/users/{id}          - 사용자 상세 조회
 * - POST   /api/users               - 사용자 생성
 * - PUT    /api/users/{id}          - 사용자 수정
 * - DELETE /api/users/{id}          - 사용자 삭제
 * - POST   /api/users/{id}/lock     - 계정 잠금
 * - POST   /api/users/{id}/unlock   - 계정 해제
 * - PUT    /api/users/{id}/roles    - 권한 변경
 * - GET    /api/roles                - 역할 목록 조회
 * 
 * =============================================================================
 */

// Vue 3 Composition API 임포트
import { ref, reactive, computed, onMounted } from 'vue'
// Vuex 스토어 사용을 위한 임포트
import { useStore } from 'vuex'
// Element Plus 메시지 컴포넌트
import { ElMessage, ElMessageBox } from 'element-plus'
// Element Plus 아이콘 컴포넌트
import {
  User, UserFilled, Search, RefreshLeft, Plus, Refresh,
  Edit, Delete, Lock, Unlock, Key,
  SuccessFilled, WarningFilled, StarFilled
} from '@element-plus/icons-vue'
// 권한 없음 안내 컴포넌트
import NoPermission from '@/components/common/NoPermission.vue'
// Axios HTTP 클라이언트
import axios from 'axios'

export default {
  name: 'UserManagementView',

  // 사용할 컴포넌트 등록
  components: {
    User, UserFilled, Search, RefreshLeft, Plus, Refresh,
    Edit, Delete, Lock, Unlock, Key,
    SuccessFilled, WarningFilled, StarFilled,
    NoPermission
  },

  setup() {
    // ==========================================================================
    // Vuex Store 연결
    // ==========================================================================
    const store = useStore()

    // ==========================================================================
    // ⭐ 권한 확인 Computed 속성들
    // ==========================================================================
    // 현재 사용자가 ADMIN 권한을 가지고 있는지 확인
    const isAdmin = computed(() => store.getters['auth/isAdmin'])
    
    // 현재 사용자가 MANAGER 권한을 가지고 있는지 확인
    const isManager = computed(() => store.getters['auth/isManager'])
    
    // 사용자 관리 권한 (ADMIN 또는 MANAGER)
    const canManageUser = computed(() => isAdmin.value || isManager.value)

    // ==========================================================================
    // 반응형 데이터 정의
    // ==========================================================================
    
    /**
     * 로딩 상태
     * - API 호출 중일 때 true로 설정
     * - 테이블에 로딩 스피너 표시
     */
    const loading = ref(false)
    
    /**
     * 사용자 목록 데이터
     * - 백엔드 API로부터 받은 사용자 배열
     */
    const users = ref([])

    /**
     * 검색 폼 데이터
     * - keyword: 사용자명 또는 이메일 검색어
     * - department: 부서 필터
     * - status: 상태 필터 (active, inactive, locked)
     */
    const searchForm = reactive({
      keyword: '',      // 검색 키워드
      department: '',   // 부서 필터
      status: ''        // 상태 필터
    })

    /**
     * 페이징 정보
     * - currentPage: 현재 페이지 번호 (1부터 시작)
     * - pageSize: 페이지당 표시할 사용자 수
     * - total: 전체 사용자 수
     */
    const pagination = reactive({
      currentPage: 1,   // 현재 페이지
      pageSize: 10,     // 페이지 크기
      total: 0          // 전체 사용자 수
    })

    /**
     * 통계 정보
     * - 대시보드 상단 카드에 표시될 통계 데이터
     */
    const statistics = reactive({
      totalUsers: 0,        // 전체 사용자 수
      activeUsers: 0,       // 활성 사용자 수
      lockedUsers: 0,       // 잠금된 계정 수
      newUsersThisWeek: 0   // 이번 주 가입자 수
    })

    // ==========================================================================
    // ⭐ 사용자 생성 다이얼로그 관련 (16일차 신규)
    // ==========================================================================
    
    /**
     * 생성 다이얼로그 표시 여부
     */
    const createDialogVisible = ref(false)
    
    /**
     * 생성 폼 로딩 상태
     */
    const createLoading = ref(false)
    
    /**
     * 생성 폼 참조 (유효성 검증용)
     */
    const createFormRef = ref(null)
    
    /**
     * 생성 폼 데이터
     */
    const createForm = reactive({
      username: '',           // 사용자명 (로그인 ID)
      password: '',           // 비밀번호
      passwordConfirm: '',    // 비밀번호 확인
      email: '',              // 이메일
      fullName: '',           // 이름
      department: '',         // 부서
      position: ''            // 직급
    })
    
    /**
     * 생성 폼 유효성 검증 규칙
     */
    const createRules = {
      // 사용자명 검증
      username: [
        { required: true, message: '사용자명을 입력하세요', trigger: 'blur' },
        { min: 4, max: 20, message: '4-20자 사이로 입력하세요', trigger: 'blur' },
        { 
          pattern: /^[a-zA-Z0-9]+$/, 
          message: '영문과 숫자만 사용 가능합니다', 
          trigger: 'blur' 
        }
      ],
      // 비밀번호 검증
      password: [
        { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
        { min: 8, message: '8자 이상 입력하세요', trigger: 'blur' },
        {
          pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/,
          message: '영문, 숫자, 특수문자를 포함해야 합니다',
          trigger: 'blur'
        }
      ],
      // 비밀번호 확인 검증
      passwordConfirm: [
        { required: true, message: '비밀번호를 다시 입력하세요', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== createForm.password) {
              callback(new Error('비밀번호가 일치하지 않습니다'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      // 이메일 검증
      email: [
        { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      // 이름 검증
      fullName: [
        { required: true, message: '이름을 입력하세요', trigger: 'blur' },
        { min: 2, max: 20, message: '2-20자 사이로 입력하세요', trigger: 'blur' }
      ],
      // 부서 검증
      department: [
        { required: true, message: '부서를 선택하세요', trigger: 'change' }
      ],
      // 직급 검증
      position: [
        { required: true, message: '직급을 선택하세요', trigger: 'change' }
      ]
    }

    // ==========================================================================
    // ⭐ 사용자 수정 다이얼로그 관련 (16일차 신규)
    // ==========================================================================
    
    /**
     * 수정 다이얼로그 표시 여부
     */
    const editDialogVisible = ref(false)
    
    /**
     * 수정 폼 로딩 상태
     */
    const editLoading = ref(false)
    
    /**
     * 수정 폼 참조 (유효성 검증용)
     */
    const editFormRef = ref(null)
    
    /**
     * 수정 폼 데이터
     */
    const editForm = reactive({
      userId: null,       // 수정할 사용자 ID
      username: '',       // 사용자명 (읽기 전용)
      email: '',          // 이메일
      fullName: '',       // 이름
      department: '',     // 부서
      position: ''        // 직급
    })
    
    /**
     * 수정 폼 유효성 검증 규칙
     */
    const editRules = {
      email: [
        { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      fullName: [
        { required: true, message: '이름을 입력하세요', trigger: 'blur' },
        { min: 2, max: 20, message: '2-20자 사이로 입력하세요', trigger: 'blur' }
      ],
      department: [
        { required: true, message: '부서를 선택하세요', trigger: 'change' }
      ],
      position: [
        { required: true, message: '직급을 선택하세요', trigger: 'change' }
      ]
    }

    // ==========================================================================
    // ⭐ 권한 변경 다이얼로그 관련 (16일차 신규)
    // ==========================================================================
    
    /**
     * 권한 변경 다이얼로그 표시 여부
     */
    const roleDialogVisible = ref(false)
    
    /**
     * 권한 변경 로딩 상태
     */
    const roleLoading = ref(false)
    
    /**
     * 현재 권한을 변경하려는 사용자 정보
     */
    const currentUser = ref(null)
    
    /**
     * 선택된 역할 ID 배열
     */
    const selectedRoles = ref([])
    
    /**
     * 사용 가능한 모든 역할 목록
     */
    const availableRoles = ref([])

    // ==========================================================================
    // API 호출 함수들
    // ==========================================================================

    /**
     * ⭐ 사용자 목록 조회 (16일차 개선: 부서/상태 필터 추가)
     * 
     * @description
     * 백엔드 API를 호출하여 사용자 목록을 조회합니다.
     * 페이징, 검색, 필터링 기능을 지원합니다.
     * 
     * @api GET /api/users
     * @auth ADMIN, MANAGER
     * 
     * @param {number} page - 페이지 번호 (0부터 시작)
     * @param {number} size - 페이지 크기
     * @param {string} keyword - 검색 키워드 (선택)
     * @param {string} department - 부서 필터 (선택)
     * @param {string} status - 상태 필터 (선택)
     * @param {string} sortBy - 정렬 기준
     * @param {string} sortDir - 정렬 방향 (asc, desc)
     * 
     * @returns {Promise<void>}
     * 
     * @throws {Error} 권한 없음 (403)
     * @throws {Error} 서버 오류 (500)
     */
    const fetchUsers = async () => {
      try {
        // 로딩 시작
        loading.value = true

        // API 요청 파라미터 구성
        const params = {
          page: pagination.currentPage - 1,  // 백엔드는 0부터 시작
          size: pagination.pageSize,
          sortBy: 'username',                // 사용자명으로 정렬
          sortDir: 'asc'                     // 오름차순 정렬
        }

        // ⭐ 검색 키워드 추가
        if (searchForm.keyword) {
          params.keyword = searchForm.keyword
        }

        // ⭐ 부서 필터 추가 (16일차 개선)
        if (searchForm.department) {
          params.department = searchForm.department
        }

        // ⭐ 상태 필터 추가 (16일차 개선)
        if (searchForm.status) {
          params.status = searchForm.status
        }

        console.log('[UserManagement] 사용자 목록 조회 요청:', params)

        // 백엔드 API 호출
        const response = await axios.get('/api/users', { params })

        console.log('[UserManagement] 사용자 목록 조회 응답:', response.data)

        // 응답 데이터 처리
        // 백엔드 응답 형식에 따라 조정 필요
        users.value = response.data.users || response.data.content || []
        pagination.total = response.data.totalElements || response.data.total || 0

        // 성공 메시지 (첫 로드 시에만 표시)
        if (pagination.currentPage === 1) {
          ElMessage.success(`사용자 ${pagination.total}명을 불러왔습니다`)
        }

      } catch (error) {
        console.error('[UserManagement] 사용자 목록 조회 오류:', error)
        
        // 에러 타입에 따라 다른 메시지 표시
        if (error.response?.status === 403) {
          ElMessage.error('사용자 목록을 조회할 권한이 없습니다')
        } else if (error.response?.status === 401) {
          ElMessage.error('로그인이 필요합니다')
        } else {
          ElMessage.error('사용자 목록을 불러오는 중 오류가 발생했습니다')
        }
      } finally {
        // 로딩 종료
        loading.value = false
      }
    }

    /**
     * 통계 정보 조회
     * 
     * @description
     * 사용자 관련 통계 정보를 조회합니다.
     * 페이지 상단 통계 카드에 표시됩니다.
     * 
     * @api GET /api/users/statistics
     * @auth ADMIN, MANAGER
     * 
     * @returns {Promise<void>}
     */
    const fetchStatistics = async () => {
      try {
        console.log('[UserManagement] 통계 정보 조회 시작')

        // 백엔드 API 호출
        const response = await axios.get('/api/users/statistics')
        
        // 응답 데이터를 statistics 객체에 할당
        Object.assign(statistics, {
          totalUsers: response.data.totalUsers || 0,
          activeUsers: response.data.activeUsers || 0,
          lockedUsers: response.data.lockedUsers || 0,
          newUsersThisWeek: response.data.newUsersThisWeek || 0
        })

        console.log('[UserManagement] 통계 정보:', statistics)

      } catch (error) {
        console.error('[UserManagement] 통계 조회 오류:', error)
        // 통계 조회는 필수가 아니므로 에러 메시지 표시 안함
      }
    }

    /**
     * ⭐ 사용 가능한 역할 목록 조회 (16일차 신규)
     * 
     * @description
     * 권한 변경 다이얼로그에서 사용할 역할 목록을 조회합니다.
     * 
     * @api GET /api/roles
     * @auth ADMIN, MANAGER
     * 
     * @returns {Promise<void>}
     */
    const fetchRoles = async () => {
      try {
        console.log('[UserManagement] 역할 목록 조회 시작')

        // 백엔드 API 호출
        const response = await axios.get('/api/roles')
        
        // 역할 목록 저장
        availableRoles.value = response.data.roles || response.data || []

        console.log('[UserManagement] 역할 목록:', availableRoles.value)

      } catch (error) {
        console.error('[UserManagement] 역할 목록 조회 오류:', error)
        ElMessage.error('역할 목록을 불러오는 중 오류가 발생했습니다')
      }
    }

    // ==========================================================================
    // 검색 및 필터링 핸들러
    // ==========================================================================

    /**
     * 검색 버튼 클릭 핸들러
     * 
     * @description
     * 검색 폼의 조건으로 사용자 목록을 다시 조회합니다.
     * 첫 페이지로 이동합니다.
     */
    const handleSearch = () => {
      console.log('[UserManagement] 검색 실행:', searchForm)
      
      // 첫 페이지로 이동
      pagination.currentPage = 1
      
      // 사용자 목록 재조회
      fetchUsers()
    }

    /**
     * 초기화 버튼 클릭 핸들러
     * 
     * @description
     * 검색 폼을 초기화하고 전체 사용자 목록을 조회합니다.
     */
    const handleReset = () => {
      console.log('[UserManagement] 검색 조건 초기화')
      
      // 검색 폼 초기화
      searchForm.keyword = ''
      searchForm.department = ''
      searchForm.status = ''
      
      // 첫 페이지로 이동
      pagination.currentPage = 1
      
      // 사용자 목록 재조회
      fetchUsers()
    }

    // ==========================================================================
    // 페이징 핸들러
    // ==========================================================================

    /**
     * 페이지 크기 변경 핸들러
     * 
     * @param {number} newSize - 새로운 페이지 크기 (10, 20, 50, 100)
     */
    const handleSizeChange = (newSize) => {
      console.log('[UserManagement] 페이지 크기 변경:', newSize)
      
      // 페이지 크기 변경
      pagination.pageSize = newSize
      
      // 첫 페이지로 이동
      pagination.currentPage = 1
      
      // 사용자 목록 재조회
      fetchUsers()
    }

    /**
     * 페이지 변경 핸들러
     * 
     * @param {number} newPage - 새로운 페이지 번호
     */
    const handlePageChange = (newPage) => {
      console.log('[UserManagement] 페이지 변경:', newPage)
      
      // 페이지 번호 변경
      pagination.currentPage = newPage
      
      // 사용자 목록 재조회
      fetchUsers()
    }

    // ==========================================================================
    // ⭐ 사용자 생성 관련 (16일차 신규)
    // ==========================================================================

    /**
     * 새 사용자 생성 버튼 클릭 핸들러
     * 
     * @description
     * 사용자 생성 다이얼로그를 엽니다.
     * ADMIN만 실행 가능합니다.
     */
    const handleCreate = () => {
      console.log('[UserManagement] 사용자 생성 다이얼로그 열기')
      
      // 폼 초기화
      createForm.username = ''
      createForm.password = ''
      createForm.passwordConfirm = ''
      createForm.email = ''
      createForm.fullName = ''
      createForm.department = ''
      createForm.position = ''
      
      // 다이얼로그 표시
      createDialogVisible.value = true
    }

    /**
     * 사용자 생성 제출 핸들러
     * 
     * @description
     * 폼 유효성 검증 후 백엔드 API를 호출하여 사용자를 생성합니다.
     * 
     * @api POST /api/users
     * @auth ADMIN
     * 
     * @returns {Promise<void>}
     */
    const submitCreate = async () => {
      try {
        // 폼 유효성 검증
        await createFormRef.value.validate()

        console.log('[UserManagement] 사용자 생성 요청:', createForm)

        // 로딩 시작
        createLoading.value = true

        // API 요청 데이터 준비
        const userData = {
          username: createForm.username,
          password: createForm.password,
          email: createForm.email,
          fullName: createForm.fullName,
          department: createForm.department,
          position: createForm.position
        }

        // 백엔드 API 호출
        const response = await axios.post('/api/users', userData)

        console.log('[UserManagement] 사용자 생성 응답:', response.data)

        // 성공 메시지
        ElMessage.success('사용자가 생성되었습니다')

        // 다이얼로그 닫기
        createDialogVisible.value = false

        // 사용자 목록 새로고침
        fetchUsers()
        fetchStatistics()

      } catch (error) {
        console.error('[UserManagement] 사용자 생성 오류:', error)

        // 에러 처리
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else if (error.response?.status === 409) {
          ElMessage.error('이미 존재하는 사용자명 또는 이메일입니다')
        } else if (error.response?.status === 403) {
          ElMessage.error('사용자를 생성할 권한이 없습니다')
        } else {
          ElMessage.error('사용자 생성 중 오류가 발생했습니다')
        }
      } finally {
        // 로딩 종료
        createLoading.value = false
      }
    }

    // ==========================================================================
    // ⭐ 사용자 수정 관련 (16일차 신규)
    // ==========================================================================

    /**
     * 사용자 수정 버튼 클릭 핸들러
     * 
     * @description
     * 사용자 수정 다이얼로그를 엽니다.
     * 기존 사용자 정보를 폼에 로드합니다.
     * 
     * @param {Object} user - 수정할 사용자 객체
     */
    const handleEdit = async (user) => {
      console.log('[UserManagement] 사용자 수정 다이얼로그 열기:', user.username)

      try {
        // 로딩 표시 (선택사항)
        loading.value = true

        // 사용자 상세 정보 조회 (필요한 경우)
        // const response = await axios.get(`/api/users/${user.userId}`)
        // const userDetail = response.data

        // 폼에 데이터 로드
        editForm.userId = user.userId
        editForm.username = user.username
        editForm.email = user.email
        editForm.fullName = user.fullName
        editForm.department = user.department
        editForm.position = user.position

        // 다이얼로그 표시
        editDialogVisible.value = true

      } catch (error) {
        console.error('[UserManagement] 사용자 정보 조회 오류:', error)
        ElMessage.error('사용자 정보를 불러오는 중 오류가 발생했습니다')
      } finally {
        loading.value = false
      }
    }

    /**
     * 사용자 수정 제출 핸들러
     * 
     * @description
     * 폼 유효성 검증 후 백엔드 API를 호출하여 사용자 정보를 수정합니다.
     * 
     * @api PUT /api/users/{id}
     * @auth ADMIN, MANAGER
     * 
     * @returns {Promise<void>}
     */
    const submitEdit = async () => {
      try {
        // 폼 유효성 검증
        await editFormRef.value.validate()

        console.log('[UserManagement] 사용자 수정 요청:', editForm)

        // 로딩 시작
        editLoading.value = true

        // API 요청 데이터 준비 (username과 userId는 제외)
        const userData = {
          email: editForm.email,
          fullName: editForm.fullName,
          department: editForm.department,
          position: editForm.position
        }

        // 백엔드 API 호출
        const response = await axios.put(
          `/api/users/${editForm.userId}`,
          userData
        )

        console.log('[UserManagement] 사용자 수정 응답:', response.data)

        // 성공 메시지
        ElMessage.success('사용자 정보가 수정되었습니다')

        // 다이얼로그 닫기
        editDialogVisible.value = false

        // 사용자 목록 새로고침
        fetchUsers()

      } catch (error) {
        console.error('[UserManagement] 사용자 수정 오류:', error)

        // 에러 처리
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else if (error.response?.status === 403) {
          ElMessage.error('사용자 정보를 수정할 권한이 없습니다')
        } else {
          ElMessage.error('사용자 수정 중 오류가 발생했습니다')
        }
      } finally {
        // 로딩 종료
        editLoading.value = false
      }
    }

    // ==========================================================================
    // ⭐ 권한 변경 관련 (16일차 신규)
    // ==========================================================================

    /**
     * 권한 변경 버튼 클릭 핸들러
     * 
     * @description
     * 권한 변경 다이얼로그를 엽니다.
     * 현재 사용자의 역할을 체크박스에 표시합니다.
     * 
     * @param {Object} user - 권한을 변경할 사용자 객체
     */
    const handleChangeRole = async (user) => {
      console.log('[UserManagement] 권한 변경 다이얼로그 열기:', user.username)

      try {
        // 현재 사용자 저장
        currentUser.value = user

        // 사용 가능한 역할 목록이 없으면 조회
        if (availableRoles.value.length === 0) {
          await fetchRoles()
        }

        // 현재 사용자의 역할 ID 추출
        selectedRoles.value = user.roles?.map(role => role.roleId) || []

        console.log('[UserManagement] 현재 선택된 역할:', selectedRoles.value)

        // 다이얼로그 표시
        roleDialogVisible.value = true

      } catch (error) {
        console.error('[UserManagement] 권한 변경 준비 오류:', error)
        ElMessage.error('권한 변경을 준비하는 중 오류가 발생했습니다')
      }
    }

    /**
     * 권한 변경 제출 핸들러
     * 
     * @description
     * 선택된 역할로 사용자의 권한을 변경합니다.
     * 
     * @api PUT /api/users/{id}/roles
     * @auth ADMIN, MANAGER
     * 
     * @returns {Promise<void>}
     */
    const submitRoleChange = async () => {
      try {
        // 최소 1개 이상의 역할 선택 확인
        if (selectedRoles.value.length === 0) {
          ElMessage.warning('최소 1개 이상의 역할을 선택하세요')
          return
        }

        console.log('[UserManagement] 권한 변경 요청:', {
          userId: currentUser.value.userId,
          roleIds: selectedRoles.value
        })

        // 로딩 시작
        roleLoading.value = true

        // 백엔드 API 호출
        const response = await axios.put(
          `/api/users/${currentUser.value.userId}/roles`,
          { roleIds: selectedRoles.value }
        )

        console.log('[UserManagement] 권한 변경 응답:', response.data)

        // 성공 메시지
        ElMessage.success('사용자 권한이 변경되었습니다')

        // 다이얼로그 닫기
        roleDialogVisible.value = false

        // 사용자 목록 새로고침
        fetchUsers()

      } catch (error) {
        console.error('[UserManagement] 권한 변경 오류:', error)

        // 에러 처리
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else if (error.response?.status === 403) {
          ElMessage.error('권한을 변경할 권한이 없습니다')
        } else {
          ElMessage.error('권한 변경 중 오류가 발생했습니다')
        }
      } finally {
        // 로딩 종료
        roleLoading.value = false
      }
    }

    // ==========================================================================
    // 계정 관리 (잠금/해제, 삭제)
    // ==========================================================================

    /**
     * 계정 잠금/해제 토글 핸들러
     * 
     * @description
     * 사용자 계정을 잠금 또는 해제합니다.
     * 잠긴 계정은 로그인할 수 없습니다.
     * 
     * @api POST /api/users/{id}/lock
     * @api POST /api/users/{id}/unlock
     * @auth ADMIN, MANAGER
     * 
     * @param {Object} user - 잠금/해제할 사용자 객체
     * @returns {Promise<void>}
     */
    const handleToggleLock = async (user) => {
      try {
        // 잠금 또는 해제
        const action = user.isLocked ? '해제' : '잠금'
        
        // 확인 다이얼로그
        await ElMessageBox.confirm(
          `${user.username} 계정을 ${action}하시겠습니까?`,
          `계정 ${action} 확인`,
          {
            confirmButtonText: action,
            cancelButtonText: '취소',
            type: 'warning'
          }
        )

        console.log(`[UserManagement] 계정 ${action} 요청:`, user.userId)

        // API 엔드포인트 결정
        const endpoint = user.isLocked
          ? `/api/users/${user.userId}/unlock`
          : `/api/users/${user.userId}/lock`

        // 백엔드 API 호출
        await axios.post(endpoint)

        // 성공 메시지
        ElMessage.success(`계정이 ${action}되었습니다`)
        
        // 목록 새로고침
        fetchUsers()

      } catch (error) {
        // 취소 버튼 클릭 시
        if (error === 'cancel') {
          return
        }

        console.error('[UserManagement] 계정 잠금/해제 오류:', error)

        // 에러 처리
        if (error.response?.status === 403) {
          ElMessage.error('계정 상태를 변경할 권한이 없습니다')
        } else {
          ElMessage.error('계정 상태 변경 중 오류가 발생했습니다')
        }
      }
    }

    /**
     * 사용자 삭제 핸들러
     * 
     * @description
     * 사용자를 삭제(비활성화)합니다.
     * 실제로는 데이터를 삭제하지 않고 isActive를 false로 설정합니다.
     * 
     * @api DELETE /api/users/{id}
     * @auth ADMIN만
     * 
     * @param {Object} user - 삭제할 사용자 객체
     * @returns {Promise<void>}
     */
    const handleDelete = async (user) => {
      try {
        // 확인 다이얼로그
        await ElMessageBox.confirm(
          `${user.username} 사용자를 삭제하시겠습니까?\n삭제된 사용자는 복구할 수 없습니다.`,
          '사용자 삭제 확인',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'error',
            dangerouslyUseHTMLString: false
          }
        )

        console.log('[UserManagement] 사용자 삭제 요청:', user.userId)

        // 백엔드 API 호출
        await axios.delete(`/api/users/${user.userId}`)

        // 성공 메시지
        ElMessage.success('사용자가 삭제되었습니다')
        
        // 목록 새로고침
        fetchUsers()
        fetchStatistics()

      } catch (error) {
        // 취소 버튼 클릭 시
        if (error === 'cancel') {
          return
        }

        console.error('[UserManagement] 사용자 삭제 오류:', error)

        // 에러 처리
        if (error.response?.status === 403) {
          ElMessage.error('사용자를 삭제할 권한이 없습니다')
        } else if (error.response?.status === 409) {
          ElMessage.error('삭제할 수 없는 사용자입니다')
        } else {
          ElMessage.error('사용자 삭제 중 오류가 발생했습니다')
        }
      }
    }

    // ==========================================================================
    // 유틸리티 함수
    // ==========================================================================

    /**
     * 역할에 따른 태그 타입 반환
     * 
     * @param {string} roleName - 역할명 (ROLE_ADMIN, ROLE_MANAGER 등)
     * @returns {string} Element Plus 태그 타입 (danger, warning, success, info)
     */
    const getRoleTagType = (roleName) => {
      const typeMap = {
        'ROLE_ADMIN': 'danger',          // 빨간색
        'ROLE_MANAGER': 'warning',       // 주황색
        'ROLE_BOARD_ADMIN': 'success',   // 초록색
        'ROLE_USER': 'info'              // 회색
      }
      return typeMap[roleName] || 'info'
    }

    /**
     * 날짜 포맷팅
     * 
     * @param {string} dateString - ISO 8601 형식의 날짜 문자열
     * @returns {string} 한국어 형식으로 포맷된 날짜 (예: 2025. 11. 11. 14:30)
     */
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      
      const date = new Date(dateString)
      
      // 유효하지 않은 날짜
      if (isNaN(date.getTime())) return '-'
      
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // ==========================================================================
    // 라이프사이클 훅
    // ==========================================================================

    /**
     * 컴포넌트 마운트 시 실행
     * 
     * @description
     * 페이지 로드 시 필요한 초기 데이터를 조회합니다.
     * - 권한 확인
     * - 사용자 목록 조회
     * - 통계 정보 조회
     */
    onMounted(() => {
      console.log('[UserManagement] 컴포넌트 마운트됨')
      
      // 권한 확인
      if (!canManageUser.value) {
        ElMessage.warning('사용자 관리 권한이 없습니다')
        console.warn('[UserManagement] 권한 없음 - ADMIN 또는 MANAGER 필요')
        return
      }

      console.log('[UserManagement] 권한 확인 완료 - 초기 데이터 로드 시작')

      // 초기 데이터 로드
      fetchUsers()       // 사용자 목록 조회
      fetchStatistics()  // 통계 정보 조회
    })

    // ==========================================================================
    // 컴포넌트에서 사용할 속성 및 메서드 반환
    // ==========================================================================
    return {
      // 권한 관련
      isAdmin,
      isManager,
      canManageUser,
      
      // 데이터
      loading,
      users,
      searchForm,
      pagination,
      statistics,
      
      // 검색 및 페이징
      fetchUsers,
      handleSearch,
      handleReset,
      handleSizeChange,
      handlePageChange,
      
      // 사용자 생성 (16일차)
      createDialogVisible,
      createLoading,
      createFormRef,
      createForm,
      createRules,
      handleCreate,
      submitCreate,
      
      // 사용자 수정 (16일차)
      editDialogVisible,
      editLoading,
      editFormRef,
      editForm,
      editRules,
      handleEdit,
      submitEdit,
      
      // 권한 변경 (16일차)
      roleDialogVisible,
      roleLoading,
      currentUser,
      selectedRoles,
      availableRoles,
      handleChangeRole,
      submitRoleChange,
      
      // 계정 관리
      handleToggleLock,
      handleDelete,
      
      // 유틸리티
      getRoleTagType,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
/**
 * =============================================================================
 * 사용자 관리 페이지 스타일
 * =============================================================================
 */

.user-management {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;

  /**
   * 페이지 헤더
   */
  .page-header {
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-description {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  /**
   * 검색 카드
   */
  .search-card {
    margin-bottom: 20px;

    .search-form {
      margin-bottom: 0;

      // 폼 아이템 간격
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  /**
   * 통계 카드
   */
  .statistics-row {
    margin-bottom: 20px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 0;

      .stat-icon {
        font-size: 40px;
        flex-shrink: 0;
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  /**
   * 테이블 카드
   */
  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        .total-count {
          font-size: 14px;
          color: #606266;

          strong {
            color: #409EFF;
            font-size: 16px;
          }
        }
      }

      .header-right {
        display: flex;
        gap: 8px;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }

  /**
   * 다이얼로그 내부 스타일
   */
  .form-tip {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .role-dialog-content {
    .current-user-info {
      padding: 0 8px;

      p {
        margin: 8px 0;
        font-size: 14px;
        color: #606266;

        strong {
          color: #303133;
          margin-right: 8px;
        }
      }
    }

    .role-selection {
      .role-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }

      :deep(.el-checkbox-group) {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-checkbox {
          margin: 0;

          .role-name {
            font-weight: 600;
            color: #303133;
            margin-right: 8px;
          }

          .role-description {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .role-tip {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 12px;
        background-color: #FDF6EC;
        border: 1px solid #F5DAB1;
        border-radius: 4px;
        font-size: 12px;
        color: #E6A23C;
      }
    }
  }
}

/**
 * 반응형 디자인 - 태블릿 (768px ~ 1024px)
 */
@media (max-width: 1024px) {
  .user-management {
    padding: 16px;

    .table-card {
      // 테이블 가로 스크롤
      :deep(.el-table) {
        font-size: 13px;
      }
    }
  }
}

/**
 * 반응형 디자인 - 모바일 (max-width: 768px)
 */
@media (max-width: 768px) {
  .user-management {
    padding: 10px;

    .page-header {
      .page-title {
        font-size: 20px;
      }

      .page-description {
        font-size: 13px;
      }
    }

    // 검색 폼 세로 정렬
    .search-form {
      :deep(.el-form-item) {
        width: 100%;
        margin-bottom: 12px;

        .el-input,
        .el-select {
          width: 100% !important;
        }
      }
    }

    // 통계 카드 간격 조정
    .statistics-row {
      :deep(.el-col) {
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    // 테이블 헤더 세로 정렬
    .table-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start !important;

      .header-right {
        width: 100%;
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }

    // 테이블 폰트 크기 축소
    :deep(.el-table) {
      font-size: 12px;
    }

    // 페이지네이션 레이아웃 조정
    .pagination-container {
      :deep(.el-pagination) {
        .el-pagination__total,
        .el-pagination__sizes {
          display: none;
        }
      }
    }
  }
}
</style>