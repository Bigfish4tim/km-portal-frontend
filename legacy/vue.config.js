// vue.config.js - Vue CLI 프로젝트 빌드 설정
// 파일 위치: km-portal-frontend/vue.config.js

const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  // ====== 기본 설정 ======
  
  // 트랜스파일링 대상 (node_modules 내의 특정 패키지 포함)
  transpileDependencies: true,
  
  // 개발 서버 설정
  devServer: {
    // 개발 서버 포트 (백엔드와 다른 포트 사용)
    port: 3000,
    
    // 자동으로 브라우저 열기
    open: true,
    
    // 핫 리로드 활성화
    hot: true,
    
    // HTTPS 사용 여부 (필요시 true로 변경)
    https: false,
    
    // 호스트 설정 (외부에서 접근 가능하도록 설정)
    host: 'localhost',
    
    // 클라이언트 로깅 레벨
    client: {
      logging: 'info',
      overlay: {
        errors: true,
        warnings: false, // 경고는 오버레이에 표시하지 않음
      }
    },
    
    // 프록시 설정 (백엔드 API 호출용)
    proxy: {
      // '/api'로 시작하는 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'http://localhost:8080', // 백엔드 서버 주소
        changeOrigin: true,              // 오리진 변경 허용
        secure: false,                   // HTTPS 인증서 검증 비활성화
        logLevel: 'debug',               // 프록시 로그 레벨
        
        // 프록시 에러 처리
        onError: (err, req, res) => {
          console.error('Proxy Error:', err.message)
        },
        
        // 프록시 요청 전 헤더 수정
        onProxyReq: (proxyReq, req, res) => {
          // 개발 환경에서 프록시 요청 로깅
          console.log(`🔄 Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`)
        },
        
        // 프록시 응답 후 로깅
        onProxyRes: (proxyRes, req, res) => {
          console.log(`✅ Proxy Response: ${proxyRes.statusCode} ${req.url}`)
        }
      }
    },
    
    // 정적 파일 압축
    compress: true,
    
    // 개발 서버에서 historyApiFallback 설정 (SPA 라우팅 지원)
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: '/index.html' }
      ]
    }
  },
  
  // ====== 경로 별칭 설정 ======
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@router': path.resolve(__dirname, 'src/router')
      }
    },
    
    // 번들 분석을 위한 설정 (필요시 활성화)
    // optimization: {
    //   splitChunks: {
    //     chunks: 'all',
    //     cacheGroups: {
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors',
    //         chunks: 'all'
    //       },
    //       elementPlus: {
    //         test: /[\\/]node_modules[\\/]element-plus[\\/]/,
    //         name: 'element-plus',
    //         chunks: 'all'
    //       }
    //     }
    //   }
    // },
    
    // 개발 환경에서 소스맵 설정
    devtool: process.env.NODE_ENV === 'development' ? 'eval-cheap-module-source-map' : false
  },
  
  // ====== CSS 관련 설정 ======
  css: {
    // CSS 소스맵 생성 여부
    sourceMap: process.env.NODE_ENV === 'development',
    
    // CSS 추출 여부 (운영 환경에서만 추출)
    extract: process.env.NODE_ENV === 'production',
    
    // CSS 전처리기 설정
    loaderOptions: {
      // SCSS 전역 변수 자동 임포트
      sass: {
        additionalData: `
          @import "@/assets/css/variables.scss";
        `
      },
      
      // PostCSS 설정
      postcss: {
        postcssOptions: {
          plugins: [
            require('autoprefixer')({
              overrideBrowserslist: [
                '> 1%',
                'last 2 versions',
                'not dead',
                'not ie 11'
              ]
            })
          ]
        }
      }
    }
  },
  
  // ====== 빌드 최적화 설정 ======
  
  // 프로덕션 소스맵 비활성화 (보안 및 성능)
  productionSourceMap: false,
  
  // gzip 압축 설정
  chainWebpack: config => {
    // ====== 개발 환경 설정 ======
    if (process.env.NODE_ENV === 'development') {
      // 개발 환경에서는 빠른 빌드를 위한 최적화
      config.optimization.splitChunks(false)
      
      // ESLint 오버레이 설정 (최신 버전 호환)
      if (config.plugins.has('eslint')) {
        config.plugin('eslint').tap(args => {
          args[0].emitWarning = true
          args[0].emitError = false
          args[0].failOnError = false
          args[0].failOnWarning = false
          return args
        })
      }
    }
    
    // ====== 프로덕션 환경 설정 ======
    if (process.env.NODE_ENV === 'production') {
      // 콘솔 로그 제거
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions.compress.drop_console = true
        args[0].terserOptions.compress.drop_debugger = true
        return args
      })
      
      // 청크 크기 최적화
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            maxSize: 244 * 1024 // 244KB
          },
          elementPlus: {
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            name: 'element-plus',
            priority: 20,
            chunks: 'all'
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      })
    }
    
    // ====== 이미지 최적화 ======
    const imagesRule = config.module.rule('images')
    imagesRule.uses.clear()
    imagesRule
      .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 8192, // 8KB 이하는 인라인으로 처리
        fallback: {
          loader: 'file-loader',
          options: {
            outputPath: 'img',
            name: '[name].[hash:8].[ext]'
          }
        }
      })
    
    // ====== 폰트 파일 처리 ======
    const fontsRule = config.module.rule('fonts')
    fontsRule.uses.clear()
    fontsRule
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096, // 4KB 이하는 인라인으로 처리
        fallback: {
          loader: 'file-loader',
          options: {
            outputPath: 'fonts',
            name: '[name].[hash:8].[ext]'
          }
        }
      })
  },
  
  // ====== PWA 설정 (향후 추가 예정) ======
  // pwa: {
  //   name: 'KM 포털',
  //   themeColor: '#1890ff',
  //   msTileColor: '#000000',
  //   appleMobileWebAppCapable: 'yes',
  //   appleMobileWebAppStatusBarStyle: 'black',
  //   workboxPluginMode: 'InjectManifest',
  //   workboxOptions: {
  //     swSrc: 'src/sw.js',
  //   }
  // },
  
  // ====== 플러그인 설정 ======
  pluginOptions: {
    // Element Plus 자동 임포트 설정 (필요시 사용)
    // 'element-plus': {
    //   useOnDemand: true,
    //   convertStyleImports: true
    // }
  },
  
  // ====== 기타 설정 ======
  
  // 공개 경로 설정 (CDN 사용시 변경)
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  
  // 빌드 출력 디렉토리
  outputDir: 'dist',
  
  // 정적 자산 디렉토리
  assetsDir: 'static',
  
  // index.html 파일 경로
  indexPath: 'index.html',
  
  // 파일명에 해시 포함 여부
  filenameHashing: true,
  
  // 린트 온 세이브 (개발 단계에서는 임시 비활성화)
  lintOnSave: false,
  
  // 런타임 전용 빌드 사용 여부
  runtimeCompiler: false,
  
  // 바벨 트랜스파일 설정
  parallel: require('os').cpus().length > 1,
  
  // 빌드 진행상황 표시 (Vue CLI 내장 기능 사용)
  // progress: true  // 이 옵션은 Vue CLI 최신 버전에서 제거됨
})

/* 
 * ====== 환경 변수 사용 예시 ======
 * 
 * .env.development:
 * NODE_ENV=development
 * VUE_APP_API_BASE_URL=http://localhost:8080/api
 * VUE_APP_TITLE=KM 포털 (개발)
 * 
 * .env.production:
 * NODE_ENV=production
 * VUE_APP_API_BASE_URL=/api
 * VUE_APP_TITLE=KM 포털
 * 
 * .env.local: (git에 추가되지 않는 로컬 설정)
 * VUE_APP_DEBUG=true
 * VUE_APP_MOCK_API=true
 */

/* 
 * ====== 빌드 명령어 참고 ======
 * 
 * 개발 서버 실행:
 * npm run serve
 * 
 * 프로덕션 빌드:
 * npm run build
 * 
 * 린트 검사:
 * npm run lint
 * 
 * 번들 분석:
 * npm run build --report
 * 
 * 테스트:
 * npm run test:unit
 */