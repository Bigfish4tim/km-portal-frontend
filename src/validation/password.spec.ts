/**
 * 비밀번호 사전 검사의 단위 테스트 — 명세 B-2a 5-1 의 PV-1 ~ PV-9.
 *
 * 🔴 B-1 의 PV-1 ~ PV-7(옛 규칙 10~64자 · 3종)은 이 표로 바뀌었다(명세 B-2a 5-1 이 승인한 교체).
 * 🔴 문구는 일부러 모듈의 상수를 가져다 쓰지 않고 **글자로** 적는다 — 서버 문구(백엔드 PasswordPolicy.java:95-103 ·
 *    2e 구현보고 2-2)와 글자가 같은지를 지키는 테스트이기 때문이다. 상수를 쓰면 상수가 틀려도 통과한다.
 * 🔴 여기의 비밀번호는 전부 합성 값이다(P1 · P3).
 */
import { describe, expect, it } from 'vitest'

import { validatePassword, validatePasswordChange } from './password'

// 서버 문구(백엔드 util/PasswordPolicy.java:95-103) — 글자 그대로
const MSG = {
  REQUIRED: '비밀번호는 필수 입력 항목입니다.',
  LENGTH: '비밀번호는 8자 이상 20자 이하여야 합니다.',
  ILLEGAL_CHARACTER: '비밀번호에는 영문, 숫자, 특수문자만 쓸 수 있습니다(공백, 한글 불가).',
  MISSING_CLASS: '영어, 숫자, 특수문자가 포함되어야 합니다.',
  REPEATED_CHARACTER: '같은 글자 반복은 안됩니다.',
  SEQUENTIAL_CHARACTER: '연속 숫자와 연속 문자는 사용할 수 없습니다.',
  SAME_AS_CURRENT: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
} as const

/** 모든 규칙을 지키는 기준 값(8자 · 영문 · 숫자 · 특수 · 반복/연속 없음) — 백엔드 2e 보고 2-2 의 통과 예와 같은 꼴 */
const VALID = 'Kx7#qm2w'

describe('validatePassword', () => {
  it('PV-1 규칙 1~6 각각의 위반이 그 규칙으로 판정되고 문구가 서버와 글자까지 같다', () => {
    const cases: Array<[string, keyof typeof MSG]> = [
      ['', 'REQUIRED'], // 규칙 1
      ['Kx7#q', 'LENGTH'], // 규칙 2
      ['Kx7#qm 2w', 'ILLEGAL_CHARACTER'], // 규칙 3
      ['Kx7qm2wp', 'MISSING_CLASS'], // 규칙 4(특수문자 없음)
      ['Kx7#qqqw', 'REPEATED_CHARACTER'], // 규칙 5
      ['Kx7#abcw', 'SEQUENTIAL_CHARACTER'], // 규칙 6
    ]
    for (const [value, rule] of cases) {
      expect(validatePassword(value), `값: ${JSON.stringify(value)}`).toEqual({
        ok: false,
        rule,
        message: MSG[rule],
      })
    }
    expect(validatePassword(VALID)).toEqual({ ok: true })
  })

  it('PV-2 경계: 7자 실패 · 8자 통과 · 20자 통과 · 21자 실패', () => {
    const twenty = 'Kx7#qm2wKx7#qm2wKx7#'
    expect(twenty).toHaveLength(20)

    expect(validatePassword('Kx7#qm2')).toMatchObject({ ok: false, rule: 'LENGTH' })
    expect(validatePassword('Kx7#qm2w')).toEqual({ ok: true })
    expect(validatePassword(twenty)).toEqual({ ok: true })
    expect(validatePassword(`${twenty}q`)).toMatchObject({ ok: false, rule: 'LENGTH' })
  })

  it('PV-3 여러 규칙을 함께 어기면 앞의 것이 나온다', () => {
    // 짧고 한글 포함 → 길이(규칙 2)
    expect(validatePassword('Kx7한')).toMatchObject({ rule: 'LENGTH' })
    // 한글 포함이고 숫자 없음 → 글자 범위(규칙 3)
    expect(validatePassword('Kxq#한글mwp')).toMatchObject({ rule: 'ILLEGAL_CHARACTER' })
    // 숫자 없고 aaa 포함 → 구성(규칙 4)
    expect(validatePassword('Kxaaa#qmw')).toMatchObject({ rule: 'MISSING_CLASS' })
    // aaa(반복)와 abc(연속)를 함께 → 반복(규칙 5)
    expect(validatePassword('Kx7#aaabc')).toMatchObject({ rule: 'REPEATED_CHARACTER' })
  })

  it('PV-4 공백 · 탭 · 한글 · 전각 문자는 규칙 3 이고, ! 와 ~ 는 통과한다', () => {
    for (const value of ['Kx7# qm2w', 'Kx7#\tqm2w', 'Kx7#가m2w', 'Kx7#ｑm2w', 'Kx7#qm２w']) {
      expect(validatePassword(value), `값: ${JSON.stringify(value)}`).toMatchObject({
        ok: false,
        rule: 'ILLEGAL_CHARACTER',
      })
    }
    expect(validatePassword('Kx7!qm2w')).toEqual({ ok: true })
    expect(validatePassword('Kx7~qm2w')).toEqual({ ok: true })
  })

  it('PV-5 구성: 대문자는 필수가 아니고, 셋 중 하나라도 없으면 실패한다', () => {
    expect(validatePassword('kx7#qm2w')).toEqual({ ok: true }) // 소문자 + 숫자 + 특수
    expect(validatePassword('KX7#QM2W')).toEqual({ ok: true }) // 대문자 + 숫자 + 특수
    expect(validatePassword('Kx7Qm2wp')).toMatchObject({ rule: 'MISSING_CLASS' }) // 영문 + 숫자
    expect(validatePassword('Kx#Qm@wp')).toMatchObject({ rule: 'MISSING_CLASS' }) // 영문 + 특수
    expect(validatePassword('27#59@40')).toMatchObject({ rule: 'MISSING_CLASS' }) // 숫자 + 특수
  })

  it('PV-6 정의 표의 막히는 예 · 통과하는 예 전부(반복 6 · 연속 숫자 7 · 연속 문자 8)', () => {
    // 각 예를 "다른 규칙에 걸리지 않는 값" 안에 넣는다. 감싸는 글자끼리는 반복 · 연속이 생기지 않게 골랐다
    const inRepeat = (ex: string) => `Q#5${ex}w%8`
    const inDigits = (ex: string) => `Q#w${ex}x%`
    const inLetters = (ex: string) => `7#${ex}5%2`

    // 반복 — 막힘 3 · 통과 3
    for (const ex of ['aaa', '111', '!!!']) {
      expect(validatePassword(inRepeat(ex)), ex).toMatchObject({ rule: 'REPEATED_CHARACTER' })
    }
    for (const ex of ['aa', 'aAa', 'a1a1a1']) {
      expect(validatePassword(inRepeat(ex)), ex).toEqual({ ok: true })
    }

    // 연속 숫자 — 막힘 3 · 통과 4
    for (const ex of ['123', '987', '012']) {
      expect(validatePassword(inDigits(ex)), ex).toMatchObject({ rule: 'SEQUENTIAL_CHARACTER' })
    }
    for (const ex of ['135', '12a3', '890', '901']) {
      expect(validatePassword(inDigits(ex)), ex).toEqual({ ok: true })
    }

    // 연속 문자 — 막힘 4 · 통과 4
    for (const ex of ['abc', 'cba', 'aBc', 'xyz']) {
      expect(validatePassword(inLetters(ex)), ex).toMatchObject({ rule: 'SEQUENTIAL_CHARACTER' })
    }
    for (const ex of ['abd', 'ab1c', 'yza', 'qwe']) {
      expect(validatePassword(inLetters(ex)), ex).toEqual({ ok: true })
    }
  })

  it('PV-7 반복 · 연속이 맨 앞 · 가운데 · 맨 끝 어디에 있어도 걸린다', () => {
    for (const value of [
      'abc#Q5w%9',
      'Q5#abc%9w',
      'Q5#%9wabc',
      '321#Qw%x',
      'Qw#321%x',
      'Qw#%x321',
    ]) {
      expect(validatePassword(value), value).toMatchObject({ rule: 'SEQUENTIAL_CHARACTER' })
    }
    for (const value of ['aaa#Q5w%9', 'Q5#aaa%9w', 'Q5#%9waaa']) {
      expect(validatePassword(value), value).toMatchObject({ rule: 'REPEATED_CHARACTER' })
    }
  })

  it('PV-9 앞뒤 공백을 잘라 내지 않는다(공백이 든 값은 규칙 3 으로 실패한다)', () => {
    expect(validatePassword(` ${VALID}`)).toMatchObject({ rule: 'ILLEGAL_CHARACTER' })
    expect(validatePassword(`${VALID} `)).toMatchObject({ rule: 'ILLEGAL_CHARACTER' })
  })
})

describe('validatePasswordChange', () => {
  it('PV-8 현재와 같으면 규칙 7 · 규칙 1~6 이 먼저 · 아이디와 같은 값도 다른 규칙을 지키면 통과', () => {
    // 현재와 같다 → 규칙 7 의 문구(글자 그대로)
    expect(validatePasswordChange(VALID, VALID)).toEqual({
      ok: false,
      rule: 'SAME_AS_CURRENT',
      message: MSG.SAME_AS_CURRENT,
    })
    // 🔴 규칙 1~6 의 위반이 규칙 7 보다 먼저 나온다(같은 값이어도)
    expect(validatePasswordChange('Kx7#q', 'Kx7#q')).toMatchObject({ rule: 'LENGTH' })
    expect(validatePasswordChange('Kx7#qqqw', 'Kx7#qqqw')).toMatchObject({
      rule: 'REPEATED_CHARACTER',
    })
    // 다르고 규칙을 지키면 통과
    expect(validatePasswordChange(VALID, 'Pz4@wn8r')).toEqual({ ok: true })
    // 아이디처럼 보이는 값(합성 아이디 test_user7)도 다른 규칙을 지키면 통과 — 아이디 검사는 없다
    expect(validatePasswordChange(VALID, 'test_user7')).toEqual({ ok: true })
  })
})
