<!--
  임시 첫 화면 `/` — 로그인 필요(명세 B-2a 4-6 ③). 국면 C 에서 대시보드로 바뀐다.

  "로그인되었습니다" 와 이름 · 부서 · 직위 · 역할(displayName 목록)을 보여 준다.
  🔴 이메일 · 전화는 보여 주지 않는다. 사용자 정보는 스토어(메모리)에서만 읽는다(P6).
-->
<script setup lang="ts">
import { computed } from 'vue'

import { TEXT } from '@/errors/text'
import { useAuthStore } from '@/stores/auth'

const LABEL = {
  NAME: '이름',
  DEPARTMENT: '부서',
  POSITION: '직위',
  ROLES: '역할',
} as const

const auth = useAuthStore()

/** 비어 있는 값은 "-" 로 */
const show = (value: string | null | undefined) => (value && value.length > 0 ? value : '-')

const roles = computed(() => auth.user?.roles.map((role) => role.displayName).join(', ') ?? '')
</script>

<template>
  <el-card class="home" data-testid="home">
    <template #header>
      <h1 class="home__title">{{ TEXT.LOGGED_IN }}</h1>
    </template>
    <el-descriptions v-if="auth.user" :column="1" border>
      <el-descriptions-item :label="LABEL.NAME">
        <span data-testid="home-name">{{ auth.user.fullName }}</span>
      </el-descriptions-item>
      <el-descriptions-item :label="LABEL.DEPARTMENT">{{
        show(auth.user.department)
      }}</el-descriptions-item>
      <el-descriptions-item :label="LABEL.POSITION">{{
        show(auth.user.position)
      }}</el-descriptions-item>
      <el-descriptions-item :label="LABEL.ROLES">
        <span data-testid="home-roles">{{ show(roles) }}</span>
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<style scoped>
.home {
  max-width: 640px;
}

.home__title {
  margin: 0;
  font-size: 18px;
}
</style>
