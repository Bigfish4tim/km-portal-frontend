/**
 * 앱 시작점.
 *
 * 무엇을: Vue 앱을 만들고 Pinia(상태 관리) · 라우터 · Element Plus(UI 부품 · 한국어)를 건 뒤,
 *   HTTP 인터셉터에 "재발급" 과 "세션 종료" 를 등록하고 화면에 붙인다.
 * 왜 여기: 앱 전체에 한 번만 거는 것들은 이 파일에만 둔다.
 */
import ElementPlus from 'element-plus'
// Element Plus 의 한국어(날짜 선택기 · 빈 표 안내 등 부품 안의 글자) — 패키지에 들어 있는 것(명세 B-2a 4-9)
import ko from 'element-plus/es/locale/lang/ko'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

// Element Plus 의 스타일 전체(전체 등록 방식 — 번들 크기는 미결 FE-4 에서 다시 본다)
import 'element-plus/dist/index.css'

import { registerSessionHooks } from '@/api/http'
import { ROUTE } from '@/router/names'
import { useAuthStore } from '@/stores/auth'

import App from './App.vue'
import router from './router'

// createApp: 최상위 컴포넌트(App.vue)로 앱 하나를 만든다
const app = createApp(App)

// app.use(...): 플러그인을 앱 전체에 건다
const pinia = createPinia()
app.use(pinia) // 상태 관리
app.use(router) // 주소 ↔ 화면 · 가드
app.use(ElementPlus, { locale: ko }) // <el-button> 같은 부품을 어디서나 쓸 수 있게 전체 등록 · 한국어

/**
 * 🔴 인터셉터(src/api/http.ts)는 라우터 · 스토어를 직접 import 하지 않는다(순환 참조 방지).
 * 대신 여기서 두 함수를 넘긴다:
 *   - renewAccessToken: 재발급 한 번(스토어)
 *   - endSession: 재발급이 안 될 때 — 스토어를 로그아웃 상태로 만들고 로그인 화면으로(reason=expired · 지금 주소를 redirect 로)
 */
const auth = useAuthStore(pinia)
registerSessionHooks({
  renewAccessToken: () => auth.renewAccessToken(),
  endSession: () => {
    const wasAuthed = auth.status === 'authed'
    auth.endSession()
    // 로그인한 상태였을 때만 화면을 옮긴다(앱을 막 열며 되살리는 중의 실패는 가드가 처리한다)
    if (wasAuthed) {
      const current = router.currentRoute.value.fullPath
      void router.push({
        name: ROUTE.LOGIN,
        query: current === '/' ? { reason: 'expired' } : { reason: 'expired', redirect: current },
      })
    }
  },
})

// index.html 의 <div id="app"> 에 붙인다
app.mount('#app')
