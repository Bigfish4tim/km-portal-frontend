# KM Portal Frontend

## 📋 프로젝트 개요

KM 업무 포털 시스템의 프론트엔드 애플리케이션입니다.

### 🛠️ 기술 스택

- **Framework**: Vue.js 3 (Composition API)
- **UI Library**: Element Plus 2.4+
- **State Management**: Vuex 4.0+
- **Routing**: Vue Router 4.0+
- **HTTP Client**: Axios 1.6+
- **CSS Preprocessor**: Sass (SCSS)
- **Build Tool**: Vue CLI / Vite

### 🚀 개발 환경 설정

#### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

#### 프로젝트 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run serve

# 빌드
npm run build

# 테스트
npm run test:unit

# 린트
npm run lint
```

#### 주요 URL

- 개발 서버: http://localhost:8080
- 백엔드 API: http://localhost:8080/api

### 🏗️ 프로젝트 구조

```
src/
├── assets/              # 정적 자원 (이미지, 폰트 등)
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/          # 공통 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── ui/              # UI 컴포넌트
├── views/               # 페이지 컴포넌트
│   ├── auth/            # 인증 관련 페이지
│   ├── dashboard/       # 대시보드
│   ├── user/            # 사용자 관리
│   ├── file/            # 파일 관리
│   └── board/           # 게시판
├── router/              # 라우터 설정
├── store/               # Vuex 스토어
│   ├── modules/         # 모듈별 스토어
│   ├── auth.js          # 인증 스토어
│   ├── user.js          # 사용자 스토어
│   └── index.js         # 메인 스토어
├── services/            # API 서비스
│   ├── api.js           # Axios 설정
│   ├── auth.js          # 인증 API
│   ├── user.js          # 사용자 API
│   └── file.js          # 파일 API
├── utils/               # 유틸리티 함수
├── styles/              # 전역 스타일
└── App.vue              # 루트 컴포넌트
```

### 🎨 주요 기능

- **인증 시스템**: JWT 토큰 기반 로그인/로그아웃
- **사용자 관리**: CRUD 및 권한 관리
- **파일 관리**: 드래그 앤 드롭 업로드/다운로드
- **게시판**: 게시글/댓글 시스템
- **대시보드**: 통계 및 차트
- **실시간 알림**: WebSocket 연동
- **반응형 디자인**: 모바일/태블릿 대응

### 📱 화면 구성

- `/login` - 로그인 페이지
- `/dashboard` - 대시보드 (메인 페이지)
- `/users` - 사용자 관리
- `/files` - 파일 관리
- `/board` - 게시판
- `/profile` - 프로필 관리

### 🔧 설정 파일

- `vue.config.js` - Vue CLI 설정
- `.env.development` - 개발환경 변수
- `.env.production` - 운영환경 변수

### 🎯 상태 관리

```javascript
// Vuex Store 구조
{
  auth: {
    user: {},
    token: '',
    isAuthenticated: false
  },
  users: {
    list: [],
    current: {}
  },
  files: {
    list: [],
    uploadProgress: 0
  }
}
```

### 🌐 API 연동

```javascript
// 백엔드 API 베이스 URL
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api'

// 인증 헤더 자동 추가
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

### 🧪 테스트

```bash
# 단위 테스트
npm run test:unit

# E2E 테스트 (추후 추가)
npm run test:e2e
```

### 📦 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물은 dist/ 폴더에 생성됩니다
```

### 🔒 보안

- JWT 토큰 자동 갱신
- XSS 방지
- CORS 처리
- 라우터 가드 (인증 필요 페이지)

### 📈 개발 진행 상황

- [x] 프로젝트 기반 구축 (1일차)
- [ ] 라우터/Vuex 설정 (3일차)
- [ ] 기본 레이아웃 컴포넌트 (4일차)
- [ ] API 서비스 모듈 (5일차)

### 🐛 알려진 이슈

현재 알려진 이슈는 없습니다.

### 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.



# 매일 작업 시작 전
git status       
// 현재 상태 확인
git pull origin main
// 최신 코드 받기

# 작업 중
git add .
// 변경사항 스테이징
git commit -m "feat: Add login functionality"
// 커밋

# 작업 완료 후
git push origin main
// 원격 저장소에 푸시


# 백업 및 불러오기 #

# 커밋 히스토리 확인
git log --oneline

# 특정 커밋으로 되돌리기 (변경사항 유지)
git reset --soft [커밋 해시]

# 특정 커밋으로 완전히 되돌리기 (변경사항 삭제)
git reset --hard [커밋 해시]

# 예시
git reset --hard abc1234

