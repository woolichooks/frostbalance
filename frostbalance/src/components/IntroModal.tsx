type Props = {
  onDismiss: () => void;
  onOpenGlossary: () => void;
};

export function IntroModal({ onDismiss, onOpenGlossary }: Props) {
  return (
    <div className="modal-overlay">
      <div
        className="modal intro-modal"
        role="dialog"
        aria-labelledby="intro-title"
      >
        <header className="modal-header">
          <h2 id="intro-title">You're an accountant. The world has frozen.</h2>
        </header>
        <div className="intro-body">
          <p>
            Every day you pick what to forage for — <strong>food, fuel, shelter,</strong> or
            <strong> medicine</strong> — and reconcile a prepaid expense schedule to bring it back.
          </p>
          <ol className="intro-list">
            <li>The trial balance and the prepaid schedule don't match by exactly $0.01, $0.02, $0.11, $0.20, or $1.50.</li>
            <li>Find the row that's wrong. Pick the right fix. Submit before the timer runs out.</li>
            <li>Faster solves bring back more units. Wrong submissions cost a 10-second penalty.</li>
            <li>Every night, all four resources tick down by 1. Any resource at zero ends your run.</li>
          </ol>
          <p className="intro-tip">
            New to accounting? Open the{' '}
            <button type="button" className="link-button" onClick={onOpenGlossary}>
              field guide
            </button>{' '}
            for plain-English definitions of every term — anytime, from the top bar.
          </p>
        </div>
        <div className="modal-actions">
          <button className="primary" onClick={onDismiss}>
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
