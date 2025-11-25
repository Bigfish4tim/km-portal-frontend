<template>
  <!--
    댓글 섹션 컴포넌트
    
    게시글 상세 페이지에서 사용되는 댓글 시스템 컴포넌트입니다.
    댓글 작성, 수정, 삭제, 대댓글 작성 등의 기능을 제공합니다.
    
    주요 기능:
    - 댓글 목록 표시 (페이징)
    - 댓글 작성 (로그인 사용자)
    - 댓글 수정/삭제 (본인 또는 관리자)
    - 대댓글 작성 및 표시
    - 실시간 댓글 수 업데이트
    
    사용 예시:
    <CommentSection :board-id="1" />
  -->
  <div class="comment-section">
    <!-- ===== 댓글 헤더 영역 ===== -->
    <div class="comment-header">
      <h3 class="comment-title">
        <!-- 댓글 아이콘 -->
        <el-icon><ChatLineRound /></el-icon>
        댓글
        <!-- 댓글 수 표시 (실시간 업데이트) -->
        <span class="comment-count">({{ totalComments }})</span>
      </h3>
    </div>

    <!-- ===== 댓글 작성 폼 영역 ===== -->
    <!-- 
      로그인한 사용자만 댓글 작성 가능
      currentUser 존재 여부로 로그인 체크
    -->
    <div v-if="currentUser" class="comment-form-container">
      <div class="comment-form">
        <!-- 댓글 입력 텍스트박스 -->
        <el-input
          v-model="newCommentContent"
          type="textarea"
          :rows="3"
          :maxlength="1000"
          show-word-limit
          placeholder="댓글을 입력하세요 (최대 1000자)"
          :disabled="isSubmitting"
        />
        
        <!-- 댓글 작성 버튼 -->
        <div class="form-actions">
          <el-button
            type="primary"
            :loading="isSubmitting"
            :disabled="!newCommentContent.trim()"
            @click="handleCreateComment"
          >
            {{ isSubmitting ? '작성 중...' : '댓글 작성' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- ===== 로그인 안내 메시지 ===== -->
    <!-- 
      로그인하지 않은 사용자에게 표시
      currentUser가 null/undefined인 경우
    -->
    <div v-else class="login-required">
      <el-alert
        title="댓글 작성은 로그인이 필요합니다."
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>댓글을 작성하시려면 먼저 로그인해주세요.</p>
          <el-button type="primary" size="small" @click="goToLogin">
            로그인하기
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- ===== 댓글 목록 영역 ===== -->
    <div class="comment-list-container">
      <!-- 로딩 중일 때 표시 -->
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 댓글이 없을 때 표시 -->
      <el-empty
        v-else-if="comments.length === 0"
        description="아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!"
        :image-size="120"
      />

      <!-- 댓글 목록 -->
      <div v-else class="comment-list">
        <!--
          v-for: 댓글 배열을 순회하며 각 댓글을 렌더링
          :key: Vue의 리스트 렌더링 최적화를 위한 고유 키
        -->
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
          :class="{ 'is-deleted': comment.isDeleted }"
        >
          <!-- ===== 댓글 카드 ===== -->
          <el-card class="comment-card" shadow="hover">
            <!-- 댓글 헤더 (작성자, 날짜) -->
            <div class="comment-item-header">
              <!-- 작성자 아바타 -->
              <el-avatar
                :size="40"
                :style="{ backgroundColor: getAvatarColor(comment.authorName) }"
              >
                {{ getAvatarText(comment.authorName) }}
              </el-avatar>

              <!-- 작성자 정보 -->
              <div class="comment-author-info">
                <div class="author-name">
                  {{ comment.authorName }}
                  <!-- 관리자 배지 -->
                  <el-tag v-if="isCommentByAdmin(comment)" type="danger" size="small">
                    관리자
                  </el-tag>
                </div>
                <div class="comment-date">
                  {{ formatDate(comment.createdAt) }}
                  <!-- 수정된 댓글 표시 -->
                  <span v-if="isEdited(comment)" class="edited-badge">
                    (수정됨)
                  </span>
                </div>
              </div>

              <!-- 댓글 액션 버튼 (수정, 삭제, 답글) -->
              <div class="comment-actions">
                <!-- 수정 버튼 (본인만 표시) -->
                <el-button
                  v-if="canEdit(comment)"
                  link
                  type="primary"
                  :icon="Edit"
                  @click="handleEditComment(comment)"
                >
                  수정
                </el-button>

                <!-- 삭제 버튼 (본인 또는 관리자만 표시) -->
                <el-button
                  v-if="canDelete(comment)"
                  link
                  type="danger"
                  :icon="Delete"
                  @click="handleDeleteComment(comment)"
                >
                  삭제
                </el-button>

                <!-- 답글 버튼 (로그인 사용자만 표시) -->
                <el-button
                  v-if="currentUser"
                  link
                  type="info"
                  :icon="ChatLineRound"
                  @click="handleReplyComment(comment)"
                >
                  답글 ({{ comment.replyCount || 0 }})
                </el-button>
              </div>
            </div>

            <!-- 댓글 내용 -->
            <div class="comment-content">
              <!-- 삭제된 댓글 표시 -->
              <p v-if="comment.isDeleted" class="deleted-message">
                삭제된 댓글입니다.
              </p>

              <!-- 수정 모드일 때 텍스트박스 표시 -->
              <div v-else-if="editingCommentId === comment.id" class="edit-form">
                <el-input
                  v-model="editingContent"
                  type="textarea"
                  :rows="3"
                  :maxlength="1000"
                  show-word-limit
                />
                <div class="edit-actions">
                  <el-button
                    type="primary"
                    size="small"
                    :loading="isSubmitting"
                    @click="handleSaveEdit(comment)"
                  >
                    저장
                  </el-button>
                  <el-button
                    size="small"
                    @click="handleCancelEdit"
                  >
                    취소
                  </el-button>
                </div>
              </div>

              <!-- 일반 모드일 때 댓글 내용 표시 -->
              <p v-else class="content-text">
                {{ comment.content }}
              </p>
            </div>

            <!-- ===== 대댓글 작성 폼 (토글) ===== -->
            <!--
              답글 버튼 클릭 시 표시
              replyingToId === comment.id: 현재 답글 작성 중인 댓글 ID와 일치하는지 확인
            -->
            <div
              v-if="replyingToId === comment.id"
              class="reply-form-container"
            >
              <div class="reply-form">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  :maxlength="1000"
                  show-word-limit
                  placeholder="답글을 입력하세요"
                  :disabled="isSubmitting"
                />
                <div class="form-actions">
                  <el-button
                    type="primary"
                    size="small"
                    :loading="isSubmitting"
                    :disabled="!replyContent.trim()"
                    @click="handleCreateReply(comment)"
                  >
                    {{ isSubmitting ? '작성 중...' : '답글 작성' }}
                  </el-button>
                  <el-button
                    size="small"
                    @click="handleCancelReply"
                  >
                    취소
                  </el-button>
                </div>
              </div>
            </div>

            <!-- ===== 대댓글 목록 ===== -->
            <!--
              대댓글이 있는 경우에만 표시
              comment.replyCount > 0: 대댓글 수가 0보다 크면 표시
            -->
            <div
              v-if="comment.replyCount > 0"
              class="replies-container"
            >
              <!-- 대댓글 펼치기/접기 버튼 -->
              <el-button
                text
                :icon="showingRepliesFor.includes(comment.id) ? ArrowUp : ArrowDown"
                @click="toggleReplies(comment)"
              >
                {{ showingRepliesFor.includes(comment.id) ? '답글 숨기기' : `답글 ${comment.replyCount}개 보기` }}
              </el-button>

              <!-- 대댓글 목록 (펼쳐진 경우에만 표시) -->
              <div
                v-if="showingRepliesFor.includes(comment.id)"
                class="replies-list"
              >
                <!-- 대댓글 로딩 중 -->
                <div v-if="loadingRepliesFor.includes(comment.id)" class="loading-replies">
                  <el-skeleton :rows="2" animated />
                </div>

                <!-- 대댓글 표시 -->
                <div
                  v-else
                  v-for="reply in getRepliesForComment(comment.id)"
                  :key="reply.id"
                  class="reply-item"
                >
                  <el-card class="reply-card" shadow="hover">
                    <!-- 대댓글 헤더 -->
                    <div class="reply-header">
                      <el-avatar
                        :size="32"
                        :style="{ backgroundColor: getAvatarColor(reply.authorName) }"
                      >
                        {{ getAvatarText(reply.authorName) }}
                      </el-avatar>

                      <div class="reply-author-info">
                        <div class="author-name">
                          {{ reply.authorName }}
                          <el-tag v-if="isCommentByAdmin(reply)" type="danger" size="small">
                            관리자
                          </el-tag>
                        </div>
                        <div class="comment-date">
                          {{ formatDate(reply.createdAt) }}
                          <span v-if="isEdited(reply)" class="edited-badge">
                            (수정됨)
                          </span>
                        </div>
                      </div>

                      <!-- 대댓글 액션 버튼 -->
                      <div class="reply-actions">
                        <el-button
                          v-if="canEdit(reply)"
                          link
                          type="primary"
                          size="small"
                          :icon="Edit"
                          @click="handleEditComment(reply)"
                        >
                          수정
                        </el-button>
                        <el-button
                          v-if="canDelete(reply)"
                          link
                          type="danger"
                          size="small"
                          :icon="Delete"
                          @click="handleDeleteComment(reply)"
                        >
                          삭제
                        </el-button>
                      </div>
                    </div>

                    <!-- 대댓글 내용 -->
                    <div class="reply-content">
                      <!-- 삭제된 대댓글 -->
                      <p v-if="reply.isDeleted" class="deleted-message">
                        삭제된 답글입니다.
                      </p>

                      <!-- 수정 모드 -->
                      <div v-else-if="editingCommentId === reply.id" class="edit-form">
                        <el-input
                          v-model="editingContent"
                          type="textarea"
                          :rows="2"
                          :maxlength="1000"
                          show-word-limit
                        />
                        <div class="edit-actions">
                          <el-button
                            type="primary"
                            size="small"
                            :loading="isSubmitting"
                            @click="handleSaveEdit(reply)"
                          >
                            저장
                          </el-button>
                          <el-button
                            size="small"
                            @click="handleCancelEdit"
                          >
                            취소
                          </el-button>
                        </div>
                      </div>

                      <!-- 일반 모드 -->
                      <p v-else class="content-text">
                        {{ reply.content }}
                      </p>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- ===== 페이징 영역 ===== -->
    <!--
      댓글이 20개보다 많을 때 페이징 표시
      totalPages > 1: 전체 페이지가 1보다 크면 표시
    -->
    <div v-if="totalPages > 1" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalComments"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * CommentSection.vue - 댓글 섹션 컴포넌트
 * 
 * 이 컴포넌트는 게시글 상세 페이지에서 사용되며,
 * 댓글 작성, 수정, 삭제, 대댓글 기능을 제공합니다.
 * 
 * ✅ BoardDetailView.vue와 완전히 호환되는 패턴 사용:
 * - authService를 사용한 인증 체크
 * - hasPermission 함수를 사용한 권한 체크
 * - currentUser 존재 여부로 로그인 확인
 * 
 * Props:
 * - boardId: 게시글 ID (필수)
 * 
 * 주요 상태:
 * - comments: 댓글 목록
 * - replies: 대댓글 목록 (댓글 ID별로 저장)
 * - currentPage: 현재 페이지
 * - totalComments: 전체 댓글 수
 * - isLoading: 로딩 상태
 * - isSubmitting: 제출 중 상태
 * - editingCommentId: 수정 중인 댓글 ID
 * - replyingToId: 답글 작성 중인 댓글 ID
 * 
 * @author KM Portal Team
 * @version 1.2 (호환성 수정 완료)
 * @since 2025-11-25 (31일차)
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit,
  Delete,
  ChatLineRound,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import * as commentApi from '@/services/commentApi'

// ✅ BoardDetailView.vue와 동일한 패턴: authService 사용
import authService from '@/services/authService'

// ===== Props 정의 =====
/**
 * Props:
 * - boardId: 게시글 ID (필수)
 * 
 * 사용 예시:
 * <CommentSection :board-id="1" />
 */
const props = defineProps({
  boardId: {
    type: Number,
    required: true
  }
})

// ===== Router =====
const router = useRouter()

// ===== 계산된 속성 (Computed Properties) =====

/**
 * 현재 로그인한 사용자 정보
 * 
 * ✅ BoardDetailView.vue와 동일한 패턴:
 * authService.getCurrentUser()를 사용하여 가져옵니다.
 */
const currentUser = computed(() => authService.getCurrentUser())

/**
 * 권한 체크 함수
 * 
 * ✅ BoardDetailView.vue와 동일한 패턴:
 * authService.hasAnyRole을 사용합니다.
 * 
 * @param {Array<string>} roles - 확인할 권한 배열 (예: ['ADMIN', 'MANAGER'])
 * @returns {boolean} 권한이 있으면 true, 없으면 false
 */
function hasPermission(roles) {
  return authService.hasAnyRole(roles.map(role => `ROLE_${role}`))
}

// ===== 반응형 상태 (Reactive State) =====

/**
 * 댓글 목록
 * 
 * 백엔드에서 가져온 댓글 배열을 저장합니다.
 * 페이징 단위(20개씩)로 조회됩니다.
 */
const comments = ref([])

/**
 * 대댓글 목록 (Map 형태)
 * 
 * 키: 부모 댓글 ID
 * 값: 대댓글 배열
 * 
 * 예시:
 * {
 *   10: [reply1, reply2],  // 10번 댓글의 대댓글들
 *   15: [reply3, reply4]   // 15번 댓글의 대댓글들
 * }
 */
const replies = ref({})

/**
 * 페이징 관련 상태
 */
const currentPage = ref(1)        // 현재 페이지 (1부터 시작)
const pageSize = ref(20)          // 페이지 크기 (한 번에 20개)
const totalComments = ref(0)      // 전체 댓글 수
const totalPages = ref(0)         // 전체 페이지 수

/**
 * 로딩 및 제출 상태
 */
const isLoading = ref(false)       // 댓글 목록 로딩 중
const isSubmitting = ref(false)    // 댓글 작성/수정/삭제 중

/**
 * 댓글 작성 관련 상태
 */
const newCommentContent = ref('')  // 새 댓글 내용

/**
 * 댓글 수정 관련 상태
 */
const editingCommentId = ref(null) // 현재 수정 중인 댓글 ID
const editingContent = ref('')     // 수정 중인 내용

/**
 * 대댓글 작성 관련 상태
 */
const replyingToId = ref(null)     // 답글 작성 중인 댓글 ID
const replyContent = ref('')       // 답글 내용

/**
 * 대댓글 표시 관련 상태
 */
const showingRepliesFor = ref([])   // 대댓글이 펼쳐진 댓글 ID 배열
const loadingRepliesFor = ref([])   // 대댓글 로딩 중인 댓글 ID 배열

// ===== 생명주기 훅 (Lifecycle Hooks) =====

/**
 * 컴포넌트 마운트 시 실행
 * 
 * 초기 댓글 목록을 불러옵니다.
 */
onMounted(() => {
  loadComments()
})

/**
 * boardId 변경 감지
 * 
 * 다른 게시글로 이동했을 때 댓글 목록을 새로 불러옵니다.
 */
watch(() => props.boardId, () => {
  // 상태 초기화
  currentPage.value = 1
  comments.value = []
  replies.value = {}
  showingRepliesFor.value = []
  
  // 새 댓글 목록 로드
  loadComments()
})

// ===== 메서드 (Methods) =====

/**
 * 댓글 목록 불러오기
 * 
 * 백엔드 API를 호출하여 댓글 목록을 가져옵니다.
 * 페이징 처리되어 있어 한 번에 20개씩 조회합니다.
 * 
 * API: GET /api/boards/{boardId}/comments?page=0&size=20
 */
async function loadComments() {
  try {
    isLoading.value = true
    
    // API 호출 (페이지 번호는 0부터 시작)
    const response = await commentApi.getComments(props.boardId, currentPage.value - 1, pageSize.value)
    
    if (response.success) {
      // 댓글 목록 저장
      comments.value = response.data.content
      
      // 페이징 정보 저장
      totalComments.value = response.data.totalElements
      totalPages.value = response.data.totalPages
      
      console.log(`댓글 ${comments.value.length}개 로드 완료`)
    }
  } catch (error) {
    console.error('댓글 목록 로드 실패:', error)
    ElMessage.error('댓글을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

/**
 * 댓글 작성 처리
 * 
 * 새로운 댓글을 작성합니다.
 * 작성 완료 후 댓글 목록을 새로 불러와 화면을 갱신합니다.
 * 
 * API: POST /api/boards/{boardId}/comments
 */
async function handleCreateComment() {
  // 유효성 검증: 빈 내용 체크
  if (!newCommentContent.value.trim()) {
    ElMessage.warning('댓글 내용을 입력해주세요.')
    return
  }

  try {
    isSubmitting.value = true
    
    // API 호출: 댓글 작성
    const response = await commentApi.createComment(props.boardId, newCommentContent.value.trim())
    
    if (response.success) {
      ElMessage.success('댓글이 작성되었습니다.')
      
      // 입력 폼 초기화
      newCommentContent.value = ''
      
      // 댓글 목록 새로고침
      await loadComments()
    }
  } catch (error) {
    console.error('댓글 작성 실패:', error)
    
    // 에러 메시지 표시
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('댓글 작성에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 댓글 수정 시작
 * 
 * 수정 모드로 전환하고 기존 내용을 편집기에 표시합니다.
 * 
 * @param {Object} comment - 수정할 댓글 객체
 */
function handleEditComment(comment) {
  // 수정 모드 활성화
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

/**
 * 댓글 수정 저장
 * 
 * 수정된 내용을 백엔드에 저장합니다.
 * 
 * API: PUT /api/boards/{boardId}/comments/{commentId}
 * 
 * @param {Object} comment - 수정할 댓글 객체
 */
async function handleSaveEdit(comment) {
  // 유효성 검증: 빈 내용 체크
  if (!editingContent.value.trim()) {
    ElMessage.warning('댓글 내용을 입력해주세요.')
    return
  }

  try {
    isSubmitting.value = true
    
    // API 호출: 댓글 수정
    const response = await commentApi.updateComment(
      props.boardId,
      comment.id,
      editingContent.value.trim()
    )
    
    if (response.success) {
      ElMessage.success('댓글이 수정되었습니다.')
      
      // 수정 모드 종료
      editingCommentId.value = null
      editingContent.value = ''
      
      // 댓글 목록 새로고침
      await loadComments()
      
      // 대댓글이었다면 대댓글 목록도 새로고침
      if (comment.parentId) {
        await loadReplies(comment.parentId)
      }
    }
  } catch (error) {
    console.error('댓글 수정 실패:', error)
    
    // 에러 메시지 표시
    if (error.response?.status === 403) {
      ElMessage.error('본인이 작성한 댓글만 수정할 수 있습니다.')
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('댓글 수정에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 댓글 수정 취소
 * 
 * 수정 모드를 종료하고 입력 내용을 초기화합니다.
 */
function handleCancelEdit() {
  editingCommentId.value = null
  editingContent.value = ''
}

/**
 * 댓글 삭제 처리
 * 
 * 사용자에게 확인을 받은 후 댓글을 삭제합니다.
 * Soft Delete 방식으로 실제로는 is_deleted 플래그만 변경됩니다.
 * 
 * API: DELETE /api/boards/{boardId}/comments/{commentId}
 * 
 * @param {Object} comment - 삭제할 댓글 객체
 */
async function handleDeleteComment(comment) {
  try {
    // 삭제 확인 다이얼로그
    await ElMessageBox.confirm(
      '정말로 이 댓글을 삭제하시겠습니까?',
      '댓글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    isSubmitting.value = true
    
    // API 호출: 댓글 삭제
    const response = await commentApi.deleteComment(props.boardId, comment.id)
    
    if (response.success) {
      ElMessage.success('댓글이 삭제되었습니다.')
      
      // 댓글 목록 새로고침
      await loadComments()
      
      // 대댓글이었다면 대댓글 목록도 새로고침
      if (comment.parentId) {
        await loadReplies(comment.parentId)
      }
    }
  } catch (error) {
    // 취소 버튼 클릭 시 (에러 아님)
    if (error === 'cancel') {
      return
    }
    
    console.error('댓글 삭제 실패:', error)
    
    // 에러 메시지 표시
    if (error.response?.status === 403) {
      ElMessage.error('본인이 작성한 댓글이거나 관리자만 삭제할 수 있습니다.')
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('댓글 삭제에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 답글 작성 모드 시작
 * 
 * 특정 댓글에 답글을 작성하기 위한 폼을 표시합니다.
 * 
 * @param {Object} comment - 답글을 달 댓글 객체
 */
function handleReplyComment(comment) {
  // 이미 답글 작성 중이면 취소
  if (replyingToId.value === comment.id) {
    handleCancelReply()
    return
  }
  
  // 답글 작성 모드 활성화
  replyingToId.value = comment.id
  replyContent.value = ''
}

/**
 * 답글 작성 처리
 * 
 * 새로운 답글(대댓글)을 작성합니다.
 * 
 * API: POST /api/boards/{boardId}/comments/{commentId}/replies
 * 
 * @param {Object} comment - 부모 댓글 객체
 */
async function handleCreateReply(comment) {
  // 유효성 검증: 빈 내용 체크
  if (!replyContent.value.trim()) {
    ElMessage.warning('답글 내용을 입력해주세요.')
    return
  }

  try {
    isSubmitting.value = true
    
    // API 호출: 답글 작성
    const response = await commentApi.createReply(
      props.boardId,
      comment.id,
      replyContent.value.trim()
    )
    
    if (response.success) {
      ElMessage.success('답글이 작성되었습니다.')
      
      // 답글 작성 모드 종료
      replyingToId.value = null
      replyContent.value = ''
      
      // 댓글 목록 새로고침 (replyCount 업데이트)
      await loadComments()
      
      // 답글 목록 새로고침
      await loadReplies(comment.id)
      
      // 답글 목록 자동 펼치기
      if (!showingRepliesFor.value.includes(comment.id)) {
        showingRepliesFor.value.push(comment.id)
      }
    }
  } catch (error) {
    console.error('답글 작성 실패:', error)
    
    // 에러 메시지 표시
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('답글 작성에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 답글 작성 취소
 * 
 * 답글 작성 모드를 종료하고 입력 내용을 초기화합니다.
 */
function handleCancelReply() {
  replyingToId.value = null
  replyContent.value = ''
}

/**
 * 답글 목록 펼치기/접기 토글
 * 
 * 특정 댓글의 답글 목록을 펼치거나 접습니다.
 * 처음 펼칠 때는 백엔드에서 답글 목록을 가져옵니다.
 * 
 * @param {Object} comment - 댓글 객체
 */
async function toggleReplies(comment) {
  const commentId = comment.id
  
  // 이미 펼쳐져 있으면 접기
  if (showingRepliesFor.value.includes(commentId)) {
    showingRepliesFor.value = showingRepliesFor.value.filter(id => id !== commentId)
    return
  }
  
  // 답글 목록 펼치기
  showingRepliesFor.value.push(commentId)
  
  // 답글 목록이 없으면 불러오기
  if (!replies.value[commentId]) {
    await loadReplies(commentId)
  }
}

/**
 * 답글 목록 불러오기
 * 
 * 특정 댓글의 답글 목록을 백엔드에서 가져옵니다.
 * 
 * API: GET /api/boards/{boardId}/comments/{commentId}/replies
 * 
 * @param {number} commentId - 부모 댓글 ID
 */
async function loadReplies(commentId) {
  try {
    // 로딩 상태 추가
    loadingRepliesFor.value.push(commentId)
    
    // API 호출: 답글 목록 조회
    const response = await commentApi.getReplies(props.boardId, commentId)
    
    if (response.success) {
      // 답글 목록 저장 (Map 형태)
      replies.value[commentId] = response.data
      
      console.log(`댓글 ${commentId}의 답글 ${response.data.length}개 로드 완료`)
    }
  } catch (error) {
    console.error('답글 목록 로드 실패:', error)
    ElMessage.error('답글을 불러오는데 실패했습니다.')
  } finally {
    // 로딩 상태 제거
    loadingRepliesFor.value = loadingRepliesFor.value.filter(id => id !== commentId)
  }
}

/**
 * 특정 댓글의 답글 목록 가져오기
 * 
 * replies Map에서 해당 댓글 ID의 답글 배열을 반환합니다.
 * 
 * @param {number} commentId - 부모 댓글 ID
 * @returns {Array} 답글 배열 (없으면 빈 배열)
 */
function getRepliesForComment(commentId) {
  return replies.value[commentId] || []
}

/**
 * 페이지 변경 처리
 * 
 * 페이지네이션에서 페이지를 변경했을 때 호출됩니다.
 * 
 * @param {number} page - 새 페이지 번호
 */
function handlePageChange(page) {
  currentPage.value = page
  loadComments()
  
  // 페이지 최상단으로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 로그인 페이지로 이동
 * 
 * 로그인하지 않은 사용자가 "로그인하기" 버튼을 클릭했을 때 호출됩니다.
 */
function goToLogin() {
  router.push('/login')
}

// ===== 유틸리티 함수 (Utility Functions) =====

/**
 * 날짜 포맷팅
 * 
 * ✅ commentApi.js의 formatDate() 또는 boardApi.js의 getRelativeTime()과 유사한 로직 사용
 * 
 * @param {string} dateString - ISO 8601 형식 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  
  // 오늘인지 확인
  const isToday = date.toDateString() === now.toDateString()
  
  // 어제인지 확인
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  // 시간 포맷 (HH:MM)
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  if (isToday) {
    return `오늘 ${timeStr}`
  } else if (isYesterday) {
    return `어제 ${timeStr}`
  } else {
    // YYYY년 MM월 DD일 HH:MM
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}

/**
 * 댓글 수정 여부 확인
 * 
 * 생성일시와 수정일시를 비교하여 수정된 댓글인지 확인합니다.
 * 
 * @param {Object} comment - 댓글 객체
 * @returns {boolean} 수정 여부
 */
function isEdited(comment) {
  if (!comment.createdAt || !comment.updatedAt) return false
  
  const created = new Date(comment.createdAt)
  const updated = new Date(comment.updatedAt)
  
  // 1초 이상 차이나면 수정된 것으로 판단
  return updated - created > 1000
}

/**
 * 댓글 작성자가 관리자인지 확인
 * 
 * ✅ 실제 구현: 백엔드에서 role 정보를 함께 반환하지 않으므로 현재는 false 반환
 * TODO: 백엔드 API 수정 후 실제 role 정보로 확인
 * 
 * @param {Object} comment - 댓글 객체
 * @returns {boolean} 관리자 여부
 */
function isCommentByAdmin(comment) {
  // TODO: 백엔드에서 role 정보를 함께 반환하도록 수정 필요
  // 현재는 임시로 false 반환
  return false
}

/**
 * 아바타 텍스트 생성
 * 
 * 사용자 이름에서 첫 글자를 추출하여 아바타에 표시합니다.
 * 
 * @param {string} name - 사용자 이름
 * @returns {string} 첫 글자
 */
function getAvatarText(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

/**
 * 아바타 배경색 생성
 * 
 * 사용자 이름을 기반으로 일관된 배경색을 생성합니다.
 * 
 * @param {string} name - 사용자 이름
 * @returns {string} CSS 색상 값
 */
function getAvatarColor(name) {
  if (!name) return '#409EFF'
  
  // 이름을 숫자로 변환 (해시 함수)
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // HSL 색상 생성
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 60%)`
}

/**
 * 댓글 수정 권한 확인
 * 
 * ✅ BoardDetailView.vue와 동일한 패턴:
 * currentUser 존재 여부로 로그인 확인
 * 
 * @param {Object} comment - 댓글 객체
 * @returns {boolean} 수정 가능 여부
 */
function canEdit(comment) {
  // 로그인하지 않았거나 삭제된 댓글은 수정 불가
  if (!currentUser.value || comment.isDeleted) return false
  
  // 본인이 작성한 댓글만 수정 가능
  return comment.authorId === currentUser.value.userId
}

/**
 * 댓글 삭제 권한 확인
 * 
 * ✅ BoardDetailView.vue와 동일한 패턴:
 * hasPermission 함수를 사용하여 관리자 권한 확인
 * 
 * @param {Object} comment - 댓글 객체
 * @returns {boolean} 삭제 가능 여부
 */
function canDelete(comment) {
  // 로그인하지 않았거나 이미 삭제된 댓글은 삭제 불가
  if (!currentUser.value || comment.isDeleted) return false
  
  // 관리자는 모든 댓글 삭제 가능 (BoardDetailView.vue와 동일한 패턴)
  if (hasPermission(['ADMIN'])) {
    return true
  }
  
  // 본인이 작성한 댓글만 삭제 가능
  return comment.authorId === currentUser.value.userId
}
</script>

<style scoped lang="scss">
/**
 * CommentSection 스타일
 * 
 * SCSS (Sass)를 사용하여 중첩 구조로 작성되었습니다.
 * Element Plus의 디자인 시스템과 조화를 이루도록 설계되었습니다.
 */

.comment-section {
  margin-top: 40px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;

  /* ===== 댓글 헤더 ===== */
  .comment-header {
    margin-bottom: 20px;

    .comment-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;

      .el-icon {
        font-size: 24px;
        color: #409EFF;
      }

      .comment-count {
        color: #909399;
        font-size: 16px;
        font-weight: 400;
      }
    }
  }

  /* ===== 댓글 작성 폼 ===== */
  .comment-form-container {
    margin-bottom: 20px;

    .comment-form {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .form-actions {
        margin-top: 12px;
        text-align: right;
      }
    }
  }

  /* ===== 로그인 안내 메시지 ===== */
  .login-required {
    margin-bottom: 20px;

    .el-alert {
      p {
        margin: 8px 0;
      }

      .el-button {
        margin-top: 8px;
      }
    }
  }

  /* ===== 댓글 목록 ===== */
  .comment-list-container {
    .loading-container {
      padding: 20px;
      background-color: white;
      border-radius: 8px;
    }

    .comment-list {
      .comment-item {
        margin-bottom: 16px;

        &.is-deleted {
          opacity: 0.6;
        }

        .comment-card {
          .comment-item-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .el-avatar {
              flex-shrink: 0;
            }

            .comment-author-info {
              flex: 1;

              .author-name {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #303133;
                margin-bottom: 4px;

                .el-tag {
                  font-size: 12px;
                }
              }

              .comment-date {
                font-size: 13px;
                color: #909399;

                .edited-badge {
                  margin-left: 4px;
                  font-style: italic;
                  color: #C0C4CC;
                }
              }
            }

            .comment-actions {
              display: flex;
              gap: 8px;
            }
          }

          .comment-content {
            padding-left: 52px; // 아바타 크기 + gap

            .content-text {
              color: #606266;
              line-height: 1.6;
              margin: 0;
              word-wrap: break-word;
              white-space: pre-wrap;
            }

            .deleted-message {
              color: #C0C4CC;
              font-style: italic;
              margin: 0;
            }

            .edit-form {
              .edit-actions {
                margin-top: 8px;
                display: flex;
                gap: 8px;
              }
            }
          }

          /* ===== 답글 작성 폼 ===== */
          .reply-form-container {
            margin-top: 16px;
            padding-left: 52px;

            .reply-form {
              background-color: #f5f7fa;
              padding: 16px;
              border-radius: 8px;

              .form-actions {
                margin-top: 8px;
                display: flex;
                gap: 8px;
              }
            }
          }

          /* ===== 답글 목록 ===== */
          .replies-container {
            margin-top: 16px;
            padding-left: 52px;
            border-left: 3px solid #DCDFE6;

            .loading-replies {
              padding: 12px;
            }

            .replies-list {
              margin-top: 12px;

              .reply-item {
                margin-bottom: 12px;

                .reply-card {
                  background-color: #f9fafb;

                  .reply-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;

                    .el-avatar {
                      flex-shrink: 0;
                    }

                    .reply-author-info {
                      flex: 1;

                      .author-name {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-weight: 600;
                        color: #303133;
                        margin-bottom: 4px;
                        font-size: 14px;
                      }

                      .comment-date {
                        font-size: 12px;
                        color: #909399;

                        .edited-badge {
                          margin-left: 4px;
                          font-style: italic;
                          color: #C0C4CC;
                        }
                      }
                    }

                    .reply-actions {
                      display: flex;
                      gap: 8px;
                    }
                  }

                  .reply-content {
                    padding-left: 44px; // 아바타 크기 + gap

                    .content-text {
                      color: #606266;
                      line-height: 1.6;
                      margin: 0;
                      word-wrap: break-word;
                      white-space: pre-wrap;
                      font-size: 14px;
                    }

                    .deleted-message {
                      color: #C0C4CC;
                      font-style: italic;
                      margin: 0;
                      font-size: 14px;
                    }

                    .edit-form {
                      .edit-actions {
                        margin-top: 8px;
                        display: flex;
                        gap: 8px;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /* ===== 페이징 ===== */
  .pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: center;
  }
}

/* ===== 반응형 디자인 ===== */
@media (max-width: 768px) {
  .comment-section {
    padding: 12px;

    .comment-header {
      .comment-title {
        font-size: 18px;

        .el-icon {
          font-size: 20px;
        }

        .comment-count {
          font-size: 14px;
        }
      }
    }

    .comment-form-container {
      .comment-form {
        padding: 16px;
      }
    }

    .comment-list-container {
      .comment-list {
        .comment-item {
          .comment-card {
            .comment-item-header {
              flex-wrap: wrap;

              .comment-actions {
                width: 100%;
                justify-content: flex-start;
                margin-top: 8px;
              }
            }

            .comment-content {
              padding-left: 0;
            }

            .reply-form-container {
              padding-left: 0;
            }

            .replies-container {
              padding-left: 20px;
            }
          }
        }
      }
    }
  }
}
</style>