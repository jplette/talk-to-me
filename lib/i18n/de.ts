// lib/i18n/de.ts
import type { Messages } from './messages';

export const de: Messages = {
  'landing.headline':   'Sprich mit\nmeinem digitalen\nZwilling.',
  'landing.lede':       'Eine kuratierte Voice-Konversation über meinen Werdegang, meine Projekte, und wie ich arbeite. Vier Minuten, deine Fragen.',
  'landing.login_cta':  'Anmelden',

  'login.heading':                  'Zugang',
  'login.lede':                     'Du brauchst das geteilte Passwort, das du per Email/Slack erhalten hast.',
  'login.password_placeholder':     'Passwort',
  'login.submit':                   'Weiter',
  'login.submitting':               'Prüfe…',
  'login.error_wrong':              'Passwort stimmt nicht. Versuche es noch einmal.',
  'login.error_lockout':            'Zu viele Versuche. Bitte {seconds} warten.',
  'login.error_network':            'Verbindungsfehler. Erneut versuchen.',

  'footer.privacy':  'Hinweis zur Audio-Verarbeitung',
  'footer.imprint':  'Impressum',

  'privacy.dialog_title':  'Hinweis zur Audio-Verarbeitung',
  'privacy.dialog_body':   'Während des Gesprächs wird dein Mikrofon-Audio in Echtzeit an ElevenLabs zur Speech-to-Text-Verarbeitung übertragen. Das Transkript und die Antworten des digitalen Zwillings werden für Qualitäts-Analysen gespeichert. Es findet keine Stimm-Identifikation und keine Weitergabe an Dritte statt. Eine Sitzung ist auf 4 Minuten begrenzt. Mehr Infos: jonathan@plettenberg.org.',
  'privacy.dialog_close':  'Verstanden',

  'lounge.idle_heading':   'Sprich mit Jonathan.',
  'lounge.idle_lede':      'Wir reden 4 Minuten — über meinen Werdegang, Projekte, und wie ich arbeite.',
  'lounge.idle_cta':       'Jetzt starten',
  'lounge.idle_caption':   'Mic-Permission wird gleich gefragt.',

  'lounge.status_idle':           'Bereit',
  'lounge.status_connecting':     'Verbinde…',
  'lounge.status_listening':      'Hört zu …',
  'lounge.status_speaking':       'Antwortet',
  'lounge.status_warning':        'Noch 30 Sekunden',
  'lounge.status_inactivity':     'Noch da?',
  'lounge.status_ending':         'Bis dann.',
  'lounge.status_reconnecting':   'Verbindung neu aufbauen…',
  'lounge.status_connect_failed': 'Verbindung fehlgeschlagen',

  'lounge.ended_display':         'Bis dann.',
  'lounge.ended_new_session':     'Neue Session',
  'lounge.ended_copy_transcript': 'Transkript kopieren',
  'lounge.ended_copy_toast':      'Transkript kopiert',
  'lounge.ended_caption':         'Weitere Fragen? →',

  'error.mic_denied_heading':   'Ohne Mikrofon-Zugriff kein Gespräch.',
  'error.mic_denied_lede':      'Erlaube den Mic-Zugriff in deinem Browser und lade die Seite neu.',
  'error.mic_denied_action':    'Seite neu laden',
  'error.mic_denied_caption':   'Falls du nicht weißt wie: Klick aufs Schloss-Symbol in der Adressleiste deines Browsers.',
  'error.connect_fail_heading': 'Verbindung fehlgeschlagen.',
  'error.connect_fail_lede':    'Das passiert manchmal. Versuch es noch einmal, das ist meistens vorbei.',
  'error.connect_fail_action':  'Erneut verbinden',
  'error.connect_fail_mailto':  'Falls das Problem bleibt, melde dich bei jonathan@plettenberg.org.',
  'error.offline':              'Du bist offline. Wir warten.',
  'error.online_back':          'Wieder online',

  'confirm.end_session_title': 'Konversation jetzt beenden?',
  'confirm.end_session_body':  'Du landest auf der Startseite.',
  'confirm.end_session_yes':   'Beenden',
  'confirm.end_session_no':    'Weiterreden',

  'a11y.mic_off': 'Mikrofon aus',
};
