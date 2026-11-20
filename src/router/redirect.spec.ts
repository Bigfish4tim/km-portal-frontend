/**
 * `redirect` 검사의 단위 테스트 — 명세 B-2a 5-1 의 RG-1.
 */
import { describe, expect, it } from 'vitest'

import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
  it('RG-1 내부 경로만 통과하고 바깥 주소 · javascript: · 빈 값은 / 로', () => {
    expect(safeRedirect('/mypage/password')).toBe('/mypage/password')
    expect(safeRedirect('/mypage/password?tab=1')).toBe('/mypage/password?tab=1')

    for (const bad of [
      '//evil.example',
      'http://evil.example',
      'https://evil.example/path',
      'javascript:alert(1)',
      '/\\evil.example',
      '',
      undefined,
      null,
      ['/mypage/password'],
    ]) {
      expect(safeRedirect(bad), String(bad)).toBe('/')
    }
  })
})
