// app/(public)/imprint/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — Jonathan Plettenberg',
};

export default function ImprintPage() {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-16 text-sm leading-relaxed">
      <h1
        className="mb-8 text-2xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Impressum
      </h1>

      <section className="space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">Jonathan Plettenberg</p>
        <p>Mahalia-Jackson-Str. 27</p>
        <p>64285 Darmstadt</p>
        <p>
          <a
            href="mailto:jonathan@plettenberg.org"
            className="text-[var(--jk-flame)] hover:underline"
          >
            jonathan@plettenberg.org
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-3 text-muted-foreground">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-foreground">
          Haftungsausschluss
        </h2>
        <p>
          Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
          Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann
          jedoch keine Gewähr übernommen werden.
        </p>
        <p>
          Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf
          diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis
          10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte
          oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-muted-foreground">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-foreground">
          Datenschutz
        </h2>
        <p>
          Die Nutzung dieser Website ist ohne Angabe personenbezogener Daten möglich.
          Im Rahmen einer Sprachkonversation können Name und Unternehmen freiwillig
          genannt werden und werden temporär verarbeitet. Weitere Informationen
          entnehmen Sie der Datenschutzerklärung.
        </p>
      </section>
    </div>
  );
}
