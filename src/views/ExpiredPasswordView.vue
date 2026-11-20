<!--
  만료 비밀번호 변경 창 `/password/expired` — 로그인하지 않은 상태의 화면(명세 B-2a 4-6 ② · 결정 G4 · G5 · G9).

  들어오는 조건: 로그인 화면이 PASSWORD_EXPIRED 를 받고 아이디를 스토어(pendingExpiredUsername · 메모리)에 넣었을 때만.
    없으면 라우터 가드가 /login 으로 보낸다(주소를 직접 쳤거나 새로 고침).
  🔴 "다음에 변경" 같은 넘기기 단추는 없다 — 토큰이 없으니 건너뛸 수도 없다.
  성공: 확인 창에 서버의 성공 문구 → 닫히면 /login(새 비밀번호로 다시 로그인 — 결정 G5).
  401: 서버 문구(로그인과 같은 대응 — 틀린 현재 비밀번호는 로그인과 한 횟수로 센다). 현재 비밀번호 칸을 비운다.
    ACCOUNT_LOCKED 면 닫힌 뒤 /login.
  400: 접두사를 뗀 서버 문구(규칙 위반 · 12개월 재사용 · 변경 대상 아님).
  🔴 분기는 errorCode 로만 한다. 문구를 비교하지 않는다.
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { changeExpiredPassword } from '@/api/authApi'
import { LOGIN_FAILURE_CODE } from '@/api/types/auth'
import PasswordChangeForm from '@/components/PasswordChangeForm.vue'
import { showNotice } from '@/components/notice'
import { describeError } from '@/errors/describeError'
import { TEXT } from '@/errors/text'
import { ROUTE } from '@/router/names'
import { useAuthStore } from '@/stores/auth'

const BRAND = 'KM손해사정(주)'

const auth = useAuthStore()
const router = useRouter()
const submitting = ref(false)
const form = ref<InstanceType<typeof PasswordChangeForm> | null>(null)

onMounted(() => form.value?.focusFirst())

// 🔴 이 화면을 떠나면 넘겨받은 아이디를 지운다(메모리에도 오래 두지 않는다)
onUnmounted(() => {
  auth.pendingExpiredUsername = null
})

/** 로그인 화면으로 돌아간다(아이디를 지우고) */
async function backToLogin(): Promise<void> {
  auth.pendingExpiredUsername = null
  await router.push({ name: ROUTE.LOGIN })
}

async function onSubmit(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  const username = auth.pendingExpiredUsername
  if (submitting.value || username === null) return
  submitting.value = true
  try {
    const message = await changeExpiredPassword(
      username,
      payload.currentPassword,
      payload.newPassword,
    )
    form.value?.clearAll()
    await showNotice(message)
    await backToLogin()
  } catch (error) {
    const described = describeError(error)
    await showNotice(described.message)
    if (described.errorCode === LOGIN_FAILURE_CODE.ACCOUNT_LOCKED) {
      await backToLogin()
      return
    }
    if (described.status === 401) {
      await form.value?.clearCurrentAndFocus()
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card class="expired" data-testid="expired-password">
    <template #header>
      <div class="expired__band">
        <h1 class="expired__brand">{{ BRAND }}</h1>
        <p class="expired__must" data-testid="must-change">{{ TEXT.MUST_CHANGE }}</p>
      </div>
    </template>
    <PasswordChangeForm
      ref="form"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="backToLogin"
    />
  </el-card>
</template>

<style scoped>
.expired {
  width: 100%;
  max-width: 820px;
}

.expired__band {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.expired__brand {
  margin: 0;
  font-size: 18px;
}

.expired__must {
  margin: 0;
  color: var(--el-color-danger);
  font-size: 14px;
}
</style>
