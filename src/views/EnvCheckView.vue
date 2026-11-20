<!--
  환경 점검 화면 `/env-check` — 🔴 개발 서버에서만 경로가 있다(명세 B-2a 4-6 · src/router/index.ts)

  무엇을: 새 프론트의 세 층(타입 · 린트 → 단위 → 화면 흐름)이 실제로 도는지 보이는 최소 화면이다.
    ① 비밀번호 칸 — 치는 대로 사전 검사(src/validation/password.ts) 결과를 한 줄로 보여 준다.
    ② "서버 확인" 단추 — 백엔드에 닿는지(src/api/serverCheck.ts) 한 줄로 보여 준다.
  왜: 업무 화면을 만들기 전에 도구 환경과 프록시가 맞는지 눈으로 확인하기 위해서다.

  🔴 비밀번호 칸의 값은 이 화면 안의 변수(password)에만 있다. 어디에도 보내지 않고 저장하지 않는다(P12).
  🔴 이 화면은 axios · 브라우저 저장소를 직접 쓰지 않는다. src/api/ 의 함수만 부른다(CLAUDE.md 5장 3번).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'

import { SERVER_CHECK_EXPECTED_STATUS, checkServer } from '@/api/serverCheck'
import { ENV_CHECK_TEXT, TEXT as COMMON_TEXT } from '@/errors/text'
import { validatePassword } from '@/validation/password'

/**
 * 이 화면의 문구 — B-2a 에서 src/errors/text.ts 로 옮겼다(명세 B-2a 4-3 "화면이 만드는 문구는 한 파일에").
 * 비밀번호 규칙 위반 문구는 src/validation/password.ts 에 있다(서버 문구와 같아야 해서).
 */
const TEXT = {
  title: ENV_CHECK_TEXT.TITLE,
  passwordLabel: ENV_CHECK_TEXT.PASSWORD_LABEL,
  passwordPlaceholder: ENV_CHECK_TEXT.PASSWORD_PLACEHOLDER,
  passwordOk: COMMON_TEXT.PASSWORD_PRECHECK_OK,
  serverButton: ENV_CHECK_TEXT.SERVER_BUTTON,
  serverIdle: ENV_CHECK_TEXT.SERVER_IDLE,
  serverChecking: ENV_CHECK_TEXT.SERVER_CHECKING,
  serverOk: ENV_CHECK_TEXT.SERVER_OK(SERVER_CHECK_EXPECTED_STATUS),
  serverUnreachable: ENV_CHECK_TEXT.SERVER_UNREACHABLE,
  // 중간의 프록시가 "백엔드에 닿지 못했다" 고 대신 답한 경우(502 · 503 · 504)
  serverUnreachableViaProxy: ENV_CHECK_TEXT.SERVER_GATEWAY,
  // 그 밖의 상태(백엔드가 답은 했지만 401 이 아니다)
  serverUnexpected: (status: number) =>
    ENV_CHECK_TEXT.SERVER_UNEXPECTED(status, SERVER_CHECK_EXPECTED_STATUS),
} as const

/**
 * 프록시(게이트웨이)가 "뒤의 서버에 닿지 못했다" 고 답할 때의 상태 코드.
 * 실측(2026-11-19 · 백엔드를 끈 채 개발 서버에 요청): 개발 서버의 프록시는 응답을 끊지 않고 502 를 준다.
 * 그래서 "응답 없음" 만 보면 백엔드가 꺼진 것을 놓친다.
 */
const GATEWAY_FAILURE_STATUSES: readonly number[] = [502, 503, 504]

// ── ① 비밀번호 사전 검사 ─────────────────────────────────────────────

// ref: 값이 바뀌면 화면이 따라 바뀌는 변수. 스크립트에서는 .value 로 읽고 쓴다.
// 🔴 이 값은 이 변수에만 있다. 스토어 · 저장소 · 주소에 두지 않는다.
const password = ref('')

// computed: 다른 값에서 계산되는 값. password 가 바뀌면 자동으로 다시 계산된다.
// 입력을 자르거나 바꾸지 않고 그대로 검사한다(P12).
const passwordResult = computed(() => validatePassword(password.value))

// ── ② 서버 확인 ───────────────────────────────────────────────────

/** 서버 확인의 상태. 'idle' 은 아직 누르지 않음, 'done' 은 결과가 있음이다. */
type ServerState = { kind: 'idle' } | { kind: 'checking' } | { kind: 'done'; status: number | null }

const serverState = ref<ServerState>({ kind: 'idle' })

/** 결과 한 줄의 문구와 색(Element Plus 의 type)을 상태에서 계산한다. */
const serverLine = computed<{ text: string; type: 'info' | 'success' | 'danger' | 'warning' }>(
  () => {
    const state = serverState.value
    if (state.kind === 'idle') {
      return { text: TEXT.serverIdle, type: 'info' }
    }
    if (state.kind === 'checking') {
      return { text: TEXT.serverChecking, type: 'info' }
    }
    if (state.status === null) {
      // 응답이 없다 — 백엔드 · 프록시에 닿지 못했다
      return { text: TEXT.serverUnreachable, type: 'danger' }
    }
    if (state.status === SERVER_CHECK_EXPECTED_STATUS) {
      // 401 — 백엔드가 살아 있고 프록시가 통한다
      return { text: TEXT.serverOk, type: 'success' }
    }
    if (GATEWAY_FAILURE_STATUSES.includes(state.status)) {
      // 프록시는 살아 있지만 백엔드에 닿지 못했다(백엔드가 꺼져 있다)
      return { text: TEXT.serverUnreachableViaProxy(state.status), type: 'danger' }
    }
    return { text: TEXT.serverUnexpected(state.status), type: 'warning' }
  },
)

/** "서버 확인" 단추를 눌렀을 때. 비밀번호 칸의 값은 여기서 쓰지 않는다(보내지 않는다). */
async function onCheckServer(): Promise<void> {
  serverState.value = { kind: 'checking' }
  serverState.value = { kind: 'done', status: await checkServer() }
}
</script>

<template>
  <main class="env-check">
    <el-card>
      <template #header>
        <h1 class="env-check__title">{{ TEXT.title }}</h1>
      </template>

      <!-- ① 비밀번호 사전 검사. v-model: 입력 칸과 변수를 양쪽으로 잇는다 -->
      <section class="env-check__section">
        <label class="env-check__label" for="env-check-password">{{ TEXT.passwordLabel }}</label>
        <el-input
          id="env-check-password"
          v-model="password"
          type="password"
          autocomplete="off"
          :placeholder="TEXT.passwordPlaceholder"
          data-testid="password-input"
        />
        <el-text
          class="env-check__line"
          :type="passwordResult.ok ? 'success' : 'danger'"
          data-testid="password-result"
        >
          {{ passwordResult.ok ? TEXT.passwordOk : passwordResult.message }}
        </el-text>
      </section>

      <!-- ② 서버 확인 -->
      <section class="env-check__section">
        <el-button
          type="primary"
          :loading="serverState.kind === 'checking'"
          data-testid="server-check-button"
          @click="onCheckServer"
        >
          {{ TEXT.serverButton }}
        </el-button>
        <el-text class="env-check__line" :type="serverLine.type" data-testid="server-result">
          {{ serverLine.text }}
        </el-text>
      </section>
    </el-card>
  </main>
</template>

<!-- scoped: 이 스타일은 이 컴포넌트에만 적용된다 -->
<style scoped>
.env-check {
  max-width: 560px;
  margin: 48px auto;
  padding: 0 16px;
}

.env-check__title {
  margin: 0;
  font-size: 20px;
}

.env-check__section + .env-check__section {
  margin-top: 24px;
}

.env-check__label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.env-check__line {
  display: block;
  margin-top: 8px;
}
</style>
