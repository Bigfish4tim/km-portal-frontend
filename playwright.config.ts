/**
 * Playwright(화면 흐름 테스트) 설정.
 *
 * 🔴 대상 주소(baseURL)는 금지 파일 항목이다(CLAUDE.md 10장). 운영 주소를 가리키면 안 된다.
 *    기본 상대는 모의 응답이다(e2e/mocks/) — 백엔드 없이 끝까지 돈다.
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // 화면 흐름 테스트와 모의 응답은 루트 e2e/ 에 둔다
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // 산출물(스크린샷 · trace)이 쌓이는 곳 — .gitignore 에 있다(P2)
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  // test.only 를 지우지 않고 올린 것을 CI 에서 잡는다
  forbidOnly: !!process.env.CI,
  retries: 0,

  use: {
    // 개발 서버 주소. 테스트의 page.goto('/') 는 이 주소를 기준으로 한다
    baseURL: 'http://localhost:3000',
    // 실패한 테스트만 실행 기록(trace)을 남긴다
    trace: 'retain-on-failure',
  },

  // 브라우저는 Chromium 하나
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // 테스트 전에 개발 서버를 띄운다. 이미 떠 있으면(로컬에서 npm run dev 중) 그것을 쓴다
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
