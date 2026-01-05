import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { renderDarkMode, renderLightMode } from '../../../test-utils/testHelpers';

describe('Card Dark Mode', () => {
  it('renders correctly in light mode', () => {
    const { container } = renderLightMode(<Card>Light Card</Card>);
    expect(screen.getByText('Light Card')).toBeInTheDocument();
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-card', 'text-card-foreground');
  });

  it('renders correctly in dark mode', () => {
    const { container } = renderDarkMode(<Card>Dark Card</Card>);
    expect(screen.getByText('Dark Card')).toBeInTheDocument();
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-card', 'text-card-foreground');
  });

  it('maintains contrast in both modes', () => {
    const lightMode = renderLightMode(<Card>Test</Card>);
    const darkMode = renderDarkMode(<Card>Test</Card>);
    
    const lightCard = lightMode.container.firstChild;
    const darkCard = darkMode.container.firstChild;
    
    // Both should have background and text colors
    expect(lightCard).toHaveClass('bg-card', 'text-card-foreground');
    expect(darkCard).toHaveClass('bg-card', 'text-card-foreground');
  });

  it('applies border colors correctly in both modes', () => {
    const lightMode = renderLightMode(<Card variant="outlined">Test</Card>);
    const darkMode = renderDarkMode(<Card variant="outlined">Test</Card>);
    
    const lightCard = lightMode.container.firstChild;
    const darkCard = darkMode.container.firstChild;
    
    expect(lightCard).toHaveClass('border-2', 'border-border');
    expect(darkCard).toHaveClass('border-2', 'border-border');
  });
});

