/**
 * HTTP 클라이언트 — 이 앱의 axios 인스턴스는 이것 하나다(CLAUDE.md 5장 3번).
 *
 * 무엇을:
 *   1. 요청 인터셉터 — 액세스 토큰이 있으면 `Authorization: Bearer …` 를 붙인다.
 *      🔴 로그인 · 재발급 · 만료 변경에는 붙이지 않는다(명세 B-2a 3-1 · 4-2).
 *   2. 응답 인터셉터 — 보호 API 의 401 이면 재발급을 한 번 부르고 원 요청을 한 번만 다시 보낸다(CLAUDE.md 6-3 의 다섯 줄).
 * 왜 여기: 401 흐름은 `src/api/` 의 인터셉터와 `src/auth/` 만 안다(CLAUDE.md 6-3). 화면은 이 흐름을 모른다.
 *
 * 🔴 인터셉터는 문구를 만들지 않는다. 오류는 그대로 던지고, 화면이 `src/errors/` 의 함수로 문구를 얻는다.
 * 🔴 순환 참조를 피하려고 라우터 · 스토어를 import 하지 않는다. 재발급과 세션 종료는 앱 시작 때
 *    `registerSessionHooks` 로 받아 둔 함수를 부른다(src/main.ts 가 등록한다).
 *
 * 개발 서버에서는 `/api` 로 시작하는 주소가 Vite 프록시를 거쳐 http://localhost:8080 으로 간다(vite.config.ts).
 */
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken } from '@/auth/tokenStore'

/**
 * 이 앱이 쓰는 요청 설정의 덧붙임.
 *
 * TypeScript 관용: `declare module 'axios'` 로 axios 의 타입에 우리 필드를 더한다("모듈 보강").
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * true 면 토큰을 붙이지 않고, 401 이 와도 재발급하지 않는다.
     * 환경 점검 화면(serverCheck.ts)이 "토큰 없이" 부를 때 쓴다. 인증 API 셋은 아래의 주소 목록으로 정한다.
     */
    skipAuth?: boolean
    /** 인터셉터가 붙이는 표시 — 401 뒤 이미 한 번 다시 보낸 요청이다. 다시 401 이면 포기한다 */
    _retried?: boolean
  }
}

/** 인증 API 의 주소 — authApi.ts 와 이 파일이 함께 쓴다. 근거: controller/AuthController.java:74(@RequestMapping("/api/auth")) */
export const AUTH_URL = {
  LOGIN: '/api/auth/login', // :130
  REFRESH: '/api/auth/refresh', // :340
  ME: '/api/auth/me', // :414
  EXPIRED_PASSWORD: '/api/auth/password/expired', // :520
  OWN_PASSWORD: '/api/auth/password', // :578
  LOGOUT: '/api/auth/logout', // :603
} as const

/**
 * 🔴 토큰을 붙이지 않고, 401 에 재발급을 시도하지 않는 주소(CLAUDE.md 6-3 의 5번 · 명세 B-2a 4-2).
 * 로그인 · 만료 변경의 401 은 "비밀번호가 틀렸다" 같은 뜻이고, 재발급의 401 은 재발급 실패 자체다.
 */
const NO_AUTH_URLS: readonly string[] = [
  AUTH_URL.LOGIN,
  AUTH_URL.REFRESH,
  AUTH_URL.EXPIRED_PASSWORD,
]

/**
 * 토큰은 붙이되 401 에 재발급을 시도하지 않는 주소.
 * 로그아웃은 실패해도 화면이 어차피 로그아웃 상태로 간다(스토어의 logout) — 그 사이에 "세션 만료" 를 띄우지 않으려고 뺀다.
 */
const NO_RENEW_URLS: readonly string[] = [...NO_AUTH_URLS, AUTH_URL.LOGOUT]

/** 요청 주소에서 쿼리를 떼어 경로만 */
function pathOf(config: AxiosRequestConfig): string {
  return (config.url ?? '').split('?')[0] ?? ''
}

/** 이 요청에 토큰을 붙이는가 */
function attachesToken(config: AxiosRequestConfig): boolean {
  return !config.skipAuth && !NO_AUTH_URLS.includes(pathOf(config))
}

/** 이 요청의 401 에 재발급을 시도하는가 */
function renewsOn401(config: AxiosRequestConfig): boolean {
  return !config.skipAuth && !NO_RENEW_URLS.includes(pathOf(config))
}

/** 앱의 HTTP 클라이언트. 컴포넌트는 이것을 직접 쓰지 않고 이 폴더의 서비스 함수를 부른다 */
export const http = axios.create({
  // 응답이 10초 안에 오지 않으면 실패로 본다(화면에는 "서버에 연결할 수 없습니다" 가 나간다 — src/errors/)
  timeout: 10_000,
})

// ------------------------------------------------------------------
// 재발급 · 세션 종료 — 앱 시작 때 등록받는다
// ------------------------------------------------------------------

/** 인터셉터가 부르는 두 함수 */
export interface SessionHooks {
  /** 재발급을 한 번 해 보고, 새 액세스 토큰을 저장했으면 true · 실패면 false(예외를 던지지 않는다) */
  renewAccessToken: () => Promise<boolean>
  /** 세션을 끝낸다 — 토큰 · 사용자 정보를 비우고 로그인 화면으로(호출 쪽이 정한다) */
  endSession: () => void
}

let hooks: SessionHooks | null = null

/** 앱 시작 때(src/main.ts) 한 번 부른다. 테스트는 가짜 함수를 넣는다 */
export function registerSessionHooks(next: SessionHooks | null): void {
  hooks = next
}

/**
 * 진행 중인 재발급 — 🔴 여러 요청이 동시에 401 을 받아도 재발급은 한 번만 나간다(CLAUDE.md 6-3 의 2번).
 * 첫 401 이 이 약속(Promise)을 만들고, 그것이 끝나기 전에 온 401 들은 같은 약속을 기다린다.
 */
let renewing: Promise<boolean> | null = null

/**
 * 세션을 끝낸다 — 🔴 토큰은 여기서 먼저 지운다(등록된 함수가 없어도 토큰이 남지 않게).
 * 그다음 등록된 함수가 스토어를 로그아웃 상태로 만들고 로그인 화면으로 보낸다(src/main.ts).
 */
function endSession(): void {
  clearTokens()
  hooks?.endSession()
}

/** 재발급을 한 번만 돌리고 결과를 함께 나눈다. 실패면 세션 종료를 **한 번** 부른다 */
function renewOnce(): Promise<boolean> {
  if (renewing === null) {
    renewing = (async () => {
      // 재발급용 토큰이 없으면 해 볼 것도 없다
      const ok = getRefreshToken() !== null && hooks !== null && (await hooks.renewAccessToken())
      if (!ok) {
        endSession()
      }
      return ok
    })().finally(() => {
      renewing = null
    })
  }
  return renewing
}

// ------------------------------------------------------------------
// 인터셉터
// ------------------------------------------------------------------

// 요청: 토큰을 붙인다(붙이는 요청일 때만)
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (attachesToken(config) && token !== null) {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    // 다시 보내는 요청 등에 남아 있을 수 있는 헤더를 확실히 뗀다
    config.headers.delete('Authorization')
  }
  return config
})

// 응답: 401 이면 재발급 → 한 번만 다시 보낸다
http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // 응답이 없거나(연결 실패) 401 이 아니면 그대로 돌려준다
    if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) {
      throw error
    }
    const config = error.config

    // 로그인 · 재발급 · 만료 변경(그리고 로그아웃 · skipAuth)의 401 은 그대로 화면에 간다
    if (!renewsOn401(config)) {
      throw error
    }

    // 이미 한 번 다시 보낸 요청이 또 401 → 포기한다(CLAUDE.md 6-3 의 3번)
    if (config._retried) {
      endSession()
      throw error
    }

    // 이 요청이 나간 뒤에 다른 요청이 이미 재발급을 끝냈으면(토큰이 바뀌었으면) 재발급 없이 다시 보낸다
    const sentWith = config.headers.get('Authorization')
    const current = getAccessToken()
    const alreadyRenewed = current !== null && sentWith !== `Bearer ${current}`

    const ok = alreadyRenewed || (await renewOnce())
    if (!ok) {
      throw error
    }
    config._retried = true
    // 다시 보낼 때 요청 인터셉터가 새 토큰을 붙인다
    return http.request(config)
  },
)
