import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { setViewport, VIEWPORTS } from '../../../test-utils/testHelpers';

describe('Card Responsive Design', () => {
  beforeEach(() => {
    // Reset viewport before each test
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  });

  it('renders correctly on mobile', () => {
    setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
    const { container } = render(<Card>Mobile Card</Card>);
    expect(screen.getByText('Mobile Card')).toBeInTheDocument();
    
    const card = container.firstChild;
    expect(card).toBeInTheDocument();
  });

  it('renders correctly on tablet', () => {
    setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
    const { container } = render(<Card>Tablet Card</Card>);
    expect(screen.getByText('Tablet Card')).toBeInTheDocument();
  });

  it('renders correctly on desktop', () => {
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
    const { container } = render(<Card>Desktop Card</Card>);
    expect(screen.getByText('Desktop Card')).toBeInTheDocument();
  });

  it('adapts to viewport changes', () => {
    const { container, rerender } = render(<Card>Responsive Card</Card>);
    
    // Start with desktop
    setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
    expect(screen.getByText('Responsive Card')).toBeInTheDocument();
    
    // Switch to mobile
    setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
    rerender(<Card>Responsive Card</Card>);
    expect(screen.getByText('Responsive Card')).toBeInTheDocument();
  });
});

