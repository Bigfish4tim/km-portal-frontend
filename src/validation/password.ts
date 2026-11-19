/**
 * 비밀번호 사전 검사 — 서버에 보내기 전에 화면이 먼저 알려 주는 안내용 검사.
 *
 * 무엇을: 비밀번호가 규칙을 어기면 "어긴 첫 규칙 하나" 의 식별자와 안내 문구를 돌려준다.
 * 왜 있는가: 사용자가 서버에 보내 보기 전에 무엇이 틀렸는지 알 수 있게 한다.
 *
 * 🔴 최종 판정은 서버다. 이 검사를 통과해도 서버가 400 을 줄 수 있다(예: "지금 비밀번호와 같다" 는 서버만 안다).
 * 🔴 규칙 · 순서 · 문구의 정본은 백엔드 `util/PasswordPolicy.java` 다. 그 파일이 바뀌면 이 파일도 바꾼다.
 *    문구를 글자까지 같게 두는 이유: 같은 규칙이 화면과 서버에서 다른 말로 나오지 않게 하려는 것이다.
 * 🔴 입력을 trim 하지 않는다(P12). 친 그대로 검사한다 — 공백이 있으면 "쓸 수 없는 글자" 다.
 *
 * 근거(백엔드): src/main/java/com/kmportal/backend/util/PasswordPolicy.java:76-116(findViolation)
 */

/** 최소 길이 — PasswordPolicy.java:44 */
export const PASSWORD_MIN_LENGTH = 10
/** 최대 길이 — PasswordPolicy.java:47 */
export const PASSWORD_MAX_LENGTH = 64
/** 네 종류(대문자 · 소문자 · 숫자 · 특수문자) 중 최소 몇 종류 — PasswordPolicy.java:50 */
export const PASSWORD_MIN_CHARACTER_CLASSES = 3

/** 쓸 수 있는 글자의 범위: '!'(0x21) ~ '~'(0x7E). 공백(0x20)은 범위 밖이다 — PasswordPolicy.java:93-94 */
const FIRST_ALLOWED_CODE = 0x21
const LAST_ALLOWED_CODE = 0x7e

/**
 * 규칙의 식별자. 화면이 분기할 때는 문구가 아니라 이 값을 쓴다.
 * (`'A' | 'B'` 꼴은 TypeScript 의 유니언 타입 — 이 값들 가운데 하나만 올 수 있다는 뜻이다.)
 */
export type PasswordRuleId =
  | 'REQUIRED'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'ILLEGAL_CHARACTER'
  | 'TOO_FEW_CLASSES'
  | 'SAME_AS_USERNAME'

/**
 * 안내 문구 — 서버의 위반 문구와 글자까지 같다.
 * (`Record<K, V>` 는 "K 의 모든 값을 키로 갖는 객체" 타입이다. 규칙이 늘면 문구를 빠뜨릴 수 없다.)
 */
export const PASSWORD_MESSAGES: Record<PasswordRuleId, string> = {
  // PasswordPolicy.java:52
  REQUIRED: '비밀번호는 필수 입력 항목입니다.',
  // PasswordPolicy.java:53
  TOO_SHORT: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
  // PasswordPolicy.java:54
  TOO_LONG: `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`,
  // PasswordPolicy.java:55-56
  ILLEGAL_CHARACTER: '비밀번호에는 영문, 숫자, 특수문자만 쓸 수 있습니다(공백, 한글 불가).',
  // PasswordPolicy.java:57-58
  TOO_FEW_CLASSES: `영문 대문자, 영문 소문자, 숫자, 특수문자 중 ${PASSWORD_MIN_CHARACTER_CLASSES}종 이상을 써야 합니다.`,
  // PasswordPolicy.java:59
  SAME_AS_USERNAME: '비밀번호는 아이디와 같을 수 없습니다.',
}

/** 검사 결과: 통과이거나, 어긴 첫 규칙 하나(식별자 + 문구)다. */
export type PasswordCheckResult =
  { ok: true } | { ok: false; rule: PasswordRuleId; message: string }

/** 위반 결과를 만드는 작은 도우미 — 식별자와 문구가 어긋나지 않게 한 곳에서 짝짓는다. */
function violation(rule: PasswordRuleId): PasswordCheckResult {
  return { ok: false, rule, message: PASSWORD_MESSAGES[rule] }
}

/**
 * 쓸 수 없는 글자가 하나라도 있는가 — PasswordPolicy.java:91-96
 * 공백 · 탭 · 한글 · 전각 문자 · 이모지는 모두 0x21~0x7E 밖이다.
 */
function hasIllegalCharacter(password: string): boolean {
  for (let i = 0; i < password.length; i++) {
    // charCodeAt: 그 자리 글자의 코드(UTF-16 단위). 서버(Java 의 charAt)와 같은 단위다.
    const code = password.charCodeAt(i)
    if (code < FIRST_ALLOWED_CODE || code > LAST_ALLOWED_CODE) {
      return true
    }
  }
  return false
}

/**
 * 네 종류(대문자 · 소문자 · 숫자 · 특수문자) 가운데 몇 종류를 썼는가 — PasswordPolicy.java:97-107
 * 🔴 특수문자 = 영문 · 숫자가 아닌 **나머지 전부**다. 목록을 따로 적지 않는다(적으면 서버와 어긋난다).
 * 이 함수는 글자 범위 검사를 지난 값(전부 0x21~0x7E)에만 쓴다.
 */
function countCharacterClasses(password: string): number {
  let upper = false
  let lower = false
  let digit = false
  let special = false
  for (const ch of password) {
    if (ch >= 'A' && ch <= 'Z') {
      upper = true
    } else if (ch >= 'a' && ch <= 'z') {
      lower = true
    } else if (ch >= '0' && ch <= '9') {
      digit = true
    } else {
      special = true
    }
  }
  // Number(true) 는 1, Number(false) 는 0 이다
  return Number(upper) + Number(lower) + Number(digit) + Number(special)
}

/**
 * 비밀번호를 사전 검사한다.
 *
 * 검사 순서는 서버와 같고 고정이다(PasswordPolicy.java:69-70):
 *   비어 있음 → 10자 미만 → 64자 초과 → 쓸 수 없는 글자 → 3종 미만 → 아이디와 같음
 * 여러 규칙을 함께 어기면 **앞의 것 하나만** 돌려준다.
 *
 * "지금 비밀번호와 달라야 한다" 는 여기서 보지 않는다 — 지금 비밀번호는 서버만 안다.
 *
 * @param password 사용자가 친 그대로의 비밀번호(자르거나 바꾸지 않는다)
 * @param username 그 계정의 아이디. 주지 않으면 아이디 비교를 건너뛴다(`?` 는 생략할 수 있는 인자라는 뜻이다)
 */
export function checkPassword(password: string, username?: string): PasswordCheckResult {
  // 1) 비어 있음 — PasswordPolicy.java:77-79
  if (password.length === 0) {
    return violation('REQUIRED')
  }
  // 2) 10자 미만 — :80-82
  if (password.length < PASSWORD_MIN_LENGTH) {
    return violation('TOO_SHORT')
  }
  // 3) 64자 초과 — :83-85
  if (password.length > PASSWORD_MAX_LENGTH) {
    return violation('TOO_LONG')
  }
  // 4) 쓸 수 없는 글자 — :91-96
  if (hasIllegalCharacter(password)) {
    return violation('ILLEGAL_CHARACTER')
  }
  // 5) 3종 미만 — :107-110
  if (countCharacterClasses(password) < PASSWORD_MIN_CHARACTER_CLASSES) {
    return violation('TOO_FEW_CLASSES')
  }
  // 6) 아이디와 같음(대소문자 무시) — :112-114
  //    서버는 Java 의 equalsIgnoreCase 를 쓴다. 여기까지 온 비밀번호는 전부 ASCII 이므로
  //    소문자로 바꿔 비교하면 같은 결과다.
  if (username !== undefined && password.toLowerCase() === username.toLowerCase()) {
    return violation('SAME_AS_USERNAME')
  }
  return { ok: true }
}
