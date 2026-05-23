export type MusicState = 'briefing' | 'playing' | 'solved' | 'gameover';

/**
 * Background music URLs per game state. Files live in public/music/
 * and are served at /music/<name>.mp3.
 *
 * Currently every state uses Ian Post — "Breaking Point". Other
 * tracks remain in public/music/ for easy swap-back:
 *   briefing.mp3 — Mac A DeMia, "Smoothie Moody"
 *   solved.mp3   — Out of Flux, "Cinnamon"
 *   gameover.mp3 — sero, "End of the Road"
 *
 * Set any value to null to disable music for that state — SFX still play.
 */
export const MUSIC_TRACKS: Record<MusicState, string | null> = {
  briefing: '/music/playing.mp3',
  playing: '/music/playing.mp3',
  solved: '/music/playing.mp3',
  gameover: '/music/playing.mp3',
};
