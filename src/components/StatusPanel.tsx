import type { ReactNode } from 'react';
import { vi } from '../i18n/vi';

/** Done and empty screens: a short Chinese line, then the Vietnamese title, text and actions. */
export function StatusPanel({ kind, title, children }: { kind: 'done' | 'empty'; title?: string; children?: ReactNode }) {
  return (
    <section className={`card status-panel status-panel--${kind} stack-sm`}>
      <p lang="zh-CN" className="status-zh">
        {kind === 'done' ? vi.status.doneZh : vi.status.emptyZh}
      </p>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
