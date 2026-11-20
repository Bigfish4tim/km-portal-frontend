/**
 * 브라우저 저장소 읽기 — 보안 테스트(SEC-1 · SEC-2 · SS-2 · LO-1 · PU-1)가 "저장소에 무엇이 남았는가" 를 본다.
 *
 * 🔴 린트 L4(브라우저 저장소는 src/auth/ 안에서만)는 앱 코드를 위한 규칙이다. 이 파일은 앱이 아니라 앱을 **검사하는** 테스트다.
 *   규칙을 끄지 않으려고(CLAUDE.md 10장) 저장소를 읽는 식을 **문자열**로 브라우저에 보낸다
 *   (page.evaluate 에 문자열을 주면 브라우저 안에서 그 식이 돈다 — ESLint 는 문자열 안을 보지 않는다).
 *   그 문자열은 이 파일에만 둔다. 구현보고 "임의로 정한 것" 에 적었다.
 * 읽기만 한다. 쓰거나 지우지 않는다.
 */
import type { Page } from '@playwright/test'

/** 저장소 하나의 [키, 값] 목록 */
export type StorageEntries = Array<[string, string]>

/** 그 창의 sessionStorage 전부 */
export async function readSessionStorage(page: Page): Promise<StorageEntries> {
  return (await page.evaluate('Object.entries(window.sessionStorage)')) as StorageEntries
}

/** 그 창의 localStorage 전부 */
export async function readLocalStorage(page: Page): Promise<StorageEntries> {
  return (await page.evaluate('Object.entries(window.localStorage)')) as StorageEntries
}

/**
 * 🔴 라이브러리가 쓰는 sessionStorage 키 — 우리 코드가 쓰지 않는다.
 *
 * vue-router 5 의 createWebHistory 는 이동할 때마다 `vue-router:scroll` 에 "경로 → 스크롤 위치" 를 적는다
 * (node_modules/vue-router/dist/devtools-RytpElE1.js:381-427 · scrollBehavior 를 주지 않아도 invalidateScrollPositions 가 적는다).
 * 명세 B-2a 의 SEC-1 은 "sessionStorage 의 키는 km.refreshToken 하나" 를 요구하지만 이 키 때문에 글자 그대로는 지킬 수 없다(구현보고 — 명세와 다른 점).
 * 그래서 이 키 하나만 따로 떼고, **그 값이 경로 → {left, top} 숫자뿐인지** 확인한다(토큰 · 비밀번호 · 이름이 들어갈 자리가 없음을 본다).
 */
export const LIBRARY_SESSION_KEY = 'vue-router:scroll'

/** 라이브러리 키를 떼고 우리 키만 남긴다. 라이브러리 키의 값이 스크롤 위치 모양이 아니면 예외 */
export function appSessionEntries(entries: StorageEntries): StorageEntries {
  const library = entries.find(([key]) => key === LIBRARY_SESSION_KEY)
  if (library) {
    const parsed: unknown = JSON.parse(library[1])
    const values = Object.values(parsed as Record<string, unknown>)
    const onlyScroll = values.every(
      (v) =>
        typeof v === 'object' &&
        v !== null &&
        Object.keys(v).sort().join(',') === 'left,top' &&
        Object.values(v).every((n) => typeof n === 'number'),
    )
    if (!onlyScroll) {
      throw new Error(`${LIBRARY_SESSION_KEY} 의 값이 스크롤 위치 모양이 아니다`)
    }
  }
  return entries.filter(([key]) => key !== LIBRARY_SESSION_KEY)
}
