import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n/provider';
import { EndedView } from '@/components/lounge/EndedView';

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

function renderEndedView(onNewSession = vi.fn()) {
  return render(
    <I18nProvider initialLang="de">
      <EndedView turns={[]} onNewSession={onNewSession} />
    </I18nProvider>
  );
}

describe('EndedView', () => {
  it('renders a mailto link to jonathan@plettenberg.org', () => {
    renderEndedView();
    const link = screen.getByRole('link', { name: /jonathan@plettenberg\.org/i });
    expect(link).toHaveAttribute('href', 'mailto:jonathan@plettenberg.org');
  });

  it('shows the contact prefix text', () => {
    renderEndedView();
    expect(screen.getByText(/Weitere Fragen/i)).toBeInTheDocument();
  });
});
