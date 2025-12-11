import { sanitize, sanitizeError } from './sanitize';

describe('sanitize', () => {
  it('should redact password fields', () => {
    const obj = { username: 'user', password: 'secret123' };
    const result = sanitize(obj);
    expect(result.username).toBe('user');
    expect(result.password).toBe('[REDACTED]');
  });

  it('should redact token fields', () => {
    const obj = { data: 'value', apiToken: 'abc123' };
    const result = sanitize(obj);
    expect(result.data).toBe('value');
    expect(result.apiToken).toBe('[REDACTED]');
  });

  it('should redact nested sensitive fields', () => {
    const obj = {
      user: {
        name: 'John',
        auth: { password: 'secret' },
      },
    };
    const result = sanitize(obj);
    expect(result.user.name).toBe('John');
    expect(result.user.auth.password).toBe('[REDACTED]');
  });

  it('should handle arrays', () => {
    const obj = {
      users: [
        { name: 'Alice', password: 'pass1' },
        { name: 'Bob', password: 'pass2' },
      ],
    };
    const result = sanitize(obj);
    expect(result.users[0].name).toBe('Alice');
    expect(result.users[0].password).toBe('[REDACTED]');
    expect(result.users[1].name).toBe('Bob');
    expect(result.users[1].password).toBe('[REDACTED]');
  });

  it('should handle null and undefined', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });

  it('should handle primitive values', () => {
    expect(sanitize('string')).toBe('string');
    expect(sanitize(123)).toBe(123);
    expect(sanitize(true)).toBe(true);
  });

  it('should redact authorization headers', () => {
    const obj = { authorization: 'Bearer token123' };
    const result = sanitize(obj);
    expect(result.authorization).toBe('[REDACTED]');
  });
});

describe('sanitizeError', () => {
  it('should extract error properties', () => {
    const error = new Error('Test error');
    const result = sanitizeError(error);
    expect(result.message).toBe('Test error');
    expect(result.name).toBe('Error');
    expect(result.stack).toBeDefined();
  });

  it('should handle custom error properties', () => {
    const error = new Error('Custom error');
    error.name = 'CustomError';
    const result = sanitizeError(error);
    expect(result.message).toBe('Custom error');
    expect(result.name).toBe('CustomError');
  });
});
