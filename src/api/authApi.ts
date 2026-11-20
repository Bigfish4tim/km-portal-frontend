/**
 * 인증 API 서비스 함수 — 화면 · 스토어는 이 함수들만 부른다(CLAUDE.md 5장 3번).
 *
 * 무엇을: 백엔드 `controller/AuthController.java` 의 여섯 경로를 함수 하나씩으로 감싼다.
 *   성공이면 봉투의 `data`(또는 성공 문구)를 돌려주고, 실패면 axios 의 오류를 그대로 던진다.
 *   문구는 만들지 않는다 — 화면이 `src/errors/` 의 함수로 얻는다.
 * 토큰 헤더: http.ts 가 주소를 보고 정한다(로그인 · 재발급 · 만료 변경에는 붙이지 않는다).
 *
 * 🔴 비밀번호는 받은 그대로 보낸다(trim 하지 않는다 · P12). 이 파일은 비밀번호를 어디에도 남기지 않는다.
 */
import { AUTH_URL, http } from './http'
import type { ApiEnvelope, AuthUser, LoginData, RefreshData } from './types/auth'

/**
 * 로그인 — `POST /api/auth/login` `{ username, password }`.
 * 근거: AuthController.java:130-219(성공 200 · data = LoginData) · 실패는 401 봉투(LoginFailureReason — 2e 보고 2-1)
 */
export async function login(username: string, password: string): Promise<LoginData> {
  const response = await http.post<ApiEnvelope<LoginData>>(AUTH_URL.LOGIN, { username, password })
  return response.data.data
}

/**
 * 재발급 — `POST /api/auth/refresh` `{ refreshToken }`. 새 refresh 토큰은 오지 않는다.
 * 근거: AuthController.java:340-405(성공 200 · data = RefreshData · 실패 401 GENERAL_ERROR)
 */
export async function refresh(refreshToken: string): Promise<RefreshData> {
  const response = await http.post<ApiEnvelope<RefreshData>>(AUTH_URL.REFRESH, { refreshToken })
  return response.data.data
}

/**
 * 내 정보 — `GET /api/auth/me`(토큰을 붙인다).
 * 근거: AuthController.java:414-475(성공 200 · data = buildUserResponse)
 */
export async function fetchMe(): Promise<AuthUser> {
  const response = await http.get<ApiEnvelope<AuthUser>>(AUTH_URL.ME)
  return response.data.data
}

/**
 * 만료 비밀번호 변경 — `POST /api/auth/password/expired` `{ username, currentPassword, newPassword }`.
 * 로그인 없이 부른다(토큰을 붙이지 않는다). 성공해도 토큰을 주지 않는다 — 새 비밀번호로 다시 로그인한다.
 * 근거: AuthController.java:520-562(성공 200 · data null · 실패 401 은 로그인과 같은 대응 · 규칙 위반 400 ILLEGAL_ARGUMENT)
 *
 * @returns 서버의 성공 문구(화면이 확인 창에 그대로 보여 준다)
 */
export async function changeExpiredPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const response = await http.post<ApiEnvelope<null>>(AUTH_URL.EXPIRED_PASSWORD, {
    username,
    currentPassword,
    newPassword,
  })
  return response.data.message ?? ''
}

/**
 * 본인 비밀번호 변경 — `PUT /api/auth/password` `{ currentPassword, newPassword }`(토큰을 붙인다).
 * 근거: AuthController.java:578-596(성공 200 · data null) ·
 *   현재 비밀번호가 틀리면 🔴 400 ILLEGAL_ARGUMENT "…: 현재 비밀번호가 올바르지 않습니다."(service/AccountSecurityService.java:68 · :240 — 401 이 아니다)
 *
 * @returns 서버의 성공 문구
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const response = await http.put<ApiEnvelope<null>>(AUTH_URL.OWN_PASSWORD, {
    currentPassword,
    newPassword,
  })
  return response.data.message ?? ''
}

/**
 * 로그아웃 — `POST /api/auth/logout`(토큰이 있으면 붙인다).
 * 근거: AuthController.java:603-618. 🔴 서버는 토큰을 무효로 만들지 않는다(백엔드 미결 A3-49) — 화면이 토큰을 지운다.
 */
export async function logout(): Promise<void> {
  await http.post<ApiEnvelope<null>>(AUTH_URL.LOGOUT)
}
