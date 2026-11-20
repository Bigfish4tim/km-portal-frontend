/**
 * 화면 흐름 테스트 — 만료 비밀번호 변경 창(명세 B-2a 5-2 의 EX-1 ~ EX-6).
 *
 * 변경 창에는 로그인 화면이 PASSWORD_EXPIRED 를 받았을 때만 들어간다 — 그래서 각 테스트는 로그인에서 시작한다.
 * 🔴 모의 응답의 문구 · 코드는 백엔드 코드에서 옮겼다(e2e/mocks/auth.ts). 값은 전부 합성이다.
 */
import { expect, test, type Page } from '@playwright/test'

import {
  API,
  FAKE,
  REUSED_MESSAGE,
  expiredChangeSuccess,
  illegalArgument,
  invalidCredentials,
  passwordExpired,
} from './mocks/auth'
import { FakeBackend } from './support/fakeBackend'
import {
  changeForm,
  closeNotice,
  expectNotice,
  notice,
  submitChange,
  submitLogin,
} from './support/steps'

/** 화면 문구 · 서버 규칙 문구 — 기대값은 글자로 */
const TEXT = {
  LENGTH: '비밀번호는 8자 이상 20자 이하여야 합니다.',
  SEQUENTIAL: '연속 숫자와 연속 문자는 사용할 수 없습니다.',
  CONFIRM_MISMATCH: '새비밀번호와 새비밀번호 확인이 일치하지 않습니다.',
  SAME_AS_CURRENT: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
}

let backend: FakeBackend

test.beforeEach(async ({ context }) => {
  backend = new FakeBackend()
  backend.on('POST', API.LOGIN, passwordExpired)
  await backend.install(context)
})

/** 로그인 → PASSWORD_EXPIRED → 변경 창 */
async function openExpiredPage(page: Page): Promise<void> {
  await page.goto('/login')
  await submitLogin(page)
  await expect(page).toHaveURL(/\/password\/expired$/)
}

test('EX-1 변경 성공 → 서버의 성공 문구 → [확인] 뒤 /login · 본문은 세 키 · Authorization 없음', async ({
  page,
}) => {
  backend.on('POST', API.EXPIRED_PASSWORD, expiredChangeSuccess)
  await openExpiredPage(page)

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expectNotice(page, '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.')
  await closeNotice(page)
  await expect(page).toHaveURL(/\/login$/)

  const [request] = backend.requests('POST', API.EXPIRED_PASSWORD)
  expect(request?.authorization).toBeUndefined()
  expect(request?.body).toEqual({
    username: FAKE.USERNAME,
    currentPassword: FAKE.PASSWORD,
    newPassword: FAKE.NEW_PASSWORD,
  })
})

test('EX-2 현재 비밀번호 틀림(401 INVALID_CREDENTIALS) → 세 줄 · 화면은 그대로 · 현재 비밀번호 칸이 빈다', async ({
  page,
}) => {
  backend.on('POST', API.EXPIRED_PASSWORD, invalidCredentials(3))
  await openExpiredPage(page)

  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expect(notice(page).lines).toHaveCount(3)
  await expect(notice(page).lines.nth(1)).toContainText('(3번 오류)')
  await closeNotice(page)
  await expect(page).toHaveURL(/\/password\/expired$/)
  await expect(changeForm(page).current).toHaveValue('')
  await expect(changeForm(page).current).toBeFocused()
})

test('EX-3 서버 400 ILLEGAL_ARGUMENT(12개월 재사용) → 접두사 없는 문구 · 요청은 실제로 나갔다', async ({
  page,
}) => {
  backend.on('POST', API.EXPIRED_PASSWORD, illegalArgument(REUSED_MESSAGE))
  await openExpiredPage(page)

  // 🔴 사전 검사를 통과하는 값 — 재사용은 서버만 안다
  await submitChange(page, FAKE.PASSWORD, FAKE.NEW_PASSWORD)

  await expectNotice(page, REUSED_MESSAGE)
  expect(backend.requests('POST', API.EXPIRED_PASSWORD)).toHaveLength(1)
})

test('EX-4 사전 검사: 7자 · 연속 숫자 · 확인 불일치 · 현재와 같음 → 각 문구 · 요청이 나가지 않는다', async ({
  page,
}) => {
  await openExpiredPage(page)

  const cases: Array<[string, string, string]> = [
    ['Pz4@wn8', 'Pz4@wn8', TEXT.LENGTH], // 7자
    ['Q#w123x%', 'Q#w123x%', TEXT.SEQUENTIAL], // 연속 숫자
    [FAKE.NEW_PASSWORD, 'Pz4@wn8s', TEXT.CONFIRM_MISMATCH], // 확인 불일치
    [FAKE.PASSWORD, FAKE.PASSWORD, TEXT.SAME_AS_CURRENT], // 현재와 같음
  ]
  for (const [next, confirm, message] of cases) {
    await submitChange(page, FAKE.PASSWORD, next, confirm)
    await expectNotice(page, message)
    await closeNotice(page)
  }

  // 입력하는 동안의 작은 안내(확인 창 없이)
  await changeForm(page).next.fill('Q#w123x%')
  await expect(changeForm(page).hint).toHaveText(TEXT.SEQUENTIAL)

  expect(backend.requests('POST', API.EXPIRED_PASSWORD)).toHaveLength(0)
})

test('EX-5 /password/expired 를 직접 열거나 변경 창에서 새로 고침하면 /login', async ({ page }) => {
  await page.goto('/password/expired')
  await expect(page).toHaveURL(/\/login$/)

  await openExpiredPage(page)
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
})

test('EX-6 단추는 "비밀번호 변경" · "취소" 둘뿐 · "취소" → /login', async ({ page }) => {
  await openExpiredPage(page)

  const buttons = page.getByTestId('expired-password').getByRole('button')
  await expect(buttons).toHaveText(['비밀번호 변경', '취소'])

  await changeForm(page).cancel.click()
  await expect(page).toHaveURL(/\/login$/)
})
