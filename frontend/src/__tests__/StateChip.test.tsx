import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StateChip } from '../components/StateChip';

describe('StateChip Component', () => {
  it('renders highly_engaged state with accessible text', () => {
    render(<StateChip state="highly_engaged" />);
    expect(screen.getByText('Deep Engagement')).toBeDefined();
  });

  it('renders away state with accessible text', () => {
    render(<StateChip state="away" />);
    expect(screen.getByText('Away from Screen')).toBeDefined();
  });

  it('renders glancing state with accessible text', () => {
    render(<StateChip state="possibly_distracted" />);
    expect(screen.getByText('Glancing Away')).toBeDefined();
  });
});
