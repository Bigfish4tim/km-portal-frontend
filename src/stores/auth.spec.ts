/**
 * 로그인 상태 스토어의 단위 테스트 — 명세 B-2a 5-1 의 AS-1 ~ AS-3.
 *
 * 서비스 함수(src/api/authApi.ts)를 가짜로 바꿔(vi.mock) 요청 없이 스토어의 동작만 본다.
 * 🔴 토큰 · 아이디 · 비밀번호는 합성 값이다.
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authApi from '@/api/authApi'
import type { AuthUser } from '@/api/types/auth'
import { clearSavedUsername, readSavedUsername, writeSavedUsername } from '@/auth/savedUsername'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/auth/tokenStore'

import { useAuthStore } from './auth'

// vi.mock: 이 모듈을 통째로 가짜 함수로 바꾼다(테스트마다 동작을 정한다)
vi.mock('@/api/authApi')

/** 합성 사용자 — 백엔드 AuthController.java:631-663 의 키 */
const USER: AuthUser = {
  userId: 1,
  username: 'test_user7',
  email: 'test_user7@example.invalid',
  fullName: '테스트사용자',
  department: '테스트부서',
  position: '테스트직위',
  phoneNumber: null,
  isActive: true,
  isLocked: false,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00',
  roles: [{ roleId: 1, roleName: 'ROLE_TEST', displayName: '테스트역할', priority: 1 }],
}

const PASSWORD = 'Kx7#qm2w'

describe('auth 스토어', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    clearTokens()
    clearSavedUsername()
  })

  it('AS-1 restore: 재발급용 토큰 없음 → guest(요청 0) · 있음 → refresh → fetchMe → authed · refresh 실패 → 토큰 지움 · guest', async () => {
    // 없음
    const a = useAuthStore()
    await a.restore()
    expect(a.status).toBe('guest')
    expect(authApi.refresh).not.toHaveBeenCalled()
    expect(authApi.fetchMe).not.toHaveBeenCalled()

    // 있음
    setActivePinia(createPinia())
    setTokens('fake-access-1', 'fake-refresh-1')
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'fake-access-2',
      tokenType: 'Bearer',
      expiresIn: 86400,
    })
    vi.mocked(authApi.fetchMe).mockResolvedValue(USER)
    const b = useAuthStore()
    await b.restore()
    expect(authApi.refresh).toHaveBeenCalledWith('fake-refresh-1')
    expect(authApi.fetchMe).toHaveBeenCalledTimes(1)
    expect(b.status).toBe('authed')
    expect(b.user).toEqual(USER)
    expect(getAccessToken()).toBe('fake-access-2')

    // refresh 실패
    setActivePinia(createPinia())
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('401'))
    const c = useAuthStore()
    await c.restore()
    expect(c.status).toBe('guest')
    expect(c.user).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('AS-2 login 성공 뒤 상태 어디에도 비밀번호가 없다 · 실패는 오류를 그대로 던지고 guest 그대로', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'fake-access-1',
      refreshToken: 'fake-refresh-1',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: USER,
    })
    const store = useAuthStore()
    await store.login('test_user7', PASSWORD)

    expect(store.status).toBe('authed')
    expect(JSON.stringify(store.$state)).not.toContain(PASSWORD)
    expect(getAccessToken()).toBe('fake-access-1')
    expect(getRefreshToken()).toBe('fake-refresh-1')

    // 실패
    setActivePinia(createPinia())
    clearTokens()
    const failure = { isAxiosError: true, response: { status: 401 } }
    vi.mocked(authApi.login).mockRejectedValue(failure)
    const guest = useAuthStore()
    guest.status = 'guest'
    await expect(guest.login('test_user7', PASSWORD)).rejects.toBe(failure)
    expect(guest.status).toBe('guest')
    expect(getRefreshToken()).toBeNull()
  })

  it('AS-3 logout 은 API 가 실패해도 토큰 · user 를 비우고 · 저장된 아이디는 남는다', async () => {
    writeSavedUsername('test_user7')
    setTokens('fake-access-1', 'fake-refresh-1')
    const store = useAuthStore()
    store.user = USER
    store.status = 'authed'
    vi.mocked(authApi.logout).mockRejectedValue(new Error('500'))

    await store.logout()

    expect(authApi.logout).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('guest')
    expect(store.user).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(readSavedUsername()).toBe('test_user7')
  })
})
