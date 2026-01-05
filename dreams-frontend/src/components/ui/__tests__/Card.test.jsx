import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';
import { renderWithProviders, renderDarkMode, renderLightMode } from '../../../test-utils/testHelpers';

describe('Card Component', () => {
  describe('Card', () => {
    it('renders card with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default variant', () => {
      const { container } = render(<Card>Test</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('border-border', 'shadow-sm');
    });

    it('applies outlined variant', () => {
      const { container } = render(<Card variant="outlined">Test</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('border-2', 'border-border', 'shadow-none');
    });

    it('applies elevated variant', () => {
      const { container } = render(<Card variant="elevated">Test</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('border-border', 'shadow-md');
    });

    it('applies hover effect when hover prop is true', () => {
      const { container } = render(<Card hover>Test</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1', 'cursor-pointer');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Test</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('renders correctly in dark mode', () => {
      const { container } = renderDarkMode(<Card>Dark Mode Card</Card>);
      expect(screen.getByText('Dark Mode Card')).toBeInTheDocument();
      const card = container.firstChild;
      expect(card).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('renders correctly in light mode', () => {
      const { container } = renderLightMode(<Card>Light Mode Card</Card>);
      expect(screen.getByText('Light Mode Card')).toBeInTheDocument();
      const card = container.firstChild;
      expect(card).toHaveClass('bg-card', 'text-card-foreground');
    });
  });

  describe('CardHeader', () => {
    it('renders card header with children', () => {
      render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies correct spacing classes', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      );
      // Use a more flexible selector approach
      const header = container.querySelector('[class*="flex"][class*="flex-col"][class*="p-6"]');
      expect(header).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders card title', () => {
      render(
        <Card>
          <CardTitle>Card Title</CardTitle>
        </Card>
      );
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
    });

    it('applies correct typography classes', () => {
      const { container } = render(
        <Card>
          <CardTitle>Title</CardTitle>
        </Card>
      );
      const title = container.querySelector('h3');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });
  });

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(
        <Card>
          <CardDescription>Description text</CardDescription>
        </Card>
      );
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('renders card content with children', () => {
      render(
        <Card>
          <CardContent>Content here</CardContent>
        </Card>
      );
      expect(screen.getByText('Content here')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('renders card footer with children', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });
  });
});

