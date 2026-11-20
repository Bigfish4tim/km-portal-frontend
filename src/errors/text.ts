/**
 * 화면이 만드는 문구 — 🔴 한 파일에 모은다(CLAUDE.md 5장 6번 · 명세 B-2a 4-3).
 *
 * 무엇을: 서버가 주지 않고 화면이 스스로 보여 주는 문구 전부(빈 칸 안내 · 연결 실패 · 비밀번호 안내문 등).
 * 왜 한 곳: 같은 뜻의 문구가 화면마다 조금씩 달라지는 것을 막는다.
 *
 * ⛔ 여기에 두지 않는 것:
 *   - 서버가 주는 문구(로그인 실패 · 규칙 위반 · 성공 안내) — 서버의 `message` 를 그대로 보여 준다.
 *     🔴 특히 로그인 실패 문구를 여기 다시 적지 않는다(명세 B-2a 3-2 · 7장 5번).
 *   - 비밀번호 규칙의 위반 문구 — 서버 문구와 글자가 같아야 해서 `src/validation/password.ts` 가 가진다.
 */
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RUN_LENGTH,
} from '@/validation/password'

/** 화면 문구(명세 B-2a 4-3 의 표 + B-1 환경 점검 화면에서 옮겨 온 것) */
export const TEXT = {
  // ---- 로그인 · 비밀번호 화면 (명세 B-2a 4-3) ----
  LOGIN_PROMPT: '아이디와 비밀번호를 입력하여 주세요.',
  REQUIRED_ID: '아이디를 입력하여 주세요.',
  REQUIRED_PASSWORD: '비밀번호를 입력하여 주세요.',
  /** 명세에 없어 정했다(구현보고 "임의로 정한 것") — 변경 화면의 "현재 비밀번호" 칸이 비었을 때 */
  REQUIRED_CURRENT_PASSWORD: '현재 비밀번호를 입력하여 주세요.',
  MUST_CHANGE: '비밀번호를 변경해야 사용 가능합니다.',
  CONFIRM_MISMATCH: '새비밀번호와 새비밀번호 확인이 일치하지 않습니다.',
  TEMP_PASSWORD_NOT_READY: '임시비밀번호 발급은 준비 중입니다. 관리자에게 문의하세요.',
  POPUP_BLOCKED: '브라우저가 팝업창을 막았습니다. 이 창에서 엽니다.',
  SESSION_ENDED: '로그인이 만료되었습니다. 다시 로그인해 주세요.',

  // ---- 오류 응답을 문구로 바꿀 때 (src/errors/describeError.ts) ----
  INVALID_INPUT: '입력값을 확인해 주세요.',
  NOT_FOUND: '요청한 대상을 찾을 수 없습니다.',
  UNEXPECTED: '처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  SERVER_UNREACHABLE: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',

  // ---- 비밀번호 입력 중 안내(새비밀번호 칸 아래 · 환경 점검 화면) ----
  PASSWORD_PRECHECK_OK: '사전 검사 통과(최종 판정은 서버가 합니다)',

  // ---- 첫 화면 ----
  LOGGED_IN: '로그인되었습니다',
} as const

/**
 * 비밀번호 안내문 — 변경 창 · 본인 변경 화면의 오른쪽(명세 B-2a 4-3).
 *
 * 숫자는 검사 모듈의 상수에서 가져온다 — 규칙이 바뀌면 안내문도 함께 바뀐다.
 * 5번은 권고다(서버가 검사하지 않는다).
 * ⚠️ 레거시 안내문의 뜻을 새 규칙에 맞춰 쓴 것이다. 레거시의 글자 그대로가 아니다(미결 — 준호님이 화면에서 본다).
 */
export const PASSWORD_GUIDE: readonly string[] = [
  `${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자의 영문, 숫자, 특수문자를 모두 조합하여 사용하실 수 있습니다.`,
  '공백과 한글은 사용할 수 없습니다.',
  `같은 글자의 반복(aaa), 연속된 숫자/문자(123/abc)는 ${PASSWORD_RUN_LENGTH}글자 이상 사용할 수 없습니다.`,
  '현재 사용하는 비밀번호와 최근 12개월 안에 사용한 비밀번호는 사용할 수 없습니다.',
  '생년월일, 전화번호, 이름 등 개인정보와 관련된 숫자는 다른 사람이 쉽게 알아낼 수 있으니 사용하지 마세요.',
  '비밀번호는 3개월마다 변경해야 합니다.',
]

/** 환경 점검 화면(`/env-check` · 개발 서버에서만)의 문구 — B-1 의 EnvCheckView.vue 에서 옮겨 왔다(명세 B-2a 4-3) */
export const ENV_CHECK_TEXT = {
  TITLE: '환경 점검',
  PASSWORD_LABEL: '비밀번호 사전 검사',
  PASSWORD_PLACEHOLDER: '아무 값이나 쳐 보세요(어디에도 보내지 않습니다)',
  SERVER_BUTTON: '서버 확인',
  SERVER_IDLE: '아직 확인하지 않았습니다',
  SERVER_CHECKING: '확인하는 중입니다',
  SERVER_OK: (status: number) => `서버 응답: ${status}(정상 — 로그인하지 않은 상태)`,
  SERVER_UNEXPECTED: (status: number, expected: number) =>
    `서버 응답: ${status}(예상과 다릅니다 — ${expected} 이어야 합니다)`,
  SERVER_UNREACHABLE: '서버에 닿지 않습니다',
  SERVER_GATEWAY: (status: number) => `서버에 닿지 않습니다(프록시 응답: ${status})`,
} as const
