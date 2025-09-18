// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// Element Plus 임포트
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// Vue 앱 생성
const app = createApp(App);

// Element Plus 플러그인 등록
app.use(ElementPlus);

// Element Plus 아이콘 컴포넌트 전역 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 라우터와 스토어 등록
app.use(store);
app.use(router);

// DOM에 마운트
app.mount("#app");
