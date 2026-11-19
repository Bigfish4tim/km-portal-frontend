<!--
  최상위 컴포넌트.

  무엇을: 지금 주소에 맞는 화면을 그린다. 그것뿐이다.
  왜: 레이아웃 · 메뉴는 이 단계(B-1)의 범위가 아니다.
-->
<script setup lang="ts">
// <script setup>: 여기 적은 import · 변수가 아래 <template> 에서 바로 쓰인다(Vue 3 의 관용 문법)
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- RouterView: src/router/index.ts 의 경로 표에서 지금 주소에 맞는 화면이 이 자리에 그려진다 -->
  <RouterView />
</template>
