export type MusicState = 'briefing' | 'playing' | 'solved' | 'gameover';

/**
 * Background music URLs per game state. Files live in public/music/.
 *
 * The shipped public build deliberately strips these out because the
 * current soundtrack ("Breaking Point" by Ian Post) carries an Artlist
 * Social License that only covers personal social-network uploads, not
 * web/app distribution. The vite plugin in vite.config.ts also deletes
 * dist/music when this flag is false, so the mp3s never reach a public
 * host.
 *
 * To bundle music anyway (local-only previews, internal demos, an
 * Artlist tier upgrade later): build with VITE_SHIP_MUSIC=true.
 *
 *   npm run dev                                    # always plays music
 *   npm run build                                  # silent build, mp3s stripped
 *   VITE_SHIP_MUSIC=true npm run build             # full music build
 *
 * Track attribution (when bundled):
 *   briefing / playing / solved / gameover —
 *     Ian Post, "Breaking Point" (Artlist Social License — WooliesDay)
 */
const shipMusic =
  import.meta.env.DEV || import.meta.env.VITE_SHIP_MUSIC === 'true';

export const MUSIC_TRACKS: Record<MusicState, string | null> = shipMusic
  ? {
      briefing: '/music/playing.mp3',
      playing: '/music/playing.mp3',
      solved: '/music/playing.mp3',
      gameover: '/music/playing.mp3',
    }
  : {
      briefing: null,
      playing: null,
      solved: null,
      gameover: null,
    };
