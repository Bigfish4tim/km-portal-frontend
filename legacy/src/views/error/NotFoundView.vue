<!-- ==============================================
📁 src/views/error/NotFoundView.vue
404 에러 페이지
============================================== -->

<template>
  <div class="error-page not-found">
    <div class="error-container">
      <div class="error-illustration">
        <div class="error-code">404</div>
        <el-icon :size="120" color="#909399">
          <DocumentDelete />
        </el-icon>
      </div>
      
      <div class="error-content">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
        
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            홈으로 돌아가기
          </el-button>
          <el-button @click="goBack">
            이전 페이지
          </el-button>
        </div>
        
        <div class="helpful-links">
          <h3>도움이 될 수 있는 링크:</h3>
          <ul>
            <li>
              <router-link to="/dashboard">대시보드</router-link>
            </li>
            <li>
              <router-link to="/board">게시판</router-link>
            </li>
            <li>
              <router-link to="/files">파일 관리</router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { DocumentDelete } from '@element-plus/icons-vue'

export default {
  name: 'NotFoundView',
  components: {
    DocumentDelete
  },
  setup() {
    const router = useRouter()

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.go(-1)
    }

    return {
      goHome,
      goBack
    }
  }
}
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  background: var(--el-bg-color-page);

  .error-container {
    text-align: center;
    max-width: 600px;

    .error-illustration {
      position: relative;
      margin-bottom: 40px;

      .error-code {
        font-size: 150px;
        font-weight: 900;
        color: var(--el-color-primary-light-5);
        line-height: 1;
        margin-bottom: 20px;
        user-select: none;
      }
    }

    .error-content {
      h1 {
        font-size: 32px;
        margin: 0 0 16px 0;
        color: var(--el-text-color-primary);
      }

      p {
        font-size: 16px;
        color: var(--el-text-color-regular);
        margin: 0 0 32px 0;
        line-height: 1.6;
      }

      .error-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-bottom: 40px;
        flex-wrap: wrap;
      }

      .helpful-links {
        text-align: left;
        background: var(--el-bg-color);
        padding: 24px;
        border-radius: 8px;
        border: 1px solid var(--el-border-color-lighter);

        h3 {
          margin: 0 0 16px 0;
          color: var(--el-text-color-primary);
        }

        ul {
          margin: 0;
          padding: 0;
          list-style: none;

          li {
            margin-bottom: 8px;

            a {
              color: var(--el-color-primary);
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }
  }
}
</style>