/**
 * Correlation ID context for tracking requests across components
 * Implements requirement 16.6
 */
class CorrelationContext {
  private storage = new Map<string, string>();

  /**
   * Generate a new correlation ID (simple UUID v4 implementation)
   */
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Set correlation ID for current context
   */
  setId(id: string): void {
    this.storage.set('current', id);
  }

  /**
   * Get current correlation ID
   */
  getId(): string | undefined {
    return this.storage.get('current');
  }

  /**
   * Clear correlation ID
   */
  clear(): void {
    this.storage.delete('current');
  }

  /**
   * Run a function with a correlation ID
   */
  run<T>(id: string, fn: () => T): T {
    this.setId(id);
    try {
      return fn();
    } finally {
      this.clear();
    }
  }
}

export const correlationContext = new CorrelationContext();

/**
 * Get or generate correlation ID
 */
export function getCorrelationId(): string {
  return correlationContext.getId() || correlationContext.generateId();
}
