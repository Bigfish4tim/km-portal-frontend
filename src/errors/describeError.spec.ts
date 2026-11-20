/**
 * 오류 → 화면 문구의 단위 테스트 — 명세 B-2a 5-1 의 ER-1 ~ ER-4.
 *
 * axios 오류는 모양만 흉내 낸다(`isAxiosError` · `response.status` · `response.data`).
 * 이 폴더는 axios 를 import 하지 않는다(린트 L3).
 * 서버 문구는 백엔드 코드에서 옮겨 적었다(근거는 각 줄).
 */
import { describe, expect, it } from 'vitest'

import { describeError } from './describeError'

/** axios 가 응답을 받은 뒤 던지는 오류의 모양 */
function httpError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } }
}

/** 화면 문구(src/errors/text.ts) — 기대값은 글자로 적는다 */
const EXPECTED = {
  INVALID_INPUT: '입력값을 확인해 주세요.',
  NOT_FOUND: '요청한 대상을 찾을 수 없습니다.',
  UNEXPECTED: '처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  SERVER_UNREACHABLE: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

describe('describeError', () => {
  it('ER-1 봉투 → 서버 문구 그대로 · 줄바꿈이 든 세 줄은 줄바꿈까지 그대로', () => {
    // 백엔드 dto/common/LoginFailureReason.java:56-59 의 틀을 (5, 2) 로 채운 값
    const threeLines =
      '비밀번호가 일치하지 않습니다.\n' +
      '비밀번호가 5회연속 틀리면 로그인 계정이 잠깁니다.(2번 오류)\n' +
      '비밀번호는 대소문자를 구분합니다. 확인 하시고 다시 시도해 주세요.'
    const result = describeError(
      httpError(401, {
        success: false,
        message: threeLines,
        data: { failedAttempts: 2, lockThreshold: 5 },
        errorCode: 'INVALID_CREDENTIALS',
        timestamp: '2026-01-01T00:00:00',
      }),
    )

    expect(result).toEqual({ status: 401, errorCode: 'INVALID_CREDENTIALS', message: threeLines })
    expect(result.message.split('\n')).toHaveLength(3)

    // 500 이어도 봉투면 서버 문구
    expect(
      describeError(
        httpError(500, {
          success: false,
          message: '로그아웃에 실패했습니다.',
          errorCode: 'GENERAL_ERROR',
        }),
      ),
    ).toMatchObject({ message: '로그아웃에 실패했습니다.' })
  })

  it('ER-2 ILLEGAL_ARGUMENT 는 접두사를 떼고 · 접두사가 없으면 그대로 · 다른 코드는 떼지 않는다', () => {
    // 백엔드 GlobalExceptionHandler.java:414-417 + AccountSecurityService.java:68
    expect(
      describeError(
        httpError(400, {
          success: false,
          message: '잘못된 요청 매개변수입니다: 현재 비밀번호가 올바르지 않습니다.',
          errorCode: 'ILLEGAL_ARGUMENT',
        }),
      ),
    ).toEqual({
      status: 400,
      errorCode: 'ILLEGAL_ARGUMENT',
      message: '현재 비밀번호가 올바르지 않습니다.',
    })

    expect(
      describeError(httpError(400, { message: '접두사 없는 문구', errorCode: 'ILLEGAL_ARGUMENT' }))
        .message,
    ).toBe('접두사 없는 문구')

    expect(
      describeError(
        httpError(409, {
          message: '잘못된 요청 매개변수입니다: 그대로',
          errorCode: 'ROLE_REQUIRED',
        }),
      ).message,
    ).toBe('잘못된 요청 매개변수입니다: 그대로')
  })

  it('ER-3 ProblemDetail → INVALID_INPUT 이고 detail 의 글자가 결과에 없다', () => {
    const result = describeError(
      httpError(400, {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: "Invalid request content. field 'password' internal-detail",
        instance: '/api/auth/login',
      }),
    )

    expect(result).toEqual({ status: 400, message: EXPECTED.INVALID_INPUT })
    expect(JSON.stringify(result)).not.toContain('internal-detail')
  })

  it('ER-4 빈 본문 404 · 502/503/504 · 응답 없음 · HTML 본문 500', () => {
    expect(describeError(httpError(404, ''))).toEqual({ status: 404, message: EXPECTED.NOT_FOUND })
    for (const status of [502, 503, 504]) {
      expect(describeError(httpError(status, '')).message).toBe(EXPECTED.SERVER_UNREACHABLE)
    }
    // 응답 없음(연결 실패 · 시간 초과) — axios 는 response 없이 던진다
    expect(describeError({ isAxiosError: true, code: 'ECONNABORTED' })).toEqual({
      message: EXPECTED.SERVER_UNREACHABLE,
    })
    expect(describeError(httpError(500, '<html><body>Internal</body></html>'))).toEqual({
      status: 500,
      message: EXPECTED.UNEXPECTED,
    })
    // HTTP 오류가 아닌 예외 — 내용을 보여 주지 않는다
    expect(describeError(new Error('internal-stack'))).toEqual({ message: EXPECTED.UNEXPECTED })
  })
})
