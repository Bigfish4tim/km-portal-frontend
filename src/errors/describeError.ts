/**
 * 오류 → 화면 문구 — 🔴 오류 본문의 모양을 아는 유일한 함수(CLAUDE.md 6-3 · 명세 B-2a 4-3).
 *
 * 무엇을: 서비스 함수(src/api/)가 던진 오류를 받아 `{ status, errorCode, message }` 로 바꾼다.
 *   화면은 `message` 를 확인 창에 그대로 보여 주고, 분기가 필요하면 `errorCode` 를 본다(문구를 비교하지 않는다).
 * 왜 한 곳: 백엔드 오류 본문의 모양이 넷이다(봉투 · 접두사 붙은 봉투 · ProblemDetail · 빈 본문/응답 없음).
 *   화면마다 따로 해석하면 한쪽만 틀린다.
 *
 * 🔴 axios 를 import 하지 않는다(L3 — src/api/ 밖). axios 오류의 모양(`isAxiosError` · `response`)만 본다.
 * 🔴 서버의 내부 정보(스택 · 경로)를 보여 주지 않는다(P10) — `ProblemDetail` 의 `detail` 을 그대로 쓰지 않는 이유다.
 */
import { ILLEGAL_ARGUMENT_CODE } from '@/api/types/auth'

import { TEXT } from './text'

/** 화면에 넘기는 결과. 응답이 없으면 status 가 없고, 봉투가 아니면 errorCode 가 없다 */
export interface DescribedError {
  status?: number
  errorCode?: string
  message: string
}

/**
 * `ILLEGAL_ARGUMENT` 400 의 접두사.
 * 근거: 백엔드 exception/GlobalExceptionHandler.java:414-417(`"잘못된 요청 매개변수입니다: " + ex.getMessage()`) ·
 *   응답규약 §4-0 · 백엔드 미결 A3-55(접두사를 없앨지)
 */
export const ILLEGAL_ARGUMENT_PREFIX = '잘못된 요청 매개변수입니다: '

/**
 * 게이트웨이(프록시)가 "뒤의 서버에 닿지 못했다" 고 답하는 상태 코드.
 * 실측(2026-11-19 · B-1): 백엔드를 끄면 개발 서버의 프록시는 연결을 끊지 않고 502 를 준다.
 */
const GATEWAY_FAILURE_STATUSES: readonly number[] = [502, 503, 504]

/** 들어온 값이 "아무 키나 읽어 볼 수 있는 객체" 인가(TypeScript 의 타입 좁히기) */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * axios 오류에서 상태 코드와 본문을 꺼낸다.
 * @returns axios 오류가 아니면 null · 응답이 없으면 status null
 */
function readHttpFailure(error: unknown): { status: number | null; body: unknown } | null {
  if (!isRecord(error) || error.isAxiosError !== true) {
    return null
  }
  const response = error.response
  if (!isRecord(response) || typeof response.status !== 'number') {
    // 요청은 나갔지만 응답이 없다(연결 실패 · 시간 초과)
    return { status: null, body: undefined }
  }
  return { status: response.status, body: response.data }
}

/**
 * 던져진 오류 하나를 화면 문구로 바꾼다.
 *
 * | 경우 | message |
 * |---|---|
 * | 응답 없음 · 시간 초과 · 502/503/504 | SERVER_UNREACHABLE |
 * | 봉투(message 가 문자열) | 서버 문구 그대로(🔴 줄바꿈을 바꾸지 않는다). ILLEGAL_ARGUMENT 면 접두사를 뗀다 |
 * | 404 이고 봉투가 아님(빈 본문 · ProblemDetail) | NOT_FOUND |
 * | ProblemDetail(message 없음 · title/detail 있음) | INVALID_INPUT(🔴 detail 을 보여 주지 않는다 — BR-4) |
 * | 그 밖(빈 본문 · HTML 본문 · 예상 밖의 오류) | UNEXPECTED |
 */
export function describeError(error: unknown): DescribedError {
  const failure = readHttpFailure(error)
  if (failure === null) {
    // 우리 코드의 예외 등 HTTP 오류가 아닌 것 — 내용을 보여 주지 않는다(P10)
    return { message: TEXT.UNEXPECTED }
  }

  const { status, body } = failure
  if (status === null) {
    return { message: TEXT.SERVER_UNREACHABLE }
  }
  if (GATEWAY_FAILURE_STATUSES.includes(status)) {
    return { status, message: TEXT.SERVER_UNREACHABLE }
  }

  // 봉투 — 서버 문구를 그대로(백엔드 dto/common/ApiResponse.java)
  if (isRecord(body) && typeof body.message === 'string') {
    const errorCode = typeof body.errorCode === 'string' ? body.errorCode : undefined
    let message = body.message
    // 🔴 접두사는 ILLEGAL_ARGUMENT 일 때만 뗀다. 다른 코드의 문구가 우연히 같은 글자로 시작해도 건드리지 않는다
    if (errorCode === ILLEGAL_ARGUMENT_CODE && message.startsWith(ILLEGAL_ARGUMENT_PREFIX)) {
      message = message.slice(ILLEGAL_ARGUMENT_PREFIX.length)
    }
    return errorCode === undefined ? { status, message } : { status, errorCode, message }
  }

  // 여기부터는 봉투가 아니다 — 404 는 본문을 읽지 않고 상태 코드로 가른다(CLAUDE.md 6-3)
  if (status === 404) {
    return { status, message: TEXT.NOT_FOUND }
  }
  // ProblemDetail — @Valid 실패 400 등(백엔드 GlobalExceptionHandler.java:244 의 주석 · 응답규약 §4)
  if (isRecord(body) && ('title' in body || 'detail' in body)) {
    return { status, message: TEXT.INVALID_INPUT }
  }
  return { status, message: TEXT.UNEXPECTED }
}
