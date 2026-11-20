/**
 * 로그인 상태 스토어(Pinia) — 명세 B-2a 4-5.
 *
 * 무엇을: "지금 로그인했는가" 와 로그인한 사용자 정보를 앱 전체가 함께 본다.
 *   - status: 'unknown'(앱을 막 열어 아직 모름) · 'guest'(로그인 안 함) · 'authed'(로그인함)
 *   - user: 로그인 · 내 정보 응답의 사용자. 🔴 메모리에만 둔다(P6) — 저장소에 쓰지 않는다
 *   - pendingExpiredUsername: 로그인이 PASSWORD_EXPIRED 일 때 변경 창으로 넘길 아이디. 🔴 메모리에만
 * 왜 여기: 토큰은 src/auth/ 가, 요청은 src/api/ 가 맡고, 이 스토어는 둘을 이어 "상태" 만 가진다.
 *
 * 🔴 비밀번호를 상태에 두지 않는다(P12). login() 은 받은 비밀번호를 서비스 함수에 넘기고 끝난다.
 * 🔴 역할 이름으로 화면을 숨기거나 여는 코드는 만들지 않는다(P8 · 국면 C).
 *
 * Pinia 관용: `defineStore('이름', () => { ... return {...} })` 는 "설정(setup) 스토어" 다.
 *   안의 ref 가 상태, 함수가 동작이 된다. 화면에서는 `useAuthStore()` 로 꺼내 쓴다.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

import * as authApi from '@/api/authApi'
import type { AuthUser } from '@/api/types/auth'
import { clearTokens, getRefreshToken, setAccessToken, setTokens } from '@/auth/tokenStore'

export type AuthStatus = 'unknown' | 'guest' | 'authed'

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown')
  const user = ref<AuthUser | null>(null)
  const pendingExpiredUsername = ref<string | null>(null)

  /** 진행 중인 restore — 라우터 가드가 여러 번 불러도 한 번만 돈다 */
  let restoring: Promise<void> | null = null

  /**
   * 앱 시작 때 한 번 — 새로 고침 뒤 로그인 상태를 되살린다.
   * 재발급용 토큰이 없으면 guest. 있으면 refresh → fetchMe → authed. 어느 단계든 실패하면 토큰을 지우고 guest.
   */
  function restore(): Promise<void> {
    if (restoring === null) {
      restoring = (async () => {
        const refreshToken = getRefreshToken()
        if (refreshToken === null) {
          status.value = 'guest'
          return
        }
        try {
          setAccessToken((await authApi.refresh(refreshToken)).accessToken)
          user.value = await authApi.fetchMe()
          status.value = 'authed'
        } catch {
          clearTokens()
          user.value = null
          status.value = 'guest'
        }
      })()
    }
    return restoring
  }

  /**
   * 로그인. 성공이면 토큰 · user 를 저장하고 authed. 실패면 오류를 그대로 던진다(화면이 문구를 얻는다).
   * 🔴 password 는 이 함수 안의 인자로만 있다 — 상태에 두지 않는다.
   */
  async function login(username: string, password: string): Promise<void> {
    const data = await authApi.login(username, password)
    setTokens(data.accessToken, data.refreshToken)
    user.value = data.user
    status.value = 'authed'
  }

  /**
   * 세션을 끝낸다 — API 를 부르지 않고 토큰 · user 를 비운다.
   * 인터셉터(재발급 실패) · 팝업창으로 열기(원래 창)가 부른다.
   */
  function endSession(): void {
    clearTokens()
    user.value = null
    status.value = 'guest'
  }

  /**
   * 로그아웃 — logout API 를 부르고(실패해도 계속) 세션을 끝낸다.
   * 🔴 저장된 아이디(km.savedUsername)는 지우지 않는다 — "아이디저장" 은 로그아웃 뒤에도 남아야 한다.
   */
  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // 서버가 실패해도 화면은 로그아웃한다(서버는 토큰을 무효로 만들지 않는다 — 백엔드 A3-49)
    }
    endSession()
  }

  /**
   * 재발급 한 번 — 인터셉터가 부른다(src/main.ts 가 등록). 성공이면 새 액세스 토큰을 저장하고 true.
   * 예외를 던지지 않는다.
   */
  async function renewAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken()
    if (refreshToken === null) {
      return false
    }
    try {
      setAccessToken((await authApi.refresh(refreshToken)).accessToken)
      return true
    } catch {
      return false
    }
  }

  return {
    status,
    user,
    pendingExpiredUsername,
    restore,
    login,
    logout,
    endSession,
    renewAccessToken,
  }
})
