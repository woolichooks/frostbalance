import type { Resource } from '../engine/survival';
import { RESOURCES, RESOURCE_LABEL } from '../engine/survival';

type Props = {
  resources: Record<Resource, number>;
  highlight?: Resource | null;
};

export function ResourcePanel({ resources, highlight }: Props) {
  return (
    <div className="resource-panel">
      {RESOURCES.map((r) => {
        const v = resources[r];
        const cls = [
          'resource-pill',
          v <= 0 ? 'depleted' : v <= 1 ? 'critical' : '',
          highlight === r ? 'highlight' : '',
        ].join(' ');
        return (
          <div key={r} className={cls}>
            <span className="resource-label">{RESOURCE_LABEL[r]}</span>
            <span className="resource-value">{v}</span>
          </div>
        );
      })}
    </div>
  );
}
