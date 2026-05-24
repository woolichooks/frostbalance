type Props = {
  onClose: () => void;
};

const ENTRIES: { term: string; def: string }[] = [
  {
    term: 'Prepaid expense',
    def: 'Money paid in advance for something you will use over time (insurance, rent, a 12-month software license). Sits on the balance sheet as an asset until you "use up" each month.',
  },
  {
    term: 'Prepaid schedule',
    def: 'A worksheet that lists the original payment, every monthly amortization since, and the remaining balance. Should always tie to the prepaid account on the trial balance.',
  },
  {
    term: 'Amortization',
    def: 'Recognizing the expense one month at a time. A $1,200 annual prepaid becomes $100 of expense and $100 less of prepaid each month for 12 months.',
  },
  {
    term: 'Trial balance',
    def: 'A list of every account and its balance at a point in time, pulled from the general ledger. It is the source of truth: if the schedule disagrees with it, the schedule is wrong.',
  },
  {
    term: 'Discrepancy',
    def: 'Schedule balance minus trial balance. Positive means the schedule says you have more prepaid asset left than the books say. Negative means the opposite.',
  },
  {
    term: 'Decoy row',
    def: 'A real, correctly-posted entry with a suspicious-looking description (e.g. "Reclass per audit memo"). Tier 2+ puzzles sprinkle these in. They reconcile cleanly — don\'t be fooled.',
  },
  {
    term: 'Roll-forward',
    def: 'When a prepaid covers more than 12 months and the schedule carries period over period. Tier 3+ puzzles use 24-month roll-forwards.',
  },
  {
    term: 'Reconciliation',
    def: 'The act of making two amounts match. In this game, finding the row that\'s off and correcting it so the schedule equals the trial balance.',
  },
  {
    term: 'How to fix a row',
    def: 'Almost always: change the amount to what it should be. The decoy options ("post an adjusting entry", "reverse the row", "leave as-is") are rabbit holes. A real accountant would just correct the source entry.',
  },
  {
    term: 'Final audit (boss)',
    def: 'Day 13+. Two errors hiding in one consolidated schedule. The displayed discrepancy is the sum of both magnitudes. Fix one and the discrepancy collapses to just the other.',
  },
];

export function GlossaryModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal glossary-modal"
        role="dialog"
        aria-labelledby="glossary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="glossary-title">Field guide</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className="modal-blurb">
          Plain-English definitions for everything the game throws at you. Open
          this any time — there's no extra credit for knowing accounting up front.
        </p>
        <dl className="glossary">
          {ENTRIES.map((e) => (
            <div key={e.term} className="glossary-entry">
              <dt>{e.term}</dt>
              <dd>{e.def}</dd>
            </div>
          ))}
        </dl>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            <span>Got it</span>
            <span className="arrow">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
