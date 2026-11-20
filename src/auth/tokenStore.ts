/**
 * 토큰 보관 — 🔴 토큰을 만지는 유일한 곳(CLAUDE.md P5 · 5장 폴더 표).
 *
 * 무엇을:
 *   - 액세스 토큰: 이 모듈 안의 변수(메모리)에만 둔다. 새로 고침하면 사라진다(그때는 재발급으로 다시 받는다).
 *   - 재발급용 토큰(refresh): `sessionStorage` 의 키 하나(`km.refreshToken`)에만 둔다.
 *     같은 탭의 새로 고침에는 남고, 탭을 닫으면 사라진다.
 * 왜 이렇게: 액세스 토큰 안에 이름 · 이메일 · 부서가 들어 있다(CLAUDE.md 6-2). 저장소에 남기지 않는다.
 *   재발급용 토큰은 새로 고침 때 로그인 상태를 되살리는 데 필요하다(2026-11-19 결정 5 · 미결 FE-6).
 *
 * ⛔ 하지 않는 것: localStorage · 쿠키 · IndexedDB 에 두기 · 사용자 정보나 비밀번호 담기 · 토큰을 풀어(decode) 읽기.
 * 토큰은 불투명한 문자열이다(명세 B-2a 3-1).
 */

/** 재발급용 토큰을 두는 sessionStorage 의 키 — 이 키 하나뿐이다 */
export const REFRESH_TOKEN_KEY = 'km.refreshToken'

/** 액세스 토큰 — 메모리에만 */
let accessToken: string | null = null

/**
 * sessionStorage 가 막힌 환경(사생활 보호 설정 등)에서 쓰는 메모리 대체 자리.
 * 그런 환경에서는 새로 고침하면 로그인이 풀린다 — 그래도 앱이 멈추지는 않는다.
 */
let refreshTokenFallback: string | null = null

/** sessionStorage 를 쓴다. 막혀 있으면 예외를 삼키고 false */
function writeSession(value: string | null): boolean {
  try {
    if (value === null) {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    } else {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, value)
    }
    return true
  } catch {
    // 저장소가 막힌 환경 — 메모리만 쓴다(사유를 찍지 않는다 · P4)
    return false
  }
}

/** 로그인 성공 때: 두 토큰을 한 번에 넣는다 */
export function setTokens(access: string, refresh: string): void {
  accessToken = access
  refreshTokenFallback = writeSession(refresh) ? null : refresh
}

/** 재발급 성공 때: 액세스 토큰만 바꾼다(재발급해도 새 refresh 토큰은 오지 않는다 — CLAUDE.md 6-2) */
export function setAccessToken(access: string): void {
  accessToken = access
}

/** 지금의 액세스 토큰(없으면 null) */
export function getAccessToken(): string | null {
  return accessToken
}

/** 지금의 재발급용 토큰(없으면 null) */
export function getRefreshToken(): string | null {
  try {
    const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (stored !== null) {
      return stored
    }
  } catch {
    // 막힌 환경 — 아래의 메모리 값을 본다
  }
  return refreshTokenFallback
}

/** 로그아웃 · 세션 종료 때: 둘 다 지운다 */
export function clearTokens(): void {
  accessToken = null
  refreshTokenFallback = null
  writeSession(null)
}
