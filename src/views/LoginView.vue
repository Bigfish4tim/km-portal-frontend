<!--
  로그인 `/login` — 명세 B-2a 4-6 ① · 결정 G1 · G2 · G6 · G7 · G8 · G11.

  흐름
    - 처음 열 때: 저장된 아이디가 있으면 아이디 칸에 채우고 비밀번호 칸에 초점. 없으면 아이디 칸에 초점. "아이디저장" 은 체크(기본).
    - 제출: 빈 칸이면 요청 없이 확인 창(아이디가 먼저). 아이디는 앞뒤 공백을 자르고, 🔴 비밀번호는 자르지 않는다(P12).
    - 성공: "아이디저장" 대로 저장/지움 → 목적지(redirect 검사 · 4-7)로. "팝업창으로열기" 면 새 창(4-8).
    - 실패: 확인 창에 서버 문구 그대로 → 닫히면 비밀번호 칸을 비우고 초점. 🔴 실패는 저장된 아이디를 바꾸지 않는다.
    - 🔴 PASSWORD_EXPIRED(errorCode 로만 판별): 확인 창 없이 변경 창으로. 아이디만 넘긴다(비밀번호는 넘기지 않는다).
    - 주소에 reason=expired 가 있으면(세션 종료로 온 경우) 확인 창에 SESSION_ENDED 를 한 번.
  🔴 서버의 로그인 실패 문구를 이 파일에 적지 않는다. 서버가 완성해서 주고 화면은 그대로 보여 준다(명세 3-2).
  🔴 비밀번호는 이 화면의 변수에만 있고, 요청을 보낸 뒤 바로 비운다. 스토어 · 저장소 · 주소에 두지 않는다.
-->
<script setup lang="ts">
import type { InputInstance } from 'element-plus'
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { LOGIN_FAILURE_CODE } from '@/api/types/auth'
import { clearSavedUsername, readSavedUsername, writeSavedUsername } from '@/auth/savedUsername'
import { showNotice } from '@/components/notice'
import { describeError } from '@/errors/describeError'
import { TEXT } from '@/errors/text'
import { ROUTE } from '@/router/names'
import { safeRedirect } from '@/router/redirect'
import { useAuthStore } from '@/stores/auth'

/** 이 화면의 글자 — 레거시와 같은 용어(결정 G11) */
const LABEL = {
  TITLE: 'KM손해사정(주)',
  SUBTITLE: '사용자 로그인',
  USERNAME: '아이디',
  PASSWORD: '비밀번호',
  SUBMIT: '로그인',
  SAVE_ID: '아이디저장',
  OPEN_POPUP: '팝업창으로열기',
  TEMP_PASSWORD: '임시비밀번호발급',
  COPYRIGHT: 'COPYRIGHT (C) KM손해사정(주). ALL RIGHTS RESERVED.',
} as const

/**
 * "팝업창으로열기" 의 새 창 — 이름과 모양(명세 B-2a 4-8 "자유 · 상수 한 곳").
 * 🔴 noopener 를 주지 않는다 — 새 창이 sessionStorage 의 사본(재발급용 토큰)을 받아야 restore() 로 로그인 상태가 된다.
 *    (착수 확인 2026-11-20 · Chromium 159: 같은 출처 · noopener 없음이면 복사되고, noopener 면 복사되지 않았다)
 */
const POPUP_WINDOW_NAME = 'kmPortalMain'
const POPUP_WINDOW_FEATURES = 'width=1280,height=900,resizable=yes,scrollbars=yes'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
// 🔴 비밀번호 — 이 변수에만 있다
const password = ref('')
/** "아이디저장" — 기본 체크(결정 G6). 체크 여부 자체는 저장하지 않는다(저장된 아이디가 있으면 체크된 것) */
const saveUsername = ref(true)
/** "팝업창으로열기" — 기본 해제 · 저장하지 않는다(4-8 의 가정) */
const openInPopup = ref(false)
const submitting = ref(false)

const usernameInput = ref<InputInstance | null>(null)
const passwordInput = ref<InputInstance | null>(null)

/** 저장된 아이디로 칸을 채우고 알맞은 칸에 초점 */
async function fillFromSaved(): Promise<void> {
  const saved = readSavedUsername()
  username.value = saved ?? ''
  saveUsername.value = true
  await nextTick()
  if (saved) {
    passwordInput.value?.focus()
  } else {
    usernameInput.value?.focus()
  }
}

onMounted(async () => {
  await fillFromSaved()
  // 세션 종료로 온 경우 — 한 번만 알리고 주소에서 reason 을 뗀다(새로 고침해도 다시 뜨지 않게)
  if (route.query.reason === 'expired') {
    await showNotice(TEXT.SESSION_ENDED)
    const query = { ...route.query }
    delete query.reason
    await router.replace({ query })
    await fillFromSaved()
  }
})

/** "아이디저장" 대로 아이디를 저장하거나 지운다 — 🔴 비밀번호가 맞았을 때만 부른다(성공 · PASSWORD_EXPIRED) */
function rememberUsername(id: string): void {
  if (saveUsername.value) {
    writeSavedUsername(id)
  } else {
    clearSavedUsername()
  }
}

/** 실패 뒤: 비밀번호 칸을 비우고 초점 */
async function resetPassword(): Promise<void> {
  password.value = ''
  await nextTick()
  passwordInput.value?.focus()
}

/** 로그인 뒤 목적지로 — 같은 창 또는 새 창(4-8) */
async function goToDestination(): Promise<void> {
  // 🔴 redirect 는 내부 경로만(4-7). 새 창의 목적지도 같은 검사를 지난다
  const destination = safeRedirect(route.query.redirect)

  if (!openInPopup.value) {
    await router.push(destination)
    return
  }

  const popup = window.open(
    router.resolve(destination).href,
    POPUP_WINDOW_NAME,
    POPUP_WINDOW_FEATURES,
  )
  if (popup === null) {
    // 브라우저가 팝업을 막았다 → 알리고 이 창에서 연다
    await showNotice(TEXT.POPUP_BLOCKED)
    await router.push(destination)
    return
  }
  // 새 창이 열렸다 — 이 창은 자기 토큰 · 사용자 정보를 비우고 로그인 화면에 남는다(logout API 는 부르지 않는다)
  auth.endSession()
  await fillFromSaved()
}

/** 로그인 제출 */
async function onSubmit(): Promise<void> {
  if (submitting.value) return

  // 아이디는 앞뒤 공백을 자른다 · 🔴 비밀번호는 자르지 않는다
  const id = username.value.trim()
  if (id.length === 0) {
    await showNotice(TEXT.REQUIRED_ID)
    usernameInput.value?.focus()
    return
  }
  if (password.value.length === 0) {
    await showNotice(TEXT.REQUIRED_PASSWORD)
    passwordInput.value?.focus()
    return
  }

  submitting.value = true
  try {
    await auth.login(id, password.value)
    password.value = ''
    rememberUsername(id)
    await goToDestination()
  } catch (error) {
    const described = describeError(error)
    // 🔴 errorCode 로만 판별한다 — 문구를 비교하지 않는다
    if (described.errorCode === LOGIN_FAILURE_CODE.PASSWORD_EXPIRED) {
      password.value = ''
      rememberUsername(id) // 비밀번호는 맞았다
      auth.pendingExpiredUsername = id
      await router.push({ name: ROUTE.EXPIRED_PASSWORD })
      return
    }
    await showNotice(described.message)
    await resetPassword()
  } finally {
    submitting.value = false
  }
}

/** [임시비밀번호발급] — 이번에는 안내만(B-2c 에서 창으로 바뀐다). 요청을 보내지 않는다 */
async function onTempPassword(): Promise<void> {
  await showNotice(TEXT.TEMP_PASSWORD_NOT_READY)
}
</script>

<template>
  <el-card class="login" data-testid="login">
    <header class="login__head">
      <h1 class="login__title">{{ LABEL.TITLE }}</h1>
      <h2 class="login__subtitle">{{ LABEL.SUBTITLE }}</h2>
      <p class="login__prompt">{{ TEXT.LOGIN_PROMPT }}</p>
    </header>

    <!-- @submit.prevent: Enter 로 제출되고, 페이지가 새로 고쳐지지 않는다 -->
    <el-form label-position="top" @submit.prevent="onSubmit">
      <el-form-item :label="LABEL.USERNAME">
        <el-input
          ref="usernameInput"
          v-model="username"
          autocomplete="username"
          data-testid="login-username"
        />
      </el-form-item>
      <el-form-item :label="LABEL.PASSWORD">
        <el-input
          ref="passwordInput"
          v-model="password"
          type="password"
          autocomplete="current-password"
          data-testid="login-password"
        />
      </el-form-item>
      <div class="login__options">
        <el-checkbox v-model="saveUsername" data-testid="save-username">{{
          LABEL.SAVE_ID
        }}</el-checkbox>
        <el-checkbox v-model="openInPopup" data-testid="open-popup">{{
          LABEL.OPEN_POPUP
        }}</el-checkbox>
      </div>
      <el-button
        class="login__submit"
        type="primary"
        native-type="submit"
        :loading="submitting"
        :disabled="submitting"
        data-testid="login-submit"
      >
        {{ LABEL.SUBMIT }}
      </el-button>
    </el-form>

    <div class="login__extra">
      <el-button size="small" data-testid="temp-password" @click="onTempPassword">
        {{ LABEL.TEMP_PASSWORD }}
      </el-button>
    </div>
    <p class="login__copyright">{{ LABEL.COPYRIGHT }}</p>
  </el-card>
</template>

<style scoped>
.login {
  width: 100%;
  max-width: 400px;
}

.login__head {
  margin-bottom: 16px;
  text-align: center;
}

.login__title {
  margin: 0;
  font-size: 22px;
}

.login__subtitle {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.login__prompt {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.login__options {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.login__submit {
  width: 100%;
}

.login__extra {
  margin-top: 16px;
  text-align: center;
}

.login__copyright {
  margin: 16px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}
</style>
