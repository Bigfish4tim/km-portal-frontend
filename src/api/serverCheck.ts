/**
 * 서버 확인 — 화면이 백엔드에 닿는지 본다(환경 점검용 · 개발 서버에서만 · `/env-check`).
 *
 * 무엇을: `GET /api/auth/me` 를 **토큰 없이** 부르고 HTTP 상태 코드만 돌려준다. 응답 본문은 읽지 않는다.
 * 왜 이 경로인가: 토큰이 없으면 반드시 401 을 주는 경로라서, 401 이 오면
 *   "개발 서버의 프록시가 통하고 백엔드가 살아 있다" 는 뜻이 된다.
 *
 * 🔴 B-2a 부터 http.ts 에 토큰을 붙이는 인터셉터가 있다. 로그인한 채 이 화면을 열어도 "토큰 없이" 부르도록
 *    `skipAuth: true` 를 준다(토큰을 붙이지 않고 · 401 에 재발급도 하지 않는다).
 *
 * 근거(백엔드): controller/AuthController.java:414(@GetMapping("/me")) · :445-451(미인증이면 401 봉투)
 */
import { AUTH_URL, http } from './http'

/** 토큰 없이 불렀을 때 백엔드가 주어야 하는 상태 코드 */
export const SERVER_CHECK_EXPECTED_STATUS = 401

/**
 * 서버에 한 번 물어보고 상태 코드를 돌려준다.
 *
 * @returns HTTP 상태 코드. 응답 자체가 없으면(백엔드 · 프록시에 닿지 못함 · 시간 초과) `null`
 */
export async function checkServer(): Promise<number | null> {
  try {
    const response = await http.get<unknown>(AUTH_URL.ME, {
      // axios 는 기본으로 4xx · 5xx 를 예외로 던진다. 여기서는 상태 코드가 곧 결과이므로
      // 어떤 상태든 정상 응답으로 받는다.
      validateStatus: () => true,
      skipAuth: true,
    })
    // 본문(response.data)은 일부러 읽지 않는다
    return response.status
  } catch {
    // 여기 오는 것은 "응답이 없는" 경우뿐이다(연결 실패 · 시간 초과). 사유를 찍지 않는다(P4).
    return null
  }
}
