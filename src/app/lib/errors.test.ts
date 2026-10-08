import { errorMessage, errorCode } from './errors';

describe('errorMessage', () => {
  it('reads the message from thrown API errors and Error objects', () => {
    expect(errorMessage({ code: 400, message: 'Name is required' }, 'Failed')).toBe('Name is required');
    expect(errorMessage(new Error('Network Error'), 'Failed')).toBe('Network Error');
  });
  it('uses a string as the message (rejectWithValue payloads)', () => {
    expect(errorMessage('Group does not exist', 'Failed')).toBe('Group does not exist');
  });
  it('falls back when there is no usable message', () => {
    expect(errorMessage(undefined, 'Failed')).toBe('Failed');
    expect(errorMessage(null, 'Failed')).toBe('Failed');
    expect(errorMessage('', 'Failed')).toBe('Failed');
    expect(errorMessage({ code: 500 }, 'Failed')).toBe('Failed');
    expect(errorMessage({ message: 42 }, 'Failed')).toBe('Failed');
  });
});

describe('errorCode', () => {
  it('reads the HTTP status from API errors', () => {
    expect(errorCode({ code: 409, message: 'x' })).toBe(409);
    expect(errorCode('x')).toBeUndefined();
    expect(errorCode({ code: 'E1' })).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
  });
});
