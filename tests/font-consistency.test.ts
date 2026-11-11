import { it, expect } from 'vitest';
const sources = import.meta.glob<string>('../src/**/*.{css,js,ts}', { query: '?raw', import: 'default', eager: true });
it('font shorthand keeps NanumSquareNeo for dynamic map and activity labels', () => {
  for (const [file, source] of Object.entries(sources)) {
    for (const [font] of source.matchAll(/\bfont\s*:[^;}]+/g)) {
      if (/sans-serif|system-ui|Malgun|Georgia|serif/.test(font)) {
        expect(font, file + ': ' + font).toMatch(/NanumSquareNeo|var\(--font/);
      }
    }
  }
});
