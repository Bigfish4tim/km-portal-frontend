<!--
  본인 비밀번호 변경 `/mypage/password` — 로그인 필요(명세 B-2a 4-6 ④ · 결정 G10 "마이페이지 아래 비밀번호").

  칸 · 검사 · 안내문은 PasswordChangeForm(만료 변경 창과 같은 부품).
  성공: 확인 창에 서버 문구 → 칸을 비운다. 로그인 상태는 그대로다(이전 토큰도 만료까지 통한다 — 백엔드 A3-48).
  400(현재 비밀번호 틀림 · 규칙 위반 · 12개월 재사용): 서버 문구(접두사를 뗀 것). 🔴 이 400 으로 로그아웃되지 않는다.
  401: 인터셉터가 재발급하고, 그것도 실패하면 세션을 끝내고 로그인 화면으로 보낸다 — 이 화면은 따로 알리지 않는다.
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { changeOwnPassword } from '@/api/authApi'
import PasswordChangeForm from '@/components/PasswordChangeForm.vue'
import { showNotice } from '@/components/notice'
import { describeError } from '@/errors/describeError'

const LABEL = {
  TITLE: '개인정보변경',
  SUBTITLE: '비밀번호',
} as const

const router = useRouter()
const submitting = ref(false)
// InstanceType<typeof 부품>: 부품을 ref 로 잡았을 때의 타입 — defineExpose 로 연 함수를 부를 수 있다
const form = ref<InstanceType<typeof PasswordChangeForm> | null>(null)

onMounted(() => form.value?.focusFirst())

async function onSubmit(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const message = await changeOwnPassword(payload.currentPassword, payload.newPassword)
    form.value?.clearAll()
    await showNotice(message)
  } catch (error) {
    const described = describeError(error)
    if (described.status === 401) {
      // 세션이 끝났다 — 인터셉터가 이미 로그인 화면으로 보냈다(SESSION_ENDED 를 그 화면이 알린다)
      return
    }
    await showNotice(described.message)
  } finally {
    submitting.value = false
  }
}

/** 취소 — 칸을 비우고 첫 화면으로 */
async function onCancel(): Promise<void> {
  form.value?.clearAll()
  await router.push('/')
}
</script>

<template>
  <el-card class="own-password">
    <template #header>
      <h1 class="own-password__title">{{ LABEL.TITLE }}</h1>
      <h2 class="own-password__subtitle">{{ LABEL.SUBTITLE }}</h2>
    </template>
    <PasswordChangeForm ref="form" :submitting="submitting" @submit="onSubmit" @cancel="onCancel" />
  </el-card>
</template>

<style scoped>
.own-password {
  max-width: 820px;
}

.own-password__title {
  margin: 0;
  font-size: 18px;
}

.own-password__subtitle {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}
</style>
