<template>
  <!--
    알림 목록 페이지 (NotificationList.vue)
    
    전체 알림을 확인하고 관리할 수 있는 페이지입니다.
    
    주요 기능:
    - 알림 목록 조회 (페이징)
    - 읽음/안읽음 필터링
    - 알림 유형별 필터링
    - 개별/전체 읽음 처리
    - 알림 삭제
    - 알림 클릭 시 해당 페이지로 이동
    
    작성일: 2025년 11월 26일 (34일차)
    작성자: 34일차 개발 담당자
  -->
  <div class="notification-list-container">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h2>알림</h2>
        <el-tag v-if="unreadCount > 0" type="danger" effect="dark" size="small">
          {{ unreadCount }}개 읽지 않음
        </el-tag>
      </div>
      
      <div class="header-actions">
        <!-- 전체 읽음 처리 버튼 -->
        <el-button 
          type="primary" 
          plain
          :disabled="unreadCount === 0"
          :loading="markingAllRead"
          @click="handleMarkAllAsRead"
        >
          <el-icon><Check /></el-icon>
          전체 읽음 처리
        </el-button>
      </div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <el-card shadow="never">
        <div class="filter-row">
          <!-- 읽음 상태 필터 -->
          <div class="filter-item">
            <span class="filter-label">읽음 상태</span>
            <el-select 
              v-model="filters.isRead" 
              placeholder="전체"
              clearable
              style="width: 120px"
              @change="handleFilterChange"
            >
              <el-option label="전체" :value="null" />
              <el-option label="읽지 않음" :value="false" />
              <el-option label="읽음" :value="true" />
            </el-select>
          </div>

          <!-- 알림 유형 필터 -->
          <div class="filter-item">
            <span class="filter-label">알림 유형</span>
            <el-select 
              v-model="filters.type" 
              placeholder="전체"
              clearable
              style="width: 140px"
              @change="handleFilterChange"
            >
              <el-option label="전체" :value="null" />
              <el-option 
                v-for="type in notificationTypes" 
                :key="type.value"
                :label="type.label" 
                :value="type.value" 
              />
            </el-select>
          </div>

          <!-- 필터 초기화 -->
          <el-button 
            text 
            type="primary" 
            @click="resetFilters"
            v-if="hasActiveFilter"
          >
            <el-icon><RefreshRight /></el-icon>
            필터 초기화
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 알림 목록 -->
    <div class="notification-content">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 알림이 없는 경우 -->
      <div v-else-if="notifications.length === 0" class="empty-container">
        <el-empty description="알림이 없습니다">
          <template #image>
            <el-icon :size="60" color="#909399"><Bell /></el-icon>
          </template>
        </el-empty>
      </div>

      <!-- 알림 목록 -->
      <div v-else class="notification-list">
        <el-card 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-item', { 'unread': !notification.isRead }]"
          shadow="hover"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content-wrapper">
            <!-- 아이콘 -->
            <div class="notification-icon" :class="getIconColorClass(notification.type)">
              <el-icon :size="24">
                <component :is="getIconComponent(notification.type)" />
              </el-icon>
            </div>

            <!-- 내용 -->
            <div class="notification-body">
              <div class="notification-header">
                <span class="notification-type">{{ notification.typeDisplayName }}</span>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message" v-if="notification.message">
                {{ notification.message }}
              </p>
              <div class="notification-meta" v-if="notification.senderName">
                <span class="sender-name">{{ notification.senderName }}</span>
              </div>
            </div>

            <!-- 액션 버튼들 -->
            <div class="notification-actions" @click.stop>
              <!-- 읽음/안읽음 토글 -->
              <el-tooltip :content="notification.isRead ? '읽지 않음으로 표시' : '읽음으로 표시'">
                <el-button 
                  text 
                  circle
                  :icon="notification.isRead ? 'View' : 'Check'"
                  @click="handleToggleRead(notification)"
                />
              </el-tooltip>

              <!-- 삭제 버튼 -->
              <el-tooltip content="삭제">
                <el-button 
                  text 
                  circle
                  type="danger"
                  icon="Delete"
                  @click="handleDelete(notification)"
                />
              </el-tooltip>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 페이징 -->
      <div class="pagination-container" v-if="totalElements > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="totalElements"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 알림 목록 페이지 컴포넌트
 *
 * Vue 3 Composition API를 사용합니다.
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, 
  Check, 
  RefreshRight, 
  ChatDotRound, 
  Document, 
  ChatLineRound,
  InfoFilled,
  Folder,
  Star,
  User,
  View,
  Delete
} from '@element-plus/icons-vue'
import notificationApi from '@/services/notificationApi'

export default {
  name: 'NotificationList',

  // Element Plus 아이콘 컴포넌트 등록
  components: {
    Bell,
    Check,
    RefreshRight,
    ChatDotRound,
    Document,
    ChatLineRound,
    InfoFilled,
    Folder,
    Star,
    User,
    View,
    Delete
  },

  setup() {
    // ====== Vue Router ======
    const router = useRouter()

    // ====== 상태 변수들 ======

    // 알림 목록 데이터
    const notifications = ref([])  // 알림 목록
    const loading = ref(false)      // 로딩 상태
    const unreadCount = ref(0)      // 읽지 않은 알림 개수

    // 페이징 상태
    const currentPage = ref(1)      // 현재 페이지 (1부터 시작, UI용)
    const pageSize = ref(10)        // 페이지 크기
    const totalElements = ref(0)    // 전체 알림 개수
    const totalPages = ref(0)       // 전체 페이지 수

    // 필터 상태
    const filters = reactive({
      isRead: null,   // 읽음 상태 필터 (null: 전체, true: 읽음, false: 안읽음)
      type: null      // 알림 유형 필터
    })

    // 로딩 상태 (버튼별)
    const markingAllRead = ref(false)  // 전체 읽음 처리 중

    // 알림 유형 목록 (필터 드롭다운용)
    const notificationTypes = notificationApi.getNotificationTypes()

    // ====== 계산된 속성 ======

    /**
     * 활성화된 필터가 있는지 확인
     */
    const hasActiveFilter = computed(() => {
      return filters.isRead !== null || filters.type !== null
    })

    // ====== 데이터 로드 메서드 ======

    /**
     * 알림 목록 조회
     *
     * 현재 설정된 페이지와 필터를 기반으로 알림 목록을 조회합니다.
     */
    async function loadNotifications() {
      loading.value = true

      try {
        // API 호출 파라미터 구성
        const params = {
          page: currentPage.value - 1,  // API는 0부터 시작
          size: pageSize.value,
          isRead: filters.isRead,
          type: filters.type
        }

        // API 호출
        const response = await notificationApi.getNotifications(params)

        if (response.success) {
          notifications.value = response.data.content || []
          totalElements.value = response.data.totalElements || 0
          totalPages.value = response.data.totalPages || 0
        } else {
          ElMessage.error(response.message || '알림 목록을 불러오지 못했습니다.')
        }

      } catch (error) {
        console.error('[NotificationList] 알림 목록 조회 실패:', error)
        ElMessage.error('알림 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    async function loadUnreadCount() {
      try {
        unreadCount.value = await notificationApi.getUnreadCount()
      } catch (error) {
        console.error('[NotificationList] 읽지 않은 알림 개수 조회 실패:', error)
      }
    }

    // ====== 이벤트 핸들러 ======

    /**
     * 알림 클릭 처리
     *
     * 알림을 읽음 처리하고 연결된 페이지로 이동합니다.
     *
     * @param {Object} notification - 클릭한 알림
     */
    async function handleNotificationClick(notification) {
      try {
        // 읽지 않은 알림이면 읽음 처리
        if (!notification.isRead) {
          await notificationApi.markAsRead(notification.id)
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }

        // 연결된 페이지가 있으면 이동
        if (notification.link) {
          router.push(notification.link)
        }

      } catch (error) {
        console.error('[NotificationList] 알림 클릭 처리 실패:', error)
      }
    }

    /**
     * 읽음/안읽음 토글 처리
     *
     * @param {Object} notification - 대상 알림
     */
    async function handleToggleRead(notification) {
      try {
        if (!notification.isRead) {
          // 읽음 처리
          await notificationApi.markAsRead(notification.id)
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
          ElMessage.success('알림을 읽음 처리했습니다.')
        } else {
          // 읽지 않음으로는 현재 API가 없으므로 안내만
          ElMessage.info('읽지 않음으로 변경하는 기능은 준비 중입니다.')
        }

      } catch (error) {
        console.error('[NotificationList] 읽음 상태 변경 실패:', error)
        ElMessage.error('알림 상태 변경 중 오류가 발생했습니다.')
      }
    }

    /**
     * 전체 읽음 처리
     */
    async function handleMarkAllAsRead() {
      if (unreadCount.value === 0) {
        ElMessage.info('읽지 않은 알림이 없습니다.')
        return
      }

      try {
        await ElMessageBox.confirm(
          `${unreadCount.value}개의 알림을 모두 읽음 처리하시겠습니까?`,
          '전체 읽음 처리',
          {
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            type: 'info'
          }
        )

        markingAllRead.value = true

        const result = await notificationApi.markAllAsRead()

        if (result.success) {
          ElMessage.success(result.message || '전체 알림을 읽음 처리했습니다.')
          // 목록 새로고침
          await loadNotifications()
          await loadUnreadCount()
        } else {
          ElMessage.error(result.message || '전체 읽음 처리에 실패했습니다.')
        }

      } catch (error) {
        if (error !== 'cancel') {
          console.error('[NotificationList] 전체 읽음 처리 실패:', error)
          ElMessage.error('전체 읽음 처리 중 오류가 발생했습니다.')
        }
      } finally {
        markingAllRead.value = false
      }
    }

    /**
     * 알림 삭제 처리
     *
     * @param {Object} notification - 삭제할 알림
     */
    async function handleDelete(notification) {
      try {
        await ElMessageBox.confirm(
          '이 알림을 삭제하시겠습니까?',
          '알림 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )

        await notificationApi.deleteNotification(notification.id)
        ElMessage.success('알림이 삭제되었습니다.')

        // 목록에서 제거
        const index = notifications.value.findIndex(n => n.id === notification.id)
        if (index !== -1) {
          notifications.value.splice(index, 1)
          totalElements.value--

          // 읽지 않은 알림이었다면 카운트 감소
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
        }

      } catch (error) {
        if (error !== 'cancel') {
          console.error('[NotificationList] 알림 삭제 실패:', error)
          ElMessage.error('알림 삭제 중 오류가 발생했습니다.')
        }
      }
    }

    /**
     * 필터 변경 처리
     */
    function handleFilterChange() {
      currentPage.value = 1  // 첫 페이지로 이동
      loadNotifications()
    }

    /**
     * 필터 초기화
     */
    function resetFilters() {
      filters.isRead = null
      filters.type = null
      currentPage.value = 1
      loadNotifications()
    }

    /**
     * 페이지 변경 처리
     *
     * @param {number} page - 새 페이지 번호
     */
    function handlePageChange(page) {
      currentPage.value = page
      loadNotifications()
    }

    /**
     * 페이지 크기 변경 처리
     *
     * @param {number} size - 새 페이지 크기
     */
    function handlePageSizeChange(size) {
      pageSize.value = size
      currentPage.value = 1  // 첫 페이지로 이동
      loadNotifications()
    }

    // ====== 유틸리티 함수 ======

    /**
     * 알림 유형에 따른 아이콘 컴포넌트 반환
     *
     * @param {string} type - 알림 유형
     * @returns {string} 아이콘 컴포넌트 이름
     */
    function getIconComponent(type) {
      const iconMap = {
        'NEW_COMMENT': 'ChatDotRound',
        'NEW_REPLY': 'ChatDotRound',
        'NEW_BOARD': 'Document',
        'MENTION': 'ChatLineRound',
        'SYSTEM': 'InfoFilled',
        'FILE_SHARED': 'Folder',
        'BOARD_PINNED': 'Star',
        'ROLE_CHANGED': 'User'
      }
      return iconMap[type] || 'Bell'
    }

    /**
     * 알림 유형에 따른 아이콘 색상 클래스 반환
     *
     * @param {string} type - 알림 유형
     * @returns {string} CSS 클래스명
     */
    function getIconColorClass(type) {
      const colorMap = {
        'NEW_COMMENT': 'icon-blue',
        'NEW_REPLY': 'icon-blue',
        'NEW_BOARD': 'icon-green',
        'MENTION': 'icon-purple',
        'SYSTEM': 'icon-orange',
        'FILE_SHARED': 'icon-cyan',
        'BOARD_PINNED': 'icon-yellow',
        'ROLE_CHANGED': 'icon-red'
      }
      return colorMap[type] || 'icon-gray'
    }

    /**
     * 시간 형식 변환 (상대적 시간)
     *
     * @param {string} dateTime - ISO 형식의 날짜/시간
     * @returns {string} 상대적 시간 문자열
     */
    function formatTime(dateTime) {
      return notificationApi.formatRelativeTime(dateTime)
    }

    // ====== 라이프사이클 훅 ======

    /**
     * 컴포넌트 마운트 시 데이터 로드
     */
    onMounted(() => {
      loadNotifications()
      loadUnreadCount()
    })

    // ====== 반환 ======

    return {
      // 상태
      notifications,
      loading,
      unreadCount,
      currentPage,
      pageSize,
      totalElements,
      totalPages,
      filters,
      markingAllRead,
      notificationTypes,
      hasActiveFilter,

      // 메서드
      handleNotificationClick,
      handleToggleRead,
      handleMarkAllAsRead,
      handleDelete,
      handleFilterChange,
      resetFilters,
      handlePageChange,
      handlePageSizeChange,
      getIconComponent,
      getIconColorClass,
      formatTime
    }
  }
}
</script>

<style scoped>
/**
 * 알림 목록 페이지 스타일
 */

/* 컨테이너 */
.notification-list-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

/* 필터 영역 */
.filter-section {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 알림 콘텐츠 영역 */
.notification-content {
  min-height: 400px;
}

/* 로딩 상태 */
.loading-container {
  padding: 40px 20px;
}

/* 빈 상태 */
.empty-container {
  padding: 60px 20px;
  text-align: center;
}

/* 알림 목록 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 개별 알림 아이템 */
.notification-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.notification-item:hover {
  transform: translateX(4px);
}

/* 읽지 않은 알림 스타일 */
.notification-item.unread {
  background-color: #f0f9ff;
  border-left-color: #409eff;
}

.notification-item.unread .notification-title {
  font-weight: 600;
}

/* 알림 내용 래퍼 */
.notification-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

/* 알림 아이콘 */
.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

/* 아이콘 색상 클래스 */
.icon-blue { background-color: #e6f4ff; color: #409eff; }
.icon-green { background-color: #e8f5e9; color: #67c23a; }
.icon-purple { background-color: #f3e8ff; color: #9c27b0; }
.icon-orange { background-color: #fff3e0; color: #e6a23c; }
.icon-cyan { background-color: #e0f7fa; color: #00bcd4; }
.icon-yellow { background-color: #fffde7; color: #f9a825; }
.icon-red { background-color: #ffebee; color: #f56c6c; }
.icon-gray { background-color: #f5f7fa; color: #909399; }

/* 알림 본문 */
.notification-body {
  flex: 1;
  min-width: 0;  /* 텍스트 overflow 처리 */
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-type {
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #303133;
  line-height: 1.4;
}

.notification-message {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  margin-top: 8px;
}

.sender-name {
  font-size: 12px;
  color: #909399;
}

/* 알림 액션 버튼 */
.notification-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

/* 페이징 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .notification-list-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .notification-content-wrapper {
    flex-direction: column;
    gap: 12px;
  }

  .notification-actions {
    opacity: 1;
    justify-content: flex-end;
    width: 100%;
  }

  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>