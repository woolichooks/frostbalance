type Props = {
  onOpenSettings: () => void;
  onOpenGlossary: () => void;
};

export function TopBar({ onOpenSettings, onOpenGlossary }: Props) {
  return (
    <div className="top-bar">
      <button
        type="button"
        className="top-bar-button"
        onClick={onOpenGlossary}
        title="Open the field guide"
      >
        FIELD GUIDE
      </button>
      <button
        type="button"
        className="top-bar-button"
        onClick={onOpenSettings}
        title="Open preferences"
      >
        PREFS
      </button>
    </div>
  );
}
