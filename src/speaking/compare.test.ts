import { describe, expect, it } from 'vitest';
import { compareZh, normalizeZh } from './compare';

describe('compareZh', () => {
  it('ignores punctuation and spaces', () => {
    expect(compareZh('我很好，谢谢！', '我很好 谢谢').score).toBe(100);
  });

  it('reads small Arabic numbers as Chinese', () => {
    expect(normalizeZh('我8岁')).toBe('我八岁');
    expect(normalizeZh('12点')).toBe('十二点');
    expect(normalizeZh('20')).toBe('二十');
    expect(compareZh('我八岁。', '我8岁').score).toBe(100);
  });

  it('marks missed characters', () => {
    const r = compareZh('你叫什么名字？', '你叫名字');
    expect(r.marks.map((m) => m.ok)).toEqual([true, true, false, false, true, true]);
    expect(r.score).toBe(67);
  });

  it('penalises extra characters', () => {
    expect(compareZh('你好', '你好你好').score).toBe(50);
    expect(compareZh('你好', '').score).toBe(0);
  });
});
