<!--
  비밀번호 변경 폼 — 🔴 만료 변경 창(②)과 본인 변경 화면(④)이 함께 쓴다(명세 B-2a 4-6 — 칸 · 검사 · 안내문을 두 번 적지 않는다).

  무엇을: "현재 비밀번호" · "새비밀번호" · "새비밀번호 확인" 칸과 [비밀번호 변경] · [취소] 단추, 오른쪽의 안내문.
    제출하면 사전 검사를 순서대로 하고(빈 칸 → 규칙 1~7 의 첫 위반 → 확인 불일치), 걸리면 요청 없이 확인 창에 그 문구를 띄운다.
    통과하면 `submit` 이벤트로 두 값을 넘긴다 — 요청은 화면(부모)이 보낸다(서비스 함수가 다르기 때문).
  🔴 비밀번호 값은 이 부품 안의 변수에만 있다. trim 하지 않는다(P12). 스토어 · 저장소 · 주소에 두지 않는다.

  Vue 관용:
    - defineProps / defineEmits: 부모가 넘기는 값 · 부모에게 알리는 이벤트를 선언한다.
    - defineExpose: 부모가 ref 로 잡아 부를 수 있는 함수(칸 비우기 · 초점)를 연다.
-->
<script setup lang="ts">
import type { InputInstance } from 'element-plus'
import { computed, nextTick, ref } from 'vue'

import { showNotice } from '@/components/notice'
import PasswordGuide from '@/components/PasswordGuide.vue'
import { TEXT } from '@/errors/text'
import { validatePassword, validatePasswordChange } from '@/validation/password'

defineProps<{
  /** 요청을 보내는 중이면 true — 단추를 막아 두 번 제출되지 않게 한다 */
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { currentPassword: string; newPassword: string }]
  cancel: []
}>()

/** 칸 이름 — 레거시와 같은 글자(결정 G9) */
const LABEL = {
  CURRENT: '현재 비밀번호',
  NEXT: '새비밀번호',
  CONFIRM: '새비밀번호 확인',
  SUBMIT: '비밀번호 변경',
  CANCEL: '취소',
} as const

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const currentInput = ref<InputInstance | null>(null)
const newInput = ref<InputInstance | null>(null)
const confirmInput = ref<InputInstance | null>(null)

/** 새비밀번호 칸 아래의 작은 안내 — 입력하는 동안 규칙 1~6 의 결과(레거시에 없는 편의 · 확인 창은 띄우지 않는다) */
const liveHint = computed(() => {
  if (newPassword.value.length === 0) {
    return null
  }
  const result = validatePassword(newPassword.value)
  return result.ok
    ? { ok: true, text: TEXT.PASSWORD_PRECHECK_OK }
    : { ok: false, text: result.message }
})

/** 제출 — 사전 검사를 순서대로. 걸리면 확인 창 → 닫히면 그 칸에 초점 */
async function onSubmit(): Promise<void> {
  // 1. 빈 칸 — 현재 비밀번호(새비밀번호의 빈 칸은 2 의 규칙 1 이, 확인 칸의 빈 칸은 3 이 잡는다)
  if (currentPassword.value.length === 0) {
    await showNotice(TEXT.REQUIRED_CURRENT_PASSWORD)
    currentInput.value?.focus()
    return
  }
  // 2. 규칙 1~7 의 첫 위반(서버 문구와 같은 글자)
  const check = validatePasswordChange(currentPassword.value, newPassword.value)
  if (!check.ok) {
    await showNotice(check.message)
    newInput.value?.focus()
    return
  }
  // 3. 확인 불일치
  if (confirmPassword.value !== newPassword.value) {
    await showNotice(TEXT.CONFIRM_MISMATCH)
    confirmInput.value?.focus()
    return
  }
  emit('submit', { currentPassword: currentPassword.value, newPassword: newPassword.value })
}

/** 세 칸을 모두 비운다(성공 · 취소) */
function clearAll(): void {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

/** 현재 비밀번호 칸만 비우고 그 칸에 초점(현재 비밀번호가 틀렸을 때) */
async function clearCurrentAndFocus(): Promise<void> {
  currentPassword.value = ''
  await nextTick()
  currentInput.value?.focus()
}

/** 첫 칸에 초점(화면을 열 때) */
function focusFirst(): void {
  currentInput.value?.focus()
}

defineExpose({ clearAll, clearCurrentAndFocus, focusFirst })
</script>

<template>
  <div class="password-change">
    <!-- @submit.prevent: 폼 제출로 페이지가 새로 고쳐지는 브라우저 기본 동작을 막고 onSubmit 을 부른다. Enter 로 제출된다 -->
    <el-form class="password-change__form" label-position="top" @submit.prevent="onSubmit">
      <el-form-item :label="LABEL.CURRENT">
        <el-input
          ref="currentInput"
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          data-testid="current-password"
        />
      </el-form-item>
      <el-form-item :label="LABEL.NEXT">
        <el-input
          ref="newInput"
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          data-testid="new-password"
        />
        <el-text
          v-if="liveHint"
          class="password-change__hint"
          size="small"
          :type="liveHint.ok ? 'success' : 'danger'"
          data-testid="new-password-hint"
        >
          {{ liveHint.text }}
        </el-text>
      </el-form-item>
      <el-form-item :label="LABEL.CONFIRM">
        <el-input
          ref="confirmInput"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          data-testid="confirm-password"
        />
      </el-form-item>
      <div class="password-change__actions">
        <el-button
          type="primary"
          native-type="submit"
          :loading="submitting"
          :disabled="submitting"
          data-testid="change-submit"
        >
          {{ LABEL.SUBMIT }}
        </el-button>
        <el-button :disabled="submitting" data-testid="change-cancel" @click="emit('cancel')">
          {{ LABEL.CANCEL }}
        </el-button>
      </div>
    </el-form>
    <aside class="password-change__guide">
      <PasswordGuide />
    </aside>
  </div>
</template>

<style scoped>
.password-change {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.password-change__form {
  flex: 1 1 280px;
  min-width: 260px;
}

.password-change__guide {
  flex: 1 1 280px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.password-change__hint {
  display: block;
  width: 100%;
  margin-top: 4px;
}

.password-change__actions {
  display: flex;
  gap: 8px;
}
</style>
