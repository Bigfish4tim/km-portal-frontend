/**
 * 확인 창의 단위 테스트 — 명세 B-2a 5-1 의 ND-1.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import NoticeDialog from './NoticeDialog.vue'
import { showNotice } from './notice'

describe('NoticeDialog', () => {
  it('ND-1 \\n 이 둘 든 문구 → 줄 요소 3개 · 태그 글자는 글자 그대로 · [확인] 으로 닫히고 약속이 끝난다', async () => {
    const wrapper = mount(NoticeDialog)
    let closed = false

    const done = showNotice('첫 줄\n<b>둘째</b> 줄\n셋째 줄').then(() => {
      closed = true
    })
    await nextTick()

    const lines = wrapper.findAll('[data-testid="notice-line"]')
    expect(lines).toHaveLength(3)
    expect(lines.map((line) => line.text())).toEqual(['첫 줄', '<b>둘째</b> 줄', '셋째 줄'])
    // 🔴 <b> 가 요소가 되지 않았다
    expect(wrapper.find('[data-testid="notice"] b').exists()).toBe(false)
    expect(closed).toBe(false)

    await wrapper.get('[data-testid="notice-confirm"]').trigger('click')
    await done

    expect(closed).toBe(true)
    expect(wrapper.find('[data-testid="notice"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
