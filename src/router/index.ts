/**
 * 경로(주소 ↔ 화면) 표.
 *
 * 무엇을: 어느 주소에 어느 화면을 그릴지 정한다.
 * 지금은 경로가 하나다 — `/` → 환경 점검 화면(임시). B-2 에서 로그인 화면으로 바뀐다.
 * 가드(로그인 여부 검사)는 아직 없다(B-2).
 */
import { createRouter, createWebHistory } from 'vue-router'

import EnvCheckView from '@/views/EnvCheckView.vue'

const router = createRouter({
  // createWebHistory: 주소에 `#` 없이 `/path` 꼴을 쓴다
  history: createWebHistory(),
  routes: [{ path: '/', name: 'env-check', component: EnvCheckView }],
})

export default router
