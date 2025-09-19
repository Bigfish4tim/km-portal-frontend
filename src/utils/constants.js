// constants.js - KM 포털 애플리케이션 상수 정의
// 파일 위치: src/utils/constants.js

/**
 * 애플리케이션 전반에서 사용되는 상수들을 정의
 *
 * 이 파일의 장점:
 * 1. 매직 넘버/문자열 제거로 코드 가독성 향상
 * 2. 중앙 집중식 관리로 수정이 용이
 * 3. 오타 방지 및 IDE 자동완성 지원
 * 4. 타입 안정성 제공
 */

// ====== 애플리케이션 기본 정보 ======

export const APP_INFO = {
  NAME: "KM 포털",
  VERSION: "1.0.0",
  DESCRIPTION: "KM 업무 포털 시스템",
  AUTHOR: "KM Portal Team",
  COPYRIGHT: "© 2025 KM Portal. All rights reserved.",
};

// ====== API 관련 상수 ======

export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
  },

  // 사용자 관리
  USER: {
    LIST: "/users",
    DETAIL: "/users", // + /{id}
    CREATE: "/users",
    UPDATE: "/users", // + /{id}
    DELETE: "/users", // + /{id}
    SEARCH: "/users/search",
    ROLES: "/users/roles",
  },

  // 파일 관리
  FILE: {
    UPLOAD: "/files/upload",
    DOWNLOAD: "/files/download", // + /{id}
    DELETE: "/files", // + /{id}
    LIST: "/files",
    SEARCH: "/files/search",
    METADATA: "/files/metadata", // + /{id}
  },

  // 게시판
  BOARD: {
    LIST: "/boards",
    DETAIL: "/boards", // + /{id}
    CREATE: "/boards",
    UPDATE: "/boards", // + /{id}
    DELETE: "/boards", // + /{id}
    SEARCH: "/boards/search",
  },

  // 댓글
  COMMENT: {
    LIST: "/comments", // ?boardId={id}
    CREATE: "/comments",
    UPDATE: "/comments", // + /{id}
    DELETE: "/comments", // + /{id}
  },

  // 대시보드
  DASHBOARD: {
    STATS: "/dashboard/stats",
    RECENT_ACTIVITIES: "/dashboard/activities",
    CHARTS: "/dashboard/charts",
  },

  // 헬스체크
  HEALTH: {
    STATUS: "/health/status",
  },
};

// ====== HTTP 상태 코드 ======

export const HTTP_STATUS = {
  // 성공
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 리다이렉션
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 클라이언트 오류
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 서버 오류
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// ====== 사용자 권한/역할 ======

export const USER_ROLES = {
  ADMIN: "ADMIN", // 시스템 관리자
  MANAGER: "MANAGER", // 부서 관리자
  USER: "USER", // 일반 사용자
  GUEST: "GUEST", // 손님 (읽기 전용)
};

export const USER_PERMISSIONS = {
  // 사용자 관리 권한
  USER_READ: "USER_READ",
  USER_WRITE: "USER_WRITE",
  USER_DELETE: "USER_DELETE",

  // 게시판 권한
  BOARD_READ: "BOARD_READ",
  BOARD_WRITE: "BOARD_WRITE",
  BOARD_DELETE: "BOARD_DELETE",

  // 파일 관리 권한
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_DOWNLOAD: "FILE_DOWNLOAD",
  FILE_DELETE: "FILE_DELETE",

  // 관리자 권한
  ADMIN_PANEL: "ADMIN_PANEL",
  SYSTEM_CONFIG: "SYSTEM_CONFIG",
};

// 역할별 기본 권한 매핑
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    USER_PERMISSIONS.USER_READ,
    USER_PERMISSIONS.USER_WRITE,
    USER_PERMISSIONS.USER_DELETE,
    USER_PERMISSIONS.BOARD_READ,
    USER_PERMISSIONS.BOARD_WRITE,
    USER_PERMISSIONS.BOARD_DELETE,
    USER_PERMISSIONS.FILE_UPLOAD,
    USER_PERMISSIONS.FILE_DOWNLOAD,
    USER_PERMISSIONS.FILE_DELETE,
    USER_PERMISSIONS.ADMIN_PANEL,
    USER_PERMISSIONS.SYSTEM_CONFIG,
  ],

  [USER_ROLES.MANAGER]: [
    USER_PERMISSIONS.USER_READ,
    USER_PERMISSIONS.BOARD_READ,
    USER_PERMISSIONS.BOARD_WRITE,
    USER_PERMISSIONS.BOARD_DELETE,
    USER_PERMISSIONS.FILE_UPLOAD,
    USER_PERMISSIONS.FILE_DOWNLOAD,
    USER_PERMISSIONS.FILE_DELETE,
  ],

  [USER_ROLES.USER]: [
    USER_PERMISSIONS.BOARD_READ,
    USER_PERMISSIONS.BOARD_WRITE,
    USER_PERMISSIONS.FILE_UPLOAD,
    USER_PERMISSIONS.FILE_DOWNLOAD,
  ],

  [USER_ROLES.GUEST]: [
    USER_PERMISSIONS.BOARD_READ,
    USER_PERMISSIONS.FILE_DOWNLOAD,
  ],
};

// ====== 파일 관련 상수 ======

export const FILE_CONSTRAINTS = {
  // 파일 크기 제한 (바이트 단위)
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_IMAGE: 5 * 1024 * 1024, // 이미지: 5MB
  MAX_SIZE_DOCUMENT: 20 * 1024 * 1024, // 문서: 20MB

  // 허용된 파일 타입
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],

  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "text/plain",
    "text/csv",
  ],

  // 파일 확장자
  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp", // 이미지
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx", // 오피스
    ".txt",
    ".csv", // 텍스트
  ],
};

// 파일 크기를 읽기 쉬운 형태로 변환하는 헬퍼 함수
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ====== 페이지네이션 ======

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10, // 기본 페이지 크기
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100], // 페이지 크기 옵션
  MAX_PAGE_SIZE: 100, // 최대 페이지 크기
  DEFAULT_PAGE: 1, // 기본 페이지 번호
};

// ====== 날짜/시간 형식 ======

export const DATE_FORMATS = {
  DATE: "YYYY-MM-DD", // 날짜만
  DATETIME: "YYYY-MM-DD HH:mm:ss", // 날짜 + 시간
  TIME: "HH:mm:ss", // 시간만
  MONTH: "YYYY-MM", // 년-월
  YEAR: "YYYY", // 년도만

  // 표시용 포맷
  DISPLAY_DATE: "YYYY년 MM월 DD일",
  DISPLAY_DATETIME: "YYYY년 MM월 DD일 HH:mm",
  DISPLAY_TIME: "HH시 mm분",
};

// ====== 검증 규칙 ======

export const VALIDATION_RULES = {
  // 이메일 검증
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // 비밀번호 검증 (최소 8자, 영문+숫자+특수문자 포함)
  PASSWORD_REGEX:
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,

  // 한국 휴대폰 번호
  PHONE_REGEX: /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/,

  // 길이 제한
  MAX_LENGTH: {
    TITLE: 100, // 제목
    CONTENT: 5000, // 내용
    COMMENT: 500, // 댓글
    NAME: 50, // 이름
    EMAIL: 100, // 이메일
    PHONE: 20, // 전화번호
  },

  MIN_LENGTH: {
    PASSWORD: 8, // 비밀번호 최소 길이
    TITLE: 2, // 제목 최소 길이
    CONTENT: 10, // 내용 최소 길이
  },
};

// ====== UI 상수 ======

export const UI_CONSTANTS = {
  // 로딩 지연 시간 (ms)
  LOADING_DELAY: 200,

  // 메시지 표시 시간 (ms)
  MESSAGE_DURATION: 3000,
  SUCCESS_MESSAGE_DURATION: 2000,
  ERROR_MESSAGE_DURATION: 5000,

  // 애니메이션 시간 (ms)
  ANIMATION_DURATION: 300,
  FAST_ANIMATION: 150,
  SLOW_ANIMATION: 500,

  // 디바운스 시간 (검색 등)
  DEBOUNCE_DELAY: 300,

  // 테이블 행 높이
  TABLE_ROW_HEIGHT: 48,

  // 사이드바 설정
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 64,
};

// ====== 로컬스토리지 키 ======

export const STORAGE_KEYS = {
  // 인증 관련
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_INFO: "user_info",

  // UI 설정
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
  THEME: "theme",
  LANGUAGE: "language",

  // 사용자 설정
  PAGE_SIZE: "page_size",
  TABLE_COLUMNS: "table_columns",
};

// ====== 이벤트 이름 ======

export const EVENT_NAMES = {
  // 전역 이벤트
  USER_LOGIN: "user:login",
  USER_LOGOUT: "user:logout",
  USER_PROFILE_UPDATED: "user:profile-updated",

  // 파일 이벤트
  FILE_UPLOADED: "file:uploaded",
  FILE_DELETED: "file:deleted",

  // UI 이벤트
  SIDEBAR_TOGGLE: "ui:sidebar-toggle",
  THEME_CHANGED: "ui:theme-changed",
};

// ====== 오류 메시지 ======

export const ERROR_MESSAGES = {
  // 네트워크 오류
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  TIMEOUT_ERROR: "요청 시간이 초과되었습니다.",

  // 인증 오류
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "접근 권한이 없습니다.",
  TOKEN_EXPIRED: "로그인이 만료되었습니다. 다시 로그인해주세요.",

  // 검증 오류
  REQUIRED_FIELD: "필수 입력 항목입니다.",
  INVALID_EMAIL: "올바른 이메일 주소를 입력해주세요.",
  INVALID_PASSWORD:
    "비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.",
  INVALID_PHONE: "올바른 휴대폰 번호를 입력해주세요.",

  // 파일 오류
  FILE_TOO_LARGE: "파일 크기가 제한을 초과했습니다.",
  INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다.",

  // 일반 오류
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
  SERVER_ERROR: "서버에서 오류가 발생했습니다.",
};

// ====== 성공 메시지 ======

export const SUCCESS_MESSAGES = {
  // 인증 관련
  LOGIN_SUCCESS: "로그인되었습니다.",
  LOGOUT_SUCCESS: "로그아웃되었습니다.",
  REGISTER_SUCCESS: "회원가입이 완료되었습니다.",

  // CRUD 작업
  CREATE_SUCCESS: "성공적으로 생성되었습니다.",
  UPDATE_SUCCESS: "성공적으로 수정되었습니다.",
  DELETE_SUCCESS: "성공적으로 삭제되었습니다.",

  // 파일 관련
  FILE_UPLOAD_SUCCESS: "파일이 업로드되었습니다.",
  FILE_DELETE_SUCCESS: "파일이 삭제되었습니다.",

  // 기타
  SAVE_SUCCESS: "저장되었습니다.",
  COPY_SUCCESS: "복사되었습니다.",
};

// 기본 내보내기
export default {
  APP_INFO,
  API_ENDPOINTS,
  HTTP_STATUS,
  USER_ROLES,
  USER_PERMISSIONS,
  ROLE_PERMISSIONS,
  FILE_CONSTRAINTS,
  PAGINATION,
  DATE_FORMATS,
  VALIDATION_RULES,
  UI_CONSTANTS,
  STORAGE_KEYS,
  EVENT_NAMES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  formatFileSize,
};
