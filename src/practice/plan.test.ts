import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseHanzi, parsePhrases, parseWords } from '../data/validate';
import type { CardState } from '../srs/sm2';
import type { DayStats } from '../storage/progress';
import { buildDailyPlan, planSize } from './plan';
import { seededRng } from './quiz';
import { greetingSlot, learnedCount, streak, weekDays } from './stats';

function load(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'));
}

const content = {
  words: parseWords(load('words')).items,
  phrases: parsePhrases(load('phrases')).items,
  hanzi: parseHanzi(load('hanzi')).items,
};

describe('buildDailyPlan', () => {
  it('has planSize steps and the expected mix', () => {
    const plan = buildDailyPlan(content, {}, '2026-10-23', 5, 'adult', seededRng(1));
    expect(plan).toHaveLength(planSize(5));
    expect(plan.map((s) => s.kind)).toEqual(['word', 'word', 'word', 'meaning', 'meaning', 'tone', 'tone', 'hanzi', 'phrase']);
  });

  it('teaches a new learner the first words in content order', () => {
    const plan = buildDailyPlan(content, {}, '2026-10-23', 5, 'adult', seededRng(4));
    const taught = plan.flatMap((s) => (s.kind === 'word' ? [s.item.id] : []));
    expect(taught).toEqual(content.words.slice(0, 3).map((w) => w.id));
    const hanzi = plan.flatMap((s) => (s.kind === 'hanzi' ? [s.item.char] : []));
    expect(hanzi).toEqual(['一']);
  });

  it('asks about the words it just taught', () => {
    const plan = buildDailyPlan(content, {}, '2026-10-23', 5, 'adult', seededRng(2));
    const taught = plan.flatMap((s) => (s.kind === 'word' ? [s.item.id] : []));
    const asked = plan.flatMap((s) => (s.kind === 'meaning' ? [s.question.target.id] : []));
    expect(asked.every((id) => taught.includes(id))).toBe(true);
  });

  it('gives children picture questions and easy content', () => {
    const plan = buildDailyPlan(content, {}, '2026-10-23', 10, 'kid', seededRng(3));
    expect(plan).toHaveLength(planSize(10));
    for (const s of plan) {
      expect(s.kind).not.toBe('meaning');
      if (s.kind === 'word') expect(s.item.level).toBeLessThanOrEqual(2);
      if (s.kind === 'phrase') expect(s.item.level).toBe(1);
      if (s.kind === 'picture') expect(s.question.options.every((o) => o.emoji)).toBe(true);
    }
  });
});

describe('stats', () => {
  const day = (answers: number): DayStats => ({ answers, correct: answers, planSteps: 0, recordMs: 0 });

  it('counts a streak ending today or yesterday', () => {
    const daily = { '2026-10-20': day(1), '2026-10-21': day(2), '2026-10-22': day(1) };
    expect(streak(daily, '2026-10-22')).toBe(3);
    expect(streak(daily, '2026-10-23')).toBe(3);
    expect(streak(daily, '2026-10-24')).toBe(0);
  });

  it('lists Monday to Sunday', () => {
    const w = weekDays('2026-10-23'); // a Friday
    expect(w[0]).toBe('2026-10-19');
    expect(w[6]).toBe('2026-10-25');
  });

  it('counts learned cards', () => {
    const c = (reps: number, due: string): CardState => ({ ef: 2.5, interval: 1, reps, due, lastReviewed: '2026-10-20' });
    const srs = { 'word:a': c(1, '2026-10-30'), 'word:b': c(0, '2026-10-21'), 'hanzi:c': c(2, '2026-11-01') };
    expect(learnedCount(srs, 'word', '2026-10-23')).toBe(1);
  });

  it('picks a greeting by hour', () => {
    expect(greetingSlot(7)).toBe('morning');
    expect(greetingSlot(14)).toBe('afternoon');
    expect(greetingSlot(20)).toBe('evening');
  });
});
