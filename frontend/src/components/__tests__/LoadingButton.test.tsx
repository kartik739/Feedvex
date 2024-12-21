import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '../LoadingButton';

describe('LoadingButton', () => {
  it('renders button with children', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('shows loading text when loading', () => {
    render(
      <LoadingButton loading loadingText="Processing...">
        Click me
      </LoadingButton>
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('calls onClick when clicked and not loading', () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(
      <LoadingButton loading onClick={handleClick}>
        Click me
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<LoadingButton className="custom-class">Click me</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
