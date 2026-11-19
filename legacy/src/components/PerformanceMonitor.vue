<template>
  <!-- ==============================================
       📁 src/components/PerformanceMonitor.vue
       성능 모니터링 대시보드 컴포넌트
       42일차 - 프론트엔드 성능 측정 도구
       ============================================== -->
  
  <div class="performance-monitor" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 토글 버튼 -->
    <div class="monitor-toggle" @click="togglePanel">
      <el-icon :size="16">
        <component :is="isCollapsed ? 'Expand' : 'Fold'" />
      </el-icon>
      <span v-if="!isCollapsed">성능 모니터</span>
      <span v-else class="score-badge" :class="scoreClass">
        {{ overallScore || '--' }}
      </span>
    </div>
    
    <!-- 메인 패널 -->
    <div v-show="!isCollapsed" class="monitor-panel">
      <!-- 헤더 -->
      <div class="monitor-header">
        <h3>📊 KM 포털 성능 모니터</h3>
        <div class="header-actions">
          <el-button 
            size="small" 
            @click="refreshMetrics"
            :loading="isLoading"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button 
            size="small" 
            type="primary"
            @click="exportReport"
          >
            내보내기
          </el-button>
        </div>
      </div>
      
      <!-- 전체 점수 -->
      <div class="overall-score-section">
        <div class="score-circle" :class="scoreClass">
          <span class="score-value">{{ overallScore || '--' }}</span>
          <span class="score-label">점수</span>
        </div>
        <div class="score-description">
          <p v-if="overallScore >= 90">🎉 우수한 성능입니다!</p>
          <p v-else-if="overallScore >= 70">👍 양호한 성능입니다.</p>
          <p v-else-if="overallScore >= 50">⚠️ 개선이 필요합니다.</p>
          <p v-else-if="overallScore">🔴 성능 최적화가 시급합니다.</p>
          <p v-else>측정 중...</p>
        </div>
      </div>
      
      <!-- Core Web Vitals -->
      <div class="metrics-section">
        <h4>🎯 Core Web Vitals</h4>
        
        <div class="metric-cards">
          <!-- LCP -->
          <div class="metric-card" :class="getMetricClass('LCP')">
            <div class="metric-header">
              <span class="metric-name">LCP</span>
              <el-tooltip content="Largest Contentful Paint - 최대 콘텐츠 표시 시간">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="metric-value">
              {{ formatMetricValue(metrics.LCP?.value, 'ms') }}
            </div>
            <div class="metric-rating">
              {{ getMetricRating('LCP') }}
            </div>
            <div class="metric-bar">
              <div 
                class="metric-bar-fill" 
                :style="{ width: getMetricBarWidth('LCP') }"
              ></div>
            </div>
          </div>
          
          <!-- FID / INP -->
          <div class="metric-card" :class="getMetricClass('FID')">
            <div class="metric-header">
              <span class="metric-name">{{ metrics.INP ? 'INP' : 'FID' }}</span>
              <el-tooltip :content="metrics.INP 
                ? 'Interaction to Next Paint - 상호작용 반응 시간' 
                : 'First Input Delay - 첫 입력 지연 시간'">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="metric-value">
              {{ formatMetricValue(
                metrics.INP?.value || metrics.FID?.value, 
                'ms'
              ) }}
            </div>
            <div class="metric-rating">
              {{ getMetricRating(metrics.INP ? 'INP' : 'FID') }}
            </div>
            <div class="metric-bar">
              <div 
                class="metric-bar-fill" 
                :style="{ width: getMetricBarWidth(metrics.INP ? 'INP' : 'FID') }"
              ></div>
            </div>
          </div>
          
          <!-- CLS -->
          <div class="metric-card" :class="getMetricClass('CLS')">
            <div class="metric-header">
              <span class="metric-name">CLS</span>
              <el-tooltip content="Cumulative Layout Shift - 누적 레이아웃 이동">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="metric-value">
              {{ formatMetricValue(metrics.CLS?.value, 'cls') }}
            </div>
            <div class="metric-rating">
              {{ getMetricRating('CLS') }}
            </div>
            <div class="metric-bar">
              <div 
                class="metric-bar-fill" 
                :style="{ width: getMetricBarWidth('CLS') }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 추가 메트릭 -->
      <div class="metrics-section">
        <h4>⏱️ 추가 메트릭</h4>
        
        <div class="additional-metrics">
          <!-- FCP -->
          <div class="additional-metric">
            <span class="metric-label">FCP (First Contentful Paint)</span>
            <span class="metric-value" :class="getMetricClass('FCP')">
              {{ formatMetricValue(metrics.FCP?.value, 'ms') }}
            </span>
          </div>
          
          <!-- TTFB -->
          <div class="additional-metric">
            <span class="metric-label">TTFB (Time to First Byte)</span>
            <span class="metric-value" :class="getMetricClass('TTFB')">
              {{ formatMetricValue(metrics.TTFB?.value, 'ms') }}
            </span>
          </div>
          
          <!-- 페이지 로드 시간 -->
          <div class="additional-metric">
            <span class="metric-label">페이지 로드 완료</span>
            <span class="metric-value">
              {{ formatMetricValue(navigationTiming?.loadComplete, 'ms') }}
            </span>
          </div>
          
          <!-- DOM Content Loaded -->
          <div class="additional-metric">
            <span class="metric-label">DOM Content Loaded</span>
            <span class="metric-value">
              {{ formatMetricValue(navigationTiming?.domContentLoaded, 'ms') }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Long Tasks -->
      <div class="metrics-section" v-if="longTasks.length > 0">
        <h4>
          🐢 Long Tasks 
          <span class="badge warning">{{ longTasks.length }}개 감지</span>
        </h4>
        
        <div class="long-tasks-list">
          <div 
            v-for="(task, index) in longTasks.slice(0, 5)" 
            :key="index"
            class="long-task-item"
            :class="{ 'is-critical': task.duration > 100 }"
          >
            <span class="task-duration">{{ task.duration }}ms</span>
            <span class="task-time">@ {{ Math.round(task.startTime) }}ms</span>
          </div>
          
          <div v-if="longTasks.length > 5" class="more-tasks">
            + {{ longTasks.length - 5 }}개 더 있음
          </div>
        </div>
      </div>
      
      <!-- 느린 리소스 -->
      <div class="metrics-section" v-if="slowResources.length > 0">
        <h4>
          📦 느린 리소스 
          <span class="badge warning">{{ slowResources.length }}개</span>
        </h4>
        
        <div class="slow-resources-list">
          <div 
            v-for="(resource, index) in slowResources.slice(0, 5)" 
            :key="index"
            class="slow-resource-item"
          >
            <div class="resource-info">
              <span class="resource-type">{{ resource.type }}</span>
              <span class="resource-name" :title="resource.name">
                {{ truncateName(resource.name, 30) }}
              </span>
            </div>
            <span class="resource-duration">{{ resource.duration }}ms</span>
          </div>
          
          <div v-if="slowResources.length > 5" class="more-resources">
            + {{ slowResources.length - 5 }}개 더 있음
          </div>
        </div>
      </div>
      
      <!-- 푸터 -->
      <div class="monitor-footer">
        <span class="last-updated">
          마지막 업데이트: {{ lastUpdated }}
        </span>
        <el-button 
          type="text" 
          size="small"
          @click="showDetailModal = true"
        >
          상세 보기
        </el-button>
      </div>
    </div>
    
    <!-- 상세 정보 모달 -->
    <el-dialog
      v-model="showDetailModal"
      title="📊 성능 상세 리포트"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="detail-report">
        <!-- 탭 메뉴 -->
        <el-tabs v-model="activeTab">
          <el-tab-pane label="메트릭 상세" name="metrics">
            <div class="detail-section">
              <h4>Core Web Vitals 상세</h4>
              <el-table :data="metricsTableData" stripe>
                <el-table-column prop="name" label="메트릭" width="100" />
                <el-table-column prop="value" label="값" width="120" />
                <el-table-column prop="rating" label="등급" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRatingTagType(row.rating)">
                      {{ row.rating }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="threshold" label="기준" />
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="리소스 분석" name="resources">
            <div class="detail-section">
              <h4>리소스 로딩 분석</h4>
              <el-table 
                :data="resourcesTableData" 
                stripe
                max-height="400"
              >
                <el-table-column prop="name" label="리소스" min-width="200">
                  <template #default="{ row }">
                    <span :title="row.fullName">{{ row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="타입" width="100" />
                <el-table-column prop="duration" label="시간" width="100" sortable>
                  <template #default="{ row }">
                    <span :class="{ 'is-slow': row.duration > 500 }">
                      {{ row.duration }}ms
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="cached" label="캐시" width="80">
                  <template #default="{ row }">
                    <el-tag v-if="row.cached" type="success" size="small">
                      Yes
                    </el-tag>
                    <el-tag v-else type="info" size="small">No</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="타이밍 분석" name="timing">
            <div class="detail-section">
              <h4>Navigation Timing</h4>
              <div class="timing-waterfall">
                <div 
                  v-for="(item, index) in timingWaterfallData" 
                  :key="index"
                  class="timing-item"
                >
                  <span class="timing-label">{{ item.label }}</span>
                  <div class="timing-bar-container">
                    <div 
                      class="timing-bar" 
                      :style="{ 
                        width: item.widthPercent + '%',
                        backgroundColor: item.color
                      }"
                    ></div>
                  </div>
                  <span class="timing-value">{{ item.value }}ms</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="권장사항" name="recommendations">
            <div class="detail-section">
              <h4>성능 개선 권장사항</h4>
              <div class="recommendations-list">
                <div 
                  v-for="(rec, index) in recommendations" 
                  :key="index"
                  class="recommendation-item"
                  :class="rec.priority"
                >
                  <el-icon :size="20">
                    <component :is="rec.icon" />
                  </el-icon>
                  <div class="rec-content">
                    <h5>{{ rec.title }}</h5>
                    <p>{{ rec.description }}</p>
                  </div>
                  <el-tag :type="rec.priority === 'high' ? 'danger' : 'warning'" size="small">
                    {{ rec.priority === 'high' ? '높음' : '보통' }}
                  </el-tag>
                </div>
                
                <div v-if="recommendations.length === 0" class="no-recommendations">
                  <el-icon :size="40"><CircleCheck /></el-icon>
                  <p>현재 특별한 개선 사항이 없습니다!</p>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <el-button @click="showDetailModal = false">닫기</el-button>
        <el-button type="primary" @click="downloadReport">
          <el-icon><Download /></el-icon>
          리포트 다운로드
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
/**
 * PerformanceMonitor.vue
 * 
 * 실시간 성능 모니터링 대시보드 컴포넌트
 * 
 * 기능:
 * - Core Web Vitals (LCP, FID/INP, CLS) 실시간 표시
 * - 추가 메트릭 (FCP, TTFB) 표시
 * - Long Task 감지 및 표시
 * - 느린 리소스 분석
 * - 성능 권장사항 제공
 * - 리포트 내보내기
 * 
 * 사용법:
 * <PerformanceMonitor v-if="isDevelopment" />
 * 
 * 또는 조건부 렌더링:
 * <PerformanceMonitor :visible="showMonitor" />
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  Expand,
  Fold,
  Refresh,
  InfoFilled,
  Download,
  CircleCheck,
  Warning,
  Timer,
  Picture,
  Document
} from '@element-plus/icons-vue'

// 성능 유틸리티 임포트
import {
  initPerformanceMonitoring,
  getPerformanceReport,
  getNavigationTiming,
  getSlowResources,
  PERFORMANCE_THRESHOLDS
} from '@/utils/performance'

export default {
  name: 'PerformanceMonitor',
  
  components: {
    Expand,
    Fold,
    Refresh,
    InfoFilled,
    Download,
    CircleCheck,
    Warning,
    Timer,
    Picture,
    Document
  },
  
  props: {
    // 모니터 표시 여부 (기본값: 개발 환경에서만 표시)
    visible: {
      type: Boolean,
      default: () => process.env.NODE_ENV === 'development'
    },
    
    // 초기 접힘 상태
    collapsed: {
      type: Boolean,
      default: true
    },
    
    // 자동 새로고침 간격 (ms, 0이면 비활성화)
    autoRefreshInterval: {
      type: Number,
      default: 5000
    },
    
    // 느린 리소스 임계값 (ms)
    slowResourceThreshold: {
      type: Number,
      default: 500
    }
  },
  
  setup(props) {
    // ==============================================
    // 반응형 상태
    // ==============================================
    
    const isCollapsed = ref(props.collapsed)
    const isLoading = ref(false)
    const showDetailModal = ref(false)
    const activeTab = ref('metrics')
    const lastUpdated = ref('--')
    
    // 메트릭 데이터
    const metrics = reactive({
      LCP: null,
      FID: null,
      INP: null,
      CLS: null,
      FCP: null,
      TTFB: null
    })
    
    const navigationTiming = ref(null)
    const longTasks = ref([])
    const slowResources = ref([])
    const overallScore = ref(null)
    
    // 자동 새로고침 타이머
    let refreshTimer = null
    
    // ==============================================
    // 계산된 속성
    // ==============================================
    
    // 점수 등급 클래스
    const scoreClass = computed(() => {
      const score = overallScore.value
      if (!score) return ''
      if (score >= 90) return 'excellent'
      if (score >= 70) return 'good'
      if (score >= 50) return 'needs-improvement'
      return 'poor'
    })
    
    // 메트릭 테이블 데이터
    const metricsTableData = computed(() => {
      const data = []
      
      const metricConfigs = [
        { key: 'LCP', name: 'LCP', unit: 'ms', desc: '< 2.5s / < 4s' },
        { key: 'FID', name: 'FID', unit: 'ms', desc: '< 100ms / < 300ms' },
        { key: 'INP', name: 'INP', unit: 'ms', desc: '< 200ms / < 500ms' },
        { key: 'CLS', name: 'CLS', unit: '', desc: '< 0.1 / < 0.25' },
        { key: 'FCP', name: 'FCP', unit: 'ms', desc: '< 1.8s / < 3s' },
        { key: 'TTFB', name: 'TTFB', unit: 'ms', desc: '< 800ms / < 1800ms' }
      ]
      
      for (const config of metricConfigs) {
        const metric = metrics[config.key]
        if (metric) {
          data.push({
            name: config.name,
            value: config.key === 'CLS' 
              ? metric.value.toFixed(3) 
              : `${Math.round(metric.value)}${config.unit}`,
            rating: metric.rating || 'N/A',
            threshold: config.desc
          })
        }
      }
      
      return data
    })
    
    // 리소스 테이블 데이터
    const resourcesTableData = computed(() => {
      return slowResources.value.map(r => ({
        name: truncateName(r.name, 40),
        fullName: r.name,
        type: r.type,
        duration: r.duration,
        cached: r.cached
      }))
    })
    
    // 타이밍 워터폴 데이터
    const timingWaterfallData = computed(() => {
      const timing = navigationTiming.value
      if (!timing) return []
      
      const maxValue = timing.loadComplete || 1000
      
      return [
        {
          label: 'DNS 조회',
          value: Math.round(timing.dnsLookup || 0),
          widthPercent: ((timing.dnsLookup || 0) / maxValue) * 100,
          color: '#67c23a'
        },
        {
          label: 'TCP 연결',
          value: Math.round(timing.tcpConnect || 0),
          widthPercent: ((timing.tcpConnect || 0) / maxValue) * 100,
          color: '#409eff'
        },
        {
          label: 'SSL/TLS',
          value: Math.round(timing.sslHandshake || 0),
          widthPercent: ((timing.sslHandshake || 0) / maxValue) * 100,
          color: '#e6a23c'
        },
        {
          label: '요청/응답',
          value: Math.round(timing.request || 0),
          widthPercent: ((timing.request || 0) / maxValue) * 100,
          color: '#f56c6c'
        },
        {
          label: 'DOM 파싱',
          value: Math.round(timing.domParsing || 0),
          widthPercent: ((timing.domParsing || 0) / maxValue) * 100,
          color: '#909399'
        },
        {
          label: '전체 로드',
          value: Math.round(timing.loadComplete || 0),
          widthPercent: 100,
          color: '#303133'
        }
      ]
    })
    
    // 성능 권장사항
    const recommendations = computed(() => {
      const recs = []
      
      // LCP 체크
      if (metrics.LCP?.value > PERFORMANCE_THRESHOLDS.LCP.needsImprovement) {
        recs.push({
          icon: 'Picture',
          title: 'LCP 개선 필요',
          description: '이미지 최적화, 지연 로딩, CDN 사용을 고려하세요.',
          priority: 'high'
        })
      } else if (metrics.LCP?.value > PERFORMANCE_THRESHOLDS.LCP.good) {
        recs.push({
          icon: 'Picture',
          title: 'LCP 개선 권장',
          description: '주요 콘텐츠 이미지 압축 및 캐싱을 확인하세요.',
          priority: 'medium'
        })
      }
      
      // CLS 체크
      if (metrics.CLS?.value > PERFORMANCE_THRESHOLDS.CLS.needsImprovement) {
        recs.push({
          icon: 'Warning',
          title: 'CLS 개선 필요',
          description: '이미지에 width/height 속성을 추가하고, 동적 콘텐츠에 공간을 예약하세요.',
          priority: 'high'
        })
      }
      
      // FID/INP 체크
      const fidValue = metrics.INP?.value || metrics.FID?.value
      if (fidValue > PERFORMANCE_THRESHOLDS.FID.needsImprovement) {
        recs.push({
          icon: 'Timer',
          title: '입력 지연 개선 필요',
          description: '무거운 JavaScript 실행을 최소화하고, 코드 분할을 적용하세요.',
          priority: 'high'
        })
      }
      
      // Long Tasks 체크
      if (longTasks.value.length > 3) {
        recs.push({
          icon: 'Timer',
          title: 'Long Task 최적화',
          description: `${longTasks.value.length}개의 Long Task가 감지되었습니다. 작업을 분할하거나 Web Worker를 활용하세요.`,
          priority: longTasks.value.length > 10 ? 'high' : 'medium'
        })
      }
      
      // 느린 리소스 체크
      if (slowResources.value.length > 5) {
        recs.push({
          icon: 'Document',
          title: '리소스 최적화',
          description: `${slowResources.value.length}개의 느린 리소스가 있습니다. 번들 크기 최적화 및 캐싱을 확인하세요.`,
          priority: 'medium'
        })
      }
      
      return recs
    })
    
    // ==============================================
    // 메서드
    // ==============================================
    
    /**
     * 패널 토글
     */
    function togglePanel() {
      isCollapsed.value = !isCollapsed.value
    }
    
    /**
     * 메트릭 새로고침
     */
    async function refreshMetrics() {
      isLoading.value = true
      
      try {
        const report = getPerformanceReport()
        
        // 메트릭 업데이트
        Object.assign(metrics, report.metrics)
        
        // 기타 데이터 업데이트
        navigationTiming.value = report.navigationTiming
        longTasks.value = report.longTasks || []
        slowResources.value = getSlowResources(props.slowResourceThreshold)
        overallScore.value = report.summary?.overallScore
        
        // 마지막 업데이트 시간
        lastUpdated.value = new Date().toLocaleTimeString('ko-KR')
      } catch (error) {
        console.error('메트릭 새로고침 실패:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    /**
     * 메트릭 값 포맷팅
     */
    function formatMetricValue(value, type) {
      if (value === undefined || value === null) return '--'
      
      if (type === 'cls') {
        return value.toFixed(3)
      } else if (type === 'ms') {
        if (value >= 1000) {
          return `${(value / 1000).toFixed(2)}s`
        }
        return `${Math.round(value)}ms`
      }
      
      return value
    }
    
    /**
     * 메트릭 등급 클래스 반환
     */
    function getMetricClass(metricName) {
      const metric = metrics[metricName]
      if (!metric) return ''
      
      const rating = metric.rating
      if (rating === 'good') return 'is-good'
      if (rating === 'needs-improvement') return 'is-needs-improvement'
      if (rating === 'poor') return 'is-poor'
      
      return ''
    }
    
    /**
     * 메트릭 등급 텍스트 반환
     */
    function getMetricRating(metricName) {
      const metric = metrics[metricName]
      if (!metric) return '측정 중...'
      
      const ratingMap = {
        'good': '좋음',
        'needs-improvement': '개선 필요',
        'poor': '나쁨'
      }
      
      return ratingMap[metric.rating] || metric.rating
    }
    
    /**
     * 메트릭 바 너비 계산
     */
    function getMetricBarWidth(metricName) {
      const metric = metrics[metricName]
      if (!metric) return '0%'
      
      const thresholds = PERFORMANCE_THRESHOLDS[metricName]
      if (!thresholds) return '100%'
      
      const value = metric.value
      const maxValue = thresholds.needsImprovement * 1.5
      
      const percentage = Math.min(100, (value / maxValue) * 100)
      return `${percentage}%`
    }
    
    /**
     * 등급 태그 타입 반환
     */
    function getRatingTagType(rating) {
      const typeMap = {
        'good': 'success',
        'needs-improvement': 'warning',
        'poor': 'danger'
      }
      return typeMap[rating] || 'info'
    }
    
    /**
     * 문자열 자르기
     */
    function truncateName(name, maxLength) {
      if (!name) return ''
      if (name.length <= maxLength) return name
      return name.substring(0, maxLength - 3) + '...'
    }
    
    /**
     * 리포트 내보내기 (콘솔 로그)
     */
    function exportReport() {
      const report = getPerformanceReport()
      console.log('📊 성능 리포트:', report)
      
      // 클립보드에 복사
      const reportText = JSON.stringify(report, null, 2)
      navigator.clipboard.writeText(reportText).then(() => {
        // ElMessage 사용 (Element Plus)
        window.$message?.success?.('리포트가 클립보드에 복사되었습니다.')
      }).catch(() => {
        window.$message?.info?.('콘솔에서 리포트를 확인하세요.')
      })
    }
    
    /**
     * 리포트 다운로드 (JSON 파일)
     */
    function downloadReport() {
      const report = getPerformanceReport()
      const reportJson = JSON.stringify(report, null, 2)
      
      const blob = new Blob([reportJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `km-portal-performance-${Date.now()}.json`
      link.click()
      
      URL.revokeObjectURL(url)
    }
    
    // ==============================================
    // 라이프사이클
    // ==============================================
    
    onMounted(async () => {
      // 성능 모니터링 초기화
      await initPerformanceMonitoring({
        enableWebVitals: true,
        enableLongTaskObserver: true,
        onReady: (report) => {
          Object.assign(metrics, report.metrics)
          navigationTiming.value = report.navigationTiming
          overallScore.value = report.summary?.overallScore
          lastUpdated.value = new Date().toLocaleTimeString('ko-KR')
        }
      })
      
      // 초기 데이터 로드
      setTimeout(refreshMetrics, 1000)
      
      // 자동 새로고침 설정
      if (props.autoRefreshInterval > 0) {
        refreshTimer = setInterval(refreshMetrics, props.autoRefreshInterval)
      }
    })
    
    onUnmounted(() => {
      // 타이머 정리
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
    })
    
    // ==============================================
    // 반환
    // ==============================================
    
    return {
      // 상태
      isCollapsed,
      isLoading,
      showDetailModal,
      activeTab,
      lastUpdated,
      metrics,
      navigationTiming,
      longTasks,
      slowResources,
      overallScore,
      
      // 계산된 속성
      scoreClass,
      metricsTableData,
      resourcesTableData,
      timingWaterfallData,
      recommendations,
      
      // 메서드
      togglePanel,
      refreshMetrics,
      formatMetricValue,
      getMetricClass,
      getMetricRating,
      getMetricBarWidth,
      getRatingTagType,
      truncateName,
      exportReport,
      downloadReport
    }
  }
}
</script>

<style lang="scss" scoped>
/* ==============================================
   Performance Monitor 스타일
   ============================================== */

.performance-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  &.is-collapsed {
    .monitor-toggle {
      border-radius: 8px;
    }
  }
}

/* 토글 버튼 */
.monitor-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .score-badge {
    background: white;
    color: #333;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 12px;
    
    &.excellent { background: #67c23a; color: white; }
    &.good { background: #409eff; color: white; }
    &.needs-improvement { background: #e6a23c; color: white; }
    &.poor { background: #f56c6c; color: white; }
  }
}

/* 메인 패널 */
.monitor-panel {
  width: 360px;
  max-height: 70vh;
  overflow-y: auto;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  
  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
}

/* 헤더 */
.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    font-size: 14px;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
}

/* 전체 점수 섹션 */
.overall-score-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .score-circle {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    &.excellent { background: linear-gradient(135deg, #67c23a, #85ce61); color: white; }
    &.good { background: linear-gradient(135deg, #409eff, #66b1ff); color: white; }
    &.needs-improvement { background: linear-gradient(135deg, #e6a23c, #ebb563); color: white; }
    &.poor { background: linear-gradient(135deg, #f56c6c, #f78989); color: white; }
    
    .score-value {
      font-size: 24px;
      font-weight: bold;
      line-height: 1;
    }
    
    .score-label {
      font-size: 10px;
      opacity: 0.9;
    }
  }
  
  .score-description {
    flex: 1;
    
    p {
      margin: 0;
      font-size: 14px;
      color: #333;
    }
  }
}

/* 메트릭 섹션 */
.metrics-section {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  
  h4 {
    margin: 0 0 12px;
    font-size: 13px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      
      &.warning {
        background: #fef0f0;
        color: #f56c6c;
      }
    }
  }
}

/* 메트릭 카드 그리드 */
.metric-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &.is-good {
    background: #f0f9eb;
    border-color: #67c23a;
  }
  
  &.is-needs-improvement {
    background: #fdf6ec;
    border-color: #e6a23c;
  }
  
  &.is-poor {
    background: #fef0f0;
    border-color: #f56c6c;
  }
  
  .metric-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-bottom: 4px;
    
    .metric-name {
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }
    
    .el-icon {
      font-size: 12px;
      color: #909399;
      cursor: help;
    }
  }
  
  .metric-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 2px;
  }
  
  .metric-rating {
    font-size: 10px;
    color: #909399;
    margin-bottom: 6px;
  }
  
  .metric-bar {
    height: 4px;
    background: #e4e7ed;
    border-radius: 2px;
    overflow: hidden;
    
    .metric-bar-fill {
      height: 100%;
      background: currentColor;
      border-radius: 2px;
      transition: width 0.5s ease;
    }
  }
  
  &.is-good .metric-bar-fill { background: #67c23a; }
  &.is-needs-improvement .metric-bar-fill { background: #e6a23c; }
  &.is-poor .metric-bar-fill { background: #f56c6c; }
}

/* 추가 메트릭 */
.additional-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.additional-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 6px;
  
  .metric-label {
    font-size: 12px;
    color: #666;
  }
  
  .metric-value {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    
    &.is-good { color: #67c23a; }
    &.is-needs-improvement { color: #e6a23c; }
    &.is-poor { color: #f56c6c; }
  }
}

/* Long Tasks 리스트 */
.long-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.long-task-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 12px;
  
  &.is-critical {
    background: #f56c6c;
    color: white;
  }
  
  .task-duration {
    font-weight: 600;
  }
  
  .task-time {
    opacity: 0.7;
  }
}

.more-tasks, .more-resources {
  text-align: center;
  font-size: 11px;
  color: #909399;
  padding: 4px;
}

/* 느린 리소스 리스트 */
.slow-resources-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slow-resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 12px;
  
  .resource-info {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    
    .resource-type {
      background: #e6a23c;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .resource-name {
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .resource-duration {
    font-weight: 600;
    color: #e6a23c;
  }
}

/* 푸터 */
.monitor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
  
  .last-updated {
    font-size: 11px;
    color: #909399;
  }
}

/* 상세 리포트 모달 */
.detail-report {
  .detail-section {
    h4 {
      margin: 0 0 16px;
      font-size: 14px;
      color: #333;
    }
  }
}

/* 타이밍 워터폴 */
.timing-waterfall {
  .timing-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    
    .timing-label {
      width: 100px;
      font-size: 12px;
      color: #666;
    }
    
    .timing-bar-container {
      flex: 1;
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      
      .timing-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }
    }
    
    .timing-value {
      width: 60px;
      text-align: right;
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }
  }
}

/* 권장사항 리스트 */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
  
  &.high {
    border-left-color: #f56c6c;
    background: #fef0f0;
  }
  
  .el-icon {
    color: #909399;
    margin-top: 2px;
  }
  
  .rec-content {
    flex: 1;
    
    h5 {
      margin: 0 0 4px;
      font-size: 13px;
      color: #333;
    }
    
    p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  }
}

.no-recommendations {
  text-align: center;
  padding: 40px 20px;
  color: #67c23a;
  
  .el-icon {
    margin-bottom: 12px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

/* 테이블 느린 리소스 강조 */
.is-slow {
  color: #f56c6c;
  font-weight: 600;
}
</style>
