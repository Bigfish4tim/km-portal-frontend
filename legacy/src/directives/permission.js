/**
 * 권한 제어 커스텀 디렉티브
 * 
 * v-permission 디렉티브를 제공하여 Vue 컴포넌트에서
 * 간단하게 권한별 요소 표시/숨김을 처리할 수 있습니다.
 * 
 * 사용법:
 * <el-button v-permission="['ROLE_ADMIN']">삭제</el-button>
 * <el-button v-permission="['ROLE_ADMIN', 'ROLE_MANAGER']">수정</el-button>
 * 
 * 장점:
 * 1. 코드가 간결해짐 (v-if 대신 v-permission 사용)
 * 2. 재사용성이 높음
 * 3. 유지보수가 쉬움
 * 
 * @author KM Portal Team
 * @version 1.0
 * @since 2025-11-06
 */

import store from '@/store'

/**
 * 권한 확인 디렉티브
 * 
 * 사용자가 지정된 권한 중 하나라도 가지고 있으면 요소를 표시하고,
 * 없으면 DOM에서 완전히 제거합니다.
 * 
 * @example
 * // 예시 1: ADMIN만 볼 수 있는 버튼
 * <el-button v-permission="['ROLE_ADMIN']">
 *   삭제
 * </el-button>
 * 
 * @example
 * // 예시 2: ADMIN 또는 MANAGER가 볼 수 있는 버튼
 * <el-button v-permission="['ROLE_ADMIN', 'ROLE_MANAGER']">
 *   수정
 * </el-button>
 * 
 * @example
 * // 예시 3: 섹션 전체를 권한으로 제어
 * <div v-permission="['ROLE_ADMIN']">
 *   <h3>관리자 전용 기능</h3>
 *   <p>이 섹션은 관리자만 볼 수 있습니다.</p>
 * </div>
 */
export default {
  /**
   * Vue 앱에 디렉티브를 설치하는 메서드
   * 
   * @param {Object} app - Vue 앱 인스턴스
   */
  install(app) {
    /**
     * v-permission 디렉티브 등록
     */
    app.directive('permission', {
      /**
       * 요소가 DOM에 마운트될 때 실행
       * 
       * @param {HTMLElement} el - 디렉티브가 적용된 DOM 요소
       * @param {Object} binding - 디렉티브 바인딩 정보
       * @param {Array} binding.value - 필요한 권한 목록 (예: ['ROLE_ADMIN'])
       * 
       * 동작 방식:
       * 1. Vuex store에서 현재 사용자의 권한 목록을 가져옴
       * 2. 사용자가 필요 권한 중 하나라도 가지고 있는지 확인
       * 3. 권한이 없으면 DOM에서 요소를 완전히 제거
       * 
       * 주의:
       * - display: none이 아니라 DOM에서 완전히 제거됨
       * - 개발자 도구에서도 요소를 볼 수 없음
       * - 보안상 더 안전함 (HTML 소스 코드에도 없음)
       */
      mounted(el, binding) {
        // 디렉티브에 전달된 권한 목록
        const { value } = binding

        // Vuex store에서 현재 사용자의 권한 가져오기
        const userRoles = store.getters['auth/userRoles'] || []

        console.log('[Permission Directive] 권한 체크')
        console.log('[Permission Directive] 필요 권한:', value)
        console.log('[Permission Directive] 사용자 권한:', userRoles)

        /**
         * 권한 체크 로직
         * 
         * 조건:
         * 1. value가 배열이어야 함
         * 2. 배열에 요소가 있어야 함
         * 
         * 체크:
         * - Array.some(): 배열의 요소 중 하나라도 조건을 만족하면 true
         * - 사용자가 필요 권한 중 하나라도 가지고 있으면 hasPermission = true
         */
        if (value && value instanceof Array && value.length > 0) {
          const hasPermission = value.some(role => userRoles.includes(role))

          console.log('[Permission Directive] 권한 확인 결과:', hasPermission)

          /**
           * 권한이 없는 경우 요소 제거
           * 
           * 1. el.parentNode 확인: 부모 요소가 있는지 확인
           * 2. removeChild(el): 부모 요소에서 현재 요소를 제거
           * 
           * 결과:
           * - DOM에서 완전히 사라짐
           * - 화면에 표시되지 않음
           * - 개발자 도구에서도 볼 수 없음
           */
          if (!hasPermission) {
            console.log('[Permission Directive] 권한 없음 - 요소 제거')
            el.parentNode && el.parentNode.removeChild(el)
          } else {
            console.log('[Permission Directive] 권한 있음 - 요소 표시')
          }
        } else {
          /**
           * 권한이 지정되지 않은 경우
           * 
           * v-permission="[]" 또는 v-permission="null" 등
           * 잘못된 사용법이므로 경고 표시
           */
          console.warn('[Permission Directive] 잘못된 사용법 - 권한 배열이 비어있거나 유효하지 않습니다')
          console.warn('[Permission Directive] 올바른 사용법: v-permission="[\'ROLE_ADMIN\']"')
        }
      },

      /**
       * 요소가 업데이트될 때 실행 (선택사항)
       * 
       * 동적으로 권한이 변경되는 경우를 대비한 로직
       * 일반적으로는 사용되지 않음 (권한 변경 시 재로그인)
       * 
       * @param {HTMLElement} el - 디렉티브가 적용된 DOM 요소
       * @param {Object} binding - 디렉티브 바인딩 정보
       */
      updated(el, binding) {
        // 필요시 업데이트 로직 구현
        // 일반적으로는 권한이 변경되면 재로그인하므로 불필요
      }
    })
  }
}

/**
 * 사용 예시:
 * 
 * 1. main.js에서 디렉티브 등록:
 * ```javascript
 * import permission from './directives/permission'
 * app.use(permission)
 * ```
 * 
 * 2. Vue 컴포넌트에서 사용:
 * ```vue
 * <template>
 *   <!-- ADMIN만 볼 수 있는 버튼 -->
 *   <el-button v-permission="['ROLE_ADMIN']" type="danger">
 *     삭제
 *   </el-button>
 * 
 *   <!-- ADMIN 또는 MANAGER가 볼 수 있는 버튼 -->
 *   <el-button v-permission="['ROLE_ADMIN', 'ROLE_MANAGER']" type="primary">
 *     수정
 *   </el-button>
 * 
 *   <!-- 게시판 관리자가 볼 수 있는 섹션 -->
 *   <div v-permission="['ROLE_BOARD_ADMIN']">
 *     <h3>게시판 관리</h3>
 *     <p>게시글을 관리할 수 있습니다.</p>
 *   </div>
 * </template>
 * ```
 * 
 * 3. 기존 v-if 방식과 비교:
 * ```vue
 * <!-- 기존 방식 (v-if) -->
 * <el-button v-if="$store.getters['auth/isAdmin']" type="danger">
 *   삭제
 * </el-button>
 * 
 * <!-- 새로운 방식 (v-permission) ← 더 간결! -->
 * <el-button v-permission="['ROLE_ADMIN']" type="danger">
 *   삭제
 * </el-button>
 * ```
 * 
 * 장점:
 * - 코드가 간결해짐
 * - 권한 체크 로직이 중앙화됨
 * - 유지보수가 쉬움
 * - 재사용성이 높음
 */