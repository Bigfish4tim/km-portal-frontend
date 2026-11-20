/**
 * 사용자 표시 "이름[부서, 직위]" — 레거시 오른쪽 위의 모양(명세 B-2a 결정 G10).
 *
 * 부서 · 직위가 비어 있으면(null 가능 — 백엔드 entity/User.java 의 department · position) 있는 것만 적고,
 * 둘 다 없으면 이름만 적는다.
 */
import type { AuthUser } from '@/api/types/auth'

export function formatUserLabel(
  user: Pick<AuthUser, 'fullName' | 'department' | 'position'>,
): string {
  const parts = [user.department, user.position].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  )
  return parts.length > 0 ? `${user.fullName}[${parts.join(', ')}]` : user.fullName
}
