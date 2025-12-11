import { correlationContext, getCorrelationId } from './correlation';

describe('CorrelationContext', () => {
  beforeEach(() => {
    correlationContext.clear();
  });

  it('should generate unique IDs', () => {
    const id1 = correlationContext.generateId();
    const id2 = correlationContext.generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should set and get correlation ID', () => {
    const id = 'test-correlation-id';
    correlationContext.setId(id);
    expect(correlationContext.getId()).toBe(id);
  });

  it('should clear correlation ID', () => {
    correlationContext.setId('test-id');
    correlationContext.clear();
    expect(correlationContext.getId()).toBeUndefined();
  });

  it('should run function with correlation ID', () => {
    const id = 'test-id';
    let capturedId: string | undefined;

    correlationContext.run(id, () => {
      capturedId = correlationContext.getId();
    });

    expect(capturedId).toBe(id);
    expect(correlationContext.getId()).toBeUndefined();
  });

  it('should clear ID even if function throws', () => {
    const id = 'test-id';

    try {
      correlationContext.run(id, () => {
        throw new Error('Test error');
      });
    } catch (error) {
      // Expected
    }

    expect(correlationContext.getId()).toBeUndefined();
  });
});

describe('getCorrelationId', () => {
  beforeEach(() => {
    correlationContext.clear();
  });

  it('should return existing correlation ID', () => {
    const id = 'existing-id';
    correlationContext.setId(id);
    expect(getCorrelationId()).toBe(id);
  });

  it('should generate new ID if none exists', () => {
    const id = getCorrelationId();
    expect(id).toBeDefined();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
