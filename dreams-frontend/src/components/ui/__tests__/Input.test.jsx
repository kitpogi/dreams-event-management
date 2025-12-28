import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input Component', () => {
  it('renders input without label', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders input with label', () => {
    render(<Input label="Email Address" />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<Input label="Email" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    
    await user.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');
  });

  it('supports different input types', () => {
    render(<Input type="email" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('can be disabled', () => {
    render(<Input disabled label="Disabled Input" />);
    const input = screen.getByLabelText('Disabled Input');
    expect(input).toBeDisabled();
  });

  it('passes through additional props', () => {
    render(<Input data-testid="test-input" aria-label="Test Input" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-label', 'Test Input');
  });
});

