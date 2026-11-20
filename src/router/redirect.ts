/**
 * `redirect` 검사 — 🔴 로그인 뒤 갈 곳으로 **내부 경로만** 받는다(명세 B-2a 4-7 · 열린 리디렉션 방지).
 *
 * 무엇을: 주소의 `?redirect=` 값이 이 앱 안의 경로인지 본다. 아니면 `/` 를 돌려준다.
 * 왜: 누가 `/login?redirect=https://나쁜곳` 링크를 보내면, 로그인한 직원이 바깥 주소로 보내질 수 있다.
 * 쓰는 곳: 로그인 뒤 이동(같은 창) · "팝업창으로열기" 의 window.open 목적지(4-8). 🔴 이 한 함수만 쓴다.
 *
 * 받는 것: `/` 로 시작하고 `//` 로 시작하지 않는 문자열(`//host` 는 브라우저가 바깥 주소로 읽는다).
 * 역슬래시(`/\host`)도 일부 브라우저가 `//` 처럼 읽으므로 받지 않는다.
 */

/** 검사를 통과하지 못했을 때 가는 곳 */
export const DEFAULT_AFTER_LOGIN = '/'

/**
 * @param value 주소의 redirect 값(vue-router 의 query 는 문자열 · 배열 · null 일 수 있다)
 * @returns 안전한 내부 경로, 아니면 `/`
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return DEFAULT_AFTER_LOGIN
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_AFTER_LOGIN
  }
  return value
}
