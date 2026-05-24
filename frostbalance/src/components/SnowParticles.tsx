import { useEffect, useRef } from 'react';

export type WeatherKind = 'CLEAR' | 'SNOW' | 'BLIZZARD' | 'SLEET';

type WeatherConfig = {
  count: number;
  speedMin: number;
  speedMax: number;
  windX: number;
  sizeMin: number;
  sizeMax: number;
  opacity: number;
  /** When true, draw short angled streaks instead of dots (rain/sleet feel) */
  streak: boolean;
};

const CONFIGS: Record<WeatherKind, WeatherConfig> = {
  CLEAR: {
    count: 0, speedMin: 0, speedMax: 0, windX: 0, sizeMin: 0, sizeMax: 0,
    opacity: 0, streak: false,
  },
  SNOW: {
    count: 70, speedMin: 0.3, speedMax: 1.0, windX: 0.05,
    sizeMin: 1.5, sizeMax: 3, opacity: 0.85, streak: false,
  },
  BLIZZARD: {
    count: 220, speedMin: 1.4, speedMax: 3.6, windX: 1.4,
    sizeMin: 1, sizeMax: 2.6, opacity: 0.92, streak: false,
  },
  SLEET: {
    count: 130, speedMin: 2.2, speedMax: 4.5, windX: 0.6,
    sizeMin: 0.8, sizeMax: 1.4, opacity: 0.7, streak: true,
  },
};

type Props = {
  weather: WeatherKind;
  reducedMotion?: boolean;
};

export function SnowParticles({ weather, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = CONFIGS[weather];
    if (cfg.count === 0) {
      // Clear canvas and bail
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    const particles: P[] = Array.from({ length: cfg.count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4 + cfg.windX,
      vy: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
      r: cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      if (cfg.streak) {
        ctx.strokeStyle = `rgba(200, 220, 232, ${cfg.opacity})`;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h + 10) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x > w + 10) p.x = -10;
          if (p.x < -10) p.x = w + 10;
          ctx.beginPath();
          const dx = p.vx * 2;
          const dy = p.vy * 2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dx, p.y - dy);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = `rgba(245, 250, 252, ${cfg.opacity})`;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h + 10) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x > w + 10) p.x = -10;
          if (p.x < -10) p.x = w + 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [weather, reducedMotion]);

  if (reducedMotion) return null;
  return <canvas ref={canvasRef} className="snow-particles" aria-hidden="true" />;
}
