import { TIME_LIMIT_MS } from '../engine/survival';

type Props = {
  elapsedMs: number;
  limitMs?: number;
  flashing?: boolean;
};

export function Timer({ elapsedMs, limitMs = TIME_LIMIT_MS, flashing }: Props) {
  const remaining = Math.max(0, limitMs - elapsedMs);
  const pct = Math.max(0, Math.min(100, (remaining / limitMs) * 100));
  const seconds = (remaining / 1000).toFixed(1);
  const zone = pct > 66 ? 'safe' : pct > 33 ? 'warn' : 'danger';
  return (
    <div className={['timer', zone, flashing ? 'flashing' : ''].join(' ')}>
      <div className="timer-bar" style={{ width: `${pct}%` }} />
      <div className="timer-label">{seconds}s</div>
    </div>
  );
}
