/**
 * "아이디저장" — 로그인 화면의 체크 상자가 쓰는 저장 자리(명세 B-2a 4-1 · 결정 G6 — 레거시를 따른다).
 *
 * 무엇을: `localStorage` 의 키 하나(`km.savedUsername`)에 **아이디 문자열 하나만** 둔다.
 * 왜 localStorage: 브라우저를 닫았다 열어도 남아야 해서다(sessionStorage 는 탭을 닫으면 사라진다).
 * 🔴 CLAUDE.md P5 · P6 의 예외다 — 두 줄에 이 파일이 적혀 있다.
 *
 * ⛔ 담지 않는 것: 비밀번호 · 토큰 · 이름 · 체크 여부(값이 있으면 체크된 것이다).
 * 저장소가 막힌 환경이면 예외를 삼킨다 — 저장되지 않을 뿐 로그인은 된다.
 */

/** 아이디를 두는 localStorage 의 키 — 이 키 하나뿐이다 */
export const SAVED_USERNAME_KEY = 'km.savedUsername'

/** 저장된 아이디(없거나 저장소가 막혔으면 null) */
export function readSavedUsername(): string | null {
  try {
    return localStorage.getItem(SAVED_USERNAME_KEY)
  } catch {
    return null
  }
}

/** 아이디를 저장한다(이미 있으면 바꾼다) */
export function writeSavedUsername(username: string): void {
  try {
    localStorage.setItem(SAVED_USERNAME_KEY, username)
  } catch {
    // 막힌 환경 — 저장하지 않는다(사유를 찍지 않는다 · P4)
  }
}

/** 저장된 아이디를 지운다 */
export function clearSavedUsername(): void {
  try {
    localStorage.removeItem(SAVED_USERNAME_KEY)
  } catch {
    // 막힌 환경 — 지울 것도 없다
  }
}
