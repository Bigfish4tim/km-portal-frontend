/**
 * Vite 설정 — 개발 서버와 빌드가 이 파일을 읽는다.
 *
 * 🔴 이 파일의 포트 · 프록시 부분은 금지 파일이다(CLAUDE.md 10장). 명시 승인 없이 고치지 않는다.
 *    백엔드의 CORS 가 `http://localhost:3000` 만 허용하므로 포트가 바뀌면 화면이 백엔드에 닿지 못한다.
 */
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
// defineConfig 를 vitest/config 에서 가져온다 — Vite 의 것과 같되 아래 `test` 칸(단위 테스트 설정)의 타입을 안다
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  // .vue 파일(한 파일 컴포넌트)을 읽게 해 주는 플러그인
  plugins: [vue()],

  resolve: {
    alias: {
      // 경로 별칭: `@/api/http` 는 `src/api/http` 를 뜻한다(tsconfig.app.json 의 paths 와 짝이다)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // 포트 3000 고정
    port: 3000,
    // 3000 이 이미 쓰이고 있으면 다른 포트로 넘어가지 않고 실패한다(조용히 3001 로 뜨는 것을 막는다)
    strictPort: true,
    proxy: {
      // 화면은 상대 경로 `/api/...` 로 부르고, 개발 서버가 그것을 백엔드(8080)로 넘긴다.
      // 브라우저가 보기에는 같은 출처(3000)라서 교차 출처 문제가 생기지 않는다.
      '/api': {
        target: 'http://localhost:8080',
      },
    },
  },

  // 단위 테스트(Vitest) 설정 — `npm run test:unit` 이 읽는다
  test: {
    // 브라우저 흉내(jsdom) — 컴포넌트 테스트가 document 를 쓸 수 있다
    environment: 'jsdom',
    // 단위 테스트는 소스 옆의 *.spec.ts 다(CLAUDE.md 5장)
    include: ['src/**/*.spec.ts'],
    // 옛 코드(legacy/)와 화면 흐름 테스트(e2e/ — Playwright 가 돌린다)는 보지 않는다
    exclude: [...configDefaults.exclude, 'legacy/**', 'e2e/**'],
  },
})
