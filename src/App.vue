<!--
  최상위 컴포넌트.

  무엇을: 지금 주소에 맞는 화면(틀 포함)을 그리고, 확인 창(NoticeDialog)을 하나 둔다.
  확인 창은 어느 화면에서든 showNotice() 로 띄우므로 여기 한 번만 둔다.
-->
<script setup lang="ts">
// <script setup>: 여기 적은 import · 변수가 아래 <template> 에서 바로 쓰인다(Vue 3 의 관용 문법)
import { RouterView } from 'vue-router'

import NoticeDialog from '@/components/NoticeDialog.vue'
</script>

<template>
  <!-- RouterView: src/router/index.ts 의 경로 표에서 지금 주소에 맞는 화면이 이 자리에 그려진다 -->
  <RouterView />
  <NoticeDialog />
</template>
