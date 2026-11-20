/**
 * 인증 API 의 응답 모양 — 백엔드 코드를 읽고 적었다(CLAUDE.md 5장 4번 · 6-1).
 *
 * 🔴 계약의 정본은 백엔드 코드다. 여기와 다르면 코드를 따르고 이 파일을 고친다.
 * 확인 날짜: 2026-11-20(백엔드 A'''-2e 커밋 기준 작업 폴더).
 */

/**
 * 응답 봉투 — 인증 API 의 성공 · 실패가 이 모양이다.
 *
 * 근거: dto/common/ApiResponse.java:48-79(필드 success · message · data · errorCode · timestamp)
 * - `timestamp` 는 형식을 확인하지 못해 `unknown` 으로 두고 읽지 않는다(명세 B-2a 3-1).
 * - 백엔드 봉투에는 `failure` 키도 있지만(2e 보고 2-1 의 "6키") 타입에 넣지 않는다 — 의존하지 않는다(CLAUDE.md 6-2).
 *
 * TypeScript 관용: `<T>` 는 "data 의 모양을 쓰는 쪽이 정한다" 는 뜻의 타입 매개변수다.
 */
export interface ApiEnvelope<T> {
  success: boolean
  message: string | null
  data: T
  errorCode: string | null
  timestamp: unknown
}

/**
 * 사용자의 역할 하나.
 * 근거: controller/AuthController.java:649-652(buildUserResponse 의 roleMap) · entity/Role.java(role_name · display_name · priority 는 NOT NULL)
 */
export interface AuthRole {
  roleId: number
  roleName: string
  displayName: string
  priority: number
}

/**
 * 로그인한 사용자 — 로그인 응답의 `user` · `GET /api/auth/me` 의 `data` 가 같은 모양이다.
 *
 * 근거: controller/AuthController.java:631-663(buildUserResponse)
 *   null 가능 여부는 entity/User.java 의 열 정의로 판단했다(email · fullName 은 NOT NULL · department · position · phoneNumber 는 null 가능).
 *   primaryRole · primaryRoleDisplayName 은 역할이 하나 이상일 때만 실린다(:661-664).
 * 🔴 메모리(스토어)에만 둔다(P6). 이메일 · 전화는 화면에 보여 주지 않는다(명세 B-2a 4-6 ③).
 */
export interface AuthUser {
  userId: number
  username: string
  email: string
  fullName: string
  department: string | null
  position: string | null
  phoneNumber: string | null
  isActive: boolean
  isLocked: boolean
  lastLoginAt: string | null
  createdAt: string
  roles: AuthRole[]
  primaryRole?: string
  primaryRoleDisplayName?: string
}

/**
 * 로그인 성공의 `data`.
 * 근거: controller/AuthController.java:211-216(accessToken · refreshToken · tokenType · expiresIn · user)
 */
export interface LoginData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

/**
 * 재발급 성공의 `data` — 🔴 새 refresh 토큰은 오지 않는다.
 * 근거: controller/AuthController.java:393-396
 */
export interface RefreshData {
  accessToken: string
  tokenType: string
  expiresIn: number
}

/**
 * 틀린 비밀번호(`INVALID_CREDENTIALS`)의 `data`.
 * 근거: dto/common/LoginFailureReason.java:133-141(toFailure(int, int))
 * 🔴 화면 표시에 쓰지 않는다 — 문구에 이미 들어 있다(명세 B-2a 3-2).
 */
export interface InvalidCredentialsData {
  failedAttempts: number
  lockThreshold: number
}

/**
 * 로그인 · 만료 변경의 401 에 실리는 `errorCode`.
 * 근거: dto/common/LoginFailureReason.java:50 · :56 · :62 · :65 · :71 · :74
 *
 * 🔴 화면은 이 코드로만 분기한다. 문구를 비교하지 않는다(CLAUDE.md 6-2).
 * 문구는 여기에 적지 않는다 — 서버가 완성해서 주고 화면은 그대로 보여 준다.
 */
export const LOGIN_FAILURE_CODE = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
} as const

/**
 * 규칙 위반 등 업무 규칙 400 의 `errorCode`.
 * 근거: exception/GlobalExceptionHandler.java:414-417(IllegalArgumentException → 400 · "잘못된 요청 매개변수입니다: " 접두사)
 */
export const ILLEGAL_ARGUMENT_CODE = 'ILLEGAL_ARGUMENT'
