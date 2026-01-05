import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../Button';
import { testA11y } from '../../../test-utils/accessibilityHelpers';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is keyboard accessible', () => {
    const { container } = render(<Button>Keyboard Button</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute('tabindex', '-1');
  });

  it('has proper ARIA attributes when disabled', () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('supports aria-label', () => {
    const { container } = render(
      <Button aria-label="Close dialog">×</Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('has focus visible styles', () => {
    const { container } = render(<Button>Focusable Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });
});

