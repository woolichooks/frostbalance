type Props = {
  fraction: number;
};

export function FrostOverlay({ fraction }: Props) {
  const intensity = Math.max(0, Math.min(1, fraction));
  if (intensity <= 0) return null;
  const opacity = intensity;
  const vignetteOpacity = intensity * 0.65;
  return (
    <div className="frost-overlay" aria-hidden="true" style={{ opacity }}>
      <div className="frost-vignette" style={{ opacity: vignetteOpacity }} />
      <svg viewBox="0 0 400 400" preserveAspectRatio="none" className="frost-svg frost-tl">
        <FrostCrystals />
      </svg>
      <svg viewBox="0 0 400 400" preserveAspectRatio="none" className="frost-svg frost-tr">
        <FrostCrystals />
      </svg>
      <svg viewBox="0 0 400 400" preserveAspectRatio="none" className="frost-svg frost-bl">
        <FrostCrystals />
      </svg>
      <svg viewBox="0 0 400 400" preserveAspectRatio="none" className="frost-svg frost-br">
        <FrostCrystals />
      </svg>
    </div>
  );
}

function FrostCrystals() {
  return (
    <g fill="none" stroke="#c5dde6" strokeLinecap="round">
      {/* Main fronds growing diagonally from the corner */}
      <g strokeWidth="1.2" opacity="0.85">
        <path d="M0 0 L120 120" />
        <path d="M30 0 L110 80 M20 12 L100 92 M40 8 L140 108" />
        <path d="M0 30 L80 110 M12 20 L92 100 M8 40 L108 140" />
        {/* Side branches */}
        <path d="M40 40 L60 20 M40 40 L20 60" />
        <path d="M70 70 L95 50 M70 70 L50 95" />
        <path d="M100 100 L130 75 M100 100 L75 130" />
        <path d="M60 60 L80 40 M60 60 L40 80" />
      </g>
      {/* Secondary crystal layer */}
      <g strokeWidth="0.8" opacity="0.7">
        <path d="M0 60 L60 120" />
        <path d="M60 0 L120 60" />
        <path d="M80 20 L130 70 M20 80 L70 130" />
        <path d="M140 0 L180 40 M0 140 L40 180" />
        <path d="M160 20 L200 60 M20 160 L60 200" />
      </g>
      {/* Snowflake stars */}
      <g strokeWidth="1" opacity="0.9">
        <g transform="translate(140 60)">
          <path d="M-8 0 L8 0 M0 -8 L0 8 M-6 -6 L6 6 M-6 6 L6 -6" />
        </g>
        <g transform="translate(60 140)">
          <path d="M-8 0 L8 0 M0 -8 L0 8 M-6 -6 L6 6 M-6 6 L6 -6" />
        </g>
        <g transform="translate(180 180)">
          <path d="M-5 0 L5 0 M0 -5 L0 5 M-4 -4 L4 4 M-4 4 L4 -4" />
        </g>
        <g transform="translate(220 90)">
          <path d="M-6 0 L6 0 M0 -6 L0 6" />
        </g>
        <g transform="translate(90 220)">
          <path d="M-6 0 L6 0 M0 -6 L0 6" />
        </g>
      </g>
      {/* Frost crystal plates — like csms-029 */}
      <g fill="#e3eff4" stroke="#8ec5d6" strokeWidth="0.6" opacity="0.55">
        <path d="M10 10 L40 18 L48 40 L22 38 Z" />
        <path d="M50 14 L80 22 L84 50 L54 44 Z" />
        <path d="M14 50 L40 56 L46 84 L18 80 Z" />
        <path d="M90 60 L120 68 L122 98 L96 92 Z" />
      </g>
      {/* Ice fractal text marks — like real frost on glass */}
      <g strokeWidth="0.6" opacity="0.85">
        <path d="M20 100 Q40 105 60 100 Q80 95 100 100" />
        <path d="M100 20 Q105 40 100 60 Q95 80 100 100" />
        <path d="M150 50 Q160 70 170 60 Q180 50 190 70" />
      </g>
    </g>
  );
}
