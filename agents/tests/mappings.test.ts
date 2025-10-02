import { describe, expect, it } from 'bun:test';
import { typeToCode, cmpToCode } from '../src/mappings';

describe('mappings helpers', () => {
  it('maps numeric types correctly', () => {
    expect(typeToCode('ubyte')).toBe(1);
    expect(typeToCode('float')).toBe(9);
    expect(typeToCode('pointer')).toBe(11);
  });

  it('defaults string to int code for friendliness', () => {
    expect(typeToCode('string')).toBe(6);
  });

  it('maps comparison codes', () => {
    expect(cmpToCode('eq')).toBe(1);
    expect(cmpToCode('approx')).toBe(7);
  });
});
