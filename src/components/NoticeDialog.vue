<!--
  확인 창 — 레거시의 브라우저 알림창(alert)을 대신한다(명세 B-2a 결정 D1 · 4-6 공통).

  무엇을: notice.ts 의 showNotice() 가 넣은 문구를 화면 가운데 창에 보이고, [확인] 하나로 닫는다.
    Enter 로도 닫힌다([확인] 단추에 초점을 두기 때문 — 단추에서 Enter 는 누름과 같다).
  🔴 줄바꿈: 문구를 `\n` 으로 나눠 줄마다 <p> 하나로 그린다. v-html 을 쓰지 않는다(P9) —
    서버 문구에 `<b>` 같은 글자가 있어도 글자 그대로 보인다(Vue 의 {{ }} 는 글자로만 넣는다).
  App.vue 에 하나만 둔다.
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { closeCurrentNotice, currentNotice, splitLines } from './notice'

/** [확인] 단추 텍스트 — 레거시 알림창의 단추 이름 */
const CONFIRM_LABEL = '확인'

const lines = computed(() => (currentNotice.value ? splitLines(currentNotice.value.message) : []))
const visible = computed(() => currentNotice.value !== null)

/** [확인] 단추(초점을 옮기려고 잡아 둔다) */
const confirmButton = ref<HTMLButtonElement | null>(null)

// 창이 뜰 때마다 [확인] 에 초점 — Enter 한 번으로 닫히게
watch(currentNotice, async (notice) => {
  if (notice) {
    await nextTick()
    confirmButton.value?.focus()
  }
})

/** [확인] · Enter · Esc */
function onConfirm(): void {
  closeCurrentNotice()
}
</script>

<template>
  <!--
    Element Plus 의 창 대신 단순한 겹 창을 직접 그린다.
    이유: el-dialog 는 닫힐 때 초점을 "열기 전 자리" 로 되돌린다. 로그인 실패 뒤 "비밀번호 칸에 초점" 같은
    "닫힌 뒤 할 일" 과 부딪친다(구현보고 — 설계 판단). 모양은 Element Plus 의 단추 · 색을 쓴다.
  -->
  <div
    v-if="visible"
    class="notice-overlay"
    data-testid="notice-overlay"
    @keydown.esc.prevent="onConfirm"
  >
    <div
      class="notice"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="notice-message"
      data-testid="notice"
    >
      <div id="notice-message" class="notice__message" data-testid="notice-message">
        <!-- 줄마다 요소 하나. 빈 줄도 높이를 갖게 &nbsp; 대신 CSS 로 최소 높이를 준다 -->
        <p
          v-for="(line, index) in lines"
          :key="index"
          class="notice__line"
          data-testid="notice-line"
        >
          {{ line }}
        </p>
      </div>
      <div class="notice__actions">
        <!-- el-button 대신 button: 초점을 확실히 잡으려고. 모양은 Element Plus 의 클래스를 빌린다 -->
        <button
          ref="confirmButton"
          type="button"
          class="el-button el-button--primary"
          data-testid="notice-confirm"
          @click="onConfirm"
        >
          {{ CONFIRM_LABEL }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 35%);
}

.notice {
  min-width: 320px;
  max-width: 480px;
  padding: 24px 24px 16px;
  background: var(--el-bg-color, #fff);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow, 0 8px 24px rgb(0 0 0 / 20%));
}

.notice__line {
  min-height: 1.5em;
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
  word-break: keep-all;
}

.notice__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
