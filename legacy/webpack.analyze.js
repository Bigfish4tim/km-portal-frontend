// ==============================================
// 📁 webpack.analyze.js
// Webpack 번들 분석 설정
// 42일차 - 프론트엔드 성능 측정 도구
// ==============================================

/**
 * Webpack Bundle Analyzer 설정
 * 
 * 이 파일은 Vue CLI 프로젝트의 번들 크기를 분석하기 위한
 * 설정을 제공합니다.
 * 
 * 설치:
 * npm install webpack-bundle-analyzer --save-dev
 * 
 * 사용법:
 * 1. vue.config.js에 이 설정을 통합하거나
 * 2. 별도의 분석 스크립트로 실행
 * 
 * 실행 방법:
 * npm run build -- --report
 * 또는
 * npx vue-cli-service build --report
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const path = require('path')

// ==============================================
// 번들 분석 플러그인 설정
// ==============================================

/**
 * Bundle Analyzer 플러그인 설정
 * 다양한 모드로 분석 결과를 출력
 */
const bundleAnalyzerConfig = {
  // ==============================================
  // 서버 모드 (인터랙티브)
  // 브라우저에서 실시간으로 번들을 탐색
  // ==============================================
  server: new BundleAnalyzerPlugin({
    // 분석 결과를 웹 서버로 제공
    analyzerMode: 'server',
    
    // 서버 호스트
    analyzerHost: '127.0.0.1',
    
    // 서버 포트
    analyzerPort: 8888,
    
    // 리포트 자동 오픈
    openAnalyzer: true,
    
    // Gzipped 크기 표시
    generateStatsFile: false,
    
    // 모듈 크기 계산 방식: 'stat' | 'parsed' | 'gzip'
    defaultSizes: 'parsed',
    
    // 콘솔 로그 레벨: 'info' | 'warn' | 'error' | 'silent'
    logLevel: 'info'
  }),
  
  // ==============================================
  // 정적 HTML 모드
  // CI/CD 파이프라인에서 사용하기 좋음
  // ==============================================
  static: new BundleAnalyzerPlugin({
    // 정적 HTML 파일 생성
    analyzerMode: 'static',
    
    // 리포트 파일 경로
    reportFilename: path.resolve(__dirname, 'dist/bundle-report.html'),
    
    // 리포트 자동 오픈 비활성화 (CI용)
    openAnalyzer: false,
    
    // Gzipped 크기 표시
    defaultSizes: 'gzip',
    
    // 로그 레벨
    logLevel: 'warn'
  }),
  
  // ==============================================
  // JSON 모드
  // 프로그래매틱 분석용
  // ==============================================
  json: new BundleAnalyzerPlugin({
    // JSON 파일만 생성 (시각화 없음)
    analyzerMode: 'json',
    
    // 리포트 파일 경로
    reportFilename: path.resolve(__dirname, 'dist/bundle-stats.json'),
    
    // 자동 오픈 비활성화
    openAnalyzer: false,
    
    // 로그 레벨
    logLevel: 'silent'
  }),
  
  // ==============================================
  // 비활성화 모드
  // 통계 파일만 생성
  // ==============================================
  disabled: new BundleAnalyzerPlugin({
    analyzerMode: 'disabled',
    generateStatsFile: true,
    statsFilename: path.resolve(__dirname, 'dist/webpack-stats.json'),
    statsOptions: {
      source: false,
      modules: true,
      chunks: true,
      chunkModules: true,
      assets: true
    }
  })
}

// ==============================================
// vue.config.js 통합용 설정
// ==============================================

/**
 * vue.config.js에 추가할 수 있는 설정
 * 
 * 사용법 (vue.config.js):
 * 
 * const { getAnalyzerConfig } = require('./webpack.analyze')
 * 
 * module.exports = {
 *   configureWebpack: {
 *     plugins: [
 *       ...getAnalyzerConfig(process.env.ANALYZE)
 *     ]
 *   }
 * }
 */
function getAnalyzerConfig(mode = 'disabled') {
  const plugins = []
  
  // 환경 변수에 따라 분석 모드 선택
  // ANALYZE=server npm run build
  // ANALYZE=static npm run build
  
  switch (mode) {
    case 'server':
    case 'true':
    case '1':
      plugins.push(bundleAnalyzerConfig.server)
      break
      
    case 'static':
      plugins.push(bundleAnalyzerConfig.static)
      break
      
    case 'json':
      plugins.push(bundleAnalyzerConfig.json)
      break
      
    case 'disabled':
    default:
      // 아무것도 추가하지 않음
      break
  }
  
  return plugins
}

// ==============================================
// 번들 크기 임계값 설정
// ==============================================

/**
 * 번들 크기 제한 설정
 * 웹팩의 performance 설정에 사용
 */
const bundleSizeLimits = {
  // ==============================================
  // 개발 환경 (느슨한 제한)
  // ==============================================
  development: {
    // 성능 힌트 비활성화
    hints: false
  },
  
  // ==============================================
  // 운영 환경 (엄격한 제한)
  // ==============================================
  production: {
    // 성능 힌트: 'warning' | 'error' | false
    hints: 'warning',
    
    // 최대 엔트리포인트 크기 (바이트)
    // KM 포털 권장: 500KB
    maxEntrypointSize: 512000, // 500KB
    
    // 최대 에셋 크기 (바이트)
    // 단일 파일 권장: 250KB
    maxAssetSize: 256000, // 250KB
    
    // 힌트 필터 (분석할 파일 확장자)
    assetFilter: function(assetFilename) {
      // JS와 CSS만 분석
      return /\.(js|css)$/.test(assetFilename)
    }
  },
  
  // ==============================================
  // 엄격한 제한 (성능 최적화 목표)
  // ==============================================
  strict: {
    hints: 'error', // 에러로 빌드 실패
    maxEntrypointSize: 256000, // 250KB
    maxAssetSize: 128000, // 125KB
    assetFilter: function(assetFilename) {
      return /\.(js|css)$/.test(assetFilename)
    }
  }
}

// ==============================================
// 청크 분할 최적화 설정
// ==============================================

/**
 * SplitChunks 최적화 설정
 * 코드 분할을 통해 초기 로드 크기 감소
 */
const splitChunksConfig = {
  // ==============================================
  // 기본 설정 (Vue CLI 기본값 확장)
  // ==============================================
  default: {
    chunks: 'all',
    minSize: 20000,      // 최소 청크 크기 (20KB)
    maxSize: 244000,     // 최대 청크 크기 (244KB)
    minChunks: 1,        // 최소 공유 횟수
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    automaticNameDelimiter: '~',
    
    cacheGroups: {
      // 기본 설정 비활성화
      default: false,
      
      // ==============================================
      // 벤더 청크 (node_modules)
      // ==============================================
      vendors: {
        name: 'chunk-vendors',
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: 'initial',
        reuseExistingChunk: true,
        enforce: true
      },
      
      // ==============================================
      // Element Plus (별도 청크)
      // KM 포털에서 가장 큰 의존성
      // ==============================================
      elementPlus: {
        name: 'chunk-element-plus',
        test: /[\\/]node_modules[\\/]element-plus[\\/]/,
        priority: 20,
        chunks: 'all',
        reuseExistingChunk: true
      },
      
      // ==============================================
      // 아이콘 라이브러리 (별도 청크)
      // ==============================================
      icons: {
        name: 'chunk-icons',
        test: /[\\/]node_modules[\\/](@element-plus[\\/]icons-vue|@iconify)[\\/]/,
        priority: 15,
        chunks: 'all'
      },
      
      // ==============================================
      // 차트 라이브러리 (별도 청크)
      // ==============================================
      charts: {
        name: 'chunk-charts',
        test: /[\\/]node_modules[\\/](chart\.js|vue-chartjs)[\\/]/,
        priority: 15,
        chunks: 'all'
      },
      
      // ==============================================
      // 유틸리티 라이브러리
      // ==============================================
      utils: {
        name: 'chunk-utils',
        test: /[\\/]node_modules[\\/](lodash-es|dayjs|axios)[\\/]/,
        priority: 10,
        chunks: 'all'
      },
      
      // ==============================================
      // 공통 컴포넌트
      // ==============================================
      common: {
        name: 'chunk-common',
        minChunks: 2,
        priority: -20,
        chunks: 'initial',
        reuseExistingChunk: true
      }
    }
  },
  
  // ==============================================
  // 공격적인 분할 (최대 병렬 로드)
  // ==============================================
  aggressive: {
    chunks: 'all',
    minSize: 10000,      // 10KB
    maxSize: 100000,     // 100KB
    minChunks: 1,
    maxAsyncRequests: 50,
    maxInitialRequests: 50,
    
    cacheGroups: {
      default: false,
      defaultVendors: false,
      
      framework: {
        name: 'chunk-framework',
        test: /[\\/]node_modules[\\/](vue|vue-router|vuex|@vue)[\\/]/,
        priority: 30,
        chunks: 'all'
      },
      
      elementPlus: {
        name: 'chunk-element',
        test: /[\\/]node_modules[\\/]element-plus[\\/]/,
        priority: 25,
        chunks: 'all'
      },
      
      vendors: {
        name(module) {
          const packageName = module.context.match(
            /[\\/]node_modules[\\/](.*?)([\\/]|$)/
          )[1]
          return `vendor.${packageName.replace('@', '')}`
        },
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        minChunks: 1
      }
    }
  }
}

// ==============================================
// 번들 크기 분석 유틸리티 함수
// ==============================================

/**
 * 번들 통계 분석
 * webpack-stats.json 파일을 분석하여 요약 생성
 * 
 * @param {object} stats - webpack stats 객체
 * @returns {object} 분석 결과
 */
function analyzeBundleStats(stats) {
  const assets = stats.assets || []
  const chunks = stats.chunks || []
  
  // 총 크기 계산
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
  
  // 타입별 크기
  const sizeByType = {}
  assets.forEach(asset => {
    const ext = asset.name.split('.').pop().toLowerCase()
    if (!sizeByType[ext]) {
      sizeByType[ext] = 0
    }
    sizeByType[ext] += asset.size
  })
  
  // 가장 큰 에셋
  const largestAssets = [...assets]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(asset => ({
      name: asset.name,
      size: formatBytes(asset.size),
      sizeRaw: asset.size
    }))
  
  // 청크 분석
  const chunkAnalysis = chunks.map(chunk => ({
    name: chunk.names?.[0] || chunk.id,
    size: formatBytes(chunk.size),
    sizeRaw: chunk.size,
    modules: chunk.modules?.length || 0
  }))
  
  return {
    summary: {
      totalSize: formatBytes(totalSize),
      totalSizeRaw: totalSize,
      assetCount: assets.length,
      chunkCount: chunks.length
    },
    sizeByType: Object.entries(sizeByType).map(([type, size]) => ({
      type,
      size: formatBytes(size),
      sizeRaw: size,
      percentage: ((size / totalSize) * 100).toFixed(1) + '%'
    })),
    largestAssets,
    chunks: chunkAnalysis
  }
}

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 * 
 * @param {number} bytes - 바이트
 * @returns {string} 포맷된 문자열
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 번들 크기 검증
 * CI/CD에서 번들 크기가 임계값을 초과하면 경고/에러
 * 
 * @param {object} stats - webpack stats
 * @param {object} limits - 크기 제한
 * @returns {object} 검증 결과
 */
function validateBundleSize(stats, limits = bundleSizeLimits.production) {
  const assets = stats.assets || []
  const warnings = []
  const errors = []
  
  // 총 엔트리포인트 크기 계산
  const entryAssets = assets.filter(a => a.isOverSizeLimit || a.name.includes('app'))
  const entrySize = entryAssets.reduce((sum, a) => sum + a.size, 0)
  
  if (entrySize > limits.maxEntrypointSize) {
    const message = `엔트리포인트 크기 초과: ${formatBytes(entrySize)} > ${formatBytes(limits.maxEntrypointSize)}`
    if (limits.hints === 'error') {
      errors.push(message)
    } else {
      warnings.push(message)
    }
  }
  
  // 개별 에셋 크기 검사
  assets.forEach(asset => {
    if (limits.assetFilter && !limits.assetFilter(asset.name)) {
      return
    }
    
    if (asset.size > limits.maxAssetSize) {
      const message = `에셋 크기 초과: ${asset.name} (${formatBytes(asset.size)} > ${formatBytes(limits.maxAssetSize)})`
      if (limits.hints === 'error') {
        errors.push(message)
      } else {
        warnings.push(message)
      }
    }
  })
  
  return {
    passed: errors.length === 0,
    warnings,
    errors,
    summary: `검사 완료: ${errors.length}개 에러, ${warnings.length}개 경고`
  }
}

// ==============================================
// 내보내기
// ==============================================

module.exports = {
  // 플러그인 설정
  bundleAnalyzerConfig,
  getAnalyzerConfig,
  
  // 크기 제한
  bundleSizeLimits,
  
  // 청크 분할 설정
  splitChunksConfig,
  
  // 유틸리티 함수
  analyzeBundleStats,
  formatBytes,
  validateBundleSize
}

// ==============================================
// CLI 실행 지원
// ==============================================

// node webpack.analyze.js [stats-file]
if (require.main === module) {
  const fs = require('fs')
  const statsFile = process.argv[2] || 'dist/webpack-stats.json'
  
  if (fs.existsSync(statsFile)) {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'))
    const analysis = analyzeBundleStats(stats)
    const validation = validateBundleSize(stats)
    
    console.log('\n📊 번들 분석 결과\n')
    console.log('='.repeat(50))
    console.log('요약:')
    console.log(`  총 크기: ${analysis.summary.totalSize}`)
    console.log(`  에셋 수: ${analysis.summary.assetCount}`)
    console.log(`  청크 수: ${analysis.summary.chunkCount}`)
    
    console.log('\n타입별 크기:')
    analysis.sizeByType.forEach(item => {
      console.log(`  ${item.type}: ${item.size} (${item.percentage})`)
    })
    
    console.log('\n가장 큰 에셋 (상위 5개):')
    analysis.largestAssets.slice(0, 5).forEach((asset, i) => {
      console.log(`  ${i + 1}. ${asset.name}: ${asset.size}`)
    })
    
    console.log('\n검증 결과:')
    console.log(`  ${validation.summary}`)
    
    if (validation.errors.length > 0) {
      console.log('\n❌ 에러:')
      validation.errors.forEach(e => console.log(`  - ${e}`))
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️ 경고:')
      validation.warnings.forEach(w => console.log(`  - ${w}`))
    }
    
    console.log('\n' + '='.repeat(50))
    
    // 에러가 있으면 종료 코드 1
    process.exit(validation.errors.length > 0 ? 1 : 0)
  } else {
    console.error(`파일을 찾을 수 없습니다: ${statsFile}`)
    console.log('먼저 빌드를 실행하세요: npm run build')
    process.exit(1)
  }
}
