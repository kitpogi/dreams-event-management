import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';
import { renderDarkMode, renderLightMode } from '../../../test-utils/testHelpers';

describe('Badge Component', () => {
  it('renders badge with text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('applies secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('custom-class');
  });

  it('renders correctly in dark mode', () => {
    const { container } = renderDarkMode(<Badge>Dark Badge</Badge>);
    expect(screen.getByText('Dark Badge')).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders correctly in light mode', () => {
    const { container } = renderLightMode(<Badge>Light Badge</Badge>);
    expect(screen.getByText('Light Badge')).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('has proper accessibility attributes', () => {
    render(<Badge aria-label="Status badge">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge).toHaveAttribute('aria-label', 'Status badge');
  });
});

