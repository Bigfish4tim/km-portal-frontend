/**
 * 모의 응답 — `GET /api/auth/me` 를 토큰 없이 불렀을 때.
 *
 * 🔴 모의 응답은 근거가 있어야 한다(CLAUDE.md 8장). 계약과 어긋나면 테스트가 거짓으로 통과한다.
 *
 * 근거(백엔드 · 2026-11-19 작업 폴더 기준):
 *   - 상태 401 · 문구: controller/AuthController.java:406-413
 *       (미인증이면 `ApiResponse.failure("인증이 필요합니다.")` 를 401 로 돌려준다)
 *   - errorCode 'GENERAL_ERROR': dto/common/ApiResponse.java:195-197
 *       (한 인자 failure 는 errorCode 를 GENERAL_ERROR 로 채운다. 이 경로는 엔트리 포인트를 지나지 않아
 *        UNAUTHORIZED 가 아니다)
 *   - 봉투의 키: dto/common/ApiResponse.java:48-79 · docs/규약/2026-10-23_응답규약.md:40-56
 *
 * 확인하지 못한 것: `timestamp` 의 직렬화 형식(문자열인지 배열인지). 아래 값은 합성 값이다.
 *   환경 점검 화면은 본문을 읽지 않고 상태 코드만 쓰므로(src/api/serverCheck.ts) 이 테스트의 결과에는
 *   영향이 없다. 본문을 읽는 화면(B-2)의 모의 응답을 만들 때는 실제 응답으로 확인한다.
 */
export const AUTH_ME_URL = '**/api/auth/me'

export const authMeUnauthorized = {
  status: 401,
  body: {
    success: false,
    message: '인증이 필요합니다.',
    data: null,
    errorCode: 'GENERAL_ERROR',
    timestamp: '2026-01-01T00:00:00',
    // 실제 응답에 실리는 "의도되지 않은" 키다(응답규약 :56). 화면은 이 키에 의존하지 않는다.
    failure: true,
  },
} as const
