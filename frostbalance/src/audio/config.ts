export type MusicState = 'briefing' | 'playing' | 'solved' | 'gameover';

/**
 * Background music URLs per game state. Files live in public/music/
 * and are served at /music/<name>.mp3.
 *
 * Track attribution (licensed for use in this game):
 *   briefing  — Mac A DeMia, "Smoothie Moody"   (chill / melancholic)
 *   playing   — Ian Post, "Breaking Point"       (tense / dramatic)
 *   solved    — Out of Flux, "Cinnamon"          (warm / upbeat)
 *   gameover  — sero, "End of the Road"          (somber / closing)
 *
 * Set any value to null to disable music for that state — SFX still play.
 */
export const MUSIC_TRACKS: Record<MusicState, string | null> = {
  briefing: '/music/briefing.mp3',
  playing: '/music/playing.mp3',
  solved: '/music/solved.mp3',
  gameover: '/music/gameover.mp3',
};
