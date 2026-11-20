/**
 * 토큰 보관의 단위 테스트 — 명세 B-2a 5-1 의 TS-1 ~ TS-3.
 * 🔴 토큰 값은 한눈에 가짜인 문자열이다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from './tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    clearTokens()
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('TS-1 넣으면 액세스는 메모리에서, 재발급용은 sessionStorage 의 km.refreshToken 에서 읽힌다', () => {
    setTokens('fake-access-1', 'fake-refresh-1')

    expect(getAccessToken()).toBe('fake-access-1')
    expect(getRefreshToken()).toBe('fake-refresh-1')
    expect(sessionStorage.getItem('km.refreshToken')).toBe('fake-refresh-1')

    // 액세스만 바꾸면 재발급용은 그대로다
    setAccessToken('fake-access-2')
    expect(getAccessToken()).toBe('fake-access-2')
    expect(getRefreshToken()).toBe('fake-refresh-1')
  })

  it('TS-2 넣은 뒤 localStorage 는 비어 있고 sessionStorage 의 키는 하나뿐이며 액세스 토큰이 없다', () => {
    setTokens('fake-access-1', 'fake-refresh-1')

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(1)
    expect(sessionStorage.key(0)).toBe('km.refreshToken')
    expect(sessionStorage.getItem('km.refreshToken')).not.toContain('fake-access-1')
  })

  it('TS-3 전부 지우면 둘 다 없다 · sessionStorage 가 예외를 던져도 함수가 예외를 내지 않는다', () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(sessionStorage.length).toBe(0)

    // 저장소가 막힌 환경을 흉내 낸다 — Storage 의 모든 동작이 예외를 던진다
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)

    expect(() => setTokens('fake-access-3', 'fake-refresh-3')).not.toThrow()
    // 막혀도 메모리로 이어 간다
    expect(getAccessToken()).toBe('fake-access-3')
    expect(getRefreshToken()).toBe('fake-refresh-3')
    expect(() => clearTokens()).not.toThrow()
    expect(getRefreshToken()).toBeNull()
  })
})
