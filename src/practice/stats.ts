// Numbers for Home and Progress (pure, tested).

import { addDays, type CardState } from '../srs/sm2';
import type { DayStats } from '../storage/progress';

/** Days in a row with any practice, ending today (or yesterday if today is still empty). */
export function streak(daily: Record<string, DayStats>, today: string): number {
  const active = (d: string) => (daily[d]?.answers ?? 0) > 0 || (daily[d]?.recordMs ?? 0) > 0;
  let day = active(today) ? today : addDays(today, -1);
  let n = 0;
  while (active(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Monday to Sunday of the week containing `today`, as YYYY-MM-DD. */
export function weekDays(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Stars: one per right answer or remembered card, all time. */
export function totalStars(daily: Record<string, DayStats>): number {
  return Object.values(daily).reduce((sum, d) => sum + d.correct, 0);
}

export type Skill = 'word' | 'hanzi' | 'phrase' | 'pinyin';

/** Items practiced at least once per skill (unique content ids). */
export function practicedCount(srs: Record<string, CardState>, skill: Skill): number {
  return Object.keys(srs).filter((k) => k.startsWith(`${skill}:`)).length;
}

/** Items whose last rating was good and that are not due yet: "đã thuộc". */
export function learnedCount(srs: Record<string, CardState>, skill: Skill, today: string): number {
  return Object.entries(srs).filter(([k, c]) => k.startsWith(`${skill}:`) && c.reps > 0 && c.due > today).length;
}

/** Keys reviewed today or earlier whose card is due again. */
export function dueKeys(srs: Record<string, CardState>, today: string, prefix: string): string[] {
  return Object.entries(srs)
    .filter(([k, c]) => k.startsWith(prefix) && c.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([k]) => k);
}

/** Morning / afternoon / evening, for the greeting on Home. */
export function greetingSlot(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 11) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
