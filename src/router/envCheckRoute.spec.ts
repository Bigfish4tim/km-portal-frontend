/**
 * 환경 점검 경로의 단위 테스트 — 명세 B-2a 5-2 의 SEC-3(확인 방법은 자유).
 *
 * 방법: `import.meta.env.DEV` 를 바꿔 가며 라우터 모듈을 새로 읽고, `/env-check` 경로가 등록되는지 본다.
 *   운영 빌드에서는 Vite 가 `import.meta.env.DEV` 를 false 로 고정한다 — 그때의 라우터와 같다.
 * (보조 확인: 운영 빌드 결과물 dist/ 에 그 화면의 글자가 없는지는 구현보고에 grep 결과로 적었다.)
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('/env-check 경로', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('SEC-3 운영(DEV=false)에서는 /env-check 가 없고 · 개발(DEV=true)에서는 있다', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const production = (await import('./index')).default
    expect(production.hasRoute('env-check')).toBe(false)
    // 없는 주소로 취급되어 / 로 간다
    expect(production.resolve('/env-check').matched.some((r) => r.name === 'env-check')).toBe(false)

    vi.stubEnv('DEV', true)
    vi.resetModules()
    const development = (await import('./index')).default
    expect(development.hasRoute('env-check')).toBe(true)
  })
})
