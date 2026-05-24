import type { Resource } from '../engine/survival';
import { RESOURCES, RESOURCE_LABEL, RESOURCE_BLURB } from '../engine/survival';
import { unlockedLocations } from '../engine/locations';
import type { BestRecord } from '../settings';

type Props = {
  day: number;
  resources: Record<Resource, number>;
  selected: Resource | null;
  journalLine: string;
  todaysBest: BestRecord | null;
  onSelect: (r: Resource) => void;
  onBegin: () => void;
};

export function DayBriefing({ day, resources, selected, journalLine, todaysBest, onSelect, onBegin }: Props) {
  const locations = unlockedLocations(day);
  return (
    <section className="card briefing">
      <h2>Day {day} — what are you foraging for?</h2>
      <p className="journal">"{journalLine}"</p>
      {todaysBest && (
        <p className="best-record">
          Today's fastest reconciliation:{' '}
          <strong>{(todaysBest.timeMs / 1000).toFixed(1)}s</strong>
          {' '}— Tier {todaysBest.tier}, in-game day {todaysBest.day}.
        </p>
      )}
      <p className="prompt">
        Reconcile the books to bring back supplies. Faster solves bring back more.
        Everything ticks down at dusk.
      </p>
      <div className="locations">
        <span className="locations-label">Sites you can scavenge today:</span>
        <ul>
          {locations.map((l) => (
            <li key={l.id}>
              <strong>{l.name}</strong>
              <span className="loc-blurb"> — {l.blurb}</span>
            </li>
          ))}
        </ul>
      </div>
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
