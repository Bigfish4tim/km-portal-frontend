/**
 * 비밀번호 사전 검사 — 서버(백엔드 `util/PasswordPolicy.java`)와 같은 규칙 · 같은 순서 · 같은 문구.
 *
 * 무엇을: 사용자가 친 비밀번호가 규칙 1~6(새 비밀번호를 바꿀 때는 7 까지)을 지키는지 보고,
 *   어기면 **순서가 앞선 위반 하나**를 돌려준다(서버도 앞의 것 하나만 준다).
 * 왜 있나: 서버에 보내기 전에 안내하려고. 🔴 **최종 판정은 서버다**(CLAUDE.md 6-2).
 *   여기를 통과해도 서버가 400 을 주면 화면은 서버 문구를 보여 준다. 규칙 8(12개월 재사용)은 서버만 안다.
 *
 * 근거(백엔드 · 2026-11-20 확인 · A'''-2e 커밋 기준):
 *   상수 PasswordPolicy.java:70(MIN_LENGTH 8) · :73(MAX_LENGTH 20) · :76(REPEAT_RUN_LENGTH 3) · :79(SEQUENCE_RUN_LENGTH 3)
 *   순서 :120-160(findViolation — 규칙 1~6) · :191-197(validateChange — 규칙 7)
 *   반복 판정 :221(hasRepeatedRun) · 연속 판정 :239(hasSequentialRun) · :261(sequenceStep)
 *   정의와 예: 백엔드 docs/조사/2026-11-19_A3-2e_인증레거시정합_구현보고.md 2-2
 *
 * 🔴 명세 B-2a 4-4: B-1 의 모듈(옛 규칙 10~64자 · 3종 · 아이디 검사)을 고쳐 쓰지 않고 새로 썼다.
 *   아이디 검사는 없다(새 규칙은 아이디와 같은 비밀번호를 검사하지 않는다 — 2e 보고 2-2).
 * 🔴 입력값을 trim 하거나 바꾸지 않는다(P12). 친 그대로 검사한다.
 */

/** 최소 길이 — PasswordPolicy.java:70 */
export const PASSWORD_MIN_LENGTH = 8

/** 최대 길이 — PasswordPolicy.java:73 */
export const PASSWORD_MAX_LENGTH = 20

/**
 * 반복 · 연속의 기준 — 같은 글자가 이만큼 이어지거나, 연속 숫자 · 문자가 이만큼 이어지면 위반이다.
 *
 * 서버에는 두 상수가 있다 — PasswordPolicy.java:76(REPEAT_RUN_LENGTH) · :79(SEQUENCE_RUN_LENGTH). 지금 둘 다 3 이다.
 * 명세 B-2a 4-4 가 "연속/반복 기준 3 — 한 곳" 이라 하여 여기서는 하나로 둔다(안내문의 "{RUN}글자" 도 이 값 하나다).
 * 서버의 두 값이 달라지는 날에는 여기를 둘로 나눈다.
 */
export const PASSWORD_RUN_LENGTH = 3

/** 위반 종류 — 서버 규칙의 순서대로(1~7). 규칙 8(재사용)은 서버만 알아서 여기 없다 */
export type PasswordRuleId =
  | 'REQUIRED' // 규칙 1
  | 'LENGTH' // 규칙 2
  | 'ILLEGAL_CHARACTER' // 규칙 3
  | 'MISSING_CLASS' // 규칙 4
  | 'REPEATED_CHARACTER' // 규칙 5
  | 'SEQUENTIAL_CHARACTER' // 규칙 6
  | 'SAME_AS_CURRENT' // 규칙 7(바꿀 때만)

/**
 * 위반 문구 — 🔴 서버 문구와 글자가 같아야 한다(띄어쓰기 · 문장부호까지).
 *
 * 서버의 위반은 400 의 `message` 로 오고 화면은 그것을 그대로 보여 준다.
 * 사전 검사가 다른 글자를 보여 주면 같은 위반에 문구가 둘이 된다.
 */
export const PASSWORD_MESSAGES: Readonly<Record<PasswordRuleId, string>> = {
  // PasswordPolicy.java:95 MSG_REQUIRED
  REQUIRED: '비밀번호는 필수 입력 항목입니다.',
  // PasswordPolicy.java:96-97 MSG_LENGTH — 서버도 상수에서 조립한다
  LENGTH: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`,
  // PasswordPolicy.java:98-99 MSG_ILLEGAL_CHARACTER
  ILLEGAL_CHARACTER: '비밀번호에는 영문, 숫자, 특수문자만 쓸 수 있습니다(공백, 한글 불가).',
  // PasswordPolicy.java:100 MSG_MISSING_CLASS
  MISSING_CLASS: '영어, 숫자, 특수문자가 포함되어야 합니다.',
  // PasswordPolicy.java:101 MSG_REPEATED_CHARACTER
  REPEATED_CHARACTER: '같은 글자 반복은 안됩니다.',
  // PasswordPolicy.java:102 MSG_SEQUENTIAL_CHARACTER
  SEQUENTIAL_CHARACTER: '연속 숫자와 연속 문자는 사용할 수 없습니다.',
  // PasswordPolicy.java:103 MSG_SAME_AS_CURRENT
  SAME_AS_CURRENT: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
}

/**
 * 검사 결과.
 *
 * TypeScript 관용: `{ ok: true } | { ok: false; ... }` 처럼 `ok` 로 갈리는 두 모양을 "구별 합집합" 이라 한다.
 * `if (!result.ok)` 안에서는 `rule` · `message` 가 있다고 TypeScript 가 안다.
 */
export type PasswordCheckResult =
  { ok: true } | { ok: false; rule: PasswordRuleId; message: string }

/** 위반 결과 하나를 만든다 — 종류와 문구가 늘 짝을 이루게 */
function violation(rule: PasswordRuleId): PasswordCheckResult {
  return { ok: false, rule, message: PASSWORD_MESSAGES[rule] }
}

// ------------------------------------------------------------------
// 글자 종류 — 서버의 isLetter · isDigit(PasswordPolicy.java:212 · :216)와 같다
// ------------------------------------------------------------------

/** 영문인가(A~Z · a~z). 한글 같은 다른 문자는 영문이 아니다 */
function isLetter(c: string): boolean {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
}

/** 숫자인가(0~9). 전각 숫자는 숫자가 아니다 */
function isDigit(c: string): boolean {
  return c >= '0' && c <= '9'
}

/** 허용 범위의 글자인가 — `!`(0x21) ~ `~`(0x7E). 공백(0x20) · 탭 · 한글 · 전각은 밖이다 */
function isAllowedCharacter(c: string): boolean {
  return c >= '!' && c <= '~'
}

// ------------------------------------------------------------------
// 규칙 5 · 6
// ------------------------------------------------------------------

/**
 * 규칙 5 — 같은 글자가 연달아 PASSWORD_RUN_LENGTH 번 이상 이어지는가.
 * 대소문자는 다른 글자다(`aAa` 는 통과). 맨 앞 · 가운데 · 맨 끝 어디서든 찾는다.
 */
function hasRepeatedRun(password: string): boolean {
  let run = 1
  for (let i = 1; i < password.length; i++) {
    run = password[i] === password[i - 1] ? run + 1 : 1
    if (run >= PASSWORD_RUN_LENGTH) {
      return true
    }
  }
  return false
}

/**
 * 두 글자가 같은 종류(숫자끼리 · 영문끼리)이고 바로 이웃이면 +1(오름) 또는 -1(내림), 아니면 0.
 *
 * 영문은 소문자로 바꿔 비교한다(`aBc` 도 연속). 차이가 정확히 ±1 인 것만 이웃이므로
 * `9 → 0` · `z → a` 같은 넘어감은 연속이 아니다. 숫자와 영문이 섞인 이어짐(`9 → a`)도 없다.
 * 자판 순서(`qwe`)는 보지 않는다.
 */
function sequenceStep(previous: string, current: string): number {
  let a: number
  let b: number
  if (isDigit(previous) && isDigit(current)) {
    a = previous.charCodeAt(0)
    b = current.charCodeAt(0)
  } else if (isLetter(previous) && isLetter(current)) {
    a = previous.toLowerCase().charCodeAt(0)
    b = current.toLowerCase().charCodeAt(0)
  } else {
    return 0
  }
  const diff = b - a
  return diff === 1 || diff === -1 ? diff : 0
}

/**
 * 규칙 6 — 연속 숫자 · 연속 문자가 PASSWORD_RUN_LENGTH 글자 이상 이어지는가(오름 · 내림 둘 다).
 * 방향이 바뀌면(`121`) 새 연속이 두 글자로 시작된다 — 서버와 같은 셈법이다.
 */
function hasSequentialRun(password: string): boolean {
  let run = 1 // 지금 이어지고 있는 연속의 길이
  let direction = 0 // +1 오름 · -1 내림 · 0 아직 없음
  for (let i = 1; i < password.length; i++) {
    // `as string`: i 가 길이 안이므로 글자가 반드시 있다(인덱스 접근의 타입은 string 이다)
    const step = sequenceStep(password[i - 1] as string, password[i] as string)
    if (step !== 0 && step === direction) {
      run++ // 같은 방향으로 한 글자 더
    } else if (step !== 0) {
      run = 2 // 새 방향의 연속이 이 두 글자로 시작된다
      direction = step
    } else {
      run = 1
      direction = 0
    }
    if (run >= PASSWORD_RUN_LENGTH) {
      return true
    }
  }
  return false
}

// ------------------------------------------------------------------
// 공개 함수
// ------------------------------------------------------------------

/**
 * 규칙 1~6 을 순서대로 보고 첫 위반을 돌려준다.
 *
 * 순서(서버와 같다): 필수 → 길이 → 글자 범위 → 구성 → 반복 → 연속.
 * 길이는 JavaScript 문자열 길이(UTF-16 단위)로 잰다 — 서버(Java `String.length()`)도 같은 단위다.
 *
 * @param value 친 그대로의 비밀번호(🔴 trim 하지 않는다)
 */
export function validatePassword(value: string): PasswordCheckResult {
  // 규칙 1
  if (value.length === 0) {
    return violation('REQUIRED')
  }
  // 규칙 2
  if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
    return violation('LENGTH')
  }

  // 규칙 3 · 4 — 한 번 훑으며 글자 범위를 보고 종류를 센다
  let letter = false
  let digit = false
  let special = false
  for (const c of value) {
    if (!isAllowedCharacter(c)) {
      return violation('ILLEGAL_CHARACTER')
    }
    if (isLetter(c)) {
      letter = true
    } else if (isDigit(c)) {
      digit = true
    } else {
      special = true // 범위 안에서 영문 · 숫자가 아닌 전부
    }
  }
  if (!(letter && digit && special)) {
    return violation('MISSING_CLASS')
  }

  // 규칙 5 — 연속(규칙 6)보다 먼저 본다. 둘 다 어긴 값은 "반복" 문구를 받는다
  if (hasRepeatedRun(value)) {
    return violation('REPEATED_CHARACTER')
  }
  // 규칙 6
  if (hasSequentialRun(value)) {
    return violation('SEQUENTIAL_CHARACTER')
  }
  return { ok: true }
}

/**
 * 비밀번호를 "바꿀 때" 의 검사 — 규칙 1~6 다음에 규칙 7(지금 비밀번호와 다름).
 *
 * 서버는 규칙 7 을 해시 대조로 본다(PasswordPolicy.java:195). 화면은 같은 화면의 "현재 비밀번호" 칸과 글자를 비교한다.
 * 🔴 규칙 1~6 의 위반이 규칙 7 보다 먼저 나온다(서버의 validateChange 도 validate 를 먼저 부른다 — :193).
 *
 * @param current 현재 비밀번호 칸의 값(그대로)
 * @param next    새 비밀번호 칸의 값(그대로)
 */
export function validatePasswordChange(current: string, next: string): PasswordCheckResult {
  const basic = validatePassword(next)
  if (!basic.ok) {
    return basic
  }
  // 규칙 7
  if (next === current) {
    return violation('SAME_AS_CURRENT')
  }
  return { ok: true }
}
