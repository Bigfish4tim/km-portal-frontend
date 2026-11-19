/**
 * 화면 흐름 테스트 — 환경 점검 화면(명세 B-1 단계 4 의 EC-1 ~ EC-4).
 *
 * 상대는 모의 응답이다(page.route 로 요청을 가로챈다). 백엔드 없이 돈다.
 * 🔴 여기의 비밀번호 값은 한눈에 가짜인 합성 값이다(P3).
 */
import { expect, test } from '@playwright/test'

import { AUTH_ME_URL, authMeUnauthorized } from './mocks/authMe'
import { devProxyBackendDown } from './mocks/devProxy'

test.describe('환경 점검 화면', () => {
  test('EC-1 / 를 열면 "환경 점검" 제목이 보인다', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: '환경 점검' })).toBeVisible()
  })

  test('EC-2 짧은 값에는 길이 안내가, 규칙을 만족하는 값에는 통과 표시가 보인다', async ({
    page,
  }) => {
    await page.goto('/')
    const input = page.getByTestId('password-input')
    const result = page.getByTestId('password-result')

    await input.fill('Fa-00')
    await expect(result).toHaveText('비밀번호는 10자 이상이어야 합니다.')

    await input.fill('Fake-Pass-0000')
    await expect(result).toContainText('사전 검사 통과')
  })

  test('EC-3 /api/auth/me 가 401 이면 정상 문구가 보이고, 나간 요청에 Authorization 헤더가 없다', async ({
    page,
  }) => {
    // 나간 요청의 헤더를 여기에 담아 둔다
    let authorizationHeader: string | undefined
    let requestCount = 0
    await page.route(AUTH_ME_URL, async (route) => {
      requestCount += 1
      authorizationHeader = route.request().headers()['authorization']
      await route.fulfill({
        status: authMeUnauthorized.status,
        contentType: 'application/json',
        body: JSON.stringify(authMeUnauthorized.body),
      })
    })

    await page.goto('/')
    await page.getByTestId('server-check-button').click()

    await expect(page.getByTestId('server-result')).toHaveText(
      '서버 응답: 401(정상 — 로그인하지 않은 상태)',
    )
    // 🔴 토큰 없이 불러야 한다 — 인터셉터가 없으므로 헤더가 붙지 않아야 한다
    expect(requestCount).toBe(1)
    expect(authorizationHeader).toBeUndefined()
  })

  test('EC-4 /api/auth/me 가 연결 실패면 "닿지 않습니다" 문구가 보인다', async ({ page }) => {
    await page.route(AUTH_ME_URL, (route) => route.abort('connectionrefused'))

    await page.goto('/')
    await page.getByTestId('server-check-button').click()

    await expect(page.getByTestId('server-result')).toHaveText('서버에 닿지 않습니다')
  })

  // 명세의 EC-1~4 에 더한 것 — 실측에서 드러난 경우다(백엔드가 꺼지면 프록시가 502 를 준다)
  test('EC-5 프록시가 502 를 주면(백엔드 꺼짐) "닿지 않습니다(프록시 응답: 502)" 가 보인다', async ({
    page,
  }) => {
    await page.route(AUTH_ME_URL, (route) =>
      route.fulfill({ status: devProxyBackendDown.status, body: devProxyBackendDown.body }),
    )

    await page.goto('/')
    await page.getByTestId('server-check-button').click()

    await expect(page.getByTestId('server-result')).toHaveText(
      '서버에 닿지 않습니다(프록시 응답: 502)',
    )
  })
})
