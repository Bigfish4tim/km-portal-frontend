/**
 * 비밀번호 사전 검사(password.ts)의 단위 테스트 — 명세 B-1 단계 4 의 PV-1 ~ PV-7.
 *
 * 🔴 여기의 비밀번호 값은 전부 한눈에 가짜인 합성 값이다(P3). 실제 계정의 값을 넣지 않는다.
 * 🔴 기대 문구는 백엔드 util/PasswordPolicy.java:52-59 의 문구를 글자 그대로 적은 것이다.
 *    구현의 상수를 가져다 비교하지 않는다 — 그러면 구현이 틀려도 테스트가 함께 틀려 통과한다.
 */
import { describe, expect, it } from 'vitest'

import { checkPassword } from './password'

/** 규칙을 모두 만족하는 합성 값(14자 · 대문자 · 소문자 · 숫자 · 특수문자) */
const VALID = 'Fake-Pass-0000'

/** 위반 결과에서 규칙 식별자만 꺼낸다. 통과면 'OK' 다. */
function ruleOf(password: string, username?: string): string {
  const result = checkPassword(password, username)
  return result.ok ? 'OK' : result.rule
}

describe('checkPassword — 비밀번호 사전 검사', () => {
  // it.each: 표의 한 줄마다 같은 테스트를 한 번씩 돌린다
  it.each([
    {
      password: '',
      username: undefined,
      rule: 'REQUIRED',
      message: '비밀번호는 필수 입력 항목입니다.',
    },
    {
      password: 'Fa-00',
      username: undefined,
      rule: 'TOO_SHORT',
      message: '비밀번호는 10자 이상이어야 합니다.',
    },
    {
      password: 'Fake-0' + 'x'.repeat(70),
      username: undefined,
      rule: 'TOO_LONG',
      message: '비밀번호는 64자 이하여야 합니다.',
    },
    {
      password: 'Fake-가짜-000000',
      username: undefined,
      rule: 'ILLEGAL_CHARACTER',
      message: '비밀번호에는 영문, 숫자, 특수문자만 쓸 수 있습니다(공백, 한글 불가).',
    },
    {
      password: 'fakefakefakefake',
      username: undefined,
      rule: 'TOO_FEW_CLASSES',
      message: '영문 대문자, 영문 소문자, 숫자, 특수문자 중 3종 이상을 써야 합니다.',
    },
    {
      password: 'Fake_User_0000',
      username: 'Fake_User_0000',
      rule: 'SAME_AS_USERNAME',
      message: '비밀번호는 아이디와 같을 수 없습니다.',
    },
  ])(
    'PV-1 규칙 $rule 의 위반이 그 규칙과 서버 문구로 판정된다',
    ({ password, username, rule, message }) => {
      expect(checkPassword(password, username)).toEqual({ ok: false, rule, message })
    },
  )

  it('PV-1 규칙을 모두 만족하면 통과다', () => {
    expect(checkPassword(VALID)).toEqual({ ok: true })
  })

  it('PV-2 길이 경계: 9자 실패 · 10자 통과 · 64자 통과 · 65자 실패', () => {
    // 'Fa-0' 4자 + 채움 글자로 길이를 맞춘다(대 · 소 · 숫자 · 특수 4종이라 길이만 판정에 걸린다)
    const ofLength = (length: number) => 'Fa-0' + 'x'.repeat(length - 4)

    expect(ofLength(9)).toHaveLength(9)
    expect(ruleOf(ofLength(9))).toBe('TOO_SHORT')
    expect(ruleOf(ofLength(10))).toBe('OK')
    expect(ruleOf(ofLength(64))).toBe('OK')
    expect(ofLength(65)).toHaveLength(65)
    expect(ruleOf(ofLength(65))).toBe('TOO_LONG')
  })

  it('PV-3 여러 규칙을 함께 어기면 앞의 것 하나가 나온다', () => {
    // 짧다 + 한글 → 길이(글자 검사보다 앞)
    expect(ruleOf('가짜0a')).toBe('TOO_SHORT')
    // 길다 + 한글 → 길이
    expect(ruleOf('가짜' + 'x'.repeat(70))).toBe('TOO_LONG')
    // 한글 + 2종뿐 → 글자(구성 검사보다 앞)
    expect(ruleOf('fakefake가짜fake')).toBe('ILLEGAL_CHARACTER')
    // 2종뿐 + 아이디와 같다 → 구성(아이디 검사보다 앞)
    expect(ruleOf('fakefake0000', 'fakefake0000')).toBe('TOO_FEW_CLASSES')
  })

  it.each([
    { name: '공백(0x20)', ch: ' ' },
    { name: '탭', ch: '\t' },
    { name: '줄바꿈', ch: '\n' },
    { name: '한글', ch: '가' },
    { name: '전각 영문', ch: 'Ａ' },
    { name: 'DEL(0x7F)', ch: '\u007f' },
  ])('PV-4 $name 은 쓸 수 없는 글자로 판정된다', ({ ch }) => {
    expect(ruleOf('Fake-Pass' + ch + '0000')).toBe('ILLEGAL_CHARACTER')
  })

  it('PV-4 범위의 양 끝 글자 0x21(!) 과 0x7E(~) 는 통과한다', () => {
    expect(ruleOf('Fake0000' + '!' + '~')).toBe('OK')
  })

  it('PV-5 대 · 소 · 숫자 3종(특수 없음)은 통과하고 2종만이면 실패한다', () => {
    expect(ruleOf('FakePass0000')).toBe('OK')
    expect(ruleOf('fakepass0000')).toBe('TOO_FEW_CLASSES') // 소 · 숫자
    expect(ruleOf('FAKEPASSfake')).toBe('TOO_FEW_CLASSES') // 대 · 소
    expect(ruleOf('FAKE----FAKE')).toBe('TOO_FEW_CLASSES') // 대 · 특수
  })

  it('PV-5 영숫자가 아닌 ASCII 기호는 어느 것이든 특수문자로 세어진다', () => {
    // 0x21~0x7E 에서 영문 · 숫자를 뺀 전부를 하나씩 넣어 본다
    const symbols: string[] = []
    for (let code = 0x21; code <= 0x7e; code++) {
      const ch = String.fromCharCode(code)
      if (!/[A-Za-z0-9]/.test(ch)) {
        symbols.push(ch)
      }
    }
    expect(symbols).toHaveLength(32)

    for (const symbol of symbols) {
      // 소문자 + 숫자(2종)에 기호 하나를 더하면 3종이 되어 통과해야 한다
      expect(ruleOf('fakefake000' + symbol), `기호 ${symbol}`).toBe('OK')
    }
  })

  it('PV-6 아이디와 대소문자만 다른 비밀번호는 실패한다', () => {
    expect(ruleOf('fake_user_0000A', 'FAKE_USER_0000a')).toBe('SAME_AS_USERNAME')
  })

  it('PV-6 아이디를 주지 않으면 아이디 규칙을 건너뛰고, 아이디와 다르면 통과한다', () => {
    expect(ruleOf('Fake_User_0000')).toBe('OK')
    expect(ruleOf('Fake_User_0000', 'other_fake_user')).toBe('OK')
  })

  it('PV-7 앞뒤 공백을 잘라 내지 않는다 — 공백이 든 값은 통과하지 못한다', () => {
    // 잘라 냈다면 통과했을 값들이다
    expect(ruleOf(' ' + VALID)).toBe('ILLEGAL_CHARACTER')
    expect(ruleOf(VALID + ' ')).toBe('ILLEGAL_CHARACTER')
    // 잘라 냈다면 9자(길이 위반)가 됐을 값 — 자르지 않으므로 10자이고 공백 때문에 걸린다
    expect(ruleOf('Fake-000x ')).toBe('ILLEGAL_CHARACTER')
  })
})
