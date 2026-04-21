/**
 * Guidance session status helper.
 * Always calculated dynamically from start/end times — never trusts the DB value
 * because the DB status can become stale after the session time has passed.
 */

export type SessionStatus = 'upcoming' | 'active' | 'ended';

/**
 * Calculate the real-time status of a guidance session.
 *
 * @param startTime - ISO string or null
 * @param endTime   - ISO string or null
 * @returns 'upcoming' | 'active' | 'ended'
 *
 * Rules:
 *   now < start_time          → upcoming
 *   start_time <= now <= end  → active
 *   now > end_time            → ended
 *   no dates at all           → falls back to 'upcoming'
 */
export function getSessionStatus(
  startTime: string | null | undefined,
  endTime:   string | null | undefined,
): SessionStatus {
  const now = Date.now();

  const start = startTime ? new Date(startTime).getTime() : null;
  const end   = endTime   ? new Date(endTime).getTime()   : null;

  if (start !== null && now < start) return 'upcoming';
  if (end   !== null && now > end)   return 'ended';
  if (start !== null && now >= start) return 'active';

  return 'upcoming';
}

/** Badge classes for each computed status */
export const SESSION_STATUS_BADGE: Record<SessionStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  active:   'bg-green-100 text-green-700 border-green-200',
  ended:    'bg-gray-100 text-gray-500 border-gray-200',
};

/** Human-readable label */
export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  upcoming: 'Upcoming',
  active:   'Active',
  ended:    'Ended',
};
