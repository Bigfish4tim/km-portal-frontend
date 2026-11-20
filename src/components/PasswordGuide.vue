<!--
  비밀번호 안내문 — 변경 창 · 본인 변경 화면의 오른쪽(명세 B-2a 4-3).
  문구는 src/errors/text.ts 의 PASSWORD_GUIDE 한 곳에 있다(숫자는 검사 모듈의 상수에서 온다).
-->
<script setup lang="ts">
import { PASSWORD_GUIDE } from '@/errors/text'
</script>

<template>
  <ol class="password-guide" data-testid="password-guide">
    <li v-for="(line, index) in PASSWORD_GUIDE" :key="index">{{ line }}</li>
  </ol>
</template>

<style scoped>
.password-guide {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
</style>
