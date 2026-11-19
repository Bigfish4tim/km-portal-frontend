/**
 * 앱 시작점.
 *
 * 무엇을: Vue 앱을 만들고 Pinia(상태 관리) · 라우터 · Element Plus(UI 부품)를 건 뒤 화면에 붙인다.
 * 왜 여기: 앱 전체에 한 번만 거는 것들은 이 파일에만 둔다.
 */
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

// Element Plus 의 스타일 전체(전체 등록 방식 — 번들 크기는 미결 FE-4 에서 다시 본다)
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

// createApp: 최상위 컴포넌트(App.vue)로 앱 하나를 만든다
const app = createApp(App)

// app.use(...): 플러그인을 앱 전체에 건다
app.use(createPinia()) // 상태 관리(스토어는 B-2 부터 생긴다)
app.use(router) // 주소 ↔ 화면
app.use(ElementPlus) // <el-button> 같은 부품을 어디서나 쓸 수 있게 전체 등록

// index.html 의 <div id="app"> 에 붙인다
app.mount('#app')
