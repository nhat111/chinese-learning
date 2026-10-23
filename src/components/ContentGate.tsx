import type { ReactNode } from 'react';
import type { ContentState } from '../data/content';
import { vi } from '../i18n/vi';

/** Renders children once content is ready; a loading line or a retry button before that. */
export function ContentGate<T>({ state, children }: { state: ContentState<T>; children: (items: T[]) => ReactNode }) {
  if (state.status === 'loading') return <p className="muted">{vi.common.loading}</p>;
  if (state.status === 'error') {
    return (
      <div className="card stack-sm">
        <p>{vi.common.loadError}</p>
        <button type="button" className="btn" onClick={state.retry}>
          {vi.common.retry}
        </button>
      </div>
    );
  }
  return <>{children(state.items)}</>;
}
