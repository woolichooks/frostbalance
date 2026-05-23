type Props = {
  fraction: number; // 0 = no frost, 1 = fully frosted
};

export function FrostOverlay({ fraction }: Props) {
  const intensity = Math.max(0, Math.min(1, fraction));
  if (intensity <= 0) return null;
  const opacity = intensity * 0.85;
  return (
    <div className="frost-overlay" aria-hidden="true" style={{ opacity }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="frost-svg frost-tl">
        <FrostCorner />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="frost-svg frost-tr">
        <FrostCorner />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="frost-svg frost-bl">
        <FrostCorner />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="frost-svg frost-br">
        <FrostCorner />
      </svg>
    </div>
  );
}

function FrostCorner() {
  return (
    <g stroke="#cfe2ec" strokeWidth="0.6" fill="none" strokeLinecap="round">
      <path d="M0 0 L18 14 M0 8 L14 18 M6 0 L20 12 M0 20 L12 26 M22 4 L34 18 M18 22 L28 30 M2 30 L16 38 M30 12 L42 22 M14 38 L24 46 M36 26 L46 36" />
      <path d="M10 6 L12 14 L18 12 L16 6 Z M22 18 L24 26 L30 24 L28 18 Z M6 22 L8 30 L14 28 L12 22 Z" fill="#e7f1f7" />
      {/* Snowflakes */}
      <g transform="translate(28 28)">
        <path d="M-5 0 L5 0 M0 -5 L0 5 M-4 -4 L4 4 M-4 4 L4 -4" strokeWidth="0.8" />
      </g>
      <g transform="translate(14 14)">
        <path d="M-3 0 L3 0 M0 -3 L0 3 M-2 -2 L2 2 M-2 2 L2 -2" strokeWidth="0.8" />
      </g>
    </g>
  );
}
