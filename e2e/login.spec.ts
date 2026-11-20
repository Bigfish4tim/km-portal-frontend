/**
 * 화면 흐름 테스트 — 로그인 화면(명세 B-2a 5-2 의 LG-1 ~ LG-8 · ID-1 ~ ID-3 · SEC-1 · SEC-2).
 *
 * 상대는 모의 응답이다(e2e/mocks/auth.ts — 문구 · 코드는 백엔드 코드에서 옮겼다). 백엔드 없이 돈다.
 * 🔴 아이디 · 비밀번호 · 이름 · 토큰은 합성 값이다.
 */
import { expect, test } from '@playwright/test'

import {
  API,
  FAKE,
  accountDisabled,
  accountLocked,
  expiredMessageWithOtherCode,
  invalidCredentials,
  loginSuccess,
  logoutSuccess,
  passwordExpired,
  userNotFound,
} from './mocks/auth'
import { devProxyBackendDown } from './mocks/devProxy'
import { appSessionEntries, readLocalStorage, readSessionStorage } from './support/browserState'
import { FakeBackend } from './support/fakeBackend'
import {
  USER_LABEL,
  closeNotice,
  expectNotice,
  loginForm,
  notice,
  submitLogin,
} from './support/steps'

/** 화면 문구(src/errors/text.ts) — 기대값은 글자로 적는다 */
const SCREEN = {
  REQUIRED_ID: '아이디를 입력하여 주세요.',
  REQUIRED_PASSWORD: '비밀번호를 입력하여 주세요.',
  TEMP_PASSWORD_NOT_READY: '임시비밀번호 발급은 준비 중입니다. 관리자에게 문의하세요.',
  SERVER_UNREACHABLE: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

test.describe('로그인', () => {
  let backend: FakeBackend

  test.beforeEach(async ({ context }) => {
    backend = new FakeBackend()
    backend.on('POST', API.LOGOUT, logoutSuccess)
    await backend.install(context)
  })

  test('LG-1 로그인 성공 → / 에 이름[부서, 직위] · 로그인 요청에 Authorization 이 없고 본문은 두 키뿐', async ({
    page,
  }) => {
    backend.on('POST', API.LOGIN, loginSuccess)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)

    await submitLogin(page)

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
    await expect(page.getByTestId('home-roles')).toHaveText(FAKE.ROLE_DISPLAY)

    const [request] = backend.requests('POST', API.LOGIN)
    expect(request?.authorization).toBeUndefined()
    expect(request?.body).toEqual({ username: FAKE.USERNAME, password: FAKE.PASSWORD })
  })

  test('LG-2 틀린 비밀번호 → 세 줄이 세 줄로 · 둘째 줄에 "2번 오류" → [확인] 뒤 비밀번호 칸이 비고 초점', async ({
    page,
  }) => {
    backend.on('POST', API.LOGIN, invalidCredentials(2))
    await page.goto('/login')

    await submitLogin(page)

    const lines = notice(page).lines
    await expect(lines).toHaveCount(3)
    await expect(lines.nth(0)).toHaveText('비밀번호가 일치하지 않습니다.')
    await expect(lines.nth(1)).toContainText('(2번 오류)')
    await expect(lines.nth(2)).toHaveText(
      '비밀번호는 대소문자를 구분합니다. 확인 하시고 다시 시도해 주세요.',
    )

    await closeNotice(page)
    const form = loginForm(page)
    await expect(form.password).toHaveValue('')
    await expect(form.password).toBeFocused()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('LG-3 없는 아이디 → "해당하는 아이디가 없습니다."', async ({ page }) => {
    backend.on('POST', API.LOGIN, userNotFound)
    await page.goto('/login')

    await submitLogin(page)

    await expectNotice(page, '해당하는 아이디가 없습니다.')
  })

  test('LG-4 잠김 · 비활성 → 각 서버 문구', async ({ page }) => {
    backend.on('POST', API.LOGIN, (_request, nth) => (nth === 0 ? accountLocked : accountDisabled))
    await page.goto('/login')

    await submitLogin(page)
    await expectNotice(page, '잠긴 계정입니다. 관리자에게 문의하세요.')
    await closeNotice(page)

    await submitLogin(page)
    await expectNotice(page, '비활성화된 계정입니다. 관리자에게 문의하세요.')
  })

  test('LG-5 PASSWORD_EXPIRED → 확인 창 없이 변경 창 · 같은 문구에 다른 errorCode 면 가지 않는다', async ({
    page,
  }) => {
    backend.on('POST', API.LOGIN, (_request, nth) =>
      nth === 0 ? passwordExpired : expiredMessageWithOtherCode,
    )

    await page.goto('/login')
    await submitLogin(page)
    await expect(page).toHaveURL(/\/password\/expired$/)
    await expect(notice(page).box).toHaveCount(0)
    await expect(page.getByTestId('must-change')).toHaveText('비밀번호를 변경해야 사용 가능합니다.')

    // 둘째 절 — 🔴 문구로 분기하지 않는다
    await page.getByTestId('change-cancel').click()
    await expect(page).toHaveURL(/\/login$/)
    await submitLogin(page)
    await expectNotice(page, '비밀번호가 만료되었습니다. 재설정이 필요합니다.')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('LG-6 빈 칸으로 "로그인" → REQUIRED_* · 요청이 나가지 않는다', async ({ page }) => {
    await page.goto('/login')
    const form = loginForm(page)

    await form.username.fill('')
    await form.submit.click()
    await expectNotice(page, SCREEN.REQUIRED_ID)
    await closeNotice(page)
    await expect(form.username).toBeFocused()

    // 공백만 친 아이디도 빈 칸이다(아이디는 앞뒤 공백을 자른다)
    await form.username.fill('   ')
    await form.submit.click()
    await expectNotice(page, SCREEN.REQUIRED_ID)
    await closeNotice(page)

    await form.username.fill(FAKE.USERNAME)
    await form.submit.click()
    await expectNotice(page, SCREEN.REQUIRED_PASSWORD)
    await closeNotice(page)
    await expect(form.password).toBeFocused()

    expect(backend.requests('POST', API.LOGIN)).toHaveLength(0)
  })

  test('LG-7 서버 502 → SERVER_UNREACHABLE', async ({ page }) => {
    backend.on('POST', API.LOGIN, {
      status: devProxyBackendDown.status,
      body: devProxyBackendDown.body,
    })
    await page.goto('/login')

    await submitLogin(page)

    await expectNotice(page, SCREEN.SERVER_UNREACHABLE)
  })

  test('LG-8 [임시비밀번호발급] → TEMP_PASSWORD_NOT_READY · 요청이 나가지 않는다', async ({
    page,
  }) => {
    await page.goto('/login')
    const before = backend.sent.length

    await loginForm(page).tempPassword.click()

    await expectNotice(page, SCREEN.TEMP_PASSWORD_NOT_READY)
    expect(backend.sent.length).toBe(before)
  })
})

test.describe('아이디저장', () => {
  let backend: FakeBackend

  test.beforeEach(async ({ context }) => {
    backend = new FakeBackend()
    backend.on('POST', API.LOGIN, loginSuccess).on('POST', API.LOGOUT, logoutSuccess)
    await backend.install(context)
  })

  test('ID-1 처음엔 체크 → 로그인 → 로그아웃 → 아이디가 채워져 있고 초점은 비밀번호 칸', async ({
    page,
  }) => {
    await page.goto('/login')
    const form = loginForm(page)
    await expect(form.saveUsername).toBeChecked()
    await expect(form.username).toBeFocused()

    await submitLogin(page)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
    await page.getByTestId('logout').click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(form.username).toHaveValue(FAKE.USERNAME)
    await expect(form.saveUsername).toBeChecked()
    await expect(form.password).toBeFocused()
  })

  test('ID-2 해제하고 로그인 → 로그아웃 → 아이디 칸이 비고 localStorage 가 비어 있다', async ({
    page,
  }) => {
    await page.goto('/login')
    const form = loginForm(page)
    await form.saveUsernameLabel.click()
    await expect(form.saveUsername).not.toBeChecked()

    await submitLogin(page)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
    await page.getByTestId('logout').click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(form.username).toHaveValue('')
    expect(await readLocalStorage(page)).toEqual([])
  })

  test('ID-3 로그인 실패는 저장된 아이디를 바꾸지 않는다', async ({ page }) => {
    // 먼저 성공으로 아이디를 저장해 둔다
    await page.goto('/login')
    await submitLogin(page)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
    await page.getByTestId('logout').click()
    await expect(page).toHaveURL(/\/login$/)

    // 다른 아이디로 실패
    backend.on('POST', API.LOGIN, invalidCredentials(1))
    await submitLogin(page, FAKE.OTHER_USERNAME)
    await expect(notice(page).lines).toHaveCount(3)
    await closeNotice(page)

    await page.reload()
    await expect(loginForm(page).username).toHaveValue(FAKE.USERNAME)
    expect(await readLocalStorage(page)).toEqual([['km.savedUsername', FAKE.USERNAME]])
  })
})

test.describe('저장소 보안', () => {
  test.beforeEach(async ({ context }) => {
    const backend = new FakeBackend()
    backend.on('POST', API.LOGIN, loginSuccess)
    await backend.install(context)
  })

  test('SEC-1 "아이디저장" 해제 로그인 뒤: localStorage 비어 있음 · sessionStorage 는 km.refreshToken 하나 · 비밀번호 · 액세스 토큰 · 이름 없음', async ({
    page,
  }) => {
    await page.goto('/login')
    await loginForm(page).saveUsernameLabel.click()
    await submitLogin(page)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)

    const local = await readLocalStorage(page)
    const session = await readSessionStorage(page)
    expect(local).toEqual([])
    // 우리 코드의 키는 km.refreshToken 하나(라이브러리 키 vue-router:scroll 은 떼고 그 값의 모양을 확인한다 — browserState.ts)
    expect(appSessionEntries(session).map(([key]) => key)).toEqual(['km.refreshToken'])

    const everything = JSON.stringify([local, session, page.url()])
    for (const secret of [FAKE.PASSWORD, FAKE.ACCESS_1, FAKE.FULL_NAME]) {
      expect(everything).not.toContain(secret)
    }
  })

  test('SEC-2 "아이디저장" 체크 로그인 뒤: localStorage 의 키는 km.savedUsername 하나이고 값은 아이디', async ({
    page,
  }) => {
    await page.goto('/login')
    await submitLogin(page)
    await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)

    expect(await readLocalStorage(page)).toEqual([['km.savedUsername', FAKE.USERNAME]])
  })
})
