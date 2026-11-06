import type { SourceStatus } from '../../../shared/types.ts';
import { sourceMessage } from '../logic.ts';

export function SourceStatusBar({ sources }: { sources: SourceStatus[] }) {
  const msgs = sources.map(sourceMessage).filter((m): m is string => m !== null);
  if (msgs.length === 0) return null;
  return (
    <ul className="source-status" role="status">
      {msgs.map((m) => <li key={m}>{m}</li>)}
    </ul>
  );
}
