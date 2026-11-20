/**
 * 가짜 백엔드 — 화면 흐름 테스트에서 `/api/**` 요청을 가로채 모의 응답을 준다(Playwright 의 요청 가로채기).
 *
 * 무엇을: 경로(방법 + 주소)마다 응답을 정해 두고, 나간 요청을 기록한다(주소 · Authorization · 본문).
 * 왜 context 에 거나: "팝업창으로열기" 의 새 창도 같은 가짜 백엔드를 써야 해서다(page 에 걸면 새 창은 빠진다).
 * 정하지 않은 경로는 404(빈 본문)로 답하고 기록에 남긴다 — 테스트가 "예상 밖의 요청" 을 알아챌 수 있게.
 */
import type { BrowserContext, Request } from '@playwright/test'

import { type MockReply } from '../mocks/auth'

/** 나간 요청 하나의 기록 */
export interface SentRequest {
  method: string
  path: string
  authorization: string | undefined
  body: unknown
}

/** 요청을 보고 응답을 정하는 함수 — 같은 경로라도 n 번째 요청마다 다르게 답할 수 있다 */
export type Responder = (request: Request, nth: number) => MockReply

export class FakeBackend {
  readonly sent: SentRequest[] = []
  private readonly responders = new Map<string, Responder>()

  /** `on('POST', '/api/auth/login', 응답)` — 응답은 고정값 또는 함수 */
  on(method: string, path: string, reply: MockReply | Responder): this {
    this.responders.set(`${method} ${path}`, typeof reply === 'function' ? reply : () => reply)
    return this
  }

  /** 그 경로로 나간 요청들 */
  requests(method: string, path: string): SentRequest[] {
    return this.sent.filter((r) => r.method === method && r.path === path)
  }

  /** context 에 건다 — 이 context 의 모든 창 · 탭에 적용된다 */
  async install(context: BrowserContext): Promise<void> {
    // 🔴 무늬 '**/api/**' 를 쓰지 않는다 — 개발 서버가 주는 소스 파일(/src/api/http.ts 등)까지 걸려 앱이 뜨지 않는다.
    //    경로가 /api/ 로 시작하는 요청만 가로챈다.
    const isApi = (url: URL) => url.pathname.startsWith('/api/')
    await context.route(isApi, async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      const method = request.method()
      let body: unknown = null
      try {
        body = request.postDataJSON()
      } catch {
        body = request.postData()
      }
      const key = `${method} ${path}`
      const nth = this.sent.filter((r) => `${r.method} ${r.path}` === key).length
      this.sent.push({ method, path, authorization: request.headers()['authorization'], body })

      const responder = this.responders.get(key)
      if (!responder) {
        await route.fulfill({ status: 404, body: '' })
        return
      }
      const reply = responder(request, nth)
      await route.fulfill({
        status: reply.status,
        contentType: 'application/json',
        body: typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body),
      })
    })
  }
}
