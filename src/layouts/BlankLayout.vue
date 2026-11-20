<!--
  빈 틀 — 로그인 · 만료 변경 창(로그인하지 않은 화면)이 쓴다(명세 B-2a 4-6 ⑤).
  화면을 가운데에 놓는 것뿐이다.
-->
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="blank-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.blank-layout {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
  background: var(--el-fill-color-lighter);
}
</style>
