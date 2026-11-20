/**
 * "아이디저장" 의 단위 테스트 — 명세 B-2a 5-1 의 SU-1.
 * 🔴 아이디는 합성 값이다.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearSavedUsername, readSavedUsername, writeSavedUsername } from './savedUsername'

describe('savedUsername', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('SU-1 쓰면 km.savedUsername 에서 읽히고 · 지우면 null · 키는 하나뿐 · 저장소 예외를 삼킨다', () => {
    localStorage.clear()
    expect(readSavedUsername()).toBeNull()

    writeSavedUsername('test_user7')
    expect(readSavedUsername()).toBe('test_user7')
    expect(localStorage.getItem('km.savedUsername')).toBe('test_user7')
    expect(localStorage.length).toBe(1)

    clearSavedUsername()
    expect(readSavedUsername()).toBeNull()
    expect(localStorage.length).toBe(0)

    // 저장소가 막힌 환경
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
    expect(() => writeSavedUsername('test_user7')).not.toThrow()
    expect(readSavedUsername()).toBeNull()
    expect(() => clearSavedUsername()).not.toThrow()
  })
})
