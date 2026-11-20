/**
 * HTTP 인터셉터의 단위 테스트 — 명세 B-2a 5-1 의 HX-1 ~ HX-6.
 *
 * 진짜 서버 대신 axios 의 "어댑터"(요청을 실제로 보내는 부분)를 가짜로 바꾼다. 새 패키지 없이 된다.
 * 가짜 어댑터는 나간 요청을 기록하고, 테스트가 정한 규칙대로 응답한다.
 * 🔴 토큰은 한눈에 가짜인 문자열이다.
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from '@/auth/tokenStore'

import { changeExpiredPassword, fetchMe, login, refresh } from './authApi'
import { http, registerSessionHooks } from './http'

/** 나간 요청 하나의 기록 */
interface Sent {
  url: string
  authorization: string | undefined
}

/** 응답 규칙: 요청을 보고 상태 코드와 본문을 정한다 */
type Reply = (
  config: InternalAxiosRequestConfig,
) => { status: number; data?: unknown } | Promise<{ status: number; data?: unknown }>

const originalAdapter = http.defaults.adapter
let sent: Sent[] = []

/** 가짜 어댑터를 건다 — 2xx 는 응답으로, 그 밖은 axios 와 같은 모양의 오류로 돌려준다 */
function useFakeServer(reply: Reply): void {
  const adapter: AxiosAdapter = async (config) => {
    const header = config.headers.get('Authorization')
    sent.push({
      url: config.url ?? '',
      authorization: typeof header === 'string' ? header : undefined,
    })
    const { status, data = null } = await reply(config)
    const response = { data, status, statusText: '', headers: {}, config, request: {} }
    if (status >= 200 && status < 300) {
      return response
    }
    throw new AxiosError(`status ${status}`, 'ERR_BAD_REQUEST', config, {}, response)
  }
  http.defaults.adapter = adapter
}

/** 나간 요청 중 주소가 같은 것의 수 */
function count(url: string): number {
  return sent.filter((s) => s.url === url).length
}

/** 401 봉투(보호 API — 백엔드 AuthController.java:450-451 · ApiResponse.java:195-197 GENERAL_ERROR) */
const UNAUTHORIZED = {
  status: 401,
  data: { success: false, message: '인증이 필요합니다.', data: null, errorCode: 'GENERAL_ERROR' },
}

/** 재발급 성공 봉투(백엔드 AuthController.java:393-398) */
function refreshed(accessToken: string) {
  return {
    status: 200,
    data: {
      success: true,
      message: '토큰 갱신 성공',
      data: { accessToken, tokenType: 'Bearer', expiresIn: 86400 },
      errorCode: null,
    },
  }
}

const ok = (data: unknown = null) => ({
  status: 200,
  data: { success: true, message: null, data, errorCode: null },
})

/** 실제 앱과 같은 재발급: authApi.refresh → 새 액세스 토큰 저장(src/stores/auth.ts 의 renewAccessToken 과 같은 일) */
async function renewAccessToken(): Promise<boolean> {
  const token = getRefreshToken()
  if (token === null) return false
  try {
    setAccessToken((await refresh(token)).accessToken)
    return true
  } catch {
    return false
  }
}

const endSession = vi.fn()

describe('http 인터셉터', () => {
  beforeEach(() => {
    sent = []
    endSession.mockClear()
    clearTokens()
    registerSessionHooks({ renewAccessToken, endSession })
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
    registerSessionHooks(null)
    clearTokens()
  })

  it('HX-1 보호 요청에는 Authorization 이 붙고 · login · refresh · changeExpiredPassword 에는 붙지 않는다', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer(() => ok({ accessToken: 'fake-access-1' }))

    await fetchMe()
    await login('test_user7', 'Kx7#qm2w')
    await refresh('fake-refresh-1')
    await changeExpiredPassword('test_user7', 'Kx7#qm2w', 'Pz4@wn8r')

    expect(sent).toEqual([
      { url: '/api/auth/me', authorization: 'Bearer fake-access-1' },
      { url: '/api/auth/login', authorization: undefined },
      { url: '/api/auth/refresh', authorization: undefined },
      { url: '/api/auth/password/expired', authorization: undefined },
    ])
  })

  it('HX-2 보호 요청 401 → refresh 1회 → 새 토큰으로 원 요청 1회 재시도 → 성공', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer((config) => {
      if (config.url === '/api/auth/refresh') return refreshed('fake-access-2')
      return config.headers.get('Authorization') === 'Bearer fake-access-2'
        ? ok({ username: 'test_user7' })
        : UNAUTHORIZED
    })

    await expect(fetchMe()).resolves.toEqual({ username: 'test_user7' })

    expect(count('/api/auth/refresh')).toBe(1)
    expect(sent.filter((s) => s.url === '/api/auth/me').map((s) => s.authorization)).toEqual([
      'Bearer fake-access-1',
      'Bearer fake-access-2',
    ])
    expect(getAccessToken()).toBe('fake-access-2')
    expect(endSession).not.toHaveBeenCalled()
  })

  it('HX-3 보호 요청 셋이 동시에 401 → refresh 는 1회 · 셋 다 재시도되어 성공', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer(async (config) => {
      if (config.url === '/api/auth/refresh') {
        // 재발급이 조금 걸리게 해서 세 401 이 모두 재발급 도중에 도착하게 한다
        await new Promise((resolve) => setTimeout(resolve, 20))
        return refreshed('fake-access-2')
      }
      return config.headers.get('Authorization') === 'Bearer fake-access-2'
        ? ok(config.url)
        : UNAUTHORIZED
    })

    const results = await Promise.all([
      http.get('/api/test/a'),
      http.get('/api/test/b'),
      http.get('/api/test/c'),
    ])

    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    expect(count('/api/auth/refresh')).toBe(1)
    for (const url of ['/api/test/a', '/api/test/b', '/api/test/c']) {
      expect(count(url)).toBe(2) // 처음 1 + 재시도 1
    }
  })

  it('HX-4 재시도한 요청이 다시 401 이면 더 시도하지 않고 세션 종료 콜백이 불린다', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer((config) =>
      config.url === '/api/auth/refresh' ? refreshed('fake-access-2') : UNAUTHORIZED,
    )

    await expect(fetchMe()).rejects.toMatchObject({ response: { status: 401 } })

    expect(count('/api/auth/me')).toBe(2) // 처음 1 + 재시도 1 — 그 뒤로는 없다
    expect(count('/api/auth/refresh')).toBe(1)
    expect(endSession).toHaveBeenCalledTimes(1)
    expect(getRefreshToken()).toBeNull()
  })

  it('HX-5 refresh 가 401 이면 토큰이 지워지고 세션 종료 콜백이 1회 불린다', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer(() => UNAUTHORIZED)

    await expect(fetchMe()).rejects.toMatchObject({ response: { status: 401 } })

    expect(count('/api/auth/refresh')).toBe(1)
    expect(count('/api/auth/me')).toBe(1)
    expect(endSession).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('HX-6 login 의 401 은 재발급용 토큰이 남아 있어도 refresh 를 부르지 않는다', async () => {
    setTokens('fake-access-1', 'fake-refresh-1')
    useFakeServer(() => ({
      status: 401,
      // 백엔드 LoginFailureReason.java:50
      data: {
        success: false,
        message: '해당하는 아이디가 없습니다.',
        data: null,
        errorCode: 'USER_NOT_FOUND',
      },
    }))

    await expect(login('test_user7', 'Kx7#qm2w')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(count('/api/auth/refresh')).toBe(0)
    expect(endSession).not.toHaveBeenCalled()
    expect(getRefreshToken()).toBe('fake-refresh-1') // 로그인 실패가 남의 세션을 지우지 않는다
  })
})
