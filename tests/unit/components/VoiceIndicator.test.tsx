// tests/unit/components/VoiceIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceIndicator } from '@/components/lounge/VoiceIndicator';

describe('VoiceIndicator', () => {
  it('renders an svg with state-bound aria-label (idle)', () => {
    render(<VoiceIndicator state="idle" amplitude={0} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/idle/i);
  });
  it('reduced-motion → renders a static circle indicator (no path)', () => {
    render(
      <VoiceIndicator state="listening" amplitude={0.5} reducedMotion />
    );
    expect(screen.getByTestId('reduced-motion-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-path')).not.toBeInTheDocument();
  });
  it('non-reduced: renders an svg path', () => {
    render(<VoiceIndicator state="listening" amplitude={0.3} />);
    expect(screen.getByTestId('scope-path')).toBeInTheDocument();
  });
  it('aria-label changes per state', () => {
    const { rerender } = render(<VoiceIndicator state="listening" amplitude={0} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/listening/i);
    rerender(<VoiceIndicator state="speaking" amplitude={0} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/speaking/i);
  });
});
