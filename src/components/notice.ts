/**
 * 확인 창을 띄우는 함수 — 레거시의 `alert` 자리(명세 B-2a 1-2 결정 D1 · 4-6 공통).
 *
 * 무엇을: `await showNotice('문구')` 로 화면 가운데에 확인 창(문구 + [확인])을 띄우고, 닫히면 약속(Promise)이 끝난다.
 *   띄운 쪽은 `await` 다음 줄에 "닫힌 뒤 할 일"(초점 옮기기 · 화면 이동)을 적으면 된다.
 * 어떻게: 이 모듈의 상태(지금 띄울 문구 목록)를 `NoticeDialog.vue` 가 그린다. App.vue 에 그 부품이 하나 있다.
 *   두 번 연달아 부르면 앞의 것이 닫힌 뒤에 다음 것이 뜬다(차례로).
 *
 * ⛔ `window.alert` · `window.confirm` 을 쓰지 않는다 — 화면을 멈추고 자동 검증이 어렵다.
 */
import { computed, shallowReactive } from 'vue'

/** 띄울 확인 창 하나 */
interface Notice {
  message: string
  /** 닫혔을 때 부를 함수(showNotice 가 돌려준 약속을 끝낸다) */
  resolve: () => void
}

/** 차례를 기다리는 확인 창들. shallowReactive: 배열이 바뀌면 화면이 따라 그린다(안쪽 객체까지는 보지 않는다) */
const queue = shallowReactive<Notice[]>([])

/** 지금 보이는 확인 창(없으면 null) — NoticeDialog.vue 가 읽는다 */
export const currentNotice = computed<Notice | null>(() => queue[0] ?? null)

/**
 * 확인 창을 띄운다.
 * @param message 보일 문구. `\n` 은 줄바꿈으로 그린다(줄마다 요소 하나 — v-html 을 쓰지 않는다)
 * @returns 사용자가 [확인] · Enter 로 닫으면 끝나는 약속
 */
export function showNotice(message: string): Promise<void> {
  return new Promise<void>((resolve) => {
    queue.push({ message, resolve })
  })
}

/** 지금 창을 닫는다 — NoticeDialog.vue 가 부른다 */
export function closeCurrentNotice(): void {
  const notice = queue.shift()
  notice?.resolve()
}

/** 문구를 줄로 나눈다(`\n` 기준). 줄마다 요소 하나로 그린다 */
export function splitLines(message: string): string[] {
  return message.split('\n')
}
