/**
 * ============================================
 * 📱 src/composables/useSwipeGesture.js
 * 스와이프 제스처 감지 컴포저블 (Vue 3 Composition API)
 *
 * 37일차 UI 고급 개선 - 모바일 최적화
 *
 * 주요 기능:
 * 1. 터치 스와이프 제스처 감지 (좌/우/상/하)
 * 2. 스와이프 방향 및 거리 계산
 * 3. 커스터마이징 가능한 임계값
 * 4. 디바운싱으로 성능 최적화
 * 5. 자동 정리 (컴포넌트 언마운트 시)
 *
 * 사용법:
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import useSwipeGesture from '@/composables/useSwipeGesture'
 *
 * const containerRef = ref(null)
 *
 * const { onSwipe, isSweping } = useSwipeGesture(containerRef, {
 *   threshold: 50,
 *   onSwipeLeft: () => console.log('왼쪽으로 스와이프'),
 *   onSwipeRight: () => console.log('오른쪽으로 스와이프')
 * })
 * </script>
 *
 * <template>
 *   <div ref="containerRef">스와이프 가능 영역</div>
 * </template>
 * ```
 *
 * @author KM Portal Dev Team
 * @version 1.0
 * @since 2025-11-28 (37일차)
 * ============================================
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * 스와이프 제스처 컴포저블
 *
 * @param {Ref} targetRef - 스와이프를 감지할 요소의 ref
 * @param {Object} options - 설정 옵션
 * @param {number} [options.threshold=50] - 스와이프 인식 최소 거리 (px)
 * @param {number} [options.maxTime=300] - 스와이프 인식 최대 시간 (ms)
 * @param {Function} [options.onSwipeLeft] - 왼쪽 스와이프 콜백
 * @param {Function} [options.onSwipeRight] - 오른쪽 스와이프 콜백
 * @param {Function} [options.onSwipeUp] - 위쪽 스와이프 콜백
 * @param {Function} [options.onSwipeDown] - 아래쪽 스와이프 콜백
 * @param {Function} [options.onSwipe] - 모든 스와이프 콜백 (방향 정보 포함)
 * @param {boolean} [options.preventScroll=false] - 스와이프 시 스크롤 방지
 *
 * @returns {Object} 스와이프 상태 및 메서드
 */
export default function useSwipeGesture(targetRef, options = {}) {
  // ========================================
  // 기본 옵션 설정
  // ========================================

  const {
    threshold = 50,           // 스와이프 인식 최소 거리 (px)
    maxTime = 300,            // 스와이프 인식 최대 시간 (ms)
    onSwipeLeft = null,       // 왼쪽 스와이프 콜백
    onSwipeRight = null,      // 오른쪽 스와이프 콜백
    onSwipeUp = null,         // 위쪽 스와이프 콜백
    onSwipeDown = null,       // 아래쪽 스와이프 콜백
    onSwipe = null,           // 모든 스와이프 콜백
    preventScroll = false     // 수평 스와이프 시 스크롤 방지
  } = options

  // ========================================
  // 반응형 상태
  // ========================================

  /**
   * 스와이프 중인지 여부
   * UI에서 스와이프 진행 중 상태를 표시할 때 사용
   */
  const isSwiping = ref(false)

  /**
   * 마지막 스와이프 방향
   * 'left', 'right', 'up', 'down' 또는 null
   */
  const swipeDirection = ref(null)

  /**
   * 마지막 스와이프 거리 (px)
   */
  const swipeDistance = ref(0)

  // ========================================
  // 내부 상태 (비반응형)
  // ========================================

  // 터치 시작 좌표
  let touchStartX = 0
  let touchStartY = 0

  // 터치 시작 시간
  let touchStartTime = 0

  // 이벤트 리스너 바인딩 여부
  let isListening = false

  // ========================================
  // 이벤트 핸들러
  // ========================================

  /**
   * 터치 시작 이벤트 핸들러
   *
   * 터치가 시작될 때 시작 좌표와 시간을 기록합니다.
   *
   * @param {TouchEvent} event - 터치 이벤트
   */
  function handleTouchStart(event) {
    // 멀티 터치는 무시 (핀치 줌 등)
    if (event.touches.length !== 1) return

    const touch = event.touches[0]

    // 시작 좌표 및 시간 기록
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()

    // 스와이프 상태 초기화
    isSwiping.value = true
    swipeDirection.value = null
    swipeDistance.value = 0
  }

  /**
   * 터치 이동 이벤트 핸들러
   *
   * 터치 이동 중 스와이프 방향을 감지하고,
   * 필요시 스크롤을 방지합니다.
   *
   * @param {TouchEvent} event - 터치 이벤트
   */
  function handleTouchMove(event) {
    if (!isSwiping.value) return
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    // 수평 스와이프가 더 큰 경우 스크롤 방지
    if (preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault()
    }
  }

  /**
   * 터치 종료 이벤트 핸들러
   *
   * 터치가 끝났을 때 스와이프 여부를 판단하고 콜백을 호출합니다.
   *
   * @param {TouchEvent} event - 터치 이벤트
   */
  function handleTouchEnd(event) {
    if (!isSwiping.value) return

    isSwiping.value = false

    // 터치 종료 시점의 좌표 계산
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    const deltaTime = Date.now() - touchStartTime

    // 시간 초과 시 스와이프로 인식하지 않음
    if (deltaTime > maxTime) {
      return
    }

    // 이동 거리 계산
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // 스와이프 방향 판별
    let direction = null

    // 수평 스와이프가 더 큰 경우
    if (absX > absY && absX >= threshold) {
      direction = deltaX > 0 ? 'right' : 'left'
      swipeDistance.value = absX
    }
    // 수직 스와이프가 더 큰 경우
    else if (absY > absX && absY >= threshold) {
      direction = deltaY > 0 ? 'down' : 'up'
      swipeDistance.value = absY
    }

    // 스와이프가 감지되었으면 콜백 호출
    if (direction) {
      swipeDirection.value = direction

      // 디버깅 로그
      console.log(`[useSwipeGesture] 스와이프 감지: ${direction}, 거리: ${swipeDistance.value}px`)

      // 방향별 콜백 호출
      switch (direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }

      // 통합 콜백 호출
      onSwipe?.({
        direction,
        distance: swipeDistance.value,
        deltaX,
        deltaY,
        duration: deltaTime
      })
    }
  }

  /**
   * 터치 취소 이벤트 핸들러
   *
   * 터치가 취소되면 스와이프 상태를 초기화합니다.
   */
  function handleTouchCancel() {
    isSwiping.value = false
    swipeDirection.value = null
    swipeDistance.value = 0
  }

  // ========================================
  // 이벤트 리스너 등록/해제
  // ========================================

  /**
   * 이벤트 리스너 등록
   *
   * 타겟 요소에 터치 이벤트 리스너를 추가합니다.
   */
  function addListeners() {
    const target = targetRef.value

    if (!target || isListening) return

    target.addEventListener('touchstart', handleTouchStart, { passive: true })
    target.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll })
    target.addEventListener('touchend', handleTouchEnd, { passive: true })
    target.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    isListening = true
    console.log('[useSwipeGesture] 이벤트 리스너 등록 완료')
  }

  /**
   * 이벤트 리스너 해제
   *
   * 타겟 요소에서 터치 이벤트 리스너를 제거합니다.
   */
  function removeListeners() {
    const target = targetRef.value

    if (!target || !isListening) return

    target.removeEventListener('touchstart', handleTouchStart)
    target.removeEventListener('touchmove', handleTouchMove)
    target.removeEventListener('touchend', handleTouchEnd)
    target.removeEventListener('touchcancel', handleTouchCancel)

    isListening = false
    console.log('[useSwipeGesture] 이벤트 리스너 해제 완료')
  }

  // ========================================
  // 라이프사이클 훅
  // ========================================

  // 컴포넌트 마운트 시 이벤트 리스너 등록
  onMounted(() => {
    addListeners()
  })

  // 컴포넌트 언마운트 시 이벤트 리스너 해제
  onUnmounted(() => {
    removeListeners()
  })

  // targetRef가 변경되면 리스너 재등록
  watch(targetRef, (newTarget, oldTarget) => {
    if (oldTarget) {
      removeListeners()
    }
    if (newTarget) {
      addListeners()
    }
  })

  // ========================================
  // 반환값
  // ========================================

  return {
    // 반응형 상태
    isSwiping,        // 스와이프 중 여부
    swipeDirection,   // 마지막 스와이프 방향
    swipeDistance,    // 마지막 스와이프 거리

    // 메서드
    addListeners,     // 수동으로 리스너 등록
    removeListeners   // 수동으로 리스너 해제
  }
}

/**
 * ====== 사용 예시 ======
 *
 * 1. 기본 사용법:
 *
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import useSwipeGesture from '@/composables/useSwipeGesture'
 *
 * const swipeArea = ref(null)
 *
 * useSwipeGesture(swipeArea, {
 *   onSwipeLeft: () => {
 *     console.log('다음 페이지')
 *   },
 *   onSwipeRight: () => {
 *     console.log('이전 페이지')
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div ref="swipeArea" class="swipe-container">
 *     스와이프하세요
 *   </div>
 * </template>
 * ```
 *
 * 2. 사이드바 토글 예시:
 *
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import useSwipeGesture from '@/composables/useSwipeGesture'
 *
 * const layoutRef = ref(null)
 * const sidebarOpen = ref(false)
 *
 * useSwipeGesture(layoutRef, {
 *   threshold: 75,
 *   onSwipeRight: () => {
 *     // 왼쪽 가장자리에서 오른쪽으로 스와이프하면 사이드바 열기
 *     sidebarOpen.value = true
 *   },
 *   onSwipeLeft: () => {
 *     // 사이드바가 열려있으면 닫기
 *     if (sidebarOpen.value) {
 *       sidebarOpen.value = false
 *     }
 *   }
 * })
 * </script>
 * ```
 *
 * 3. 스와이프 정보 활용 예시:
 *
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import useSwipeGesture from '@/composables/useSwipeGesture'
 *
 * const area = ref(null)
 *
 * const { swipeDirection, swipeDistance, isSwiping } = useSwipeGesture(area, {
 *   onSwipe: (info) => {
 *     console.log('방향:', info.direction)
 *     console.log('거리:', info.distance, 'px')
 *     console.log('수평 이동:', info.deltaX, 'px')
 *     console.log('수직 이동:', info.deltaY, 'px')
 *     console.log('소요 시간:', info.duration, 'ms')
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div ref="area">
 *     <p v-if="isSwiping">스와이프 중...</p>
 *     <p>마지막 방향: {{ swipeDirection }}</p>
 *     <p>마지막 거리: {{ swipeDistance }}px</p>
 *   </div>
 * </template>
 * ```
 */