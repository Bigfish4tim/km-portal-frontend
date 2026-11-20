/**
 * 화면 흐름 테스트 — 세션(새로 고침 · 재발급 · 로그아웃)과 본인 비밀번호 변경
 * (명세 B-2a 5-2 의 SS-1 ~ SS-3 · RF-1 · RF-2 · OP-1 · OP-2 · LO-1).
 *
 * 🔴 모의 응답의 문구 · 코드는 백엔드 코드에서 옮겼다(e2e/mocks/auth.ts). 값은 전부 합성이다.
 */
import { expect, test, type Page } from '@playwright/test'

import {
  API,
  FAKE,
  WRONG_CURRENT_MESSAGE,
  entryPointUnauthorized,
  illegalArgument,
  loginSuccess,
  logoutSuccess,
  meSuccess,
  ownChangeSuccess,
  refreshFailure,
  refreshSuccess,
} from './mocks/auth'
import { appSessionEntries, readSessionStorage } from './support/browserState'
import { FakeBackend } from './support/fakeBackend'
import {
  USER_LABEL,
  changeForm,
  closeNotice,
  expectNotice,
  submitChange,
  submitLogin,
} from './support/steps'

const SESSION_ENDED = '로그인이 만료되었습니다. 다시 로그인해 주세요.'

let backend: FakeBackend

test.beforeEach(async ({ context }) => {
  backend = new FakeBackend()
  backend
    .on('POST', API.LOGIN, loginSuccess)
    .on('POST', API.LOGOUT, logoutSuccess)
    .on('POST', API.REFRESH, refreshSuccess(FAKE.ACCESS_2))
    .on('GET', API.ME, meSuccess)
  await backend.install(context)
})

/** 로그인해서 첫 화면까지 */
async function loginToHome(page: Page): Promise<void> {
  await page.goto('/login')
  await submitLogin(page)
  await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
}

test('SS-1 로그인 뒤 새로 고침 → 다시 로그인하지 않고 / (refresh 1회 · me 1회)', async ({
  page,
}) => {
  await loginToHome(page)

  await page.reload()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
  expect(backend.requests('POST', API.REFRESH)).toHaveLength(1)
  expect(backend.requests('GET', API.ME)).toHaveLength(1)
  expect(backend.requests('GET', API.ME)[0]?.authorization).toBe(`Bearer ${FAKE.ACCESS_2}`)
})

test('SS-2 새로 고침 때 refresh 가 401 → /login · sessionStorage 에 재발급용 토큰이 없다', async ({
  page,
}) => {
  await loginToHome(page)
  backend.on('POST', API.REFRESH, refreshFailure)

  await page.reload()

  await expect(page).toHaveURL(/\/login$/)
  expect(appSessionEntries(await readSessionStorage(page))).toEqual([])
})

test('SS-3 로그인하지 않고 /mypage/password → /login?redirect=… → 로그인하면 /mypage/password', async ({
  page,
}) => {
  await page.goto('/mypage/password')
  // vue-router 는 쿼리의 / 를 인코딩하지 않는다 — 둘 다 같은 값이다
  await expect(page).toHaveURL(/\/login\?redirect=(\/|%2F)mypage(\/|%2F)password$/)

  await submitLogin(page)

  await expect(page).toHaveURL(/\/mypage\/password$/)
})

test('RF-1 보호 요청(PUT /api/auth/password)이 401 → refresh 뒤 재시도되어 성공 문구', async ({
  page,
}) => {
  backend.on('PUT', API.OWN_PASSWORD, (request) =>
    request.headers()['authorization'] === `Bearer ${FAKE.ACCESS_2}`
      ? ownChangeSuccess
      : entryPointUnauthorized,
  )
  await loginToHome(page)
  await page.getByTestId('nav-own-password').click()

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expectNotice(page, '비밀번호가 변경되었습니다.')
  expect(backend.requests('POST', API.REFRESH)).toHaveLength(1)
  expect(backend.requests('PUT', API.OWN_PASSWORD).map((r) => r.authorization)).toEqual([
    `Bearer ${FAKE.ACCESS_1}`,
    `Bearer ${FAKE.ACCESS_2}`,
  ])
})

test('RF-2 같은 상황에서 refresh 도 401 → /login?reason=expired… 에 SESSION_ENDED', async ({
  page,
}) => {
  backend.on('PUT', API.OWN_PASSWORD, entryPointUnauthorized)
  backend.on('POST', API.REFRESH, refreshFailure)
  await loginToHome(page)
  await page.getByTestId('nav-own-password').click()

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expect(page).toHaveURL(/\/login\?reason=expired/)
  await expectNotice(page, SESSION_ENDED)
  await closeNotice(page)
  expect(appSessionEntries(await readSessionStorage(page))).toEqual([])
})

test('OP-1 본인 변경 성공 → 서버 문구 · 칸이 비워진다 · 로그인 상태 그대로', async ({ page }) => {
  backend.on('PUT', API.OWN_PASSWORD, ownChangeSuccess)
  await loginToHome(page)
  await page.getByTestId('nav-own-password').click()

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expectNotice(page, '비밀번호가 변경되었습니다.')
  await closeNotice(page)
  const form = changeForm(page)
  await expect(form.current).toHaveValue('')
  await expect(form.next).toHaveValue('')
  await expect(form.confirm).toHaveValue('')
  await expect(page).toHaveURL(/\/mypage\/password$/)
  await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
})

test('OP-2 현재 비밀번호 틀림(400) → 서버 문구 · 로그아웃되지 않는다', async ({ page }) => {
  backend.on('PUT', API.OWN_PASSWORD, illegalArgument(WRONG_CURRENT_MESSAGE))
  await loginToHome(page)
  await page.getByTestId('nav-own-password').click()

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expectNotice(page, WRONG_CURRENT_MESSAGE)
  await closeNotice(page)
  await expect(page).toHaveURL(/\/mypage\/password$/)
  await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
  expect(backend.requests('POST', API.REFRESH)).toHaveLength(0)
})

test('LO-1 "로그아웃" → /login · sessionStorage 비어 있음 · 뒤로 가기로 / 를 열어도 /login', async ({
  page,
}) => {
  await loginToHome(page)

  await page.getByTestId('logout').click()

  await expect(page).toHaveURL(/\/login$/)
  expect(appSessionEntries(await readSessionStorage(page))).toEqual([])
  expect(backend.requests('POST', API.LOGOUT)[0]?.authorization).toBe(`Bearer ${FAKE.ACCESS_1}`)

  await page.goBack()
  await expect(page).toHaveURL(/\/login$/)
})
