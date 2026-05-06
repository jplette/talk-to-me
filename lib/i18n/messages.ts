// lib/i18n/messages.ts

export type Lang = 'de' | 'en';

export type MessageKey =
  // Landing
  | 'landing.headline'
  | 'landing.lede'
  | 'landing.login_cta'
  // Login
  | 'login.heading'
  | 'login.lede'
  | 'login.password_placeholder'
  | 'login.submit'
  | 'login.submitting'
  | 'login.error_wrong'
  | 'login.error_lockout'
  | 'login.error_network'
  // Footer
  | 'footer.privacy'
  | 'footer.imprint'
  // Privacy dialog
  | 'privacy.dialog_title'
  | 'privacy.dialog_body'
  | 'privacy.dialog_close'
  // Lounge — idle
  | 'lounge.idle_heading'
  | 'lounge.idle_lede'
  | 'lounge.idle_cta'
  | 'lounge.idle_caption'
  // Lounge — status
  | 'lounge.status_idle'
  | 'lounge.status_connecting'
  | 'lounge.status_listening'
  | 'lounge.status_speaking'
  | 'lounge.status_warning'
  | 'lounge.status_inactivity'
  | 'lounge.status_ending'
  | 'lounge.status_reconnecting'
  | 'lounge.status_connect_failed'
  // Lounge — ended
  | 'lounge.ended_display'
  | 'lounge.ended_new_session'
  | 'lounge.ended_copy_transcript'
  | 'lounge.ended_copy_toast'
  | 'lounge.ended_caption'
  // Errors
  | 'error.mic_denied_heading'
  | 'error.mic_denied_lede'
  | 'error.mic_denied_action'
  | 'error.mic_denied_caption'
  | 'error.connect_fail_heading'
  | 'error.connect_fail_lede'
  | 'error.connect_fail_action'
  | 'error.connect_fail_mailto'
  | 'error.offline'
  | 'error.online_back'
  // Confirm
  | 'confirm.end_session_title'
  | 'confirm.end_session_body'
  | 'confirm.end_session_yes'
  | 'confirm.end_session_no'
  // Misc
  | 'a11y.mic_off';

export type Messages = Record<MessageKey, string>;
