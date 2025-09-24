// ==============================================
// 📁 src/store/modules/file.js
// 파일 관리 모듈
// ==============================================

/**
 * 파일 관리 상태 모듈
 * - 파일 업로드/다운로드
 * - 파일 목록 관리
 * - 업로드 진행상황 추적
 */
const file = {
  namespaced: true,

  // ========================================
  // 상태 정의
  // ========================================
  state: {
    // 파일 목록
    files: [],
    totalFiles: 0,
    
    // 업로드 상태
    uploadProgress: {},
    uploading: false,
    
    // 로딩 상태
    loading: false,
    
    // 검색 및 필터
    searchKeyword: '',
    filters: {
      fileType: '',
      uploadDate: null,
      uploader: ''
    },
    
    // 페이징
    pagination: {
      page: 1,
      size: 20,
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
    allFiles: (state) => state.files,
    uploadProgress: (state) => state.uploadProgress,
    isUploading: (state) => state.uploading,
    isLoading: (state) => state.loading,
    
    /**
     * 파일 타입별 그룹핑
     */
    filesByType: (state) => {
      return state.files.reduce((groups, file) => {
        const type = file.fileType || 'other'
        if (!groups[type]) {
          groups[type] = []
        }
        groups[type].push(file)
        return groups
      }, {})
    },
    
    /**
     * 총 파일 크기
     */
    totalFileSize: (state) => {
      return state.files.reduce((total, file) => total + (file.fileSize || 0), 0)
    }
  },

  // ========================================
  // 뮤테이션 정의
  // ========================================
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_UPLOADING(state, uploading) {
      state.uploading = uploading
    },

    SET_FILES(state, { files, total }) {
      state.files = files
      state.totalFiles = total
    },

    ADD_FILE(state, file) {
      state.files.unshift(file)
      state.totalFiles++
    },

    REMOVE_FILE(state, fileId) {
      state.files = state.files.filter(file => file.fileId !== fileId)
      state.totalFiles--
    },

    SET_UPLOAD_PROGRESS(state, { fileId, progress }) {
      state.uploadProgress = {
        ...state.uploadProgress,
        [fileId]: progress
      }
    },

    CLEAR_UPLOAD_PROGRESS(state, fileId) {
      const newProgress = { ...state.uploadProgress }
      delete newProgress[fileId]
      state.uploadProgress = newProgress
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
     * 파일 목록 조회
     */
    async fetchFiles({ commit, state }) {
      commit('SET_LOADING', true)
      
      try {
        const params = {
          page: state.pagination.page - 1,
          size: state.pagination.size,
          sort: `${state.pagination.sort},${state.pagination.order}`,
          search: state.searchKeyword,
          ...state.filters
        }
        
        const response = await api.get('/files', { params })
        const { content, totalElements } = response.data.data
        
        commit('SET_FILES', { files: content, total: totalElements })
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '파일 목록 조회에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 파일 업로드
     */
    async uploadFile({ commit }, { file, onProgress }) {
      commit('SET_UPLOADING', true)
      
      const fileId = Date.now() + Math.random()
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            commit('SET_UPLOAD_PROGRESS', { fileId, progress })
            
            if (onProgress) {
              onProgress(progress)
            }
          }
        })
        
        const uploadedFile = response.data.data
        
        commit('ADD_FILE', uploadedFile)
        commit('CLEAR_UPLOAD_PROGRESS', fileId)
        
        return { success: true, file: uploadedFile }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '파일 업로드에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        commit('CLEAR_UPLOAD_PROGRESS', fileId)
        
        return { success: false, error: errorMessage }
      } finally {
        commit('SET_UPLOADING', false)
      }
    },

    /**
     * 파일 다운로드
     */
    async downloadFile({ commit }, fileId) {
      try {
        const response = await api.get(`/files/${fileId}/download`, {
          responseType: 'blob'
        })
        
        // 브라우저에서 파일 다운로드 처리
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        
        // Content-Disposition 헤더에서 파일명 추출
        const contentDisposition = response.headers['content-disposition']
        let filename = 'download'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }
        
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '파일 다운로드에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      }
    },

    /**
     * 파일 삭제
     */
    async deleteFile({ commit }, fileId) {
      try {
        await api.delete(`/files/${fileId}`)
        
        commit('REMOVE_FILE', fileId)
        
        return { success: true }
        
      } catch (error) {
        const errorMessage = error.response?.data?.message || '파일 삭제에 실패했습니다.'
        commit('SET_ERROR', errorMessage)
        
        return { success: false, error: errorMessage }
      }
    }
  }
}

export default file