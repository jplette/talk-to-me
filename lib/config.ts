// lib/config.ts

export const SESSION = {
  HARD_LIMIT_MS: 4 * 60 * 1000,
  WARNING_AT_MS: 3 * 60 * 1000 + 30_000,
  INACTIVITY_PROMPT_MS: 20_000,
  INACTIVITY_END_MS: 30_000,
  GRACEFUL_END_BUDGET_MS: 20_000,
} as const;

export const AUTH = {
  COOKIE_NAME: 'tt_auth',
  COOKIE_TTL_SECONDS: 7 * 24 * 60 * 60,
} as const;

export const LOCKOUT = {
  MAX_FAILURES: 5,
  WINDOW_MS: 10 * 60 * 1000,
  BLOCK_MS: 60 * 1000,
} as const;

export const WEBHOOK = {
  // Tolerated drift between webhook timestamp and server clock.
  // ElevenLabs default: signed timestamps are recent. 5min covers clock skew + retries.
  SIGNATURE_TOLERANCE_SECONDS: 5 * 60,
} as const;
