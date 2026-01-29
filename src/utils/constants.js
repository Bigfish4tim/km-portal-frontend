// ============================================
// constants.js - KM 손해사정 포털 애플리케이션 상수 정의
// ============================================
// 📌 1일차 수정 (2025-01-21)
// - 기존 4개 USER_ROLES → 12개 ROLES로 확장
// - 손해사정 업무에 맞는 새로운 Role 상수 추가
// - 1종/4종 접근 권한 헬퍼 함수 추가
// ============================================
// 파일 위치: src/utils/constants.js
//
// 이 파일의 장점:
// 1. 매직 넘버/문자열 제거로 코드 가독성 향상
// 2. 중앙 집중식 관리로 수정이 용이
// 3. 오타 방지 및 IDE 자동완성 지원
// 4. 타입 안정성 제공
// ============================================

// ====== 애플리케이션 기본 정보 ======

export const APP_INFO = {
    NAME: 'KM 손해사정 포털',
    VERSION: '2.0.0', // 1일차 수정: 버전 업데이트
    DESCRIPTION: 'KM 손해사정 업무 포털 시스템',
    AUTHOR: 'KM Portal Team',
    COPYRIGHT: '© 2025 KM Portal. All rights reserved.',
}

// ====== API 관련 상수 ======

export const API_ENDPOINTS = {
    // 인증 관련
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile',
        CHANGE_PASSWORD: '/auth/change-password',
    },

    // 사용자 관리
    USER: {
        LIST: '/users',
        DETAIL: '/users', // + /{id}
        CREATE: '/users',
        UPDATE: '/users', // + /{id}
        DELETE: '/users', // + /{id}
        SEARCH: '/users/search',
        ROLES: '/users/roles',
    },

    // 역할 관리 (1일차: Role API 강조)
    ROLE: {
        LIST: '/roles',
        ACTIVE: '/roles/active',
        SYSTEM: '/roles/system',
        DETAIL: '/roles', // + /{id}
        STATISTICS: '/roles/statistics',
        CHECK_NAME: '/roles/check-name',
    },

    // 파일 관리
    FILE: {
        UPLOAD: '/files/upload',
        DOWNLOAD: '/files/download', // + /{id}
        DELETE: '/files', // + /{id}
        LIST: '/files',
        SEARCH: '/files/search',
        METADATA: '/files/metadata', // + /{id}
    },

    // 게시판
    BOARD: {
        LIST: '/boards',
        DETAIL: '/boards', // + /{id}
        CREATE: '/boards',
        UPDATE: '/boards', // + /{id}
        DELETE: '/boards', // + /{id}
        SEARCH: '/boards/search',
    },

    // 댓글
    COMMENT: {
        LIST: '/comments', // ?boardId={id}
        CREATE: '/comments',
        UPDATE: '/comments', // + /{id}
        DELETE: '/comments', // + /{id}
    },

    // 대시보드
    DASHBOARD: {
        STATS: '/dashboard/stats',
        RECENT_ACTIVITIES: '/dashboard/activities',
        CHARTS: '/dashboard/charts',
    },

    // 헬스체크
    HEALTH: {
        STATUS: '/health/status',
    },
}

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
}

// ============================================
// 📌 [1일차 수정] 사용자 권한/역할 - 12개 Role 시스템
// ============================================
// 요구사항 명세서 ROL-FE-001에 따른 Frontend Role 상수
// Spring Security의 ROLE_ 접두사 규칙 적용
// ============================================

/**
 * 손해사정 업무용 역할 상수 (12개)
 *
 * [역할 그룹]
 * - 관리: ADMIN, BUSINESS_SUPPORT
 * - 임원: EXECUTIVE_ALL, EXECUTIVE_TYPE1, EXECUTIVE_TYPE4
 * - 팀장: TEAM_LEADER_ALL, TEAM_LEADER_TYPE1, TEAM_LEADER_TYPE4
 * - 조사자: INVESTIGATOR_ALL, INVESTIGATOR_TYPE1, INVESTIGATOR_TYPE4
 * - 일반: EMPLOYEE
 *
 * [사용 예시]
 * import { ROLES } from '@/utils/constants'
 *
 * // 권한 체크
 * if (user.role === ROLES.ADMIN) { ... }
 *
 * // 라우터 가드에서 사용
 * meta: { roles: [ROLES.ADMIN, ROLES.BUSINESS_SUPPORT] }
 */
export const ROLES = {
    // 관리 역할
    ADMIN: 'ROLE_ADMIN', // 관리자 (우선순위: 1)
    BUSINESS_SUPPORT: 'ROLE_BUSINESS_SUPPORT', // 경영지원 (우선순위: 5)

    // 임원 역할
    EXECUTIVE_ALL: 'ROLE_EXECUTIVE_ALL', // 임원(1/4종) (우선순위: 10)
    EXECUTIVE_TYPE1: 'ROLE_EXECUTIVE_TYPE1', // 임원(1종) (우선순위: 11)
    EXECUTIVE_TYPE4: 'ROLE_EXECUTIVE_TYPE4', // 임원(4종) (우선순위: 12)

    // 팀장 역할
    TEAM_LEADER_ALL: 'ROLE_TEAM_LEADER_ALL', // 팀장(1/4종) (우선순위: 20)
    TEAM_LEADER_TYPE1: 'ROLE_TEAM_LEADER_TYPE1', // 팀장(1종) (우선순위: 21)
    TEAM_LEADER_TYPE4: 'ROLE_TEAM_LEADER_TYPE4', // 팀장(4종) (우선순위: 22)

    // 조사자 역할
    INVESTIGATOR_ALL: 'ROLE_INVESTIGATOR_ALL', // 조사자(1/4종) (우선순위: 30)
    INVESTIGATOR_TYPE1: 'ROLE_INVESTIGATOR_TYPE1', // 조사자(1종) (우선순위: 31)
    INVESTIGATOR_TYPE4: 'ROLE_INVESTIGATOR_TYPE4', // 조사자(4종) (우선순위: 32)

    // 일반 역할
    EMPLOYEE: 'ROLE_EMPLOYEE', // 일반사원 (우선순위: 100)
}

/**
 * 역할 표시명 (한글)
 *
 * [사용 예시]
 * import { ROLES, ROLE_DISPLAY_NAMES } from '@/utils/constants'
 *
 * const roleName = ROLE_DISPLAY_NAMES[user.role]
 * // "관리자", "경영지원", "임원(1/4종)" 등
 */
export const ROLE_DISPLAY_NAMES = {
    [ROLES.ADMIN]: '관리자',
    [ROLES.BUSINESS_SUPPORT]: '경영지원',
    [ROLES.EXECUTIVE_ALL]: '임원(1/4종)',
    [ROLES.EXECUTIVE_TYPE1]: '임원(1종)',
    [ROLES.EXECUTIVE_TYPE4]: '임원(4종)',
    [ROLES.TEAM_LEADER_ALL]: '팀장(1/4종)',
    [ROLES.TEAM_LEADER_TYPE1]: '팀장(1종)',
    [ROLES.TEAM_LEADER_TYPE4]: '팀장(4종)',
    [ROLES.INVESTIGATOR_ALL]: '조사자(1/4종)',
    [ROLES.INVESTIGATOR_TYPE1]: '조사자(1종)',
    [ROLES.INVESTIGATOR_TYPE4]: '조사자(4종)',
    [ROLES.EMPLOYEE]: '일반사원',
}

/**
 * 역할 우선순위 (숫자가 낮을수록 높은 권한)
 */
export const ROLE_PRIORITIES = {
    [ROLES.ADMIN]: 1,
    [ROLES.BUSINESS_SUPPORT]: 5,
    [ROLES.EXECUTIVE_ALL]: 10,
    [ROLES.EXECUTIVE_TYPE1]: 11,
    [ROLES.EXECUTIVE_TYPE4]: 12,
    [ROLES.TEAM_LEADER_ALL]: 20,
    [ROLES.TEAM_LEADER_TYPE1]: 21,
    [ROLES.TEAM_LEADER_TYPE4]: 22,
    [ROLES.INVESTIGATOR_ALL]: 30,
    [ROLES.INVESTIGATOR_TYPE1]: 31,
    [ROLES.INVESTIGATOR_TYPE4]: 32,
    [ROLES.EMPLOYEE]: 100,
}

/**
 * 역할 옵션 목록 (드롭다운 등에서 사용)
 *
 * [사용 예시]
 * <el-select v-model="selectedRole">
 *   <el-option
 *     v-for="role in ROLE_OPTIONS"
 *     :key="role.value"
 *     :label="role.label"
 *     :value="role.value"
 *   />
 * </el-select>
 */
export const ROLE_OPTIONS = [
    { value: ROLES.ADMIN, label: '관리자', priority: 1 },
    { value: ROLES.BUSINESS_SUPPORT, label: '경영지원', priority: 5 },
    { value: ROLES.EXECUTIVE_ALL, label: '임원(1/4종)', priority: 10 },
    { value: ROLES.EXECUTIVE_TYPE1, label: '임원(1종)', priority: 11 },
    { value: ROLES.EXECUTIVE_TYPE4, label: '임원(4종)', priority: 12 },
    { value: ROLES.TEAM_LEADER_ALL, label: '팀장(1/4종)', priority: 20 },
    { value: ROLES.TEAM_LEADER_TYPE1, label: '팀장(1종)', priority: 21 },
    { value: ROLES.TEAM_LEADER_TYPE4, label: '팀장(4종)', priority: 22 },
    { value: ROLES.INVESTIGATOR_ALL, label: '조사자(1/4종)', priority: 30 },
    { value: ROLES.INVESTIGATOR_TYPE1, label: '조사자(1종)', priority: 31 },
    { value: ROLES.INVESTIGATOR_TYPE4, label: '조사자(4종)', priority: 32 },
    { value: ROLES.EMPLOYEE, label: '일반사원', priority: 100 },
]

// ============================================
// 📌 [1일차 신규] 1종/4종 접근 권한 설정
// ============================================
// 요구사항 명세서 8.1 1종/4종 접근 권한 매트릭스 기반
// ============================================

/**
 * 1종 업무 접근 가능 역할 목록
 */
export const TYPE1_ACCESS_ROLES = [
    ROLES.ADMIN,
    ROLES.BUSINESS_SUPPORT,
    ROLES.EXECUTIVE_ALL,
    ROLES.EXECUTIVE_TYPE1,
    ROLES.TEAM_LEADER_ALL,
    ROLES.TEAM_LEADER_TYPE1,
    ROLES.INVESTIGATOR_ALL,
    ROLES.INVESTIGATOR_TYPE1,
]

/**
 * 4종 업무 접근 가능 역할 목록
 */
export const TYPE4_ACCESS_ROLES = [
    ROLES.ADMIN,
    ROLES.BUSINESS_SUPPORT,
    ROLES.EXECUTIVE_ALL,
    ROLES.EXECUTIVE_TYPE4,
    ROLES.TEAM_LEADER_ALL,
    ROLES.TEAM_LEADER_TYPE4,
    ROLES.INVESTIGATOR_ALL,
    ROLES.INVESTIGATOR_TYPE4,
]

// ============================================
// 📌 [1일차 신규] 업무별 권한 설정
// ============================================
// 요구사항 명세서 8.2 업무별 권한 매트릭스 기반
// ============================================

/**
 * 접수 권한 역할 목록
 */
export const RECEPTION_ACCESS_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_SUPPORT]

/**
 * 배당 권한 역할 목록
 */
export const ASSIGNMENT_ACCESS_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_SUPPORT]

/**
 * 조사 권한 역할 목록
 */
export const INVESTIGATION_ACCESS_ROLES = [
    ROLES.ADMIN,
    ROLES.TEAM_LEADER_ALL,
    ROLES.TEAM_LEADER_TYPE1,
    ROLES.TEAM_LEADER_TYPE4,
    ROLES.INVESTIGATOR_ALL,
    ROLES.INVESTIGATOR_TYPE1,
    ROLES.INVESTIGATOR_TYPE4,
]

/**
 * 보고서 작성 권한 역할 목록
 */
export const REPORT_ACCESS_ROLES = [
    ROLES.ADMIN,
    ROLES.TEAM_LEADER_ALL,
    ROLES.TEAM_LEADER_TYPE1,
    ROLES.TEAM_LEADER_TYPE4,
    ROLES.INVESTIGATOR_ALL,
    ROLES.INVESTIGATOR_TYPE1,
    ROLES.INVESTIGATOR_TYPE4,
]

/**
 * 검토 권한 역할 목록
 */
export const REVIEW_ACCESS_ROLES = [
    ROLES.ADMIN,
    ROLES.EXECUTIVE_ALL,
    ROLES.EXECUTIVE_TYPE1,
    ROLES.EXECUTIVE_TYPE4,
    ROLES.TEAM_LEADER_ALL,
    ROLES.TEAM_LEADER_TYPE1,
    ROLES.TEAM_LEADER_TYPE4,
]

/**
 * 전송 권한 역할 목록
 */
export const TRANSMISSION_ACCESS_ROLES = [ROLES.ADMIN, ROLES.BUSINESS_SUPPORT]

// ============================================
// 📌 [1일차 신규] 권한 체크 헬퍼 함수
// ============================================

/**
 * 1종 업무 접근 가능 여부 확인
 *
 * @param {string} role - 사용자 역할 (ROLE_* 형식)
 * @returns {boolean} 접근 가능 여부
 *
 * @example
 * if (canAccessType1(user.role)) {
 *   // 1종 업무 화면 표시
 * }
 */
export const canAccessType1 = (role) => {
    return TYPE1_ACCESS_ROLES.includes(role)
}

/**
 * 4종 업무 접근 가능 여부 확인
 *
 * @param {string} role - 사용자 역할 (ROLE_* 형식)
 * @returns {boolean} 접근 가능 여부
 *
 * @example
 * if (canAccessType4(user.role)) {
 *   // 4종 업무 화면 표시
 * }
 */
export const canAccessType4 = (role) => {
    return TYPE4_ACCESS_ROLES.includes(role)
}

/**
 * 관리자급 권한 확인 (관리자 또는 경영지원)
 *
 * @param {string} role - 사용자 역할
 * @returns {boolean} 관리자급 여부
 */
export const isAdminLevel = (role) => {
    return role === ROLES.ADMIN || role === ROLES.BUSINESS_SUPPORT
}

/**
 * 임원급 이상 권한 확인
 *
 * @param {string} role - 사용자 역할
 * @returns {boolean} 임원급 이상 여부
 */
export const isExecutiveLevel = (role) => {
    return [ROLES.ADMIN, ROLES.EXECUTIVE_ALL, ROLES.EXECUTIVE_TYPE1, ROLES.EXECUTIVE_TYPE4].includes(role)
}

/**
 * 팀장급 이상 권한 확인
 *
 * @param {string} role - 사용자 역할
 * @returns {boolean} 팀장급 이상 여부
 */
export const isTeamLeaderLevel = (role) => {
    return [
        ROLES.ADMIN,
        ROLES.BUSINESS_SUPPORT,
        ROLES.EXECUTIVE_ALL,
        ROLES.EXECUTIVE_TYPE1,
        ROLES.EXECUTIVE_TYPE4,
        ROLES.TEAM_LEADER_ALL,
        ROLES.TEAM_LEADER_TYPE1,
        ROLES.TEAM_LEADER_TYPE4,
    ].includes(role)
}

/**
 * 조사자급 이상 권한 확인
 *
 * @param {string} role - 사용자 역할
 * @returns {boolean} 조사자급 이상 여부
 */
export const isInvestigatorLevel = (role) => {
    return role !== ROLES.EMPLOYEE // 일반사원만 제외
}

/**
 * 역할 간 우선순위 비교
 *
 * @param {string} role1 - 비교할 역할 1
 * @param {string} role2 - 비교할 역할 2
 * @returns {number} role1이 더 높은 권한이면 -1, 같으면 0, 낮으면 1
 *
 * @example
 * // 정렬에 사용
 * users.sort((a, b) => compareRolePriority(a.role, b.role))
 */
export const compareRolePriority = (role1, role2) => {
    const priority1 = ROLE_PRIORITIES[role1] || 999
    const priority2 = ROLE_PRIORITIES[role2] || 999

    if (priority1 < priority2) return -1
    if (priority1 > priority2) return 1
    return 0
}

/**
 * 특정 업무에 대한 접근 권한 확인
 *
 * @param {string} role - 사용자 역할
 * @param {string} task - 업무 유형 ('reception', 'assignment', 'investigation', 'report', 'review', 'transmission')
 * @returns {boolean} 접근 가능 여부
 *
 * @example
 * if (hasTaskPermission(user.role, 'review')) {
 *   // 검토 버튼 표시
 * }
 */
export const hasTaskPermission = (role, task) => {
    const taskRoleMap = {
        reception: RECEPTION_ACCESS_ROLES,
        assignment: ASSIGNMENT_ACCESS_ROLES,
        investigation: INVESTIGATION_ACCESS_ROLES,
        report: REPORT_ACCESS_ROLES,
        review: REVIEW_ACCESS_ROLES,
        transmission: TRANSMISSION_ACCESS_ROLES,
    }

    const allowedRoles = taskRoleMap[task]
    if (!allowedRoles) return false

    return allowedRoles.includes(role)
}

// ============================================
// [기존 코드 유지] 하위 호환성을 위해 USER_ROLES 유지
// ============================================
// 기존 코드에서 USER_ROLES를 사용하는 경우를 위해 유지
// 신규 코드에서는 ROLES 사용을 권장
// ============================================

/**
 * @deprecated ROLES 상수 사용을 권장합니다.
 */
export const USER_ROLES = {
    ADMIN: 'ROLE_ADMIN',
    BUSINESS_SUPPORT: 'ROLE_BUSINESS_SUPPORT', // 1일차 수정: MANAGER → BUSINESS_SUPPORT
    EMPLOYEE: 'ROLE_EMPLOYEE', // 1일차 수정: USER → EMPLOYEE
}

export const USER_PERMISSIONS = {
    // 사용자 관리 권한
    USER_READ: 'USER_READ',
    USER_WRITE: 'USER_WRITE',
    USER_DELETE: 'USER_DELETE',

    // 게시판 권한
    BOARD_READ: 'BOARD_READ',
    BOARD_WRITE: 'BOARD_WRITE',
    BOARD_DELETE: 'BOARD_DELETE',

    // 파일 관리 권한
    FILE_UPLOAD: 'FILE_UPLOAD',
    FILE_DOWNLOAD: 'FILE_DOWNLOAD',
    FILE_DELETE: 'FILE_DELETE',

    // 관리자 권한
    ADMIN_PANEL: 'ADMIN_PANEL',
    SYSTEM_CONFIG: 'SYSTEM_CONFIG',

    // [1일차 신규] 손해사정 업무 권한
    INVESTIGATION_RECEPTION: 'INVESTIGATION_RECEPTION', // 접수
    INVESTIGATION_ASSIGNMENT: 'INVESTIGATION_ASSIGNMENT', // 배당
    INVESTIGATION_CONDUCT: 'INVESTIGATION_CONDUCT', // 조사
    INVESTIGATION_REPORT: 'INVESTIGATION_REPORT', // 보고서
    INVESTIGATION_REVIEW: 'INVESTIGATION_REVIEW', // 검토
    INVESTIGATION_TRANSMISSION: 'INVESTIGATION_TRANSMISSION', // 전송
}

// 역할별 기본 권한 매핑 (1일차 수정)
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
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
        USER_PERMISSIONS.INVESTIGATION_RECEPTION,
        USER_PERMISSIONS.INVESTIGATION_ASSIGNMENT,
        USER_PERMISSIONS.INVESTIGATION_CONDUCT,
        USER_PERMISSIONS.INVESTIGATION_REPORT,
        USER_PERMISSIONS.INVESTIGATION_REVIEW,
        USER_PERMISSIONS.INVESTIGATION_TRANSMISSION,
    ],

    [ROLES.BUSINESS_SUPPORT]: [
        USER_PERMISSIONS.USER_READ,
        USER_PERMISSIONS.BOARD_READ,
        USER_PERMISSIONS.BOARD_WRITE,
        USER_PERMISSIONS.FILE_UPLOAD,
        USER_PERMISSIONS.FILE_DOWNLOAD,
        USER_PERMISSIONS.INVESTIGATION_RECEPTION,
        USER_PERMISSIONS.INVESTIGATION_ASSIGNMENT,
        USER_PERMISSIONS.INVESTIGATION_TRANSMISSION,
    ],

    [ROLES.EXECUTIVE_ALL]: [USER_PERMISSIONS.BOARD_READ, USER_PERMISSIONS.FILE_DOWNLOAD, USER_PERMISSIONS.INVESTIGATION_REVIEW],

    [ROLES.TEAM_LEADER_ALL]: [
        USER_PERMISSIONS.BOARD_READ,
        USER_PERMISSIONS.BOARD_WRITE,
        USER_PERMISSIONS.FILE_UPLOAD,
        USER_PERMISSIONS.FILE_DOWNLOAD,
        USER_PERMISSIONS.INVESTIGATION_CONDUCT,
        USER_PERMISSIONS.INVESTIGATION_REPORT,
        USER_PERMISSIONS.INVESTIGATION_REVIEW,
    ],

    [ROLES.INVESTIGATOR_ALL]: [
        USER_PERMISSIONS.BOARD_READ,
        USER_PERMISSIONS.BOARD_WRITE,
        USER_PERMISSIONS.FILE_UPLOAD,
        USER_PERMISSIONS.FILE_DOWNLOAD,
        USER_PERMISSIONS.INVESTIGATION_CONDUCT,
        USER_PERMISSIONS.INVESTIGATION_REPORT,
    ],

    [ROLES.EMPLOYEE]: [USER_PERMISSIONS.BOARD_READ, USER_PERMISSIONS.FILE_DOWNLOAD],
}

// ====== 파일 관련 상수 ======

export const FILE_CONSTRAINTS = {
    // 파일 크기 제한 (바이트 단위)
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_SIZE_IMAGE: 5 * 1024 * 1024, // 이미지: 5MB
    MAX_SIZE_DOCUMENT: 20 * 1024 * 1024, // 문서: 20MB

    // 허용된 파일 타입
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],

    ALLOWED_DOCUMENT_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain',
        'text/csv',
        'application/x-hwp', // 한글 파일 (1일차 추가)
    ],

    // 파일 확장자
    ALLOWED_EXTENSIONS: [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp', // 이미지
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx', // 오피스
        '.hwp', // 한글 (1일차 추가)
        '.txt',
        '.csv', // 텍스트
    ],
}

// 파일 크기를 읽기 쉬운 형태로 변환하는 헬퍼 함수
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ====== 페이지네이션 ======

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10, // 기본 페이지 크기
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100], // 페이지 크기 옵션
    MAX_PAGE_SIZE: 100, // 최대 페이지 크기
    DEFAULT_PAGE: 1, // 기본 페이지 번호
}

// ====== 날짜/시간 형식 ======

export const DATE_FORMATS = {
    DATE: 'YYYY-MM-DD', // 날짜만
    DATETIME: 'YYYY-MM-DD HH:mm:ss', // 날짜 + 시간
    TIME: 'HH:mm:ss', // 시간만
    MONTH: 'YYYY-MM', // 년-월
    YEAR: 'YYYY', // 년도만

    // 표시용 포맷
    DISPLAY_DATE: 'YYYY년 MM월 DD일',
    DISPLAY_DATETIME: 'YYYY년 MM월 DD일 HH:mm',
    DISPLAY_TIME: 'HH시 mm분',
}

// ====== 검증 규칙 ======

export const VALIDATION_RULES = {
    // 이메일 검증
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // 비밀번호 검증 (최소 8자, 영문+숫자+특수문자 포함)
    PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,

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
}

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
}

// ====== 로컬스토리지 키 ======

export const STORAGE_KEYS = {
    // 인증 관련
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_INFO: 'user_info',

    // UI 설정
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    THEME: 'theme',
    LANGUAGE: 'language',

    // 사용자 설정
    PAGE_SIZE: 'page_size',
    TABLE_COLUMNS: 'table_columns',
}

// ====== 이벤트 이름 ======

export const EVENT_NAMES = {
    // 전역 이벤트
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_PROFILE_UPDATED: 'user:profile-updated',

    // 파일 이벤트
    FILE_UPLOADED: 'file:uploaded',
    FILE_DELETED: 'file:deleted',

    // UI 이벤트
    SIDEBAR_TOGGLE: 'ui:sidebar-toggle',
    THEME_CHANGED: 'ui:theme-changed',
}

// ====== 오류 메시지 ======

export const ERROR_MESSAGES = {
    // 네트워크 오류
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',

    // 인증 오류
    UNAUTHORIZED: '로그인이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
    TOKEN_EXPIRED: '로그인이 만료되었습니다. 다시 로그인해주세요.',

    // 검증 오류
    REQUIRED_FIELD: '필수 입력 항목입니다.',
    INVALID_EMAIL: '올바른 이메일 주소를 입력해주세요.',
    INVALID_PASSWORD: '비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.',
    INVALID_PHONE: '올바른 휴대폰 번호를 입력해주세요.',

    // 파일 오류
    FILE_TOO_LARGE: '파일 크기가 제한을 초과했습니다.',
    INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',

    // 일반 오류
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
    SERVER_ERROR: '서버에서 오류가 발생했습니다.',
}

// ====== 성공 메시지 ======

export const SUCCESS_MESSAGES = {
    // 인증 관련
    LOGIN_SUCCESS: '로그인되었습니다.',
    LOGOUT_SUCCESS: '로그아웃되었습니다.',
    REGISTER_SUCCESS: '회원가입이 완료되었습니다.',

    // CRUD 작업
    CREATE_SUCCESS: '성공적으로 생성되었습니다.',
    UPDATE_SUCCESS: '성공적으로 수정되었습니다.',
    DELETE_SUCCESS: '성공적으로 삭제되었습니다.',

    // 파일 관련
    FILE_UPLOAD_SUCCESS: '파일이 업로드되었습니다.',
    FILE_DELETE_SUCCESS: '파일이 삭제되었습니다.',

    // 기타
    SAVE_SUCCESS: '저장되었습니다.',
    COPY_SUCCESS: '복사되었습니다.',
}

// 기본 내보내기
export default {
    APP_INFO,
    API_ENDPOINTS,
    HTTP_STATUS,
    // 1일차 수정: 새로운 Role 시스템
    ROLES,
    ROLE_DISPLAY_NAMES,
    ROLE_PRIORITIES,
    ROLE_OPTIONS,
    TYPE1_ACCESS_ROLES,
    TYPE4_ACCESS_ROLES,
    RECEPTION_ACCESS_ROLES,
    ASSIGNMENT_ACCESS_ROLES,
    INVESTIGATION_ACCESS_ROLES,
    REPORT_ACCESS_ROLES,
    REVIEW_ACCESS_ROLES,
    TRANSMISSION_ACCESS_ROLES,
    canAccessType1,
    canAccessType4,
    isAdminLevel,
    isExecutiveLevel,
    isTeamLeaderLevel,
    isInvestigatorLevel,
    compareRolePriority,
    hasTaskPermission,
    // 기존 호환성 유지
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
}
