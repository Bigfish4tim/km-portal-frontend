<!--
  LoadingSpinner.vue - 범용 로딩 스피너 컴포넌트
  파일 위치: src/components/common/LoadingSpinner.vue
  
  이 컴포넌트는 다음과 같은 상황에서 사용됩니다:
  1. API 호출 중 로딩 표시
  2. 페이지 전환시 로딩 표시
  3. 파일 업로드/다운로드 진행 상황 표시
  4. 데이터 처리 중 대기 화면
-->

<template>
  <div 
    class="loading-container"
    :class="{
      'is-overlay': overlay,
      'is-fullscreen': fullscreen,
      'is-inline': !overlay && !fullscreen
    }"
    v-show="visible"
  >
    <!-- 배경 오버레이 (overlay 모드일 때) -->
    <div 
      v-if="overlay || fullscreen" 
      class="loading-backdrop"
      @click="handleBackdropClick"
    />
    
    <!-- 로딩 스피너 컨테이너 -->
    <div class="loading-content">
      <!-- 스피너 아이콘 -->
      <div 
        class="loading-spinner"
        :class="`size-${size}`"
        :style="spinnerStyle"
      >
        <!-- 커스텀 스피너 (기본) -->
        <div v-if="type === 'spinner'" class="spinner">
          <div class="spinner-circle"></div>
        </div>
        
        <!-- 점 애니메이션 -->
        <div v-else-if="type === 'dots'" class="dots">
          <div class="dot" v-for="n in 3" :key="n"></div>
        </div>
        
        <!-- 바 애니메이션 -->
        <div v-else-if="type === 'bars'" class="bars">
          <div class="bar" v-for="n in 4" :key="n"></div>
        </div>
        
        <!-- Element Plus 스피너 -->
        <el-icon v-else-if="type === 'element'" class="is-loading">
          <Loading />
        </el-icon>
        
        <!-- 펄스 애니메이션 -->
        <div v-else-if="type === 'pulse'" class="pulse">
          <div class="pulse-circle"></div>
        </div>
      </div>
      
      <!-- 로딩 메시지 -->
      <div 
        v-if="text" 
        class="loading-text"
        :class="`text-${size}`"
      >
        {{ text }}
      </div>
      
      <!-- 진행률 표시 (선택적) -->
      <div 
        v-if="progress !== null" 
        class="loading-progress"
      >
        <el-progress 
          :percentage="progress" 
          :show-text="showProgressText"
          :stroke-width="progressStrokeWidth"
        />
      </div>
      
      <!-- 취소 버튼 (선택적) -->
      <el-button
        v-if="cancelable"
        class="loading-cancel-btn"
        size="small"
        type="text"
        @click="handleCancel"
      >
        취소
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

/**
 * 컴포넌트 Props 정의
 */
const props = defineProps({
  // 로딩 스피너 표시 여부
  visible: {
    type: Boolean,
    default: true
  },
  
  // 스피너 타입
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'bars', 'element', 'pulse'].includes(value)
  },
  
  // 크기 ('small', 'medium', 'large')
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  
  // 로딩 메시지 텍스트
  text: {
    type: String,
    default: ''
  },
  
  // 오버레이 모드 (배경을 어둡게 하고 가운데 표시)
  overlay: {
    type: Boolean,
    default: false
  },
  
  // 전체 화면 모드
  fullscreen: {
    type: Boolean,
    default: false
  },
  
  // 스피너 색상 커스터마이징
  color: {
    type: String,
    default: '#1890ff'
  },
  
  // 진행률 (0-100, null이면 표시 안함)
  progress: {
    type: Number,
    default: null,
    validator: (value) => value === null || (value >= 0 && value <= 100)
  },
  
  // 진행률 텍스트 표시 여부
  showProgressText: {
    type: Boolean,
    default: true
  },
  
  // 진행률 바 두께
  progressStrokeWidth: {
    type: Number,
    default: 6
  },
  
  // 취소 버튼 표시 여부
  cancelable: {
    type: Boolean,
    default: false
  },
  
  // 배경 클릭시 닫기 방지
  preventBackdropClose: {
    type: Boolean,
    default: false
  }
})

/**
 * 이벤트 정의
 */
const emit = defineEmits(['cancel', 'backdrop-click'])

/**
 * 반응형 데이터
 */
const spinnerRef = ref(null)

/**
 * 계산된 속성들
 */
const spinnerStyle = computed(() => ({
  '--spinner-color': props.color
}))

/**
 * 메서드들
 */

/**
 * 배경 클릭 처리
 */
const handleBackdropClick = () => {
  emit('backdrop-click')
  
  if (!props.preventBackdropClose) {
    // 부모 컴포넌트에서 visible을 false로 변경하도록 이벤트 전달
    emit('cancel')
  }
}

/**
 * 취소 버튼 클릭 처리
 */
const handleCancel = () => {
  emit('cancel')
}

/**
 * ESC 키 처리 (전체 화면 모드일 때)
 */
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && props.fullscreen && !props.preventBackdropClose) {
    emit('cancel')
  }
}

/**
 * 라이프사이클 훅
 */
onMounted(() => {
  if (props.fullscreen) {
    document.addEventListener('keydown', handleKeyDown)
    // 전체 화면 모드일 때 body 스크롤 방지
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  if (props.fullscreen) {
    document.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss" scoped>
// SCSS 변수 import (실제 프로젝트에서는 전역으로 설정)
$primary-color: #1890ff;
$gray-5: #8c8c8c;
$white: #ffffff;
$black-alpha-50: rgba(0, 0, 0, 0.5);
$spacing-base: 16px;
$spacing-sm: 8px;
$spacing-lg: 24px;
$border-radius-base: 6px;
$transition-base: 0.3s;
$z-index-modal: 1050;

.loading-container {
  position: relative;
  
  // 오버레이 모드
  &.is-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-index-modal;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  // 전체 화면 모드
  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-index-modal + 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  // 인라인 모드 (기본)
  &.is-inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-base;
  }
}

.loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $black-alpha-50;
  backdrop-filter: blur(2px);
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background: $white;
  border-radius: $border-radius-base;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  
  .is-inline & {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }
}

.loading-spinner {
  --spinner-color: #{$primary-color};
  margin-bottom: $spacing-base;
  
  &.size-small {
    width: 24px;
    height: 24px;
  }
  
  &.size-medium {
    width: 32px;
    height: 32px;
  }
  
  &.size-large {
    width: 48px;
    height: 48px;
  }
}

// ====== 스피너 타입별 스타일 ======

// 기본 스피너
.spinner {
  width: 100%;
  height: 100%;
  
  .spinner-circle {
    width: 100%;
    height: 100%;
    border: 3px solid rgba(var(--spinner-color), 0.3);
    border-top: 3px solid var(--spinner-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

// 점 애니메이션
.dots {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  .dot {
    width: 8px;
    height: 8px;
    background: var(--spinner-color);
    border-radius: 50%;
    animation: dotBounce 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
}

// 바 애니메이션
.bars {
  display: flex;
  gap: 3px;
  align-items: end;
  justify-content: center;
  height: 100%;
  
  .bar {
    width: 4px;
    height: 100%;
    background: var(--spinner-color);
    animation: barStretch 1.2s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.45s; }
    &:nth-child(2) { animation-delay: -0.3s; }
    &:nth-child(3) { animation-delay: -0.15s; }
    &:nth-child(4) { animation-delay: 0s; }
  }
}

// Element Plus 아이콘
.el-icon.is-loading {
  font-size: inherit;
  color: var(--spinner-color);
  animation: spin 1s linear infinite;
}

// 펄스 애니메이션
.pulse {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .pulse-circle {
    width: 60%;
    height: 60%;
    background: var(--spinner-color);
    border-radius: 50%;
    animation: pulse 1.5s infinite ease-in-out;
  }
}

// ====== 애니메이션 정의 ======

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes barStretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

// ====== 텍스트 및 기타 요소 ======

.loading-text {
  color: $gray-5;
  text-align: center;
  margin-bottom: $spacing-sm;
  
  &.text-small {
    font-size: 12px;
  }
  
  &.text-medium {
    font-size: 14px;
  }
  
  &.text-large {
    font-size: 16px;
  }
}

.loading-progress {
  width: 200px;
  margin-bottom: $spacing-sm;
}

.loading-cancel-btn {
  margin-top: $spacing-sm;
}
</style>

<!--
사용 예시:

1. 기본 인라인 스피너:
<LoadingSpinner visible />

2. 오버레이 모드:
<LoadingSpinner 
  :visible="isLoading" 
  overlay 
  text="데이터를 불러오는 중..." 
/>

3. 전체 화면 모드:
<LoadingSpinner 
  :visible="isLoading" 
  fullscreen 
  text="처리 중입니다..." 
  cancelable
  @cancel="handleCancel"
/>

4. 진행률 표시:
<LoadingSpinner 
  :visible="isUploading" 
  overlay
  text="파일 업로드 중..."
  :progress="uploadProgress"
  cancelable
  @cancel="cancelUpload"
/>

5. 다양한 스타일:
<LoadingSpinner type="dots" size="large" color="#52c41a" />
<LoadingSpinner type="bars" size="small" />
<LoadingSpinner type="pulse" color="#722ed1" />
-->