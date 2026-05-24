import type { Resource } from '../engine/survival';
import { RESOURCES, RESOURCE_LABEL } from '../engine/survival';

type Props = {
  resources: Record<Resource, number>;
  highlight?: Resource | null;
};

export function InventoryStrip({ resources, highlight }: Props) {
  return (
    <div className="inventory" aria-label="Inventory">
      {RESOURCES.map((r) => {
        const v = resources[r];
        const cls = [
          'inv-cell',
          v <= 0 ? 'is-depleted' : v <= 2 ? 'is-low' : '',
          highlight === r ? 'is-active' : '',
        ].join(' ');
        const pct = Math.max(0, Math.min(100, (v / 10) * 100));
        return (
          <div key={r} className={cls}>
            <span className="inv-label">{RESOURCE_LABEL[r]}</span>
            <span className="inv-value">{String(v).padStart(2, '0')}</span>
            <span className="inv-meter">
              <i style={{ width: `${pct}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
