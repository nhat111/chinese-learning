import { describe, expect, it } from 'vitest';
import { isSingleSyllable, setTone, stripTone, toneOf, toneVariants } from './pinyin';

describe('pinyin tones', () => {
  it('reads the tone from the mark', () => {
    expect(toneOf('mā')).toBe(1);
    expect(toneOf('má')).toBe(2);
    expect(toneOf('mǎ')).toBe(3);
    expect(toneOf('mà')).toBe(4);
    expect(toneOf('ma')).toBe(5);
    expect(toneOf('lǜ')).toBe(4);
    expect(toneOf('Zhōng')).toBe(1);
  });

  it('strips marks and keeps ü', () => {
    expect(stripTone('lǜ')).toBe('lü');
    expect(stripTone('xiǎo')).toBe('xiao');
    expect(stripTone('Ài')).toBe('Ai');
  });

  it('places the mark by the standard rules', () => {
    expect(setTone('hao', 3)).toBe('hǎo');
    expect(setTone('xie', 4)).toBe('xiè');
    expect(setTone('gou', 3)).toBe('gǒu');
    expect(setTone('liu', 4)).toBe('liù');
    expect(setTone('gui', 4)).toBe('guì');
    expect(setTone('lü', 4)).toBe('lǜ');
    expect(setTone('mā', 5)).toBe('ma');
    expect(setTone('Zhōng', 4)).toBe('Zhòng');
    expect(setTone('er', 4)).toBe('èr');
  });

  it('builds the four quiz variants', () => {
    expect(toneVariants('mǎ')).toEqual(['mā', 'má', 'mǎ', 'mà']);
    expect(toneVariants('niǎo')).toEqual(['niāo', 'niáo', 'niǎo', 'niào']);
  });

  it('detects single syllables', () => {
    expect(isSingleSyllable('mǎ')).toBe(true);
    expect(isSingleSyllable('xiǎo')).toBe(true);
    expect(isSingleSyllable('zhuāng')).toBe(true);
    expect(isSingleSyllable('nǐ hǎo')).toBe(false);
    expect(isSingleSyllable('māma')).toBe(false);
    expect(isSingleSyllable("wǎn'ān")).toBe(false);
  });
});
