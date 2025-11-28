<!--
============================================
🖼️ src/components/common/LazyImage.vue
이미지 지연 로딩 컴포넌트

37일차 UI 고급 개선 - 모바일 최적화

주요 기능:
1. Intersection Observer API를 사용한 지연 로딩
2. 로딩 중 플레이스홀더 표시
3. 로드 실패 시 대체 이미지 표시
4. 점진적 이미지 로딩 효과 (블러 → 선명)
5. 반응형 이미지 지원 (srcset)
6. 접근성 지원 (alt 텍스트)

사용법:
```vue
<LazyImage
  src="/images/photo.jpg"
  alt="사진 설명"
  :width="300"
  :height="200"
  placeholder="/images/placeholder.svg"
  fallback="/images/error.svg"
/>
```

@author KM Portal Dev Team
@version 1.0
@since 2025-11-28 (37일차)
============================================
-->

<template>
  <div 
    ref="containerRef"
    class="lazy-image-container"
    :style="containerStyle"
    :class="containerClass"
  >
    <!-- 
      플레이스홀더 (로딩 전/로딩 중 표시)
      - 이미지가 로드되기 전에 공간 확보
      - 로딩 중 스피너 또는 스켈레톤 표시
    -->
    <div 
      v-if="!isLoaded || isLoading" 
      class="lazy-image-placeholder"
    >
      <!-- 사용자 정의 플레이스홀더 슬롯 -->
      <slot name="placeholder">
        <!-- 기본 플레이스홀더: 스켈레톤 + 아이콘 -->
        <div class="placeholder-content">
          <el-icon v-if="!isLoading" class="placeholder-icon">
            <Picture />
          </el-icon>
          <el-icon v-else class="loading-icon is-loading">
            <Loading />
          </el-icon>
        </div>
      </slot>
    </div>

    <!-- 
      실제 이미지
      - inView가 true가 되면 src 로드 시작
      - 로드 완료 시 페이드인 효과
    -->
    <img
      v-if="shouldLoad"
      ref="imageRef"
      :src="currentSrc"
      :srcset="srcset"
      :sizes="sizes"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="nativeLazy ? 'lazy' : 'eager'"
      class="lazy-image"
      :class="{ 'is-loaded': isLoaded, 'is-error': hasError }"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 
      에러 상태 표시 (로드 실패 시)
    -->
    <div 
      v-if="hasError && !fallback" 
      class="lazy-image-error"
    >
      <slot name="error">
        <el-icon class="error-icon"><PictureFilled /></el-icon>
        <span class="error-text">이미지를 불러올 수 없습니다</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * LazyImage.vue - 이미지 지연 로딩 컴포넌트
 * 
 * Intersection Observer API를 사용하여 뷰포트에 진입할 때만
 * 이미지를 로드하여 초기 페이지 로딩 속도를 개선합니다.
 * 
 * @version 1.0 (37일차)
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Picture, PictureFilled, Loading } from '@element-plus/icons-vue'

// ========================================
// Props 정의
// ========================================

const props = defineProps({
  /**
   * 이미지 URL (필수)
   */
  src: {
    type: String,
    required: true
  },

  /**
   * 대체 텍스트 (접근성)
   */
  alt: {
    type: String,
    default: ''
  },

  /**
   * 이미지 너비 (px)
   * - 플레이스홀더 크기 설정에 사용
   */
  width: {
    type: [Number, String],
    default: null
  },

  /**
   * 이미지 높이 (px)
   * - 플레이스홀더 크기 설정에 사용
   */
  height: {
    type: [Number, String],
    default: null
  },

  /**
   * 가로세로 비율 (예: '16/9', '4/3', '1/1')
   * - width/height가 없을 때 사용
   */
  aspectRatio: {
    type: String,
    default: null
  },

  /**
   * 플레이스홀더 이미지 URL
   * - 저해상도 미리보기 이미지 또는 단색 이미지
   */
  placeholder: {
    type: String,
    default: null
  },

  /**
   * 로드 실패 시 대체 이미지 URL
   */
  fallback: {
    type: String,
    default: null
  },

  /**
   * srcset 속성 (반응형 이미지)
   * 예: 'image-320.jpg 320w, image-640.jpg 640w'
   */
  srcset: {
    type: String,
    default: null
  },

  /**
   * sizes 속성 (srcset과 함께 사용)
   * 예: '(max-width: 320px) 280px, 640px'
   */
  sizes: {
    type: String,
    default: null
  },

  /**
   * Intersection Observer 루트 마진
   * - 양수: 미리 로드 시작 (예: '200px')
   * - 음수: 더 늦게 로드
   */
  rootMargin: {
    type: String,
    default: '200px 0px'  // 뷰포트 200px 위에서 미리 로드 시작
  },

  /**
   * Intersection Observer 임계값 (0~1)
   * - 0: 1px만 보여도 트리거
   * - 1: 전체가 보여야 트리거
   */
  threshold: {
    type: Number,
    default: 0.01
  },

  /**
   * 네이티브 lazy 로딩 사용 여부
   * - true: loading="lazy" 속성 추가
   * - false: Intersection Observer만 사용
   */
  nativeLazy: {
    type: Boolean,
    default: false
  },

  /**
   * 객체 적합 방식
   * - 'cover': 영역을 채움 (잘릴 수 있음)
   * - 'contain': 영역 안에 맞춤 (여백 가능)
   * - 'fill': 영역에 맞게 늘림
   */
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain', 'fill', 'none', 'scale-down'].includes(value)
  },

  /**
   * 즉시 로드 여부 (지연 로딩 비활성화)
   */
  eager: {
    type: Boolean,
    default: false
  }
})

// ========================================
// Emits 정의
// ========================================

const emit = defineEmits([
  'load',     // 이미지 로드 완료
  'error',    // 이미지 로드 실패
  'inView'    // 뷰포트에 진입
])

// ========================================
// 반응형 상태
// ========================================

/**
 * 컨테이너 요소 ref
 */
const containerRef = ref(null)

/**
 * 이미지 요소 ref
 */
const imageRef = ref(null)

/**
 * 뷰포트에 진입했는지 여부
 */
const inView = ref(false)

/**
 * 이미지 로딩 중 여부
 */
const isLoading = ref(false)

/**
 * 이미지 로드 완료 여부
 */
const isLoaded = ref(false)

/**
 * 이미지 로드 에러 여부
 */
const hasError = ref(false)

/**
 * Intersection Observer 인스턴스
 */
let observer = null

// ========================================
// 계산된 속성
// ========================================

/**
 * 이미지 로드를 시작해야 하는지 여부
 */
const shouldLoad = computed(() => {
  // eager가 true면 즉시 로드
  if (props.eager) return true

  // 뷰포트에 진입했으면 로드
  return inView.value
})

/**
 * 현재 표시할 이미지 URL
 * - 에러 시 fallback, 그 외 원본 src
 */
const currentSrc = computed(() => {
  if (hasError.value && props.fallback) {
    return props.fallback
  }
  return props.src
})

/**
 * 컨테이너 스타일
 */
const containerStyle = computed(() => {
  const style = {}

  // 너비/높이 설정
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }

  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  // 가로세로 비율 설정
  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio
  }

  // 객체 적합 방식
  style['--object-fit'] = props.objectFit

  return style
})

/**
 * 컨테이너 클래스
 */
const containerClass = computed(() => ({
  'is-loading': isLoading.value,
  'is-loaded': isLoaded.value,
  'has-error': hasError.value
}))

// ========================================
// 메서드
// ========================================

/**
 * Intersection Observer 생성 및 관찰 시작
 */
function createObserver() {
  // SSR 환경이나 Observer 미지원 시 즉시 로드
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    inView.value = true
    return
  }

  // eager 모드면 Observer 불필요
  if (props.eager) {
    inView.value = true
    return
  }

  // Observer 옵션
  const options = {
    rootMargin: props.rootMargin,
    threshold: props.threshold
  }

  // Observer 생성
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log('[LazyImage] 뷰포트 진입:', props.src)

        inView.value = true
        isLoading.value = true

        emit('inView')

        // 한 번 로드 시작하면 더 이상 관찰 불필요
        observer?.disconnect()
      }
    })
  }, options)

  // 컨테이너 요소 관찰 시작
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

/**
 * Observer 정리
 */
function destroyObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

/**
 * 이미지 로드 완료 핸들러
 */
function handleLoad() {
  console.log('[LazyImage] 이미지 로드 완료:', props.src)

  isLoading.value = false
  isLoaded.value = true
  hasError.value = false

  emit('load', { src: props.src })
}

/**
 * 이미지 로드 실패 핸들러
 */
function handleError(event) {
  console.error('[LazyImage] 이미지 로드 실패:', props.src)

  isLoading.value = false
  hasError.value = true

  emit('error', { src: props.src, event })
}

// ========================================
// 라이프사이클 훅
// ========================================

onMounted(() => {
  createObserver()
})

onUnmounted(() => {
  destroyObserver()
})

// src가 변경되면 상태 초기화
watch(() => props.src, () => {
  isLoaded.value = false
  isLoading.value = false
  hasError.value = false

  // 이미 뷰포트에 있으면 즉시 로딩 시작
  if (inView.value) {
    isLoading.value = true
  }
})
</script>

<style lang="scss" scoped>
/**
 * 이미지 지연 로딩 컴포넌트 스타일
 */

.lazy-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;

  // 기본 크기 (너비/높이가 지정되지 않은 경우)
  min-width: 50px;
  min-height: 50px;

  // 블록 레벨 요소로 설정
  display: block;
}

// ========================================
// 플레이스홀더 스타일
// ========================================
.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;

  // 페이드아웃 애니메이션
  transition: opacity 0.3s ease;
  z-index: 1;

  .is-loaded & {
    opacity: 0;
    pointer-events: none;
  }
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.placeholder-icon {
  font-size: 32px;
}

.loading-icon {
  font-size: 24px;
  color: #409eff;
}

// 로딩 애니메이션
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.is-loading {
  animation: spin 1s linear infinite;
}

// ========================================
// 이미지 스타일
// ========================================
.lazy-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--object-fit, cover);

  // 초기 상태: 투명 + 약간 확대
  opacity: 0;
  transform: scale(1.05);
  transition: 
    opacity 0.5s ease,
    transform 0.5s ease;

  // 로드 완료 상태
  &.is-loaded {
    opacity: 1;
    transform: scale(1);
  }

  // 에러 상태
  &.is-error {
    opacity: 0;
  }
}

// ========================================
// 에러 상태 스타일
// ========================================
.lazy-image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  z-index: 2;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #c0c4cc;
}

.error-text {
  font-size: 12px;
}

// ========================================
// 스켈레톤 애니메이션 (선택적)
// ========================================
.lazy-image-container.is-loading {
  .lazy-image-placeholder {
    background: linear-gradient(
      90deg,
      #f5f7fa 25%,
      #e4e7ed 50%,
      #f5f7fa 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>