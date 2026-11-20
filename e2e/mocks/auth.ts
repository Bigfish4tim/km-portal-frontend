/**
 * 모의 응답 — 인증 API 여섯 경로(명세 B-2a 5장).
 *
 * 🔴 모의 응답은 근거가 있어야 한다(CLAUDE.md 8장). 문구 · 코드는 **백엔드 코드에서 글자 그대로 옮겼다** —
 *    화면 코드(src/)의 상수를 가져다 쓰지 않는다(명세 B-2a 5장). 화면 상수가 틀리면 테스트가 잡게 하려는 것이다.
 * 🔴 토큰 · 아이디 · 이름 · 비밀번호는 전부 합성 값이다(P1 · P3).
 *
 * 근거(백엔드 · 2026-11-20 확인 · 줄 번호는 A'''-2e 보고 2-4 와 같은 판):
 *   봉투 키 ................ dto/common/ApiResponse.java:48-79 (success · message · data · errorCode · timestamp · failure)
 *   로그인 성공 data ........ controller/AuthController.java:211-216 · user 키 :631-663(buildUserResponse)
 *   로그인 실패 여섯 ........ dto/common/LoginFailureReason.java:50 · :56-59 · :62 · :65 · :71 · :74 · 채우기 :133-141
 *   재발급 성공 ............ AuthController.java:393-398 · 실패 :362-363(GENERAL_ERROR — ApiResponse.java:195-197)
 *   만료 변경 성공 .......... AuthController.java:561
 *   본인 변경 성공 .......... AuthController.java:595 · 토큰 없음/만료 401 은 엔트리 포인트(ApiResponse.unauthorized — ApiResponse.java:234-236)
 *   로그아웃 성공 .......... AuthController.java:611
 *   규칙 위반 400 ........... exception/GlobalExceptionHandler.java:414-417(접두사) + util/PasswordPolicy.java:95-104(문구)
 *   현재 비밀번호 틀림 400 .. service/AccountSecurityService.java:68 · :240
 *
 * 확인하지 못한 것: 봉투 `timestamp` 의 직렬화 형식 — 아래 값은 합성이고 화면은 읽지 않는다(미결 등록).
 */

/** Playwright 의 주소 무늬 — 개발 서버(3000)의 /api 아래 */
export const API = {
  LOGIN: '/api/auth/login',
  REFRESH: '/api/auth/refresh',
  ME: '/api/auth/me',
  EXPIRED_PASSWORD: '/api/auth/password/expired',
  OWN_PASSWORD: '/api/auth/password',
  LOGOUT: '/api/auth/logout',
} as const

/** 합성 값 */
export const FAKE = {
  USERNAME: 'test_user7',
  OTHER_USERNAME: 'test_user8',
  /** 새 규칙(8~20자 · 영문/숫자/특수 · 반복/연속 없음)을 지키는 합성 비밀번호 */
  PASSWORD: 'Kx7#qm2w',
  NEW_PASSWORD: 'Pz4@wn8r',
  ACCESS_1: 'fake-access-1',
  ACCESS_2: 'fake-access-2',
  REFRESH_1: 'fake-refresh-1',
  FULL_NAME: '테스트사용자',
  DEPARTMENT: '테스트부서',
  POSITION: '테스트직위',
  ROLE_DISPLAY: '테스트역할',
} as const

const TIMESTAMP = '2026-01-01T00:00:00'

/** 봉투 하나(ApiResponse) */
function envelope(
  success: boolean,
  message: string | null,
  data: unknown,
  errorCode: string | null,
) {
  return { success, message, data, errorCode, timestamp: TIMESTAMP, failure: !success }
}

/** buildUserResponse 의 키(AuthController.java:631-663) — 합성 사용자 */
export const FAKE_USER = {
  userId: 7,
  username: FAKE.USERNAME,
  email: 'test_user7@example.invalid',
  fullName: FAKE.FULL_NAME,
  department: FAKE.DEPARTMENT,
  position: FAKE.POSITION,
  phoneNumber: null,
  isActive: true,
  isLocked: false,
  lastLoginAt: TIMESTAMP,
  createdAt: TIMESTAMP,
  roles: [{ roleId: 1, roleName: 'ROLE_TEST', displayName: FAKE.ROLE_DISPLAY, priority: 1 }],
  primaryRole: 'ROLE_TEST',
  primaryRoleDisplayName: FAKE.ROLE_DISPLAY,
}

/** 모의 응답 하나 */
export interface MockReply {
  status: number
  body: unknown
}

// ---------------------------------------------------------------------------
// 성공
// ---------------------------------------------------------------------------

export const loginSuccess: MockReply = {
  status: 200,
  body: envelope(
    true,
    '로그인 성공',
    {
      accessToken: FAKE.ACCESS_1,
      refreshToken: FAKE.REFRESH_1,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: FAKE_USER,
    },
    null,
  ),
}

export function refreshSuccess(accessToken: string): MockReply {
  return {
    status: 200,
    body: envelope(
      true,
      '토큰 갱신 성공',
      { accessToken, tokenType: 'Bearer', expiresIn: 86400 },
      null,
    ),
  }
}

export const meSuccess: MockReply = { status: 200, body: envelope(true, null, FAKE_USER, null) }

export const expiredChangeSuccess: MockReply = {
  status: 200,
  body: envelope(true, '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.', null, null),
}

export const ownChangeSuccess: MockReply = {
  status: 200,
  body: envelope(true, '비밀번호가 변경되었습니다.', null, null),
}

export const logoutSuccess: MockReply = {
  status: 200,
  body: envelope(true, '로그아웃 되었습니다.', null, null),
}

// ---------------------------------------------------------------------------
// 로그인 · 만료 변경의 401(LoginFailureReason)
// ---------------------------------------------------------------------------

export const userNotFound: MockReply = {
  status: 401,
  body: envelope(false, '해당하는 아이디가 없습니다.', null, 'USER_NOT_FOUND'),
}

/** 틀린 비밀번호 — 서버가 String.format(틀, 5, n) 으로 채운 세 줄(LoginFailureReason.java:56-59 · :140) */
export function invalidCredentials(failedAttempts: number): MockReply {
  return {
    status: 401,
    body: envelope(
      false,
      '비밀번호가 일치하지 않습니다.\n' +
        `비밀번호가 5회연속 틀리면 로그인 계정이 잠깁니다.(${failedAttempts}번 오류)\n` +
        '비밀번호는 대소문자를 구분합니다. 확인 하시고 다시 시도해 주세요.',
      { failedAttempts, lockThreshold: 5 },
      'INVALID_CREDENTIALS',
    ),
  }
}

export const accountDisabled: MockReply = {
  status: 401,
  body: envelope(false, '비활성화된 계정입니다. 관리자에게 문의하세요.', null, 'ACCOUNT_DISABLED'),
}

export const accountLocked: MockReply = {
  status: 401,
  body: envelope(false, '잠긴 계정입니다. 관리자에게 문의하세요.', null, 'ACCOUNT_LOCKED'),
}

export const passwordExpired: MockReply = {
  status: 401,
  body: envelope(
    false,
    '비밀번호가 만료되었습니다. 재설정이 필요합니다.',
    null,
    'PASSWORD_EXPIRED',
  ),
}

/**
 * 🔴 계약에 없는 응답 — 만료 문구에 다른 errorCode. "문구로 분기하지 않는다" 를 고정하려는 시험용(LG-5 둘째 절).
 */
export const expiredMessageWithOtherCode: MockReply = {
  status: 401,
  body: envelope(
    false,
    '비밀번호가 만료되었습니다. 재설정이 필요합니다.',
    { failedAttempts: 1, lockThreshold: 5 },
    'INVALID_CREDENTIALS',
  ),
}

// ---------------------------------------------------------------------------
// 그 밖의 실패
// ---------------------------------------------------------------------------

/** 규칙 위반 등 IllegalArgumentException → 400 · 접두사(GlobalExceptionHandler.java:414-417) */
export function illegalArgument(message: string): MockReply {
  return {
    status: 400,
    body: envelope(false, `잘못된 요청 매개변수입니다: ${message}`, null, 'ILLEGAL_ARGUMENT'),
  }
}

/** 규칙 8 의 문구(PasswordPolicy.java:104-105 MSG_REUSED) */
export const REUSED_MESSAGE = '이미 사용한 비밀번호는 12개월 내에 다시 사용할 수 없습니다.'

/** 본인 변경의 현재 비밀번호 틀림(AccountSecurityService.java:68) */
export const WRONG_CURRENT_MESSAGE = '현재 비밀번호가 올바르지 않습니다.'

/** 재발급 실패(AuthController.java:362-363) */
export const refreshFailure: MockReply = {
  status: 401,
  body: envelope(false, '만료되었거나 유효하지 않은 리프레시 토큰입니다.', null, 'GENERAL_ERROR'),
}

/** 보호 경로의 토큰 만료 · 없음 → 엔트리 포인트 401(ApiResponse.unauthorized — ApiResponse.java:234-236) */
export const entryPointUnauthorized: MockReply = {
  status: 401,
  body: envelope(false, '인증이 필요합니다.', null, 'UNAUTHORIZED'),
}
