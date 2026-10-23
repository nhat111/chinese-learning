import { describe, expect, it } from 'vitest';
import { audioKey, audioUrl } from './audioKey';

describe('audioKey', () => {
  it('is pinned: changing it would orphan every generated MP3', () => {
    expect(audioKey('你好')).toBe(audioKey(' 你好 '));
    expect(audioKey('你好')).toMatch(/^[0-9a-f]{14}$/);
    expect(audioKey('你好')).toBe('027a0a81745c3f');
  });

  it('builds the URL under the given host', () => {
    expect(audioUrl('你好', 'https://x.test')).toBe(`https://x.test/audio/zh/${audioKey('你好')}.mp3`);
  });
});
