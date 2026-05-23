import type { Resource } from '../engine/survival';
import { RESOURCES, RESOURCE_LABEL, RESOURCE_BLURB } from '../engine/survival';

type Props = {
  day: number;
  resources: Record<Resource, number>;
  selected: Resource | null;
  onSelect: (r: Resource) => void;
  onBegin: () => void;
};

export function DayBriefing({ day, resources, selected, onSelect, onBegin }: Props) {
  return (
    <section className="card briefing">
      <h2>Day {day} — what are you foraging for?</h2>
      <p className="prompt">
        You have 90 seconds to reconcile the books. Faster solves bring back more
        supplies. Pick wisely — everything ticks down at dusk.
      </p>
      <div className="resource-choices">
        {RESOURCES.map((r) => (
          <button
            key={r}
            type="button"
            className={[
              'resource-choice',
              selected === r ? 'chosen' : '',
              resources[r] <= 1 ? 'urgent' : '',
            ].join(' ')}
            onClick={() => onSelect(r)}
          >
            <div className="resource-choice-head">
              <span>{RESOURCE_LABEL[r]}</span>
              <span className="resource-choice-count">have {resources[r]}</span>
            </div>
            <div className="resource-choice-blurb">{RESOURCE_BLURB[r]}</div>
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="primary" disabled={!selected} onClick={onBegin}>
          Begin the day →
        </button>
      </div>
    </section>
  );
}
