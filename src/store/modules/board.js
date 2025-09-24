// ==============================================
// 📁 src/store/modules/board.js
// 게시판 모듈
// ==============================================

/**
 * 게시판 상태 관리 모듈
 * - 게시글 목록 관리
 * - 게시글 CRUD 작업
 * - 댓글 관리
 * - 카테고리 관리
 */
const board = {
  namespaced: true,

  // ========================================
  // 상태 정의
  // ========================================
  state: {
    // 게시글 목록
    posts: [],
    totalPosts: 0,
    
    // 현재 선택된 게시글
    selectedPost: null,
    
    // 댓글 목록
    comments: [],
    totalComments: 0,
    
    // 카테고리 목록
    categories: [],
    
    // 로딩 상태
    loading: false,
    commentsLoading: false,
    
    // 검색 및 필터
    searchKeyword: '',
    filters: {
      category: '',
      author: '',
      dateRange: null
    },
    
    // 페이징
    pagination: {
      page: 1,
      size: 10,
      sort: 'createdAt',
      order: 'desc'
    },
    
    // 에러 상태
    error: null
  },

  // ========================================
  // 게터 정의
  // ========================================
  getters: {
    allPosts: (state) => state.posts,
    selectedPost: (state) => state.selectedPost,
    comments: (state) => state.comments,
    categories: (state) => state.categories,
    isLoading: (state) => state.loading,
    isCommentsLoading: (state) => state.commentsLoading,
    searchKeyword: (state) => state.searchKeyword,
    currentFilters: (state) => state.filters,
    pagination: (state) => state.pagination,
    totalPosts: (state) => state.totalPosts,
    
    /**
     * 카테고리별 게시글 수
     */
    postsByCategory: (state) => {
      return state.posts.reduce((groups, post) => {
        const category = post.category || '일반'
        groups[category] = (groups[category] || 0) + 1
        return groups
      }, {})
    }
  },

  // ========================================
  // 뮤테이션 정의
  // ========================================
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_COMMENTS_LOADING(state, loading) {
      state.commentsLoading = loading
    },

    SET_POSTS(state, { posts, total }) {
      state.posts = posts
      state.totalPosts = total
    },

    SET_SELECTED_POST(state, post) {
      state.selectedPost = post
    },

    ADD_POST(state, post) {
      state.posts.unshift(post)
      state.totalPosts++
    },

    UPDATE_POST(state, updatedPost) {
      const index = state.posts.findIndex(post => post.postId === updatedPost.postId)
      if (index !== -1) {
        state.posts.splice(index, 1, updatedPost)
      }
      
      if (state.selectedPost && state.selectedPost.postId === updatedPost.postId) {
        state.selectedPost = updatedPost
      }
    },

    REMOVE_POST(state, postId) {
      state.posts = state.posts.filter(post => post.postId !== postId)
      state.totalPosts--
      
      if (state.selectedPost && state.selectedPost.postId === postId) {
        state.selectedPost = null
      }
    },

    SET_COMMENTS(state, { comments, total }) {
      state.comments = comments
      state.totalComments = total
    },

    ADD_COMMENT(state, comment) {
      state.comments.push(comment)
      state.totalComments++
    },

    UPDATE_COMMENT(state, updatedComment) {
      const index = state.comments.findIndex(comment => comment.commentId === updatedComment.commentId)
      if (index !== -1) {
        state.comments.splice(index, 1, updatedComment)
      }
    },

    REMOVE_COMMENT(state, commentId) {
      state.comments = state.comments.filter(comment => comment.commentId !== commentId)
      state.totalComments--
    },

    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },

    SET_SEARCH_KEYWORD(state, keyword) {
      state.searchKeyword = keyword
    },

    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters }
    },

    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...pagination }
    },

    SET_ERROR(state, error) {
      state.error = error
    }
  },

  // ========================================
  // 액션 정의
  // ========================================
  actions: {
    /**
     * 게시글 목록 조회
     */
    async fetchPosts({ commit, state }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const params = {
          page: state.pagination.page - 1,
          size: state.pagination.size,
          sort: `${state.pagination.sort},${state.pagination.order}`,
          search: state.searchKeyword,
          ...state.filters
        }
        
        const response = await api.get('/board/posts', { params })
        const { content, totalElements } = response.data.data
        
        commit('SET_POSTS', { posts: content, total: totalElements })
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '게시글 목록 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 게시글 상세 조회
     */
    async fetchPost({ commit }, postId) {
      commit('SET_LOADING', true)
      
      try {
        const response = await api.get(`/board/posts/${postId}`)
        const post = response.data.data
        
        commit('SET_SELECTED_POST', post)
        
        return { success: true, post }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '게시글 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 게시글 생성
     */
    async createPost({ commit }, postData) {
      commit('SET_LOADING', true)
      
      try {
        const response = await api.post('/board/posts', postData)
        const newPost = response.data.data
        
        commit('ADD_POST', newPost)
        
        return { success: true, post: newPost }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '게시글 작성에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 댓글 목록 조회
     */
    async fetchComments({ commit }, postId) {
      commit('SET_COMMENTS_LOADING', true)
      
      try {
        const response = await api.get(`/board/posts/${postId}/comments`)
        const { comments, total } = response.data.data
        
        commit('SET_COMMENTS', { comments, total })
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '댓글 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_COMMENTS_LOADING', false)
      }
    }
  }
}

export default board