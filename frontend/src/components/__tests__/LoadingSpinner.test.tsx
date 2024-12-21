import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders in fullscreen mode', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const spinnerContainer = container.querySelector('.loading-spinner-container');
    expect(spinnerContainer).toHaveClass('fullscreen');
  });

  it('renders with different sizes', () => {
    const { container, rerender } = render(<LoadingSpinner size="small" />);
    let spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('small');

    rerender(<LoadingSpinner size="large" />);
    spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('large');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading data" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    
    // Screen reader text
    expect(screen.getByText('Loading data', { selector: '.sr-only' })).toBeInTheDocument();
  });
});
