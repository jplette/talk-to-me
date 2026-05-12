// lib/i18n/en.ts
import type { Messages } from './messages';

export const en: Messages = {
  'landing.headline':   'Talk to\nmy digital\ntwin.',
  'landing.lede':       'A curated voice conversation about my work history, projects, and how I operate. Four minutes, your questions.',
  'landing.login_cta':  'Login',

  'login.heading':                  'Access',
  'login.lede':                     'You need the shared password you received via email/Slack.',
  'login.password_placeholder':     'Password',
  'login.submit':                   'Continue',
  'login.submitting':               'Checking…',
  'login.error_wrong':              "Password doesn't match. Try again.",
  'login.error_lockout':            'Too many attempts. Please wait {seconds}.',
  'login.error_network':            'Connection error. Try again.',

  'footer.privacy':  'How we handle audio',
  'footer.imprint':  'Imprint',

  'privacy.dialog_title':  'How we handle audio',
  'privacy.dialog_body':   'During the conversation, your microphone audio is streamed in real time to ElevenLabs for speech-to-text processing. The transcript and the digital twin\'s responses are stored for quality analysis. No voice identification, no sharing with third parties. A session is capped at 4 minutes. More info: jonathan@plettenberg.org.',
  'privacy.dialog_close':  'Got it',

  'lounge.idle_heading':   'Talk to Jonathan.',
  'lounge.idle_lede':      'Four minutes — about my work history, projects, and how I operate.',
  'lounge.idle_cta':       'Start conversation',
  'lounge.idle_caption':   'Mic permission will be asked next.',

  'lounge.status_idle':           'Ready',
  'lounge.status_connecting':     'Connecting…',
  'lounge.status_listening':      'Listening …',
  'lounge.status_speaking':       'Replying',
  'lounge.status_warning':        '30 seconds left',
  'lounge.status_inactivity':     'Still there?',
  'lounge.status_ending':         'Until then.',
  'lounge.status_reconnecting':   'Reconnecting…',
  'lounge.status_connect_failed': 'Connection failed',

  'lounge.ended_display':         'Until then.',
  'lounge.ended_new_session':     'New session',
  'lounge.ended_copy_transcript': 'Copy transcript',
  'lounge.ended_copy_toast':      'Transcript copied',
  'lounge.ended_caption':         'More questions? →',

  'error.mic_denied_heading':   'No conversation without mic access.',
  'error.mic_denied_lede':      'Allow mic access in your browser and reload the page.',
  'error.mic_denied_action':    'Reload page',
  'error.mic_denied_caption':   "If you're not sure how: click the lock icon in your browser's address bar.",
  'error.connect_fail_heading': 'Connection failed.',
  'error.connect_fail_lede':    'It happens. Try again — usually that\'s it.',
  'error.connect_fail_action':  'Reconnect',
  'error.connect_fail_mailto':  'If it persists, reach out at jonathan@plettenberg.org.',
  'error.offline':              "You're offline. We'll wait.",
  'error.online_back':          'Back online',

  'confirm.end_session_title': 'End conversation now?',
  'confirm.end_session_body':  "You'll land on the start page.",
  'confirm.end_session_yes':   'End',
  'confirm.end_session_no':    'Keep going',

  'a11y.mic_off': 'Microphone off',
};
