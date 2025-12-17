// ==============================================
// 📁 lighthouse.config.js
// Lighthouse CI 설정 파일
// 42일차 - 프론트엔드 성능 측정 도구
// ==============================================

/**
 * Lighthouse CI 설정
 * 
 * 이 파일은 Lighthouse를 자동화된 CI/CD 파이프라인에서 
 * 실행하기 위한 설정을 제공합니다.
 * 
 * 설치:
 * npm install -g @lhci/cli
 * 또는
 * npm install @lhci/cli --save-dev
 * 
 * 실행 방법:
 * lhci autorun --config=lighthouse.config.js
 * 
 * 또는 로컬 실행:
 * npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
 */

module.exports = {
  // ==============================================
  // CI 설정
  // ==============================================
  ci: {
    // ==============================================
    // 수집 (Collect) 설정
    // Lighthouse 실행 방법 정의
    // ==============================================
    collect: {
      // 테스트할 URL 목록
      url: [
        'http://localhost:3000/',           // 메인 페이지
        'http://localhost:3000/login',       // 로그인 페이지
        'http://localhost:3000/boards',      // 게시판 목록
        'http://localhost:3000/dashboard'    // 대시보드
      ],
      
      // 각 URL당 실행 횟수 (중앙값 사용)
      numberOfRuns: 3,
      
      // 로컬 서버 시작 설정
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'App running at',
      startServerReadyTimeout: 60000, // 60초
      
      // Chrome 설정
      settings: {
        // 프리셋: 'desktop' | 'mobile' | 'perf'
        preset: 'desktop',
        
        // 디바이스 에뮬레이션
        formFactor: 'desktop',
        
        // 스로틀링 설정 (실제 네트워크 속도 시뮬레이션)
        throttling: {
          // 네트워크 스로틀링
          rttMs: 40,                    // Round Trip Time
          throughputKbps: 10 * 1024,    // 10Mbps
          
          // CPU 스로틀링 (1 = 스로틀링 없음)
          cpuSlowdownMultiplier: 1
        },
        
        // 화면 크기
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          disabled: false
        },
        
        // 실행할 카테고리
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo'
        ],
        
        // 스킵할 감사 항목
        skipAudits: [
          'uses-http2',           // 개발 환경에서는 무시
          'redirects-http'        // HTTPS 리다이렉트 무시
        ],
        
        // 추가 Chrome 플래그
        chromeFlags: [
          '--headless',           // 헤드리스 모드
          '--no-sandbox',         // 샌드박스 비활성화 (Docker용)
          '--disable-gpu',        // GPU 비활성화
          '--disable-dev-shm-usage',
          '--disable-extensions'
        ],
        
        // 최대 대기 시간
        maxWaitForLoad: 45000,    // 45초
        
        // 추가 헤더 (인증 등)
        extraHeaders: {
          // 'Authorization': 'Bearer <token>'
        }
      },
      
      // 퍼펫티어 설정
      puppeteerScript: './lighthouse-puppeteer.js', // 선택적 (로그인 필요 시)
      puppeteerLaunchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    },
    
    // ==============================================
    // 검증 (Assert) 설정
    // 성능 임계값 정의
    // ==============================================
    assert: {
      // 프리셋: 'lighthouse:no-pwa' | 'lighthouse:all' | 'lighthouse:recommended'
      preset: 'lighthouse:no-pwa',
      
      // 카테고리별 최소 점수
      assertions: {
        // ==============================================
        // 성능 (Performance) - 가장 중요
        // ==============================================
        'categories:performance': ['error', { minScore: 0.7 }],  // 70점 이상
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],      // 2초 이하
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],   // 2.5초 이하
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],      // 0.1 이하
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],          // 300ms 이하 (FID 대용)
        
        // 기타 성능 메트릭
        'speed-index': ['warn', { maxNumericValue: 4000 }],                 // 4초 이하
        'interactive': ['warn', { maxNumericValue: 5000 }],                 // TTI 5초 이하
        'max-potential-fid': ['warn', { maxNumericValue: 300 }],            // 300ms 이하
        
        // ==============================================
        // 접근성 (Accessibility)
        // ==============================================
        'categories:accessibility': ['warn', { minScore: 0.8 }],  // 80점 이상
        
        // 필수 접근성 항목
        'color-contrast': 'warn',
        'image-alt': 'error',
        'label': 'warn',
        'link-name': 'warn',
        'button-name': 'warn',
        
        // ==============================================
        // 모범 사례 (Best Practices)
        // ==============================================
        'categories:best-practices': ['warn', { minScore: 0.8 }],  // 80점 이상
        
        // 필수 보안/모범 사례
        'is-on-https': 'off',              // 개발 환경에서 비활성화
        'uses-passive-event-listeners': 'warn',
        'no-document-write': 'warn',
        'no-vulnerable-libraries': 'warn',
        'js-libraries': 'off',
        
        // ==============================================
        // SEO
        // ==============================================
        'categories:seo': ['warn', { minScore: 0.8 }],  // 80점 이상
        
        // 필수 SEO 항목
        'document-title': 'warn',
        'meta-description': 'warn',
        'viewport': 'error'
      }
    },
    
    // ==============================================
    // 업로드 (Upload) 설정
    // 결과 저장 위치
    // ==============================================
    upload: {
      // 대상: 'temporary-public-storage' | 'lhci' | 'filesystem'
      target: 'filesystem',
      
      // 결과 저장 경로
      outputDir: './lighthouse-results',
      
      // 리포트 파일명 패턴
      reportFilenamePattern: '%%HOSTNAME%%-%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%'
      
      // LHCI 서버 사용 시
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
      // token: 'your-build-token',
      
      // 임시 공개 저장소 사용 시 (7일 후 삭제)
      // target: 'temporary-public-storage'
    }
  }
}

// ==============================================
// 별도 Lighthouse 설정 (CLI용)
// ==============================================

/**
 * Lighthouse CLI 실행용 설정
 * 
 * 사용법:
 * lighthouse http://localhost:3000 --config-path=./lighthouse.config.js
 */
const lighthouseCliConfig = {
  extends: 'lighthouse:default',
  
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1
    },
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false
    },
    emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    maxWaitForLoad: 45000
  },
  
  // 사용자 정의 감사 추가 (선택적)
  // audits: [
  //   'path/to/custom-audit.js'
  // ],
  
  // 카테고리 설정
  categories: {
    performance: {
      title: '성능',
      description: '페이지 로드 속도 및 인터랙티브 성능',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'total-blocking-time', weight: 30 },
        { id: 'cumulative-layout-shift', weight: 25 },
        { id: 'speed-index', weight: 10 }
      ]
    }
  }
}

// ==============================================
// 모바일 테스트용 설정
// ==============================================

const mobileConfig = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/boards'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        formFactor: 'mobile',
        throttling: {
          rttMs: 150,                    // 모바일 네트워크 시뮬레이션
          throughputKbps: 1.6 * 1024,    // 1.6Mbps (4G)
          cpuSlowdownMultiplier: 4       // 모바일 CPU 시뮬레이션
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        },
        onlyCategories: ['performance', 'accessibility']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.5 }],  // 모바일은 50점 이상
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],  // 4초
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }]    // 0.25
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results/mobile'
    }
  }
}

// ==============================================
// 성능 예산 (Performance Budget) 설정
// ==============================================

/**
 * 성능 예산 설정
 * 리소스 크기 및 개수 제한
 */
const performanceBudget = [
  {
    // JavaScript 예산
    resourceType: 'script',
    budget: 500  // 500KB 이하
  },
  {
    // CSS 예산
    resourceType: 'stylesheet',
    budget: 100  // 100KB 이하
  },
  {
    // 이미지 예산
    resourceType: 'image',
    budget: 1000  // 1MB 이하
  },
  {
    // 폰트 예산
    resourceType: 'font',
    budget: 200  // 200KB 이하
  },
  {
    // 전체 문서 크기
    resourceType: 'document',
    budget: 50  // 50KB 이하
  },
  {
    // 총 전송 크기
    resourceType: 'total',
    budget: 2000  // 2MB 이하
  },
  {
    // 서드파티 스크립트
    resourceType: 'third-party',
    budget: 300  // 300KB 이하
  }
]

/**
 * 타이밍 예산
 */
const timingBudget = [
  {
    metric: 'first-contentful-paint',
    budget: 2000  // 2초
  },
  {
    metric: 'largest-contentful-paint',
    budget: 2500  // 2.5초
  },
  {
    metric: 'interactive',
    budget: 5000  // 5초
  },
  {
    metric: 'total-blocking-time',
    budget: 300  // 300ms
  },
  {
    metric: 'cumulative-layout-shift',
    budget: 0.1
  }
]

// ==============================================
// 내보내기
// ==============================================

module.exports.lighthouseCliConfig = lighthouseCliConfig
module.exports.mobileConfig = mobileConfig
module.exports.performanceBudget = performanceBudget
module.exports.timingBudget = timingBudget
