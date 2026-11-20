<!--
  기본 틀 — 로그인한 화면(첫 화면 · 본인 비밀번호 변경)이 쓴다(명세 B-2a 4-6 ⑤ · 결정 G10).

  상단 띠: 왼쪽 "KM손해사정(주)"(누르면 /) · 오른쪽 "이름[부서, 직위]" · "비밀번호 변경" · "로그아웃".
  메뉴는 없다(국면 C). 🔴 역할로 무엇을 숨기지 않는다(P8).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { formatUserLabel } from '@/components/userLabel'
import { ROUTE } from '@/router/names'
import { useAuthStore } from '@/stores/auth'

const LABEL = {
  BRAND: 'KM손해사정(주)',
  CHANGE_PASSWORD: '비밀번호 변경',
  LOGOUT: '로그아웃',
} as const

const auth = useAuthStore()
const router = useRouter()

const userLabel = computed(() => (auth.user ? formatUserLabel(auth.user) : ''))
const loggingOut = ref(false)

/** 로그아웃 — API 를 부르고(실패해도) 토큰 · 사용자 정보를 비운 뒤 로그인 화면으로. 저장된 아이디는 남는다 */
async function onLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await auth.logout()
    await router.push({ name: ROUTE.LOGIN })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="default-layout">
    <header class="default-layout__bar">
      <RouterLink to="/" class="default-layout__brand" data-testid="brand">{{
        LABEL.BRAND
      }}</RouterLink>
      <nav class="default-layout__user">
        <span data-testid="user-label">{{ userLabel }}</span>
        <RouterLink :to="{ name: ROUTE.OWN_PASSWORD }" data-testid="nav-own-password">
          {{ LABEL.CHANGE_PASSWORD }}
        </RouterLink>
        <el-button
          link
          type="primary"
          :disabled="loggingOut"
          data-testid="logout"
          @click="onLogout"
        >
          {{ LABEL.LOGOUT }}
        </el-button>
      </nav>
    </header>
    <main class="default-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.default-layout__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.default-layout__brand {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-decoration: none;
}

.default-layout__user {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.default-layout__user a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.default-layout__main {
  padding: 24px;
}
</style>
