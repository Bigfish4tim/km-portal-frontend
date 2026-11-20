/**
 * 화면 흐름 테스트에서 되풀이하는 동작 — 로그인 칸 채우기 · 확인 창 읽기 등.
 * 화면 요소는 data-testid 로 찾는다(글자가 바뀌어도 찾을 수 있게). 단언은 각 테스트가 한다.
 */
import { expect, type Page } from '@playwright/test'

import { FAKE } from '../mocks/auth'

/** 확인 창의 요소들 */
export function notice(page: Page) {
  return {
    box: page.getByTestId('notice'),
    lines: page.getByTestId('notice-line'),
    confirm: page.getByTestId('notice-confirm'),
  }
}

/** 확인 창이 떠 있고 문구가 이것인가(줄바꿈은 줄 요소로 나뉘어 있으므로 줄 목록으로 본다) */
export async function expectNotice(page: Page, message: string): Promise<void> {
  await expect(notice(page).lines).toHaveText(message.split('\n'))
}

/** [확인] 을 눌러 확인 창을 닫는다 */
export async function closeNotice(page: Page): Promise<void> {
  await notice(page).confirm.click()
  await expect(notice(page).box).toHaveCount(0)
}

/** 로그인 화면의 요소들 */
export function loginForm(page: Page) {
  return {
    username: page.getByTestId('login-username'),
    password: page.getByTestId('login-password'),
    // el-checkbox 의 진짜 체크 상자(input)
    saveUsername: page.getByTestId('save-username').locator('input[type="checkbox"]'),
    openPopup: page.getByTestId('open-popup').locator('input[type="checkbox"]'),
    saveUsernameLabel: page.getByTestId('save-username'),
    openPopupLabel: page.getByTestId('open-popup'),
    submit: page.getByTestId('login-submit'),
    tempPassword: page.getByTestId('temp-password'),
  }
}

/** 로그인 화면에서 아이디 · 비밀번호를 치고 "로그인" */
export async function submitLogin(
  page: Page,
  username: string = FAKE.USERNAME,
  password: string = FAKE.PASSWORD,
): Promise<void> {
  const form = loginForm(page)
  await form.username.fill(username)
  await form.password.fill(password)
  await form.submit.click()
}

/** 변경 폼(만료 변경 · 본인 변경 공통)의 요소들 */
export function changeForm(page: Page) {
  return {
    current: page.getByTestId('current-password'),
    next: page.getByTestId('new-password'),
    confirm: page.getByTestId('confirm-password'),
    submit: page.getByTestId('change-submit'),
    cancel: page.getByTestId('change-cancel'),
    hint: page.getByTestId('new-password-hint'),
  }
}

/** 변경 폼 세 칸을 채우고 "비밀번호 변경" */
export async function submitChange(
  page: Page,
  current: string,
  next: string,
  confirm: string = next,
): Promise<void> {
  const form = changeForm(page)
  await form.current.fill(current)
  await form.next.fill(next)
  await form.confirm.fill(confirm)
  await form.submit.click()
}

/** 상단 띠의 "이름[부서, 직위]" — 합성 사용자 */
export const USER_LABEL = `${FAKE.FULL_NAME}[${FAKE.DEPARTMENT}, ${FAKE.POSITION}]`
