// Compares what speech recognition heard with the model sentence (pure, tested).
// Chinese is compared character by character, ignoring punctuation and spaces.

/** Score from which an answer counts as right. */
export const PASS_SCORE = 70;

const DIGITS = '零一二三四五六七八九';

/** 0-99 as Chinese numerals, so "8岁" from the recognizer matches "八岁". */
function numberToHan(n: number): string {
  if (n < 10) return DIGITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${tens === 1 ? '' : DIGITS[tens]}十${ones === 0 ? '' : DIGITS[ones]}`;
}

/** Han characters only, with small Arabic numbers written in Chinese. */
export function normalizeZh(text: string): string {
  const withHan = text.replace(/\d+/g, (d) => {
    const n = Number(d);
    return n < 100 ? numberToHan(n) : d;
  });
  return [...withHan].filter((ch) => /\p{Script=Han}/u.test(ch)).join('');
}

export interface CharMark {
  ch: string;
  /** Heard by the recognizer (part of the longest common subsequence). */
  ok: boolean;
}

export interface Comparison {
  /** 0-100. */
  score: number;
  /** The model's characters (punctuation dropped), each marked heard or missed. */
  marks: CharMark[];
}

export function compareZh(model: string, heard: string): Comparison {
  const a = [...normalizeZh(model)];
  const b = [...normalizeZh(heard)];
  // LCS table: which model characters were heard, in order.
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const marks: CharMark[] = a.map((ch) => ({ ch, ok: false }));
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      marks[i].ok = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const longest = Math.max(a.length, b.length);
  const score = longest === 0 ? 0 : Math.round((dp[0][0] / longest) * 100);
  return { score, marks };
}
