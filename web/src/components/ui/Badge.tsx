import { toneFor } from '../../lib/ui';

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${toneFor(status)}`}>
      {status}
    </span>
  );
}
