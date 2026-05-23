export type MusicState = 'briefing' | 'playing' | 'solved' | 'gameover';

/**
 * Background music URLs per game state. Leave any value as null to
 * disable music for that state — SFX still play.
 *
 * Drop royalty-free / CC0 mp3 files in `public/music/` and reference
 * them here as '/music/foo.mp3'.
 *
 * Mood targets (from the user's inspiration tracks, which are NOT
 * shipped with the game):
 *   briefing  — chill, melancholic       (ref: Mac A DeMia "Smoothie Moody")
 *   playing   — tense, dramatic          (ref: Ian Post "Breaking Point")
 *   solved    — warm, upbeat             (ref: Out of Flux "Cinnamon")
 *   gameover  — somber, closing          (ref: sero "End of the Road")
 *
 * Suggested CC0 / royalty-free sources:
 *   - freemusicarchive.org
 *   - pixabay.com/music
 *   - incompetech.com (Kevin MacLeod, CC-BY)
 *   - freepd.com
 */
export const MUSIC_TRACKS: Record<MusicState, string | null> = {
  briefing: null,
  playing: null,
  solved: null,
  gameover: null,
};
