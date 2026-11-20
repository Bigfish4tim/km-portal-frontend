/**
 * 경로 이름 — 화면 코드가 경로 문자열을 흩어 적지 않게 한 곳에 둔다.
 * 라우터(index.ts)와 따로 둔 이유: 화면이 이 이름을 쓰려고 라우터를 import 하면, 라우터도 화면을 import 하므로 서로 물린다(순환 참조).
 */
export const ROUTE = {
  LOGIN: 'login',
  EXPIRED_PASSWORD: 'password-expired',
  HOME: 'home',
  OWN_PASSWORD: 'own-password',
  ENV_CHECK: 'env-check',
} as const
