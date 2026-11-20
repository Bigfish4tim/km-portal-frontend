/**
 * 화면 흐름 테스트 — "팝업창으로열기"(명세 B-2a 4-8 · 5-2 의 PU-1 · PU-2).
 *
 * 🔴 4-8 의 동작은 가정이다(레거시의 정확한 동작을 확인하지 못했다 — 미결). 이 테스트는 그 가정을 고정한다.
 * 가짜 백엔드는 context 에 걸려 있어 새 창의 요청(refresh · me)도 가로챈다.
 */
import { expect, test } from '@playwright/test'

import { API, FAKE, loginSuccess, meSuccess, refreshSuccess } from './mocks/auth'
import { appSessionEntries, readSessionStorage } from './support/browserState'
import { FakeBackend } from './support/fakeBackend'
import { USER_LABEL, closeNotice, expectNotice, loginForm, submitLogin } from './support/steps'

let backend: FakeBackend

test.beforeEach(async ({ context }) => {
  backend = new FakeBackend()
  backend
    .on('POST', API.LOGIN, loginSuccess)
    .on('POST', API.REFRESH, refreshSuccess(FAKE.ACCESS_2))
    .on('GET', API.ME, meSuccess)
  await backend.install(context)
})

test('PU-1 체크하고 로그인 → 새 창이 / 에 이름[부서, 직위] · 원래 창은 /login 이고 재발급용 토큰이 없다', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await loginForm(page).openPopupLabel.click()

  const popupPromise = context.waitForEvent('page')
  await submitLogin(page)
  const popup = await popupPromise

  await expect(popup).toHaveURL(/\/$/)
  await expect(popup.getByTestId('user-label')).toHaveText(USER_LABEL)
  // 새 창은 sessionStorage 사본의 재발급용 토큰으로 되살아났다(refresh 1 · me 1)
  expect(backend.requests('POST', API.REFRESH)).toHaveLength(1)

  await expect(page).toHaveURL(/\/login$/)
  await expect(loginForm(page).password).toHaveValue('')
  expect(appSessionEntries(await readSessionStorage(page))).toEqual([])
})

test('PU-2 window.open 이 null 이면 POPUP_BLOCKED → [확인] 뒤 같은 창이 /', async ({ page }) => {
  // 브라우저가 팝업을 막은 상황을 흉내 낸다
  await page.addInitScript(() => {
    window.open = () => null
  })
  await page.goto('/login')
  await loginForm(page).openPopupLabel.click()

  await submitLogin(page)

  await expectNotice(page, '브라우저가 팝업창을 막았습니다. 이 창에서 엽니다.')
  await closeNotice(page)
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('user-label')).toHaveText(USER_LABEL)
})
