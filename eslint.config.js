/**
 * ESLint 설정 — 문서(CLAUDE.md)의 규칙을 기계가 지키게 한다.
 *
 * 🔴 여기의 규칙을 끄거나 약하게 바꾸는 것은 금지다(CLAUDE.md 10장). 규칙을 더하는 것은 된다.
 *
 * 강제하는 규칙 다섯(명세 B-1 단계 3):
 *   L1  any 금지                                   — CLAUDE.md 5장 5번
 *   L2  console 금지                               — P4
 *   L3  axios 는 src/api/ 안에서만 import           — 5장 3번
 *   L4  브라우저 저장소는 src/auth/ 안에서만 사용    — P5 · P6
 *   L5  v-html 금지                                — P9
 */
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// L4 에서 같은 안내문을 여러 번 쓴다
const STORAGE_MESSAGE =
  '브라우저 저장소는 src/auth/ 안에서만 쓴다(CLAUDE.md P5 · P6). 토큰 모듈의 함수를 부를 것.'
const AXIOS_MESSAGE =
  'axios 는 src/api/ 안에서만 쓴다(CLAUDE.md 5장 3번). src/api/ 의 서비스 함수를 부를 것.'

// 저장소 전역 객체 이름 셋 — 맨이름(localStorage)과 window.localStorage 꼴을 둘 다 막는다
const STORAGE_GLOBALS = ['localStorage', 'sessionStorage', 'indexedDB']
const STORAGE_OWNERS = ['window', 'globalThis', 'self']

export default defineConfig(
  // 보지 않는 곳: 옛 코드 · 빌드 결과물 · 테스트 산출물
  globalIgnores([
    'legacy/**',
    'dist/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    'blob-report/**',
  ]),

  // TypeScript 권장 규칙 · Vue 권장 규칙
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],

  // .vue 파일의 <script lang="ts"> 를 TypeScript 로 읽게 한다
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },

  // L1 · L2 · L5
  {
    name: 'km/l1-l2-l5',
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // L1
      'no-console': 'error', // L2
      'vue/no-v-html': 'error', // L5
    },
  },

  // L3 — src/api/ 밖에서 axios 를 import 하면 오류
  {
    name: 'km/l3-axios-only-in-api',
    ignores: ['src/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'axios', message: AXIOS_MESSAGE }],
          patterns: [{ group: ['axios/*'], message: AXIOS_MESSAGE }],
        },
      ],
    },
  },

  // L4 — src/auth/ 밖에서 localStorage · sessionStorage · indexedDB · document.cookie 를 쓰면 오류
  {
    name: 'km/l4-storage-only-in-auth',
    ignores: ['src/auth/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...STORAGE_GLOBALS.map((name) => ({ name, message: STORAGE_MESSAGE })),
      ],
      'no-restricted-properties': [
        'error',
        ...STORAGE_OWNERS.flatMap((object) =>
          STORAGE_GLOBALS.map((property) => ({ object, property, message: STORAGE_MESSAGE })),
        ),
        { object: 'document', property: 'cookie', message: STORAGE_MESSAGE },
      ],
    },
  },

  // Prettier 와 부딪치는 모양 규칙을 끈다(모양은 Prettier 가 맡는다). 반드시 맨 뒤에 둔다
  eslintConfigPrettier,
)
