type Props = {
  onClose: () => void;
};

export function CreditsModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal credits-modal"
        role="dialog"
        aria-labelledby="credits-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="credits-title">Credits</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="credits-body">
          <p className="credits-sparkle">*:･ﾟ✧*:･ﾟ✧</p>
          <p>
            Built by{' '}
            <a
              href="https://woolichooks.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="credits-link"
            >
              Woolichooks
            </a>
          </p>
          <p>Software: Claude Code</p>
          <p className="credits-sparkle">*:･ﾟ✧*:･ﾟ✧</p>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            <span>Close</span>
            <span className="arrow">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
