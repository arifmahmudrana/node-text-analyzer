import { countWords } from '../../src/helpers/text';

describe('countWords', () => {
  test('should return 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  test('should return 0 for string with only whitespace', () => {
    expect(countWords('   ')).toBe(0);
    expect(countWords('\t\n  ')).toBe(0);
  });

  test('should return 1 for single word', () => {
    expect(countWords('hello')).toBe(1);
    expect(countWords('world')).toBe(1);
  });

  test('should count multiple words separated by single spaces', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('the quick brown fox')).toBe(4);
  });

  test('should handle multiple spaces between words', () => {
    expect(countWords('hello    world')).toBe(2);
    expect(countWords('one  two   three    four')).toBe(4);
  });

  test('should handle mixed whitespace (spaces, tabs, newlines)', () => {
    expect(countWords('hello\tworld')).toBe(2);
    expect(countWords('hello\nworld')).toBe(2);
    expect(countWords('one\t\ntwo   three')).toBe(3);
  });

  test('should ignore punctuation', () => {
    expect(countWords('hello, world!')).toBe(2);
    expect(countWords("don't count punctuation.")).toBe(3);
    expect(countWords('one; two: three? four!')).toBe(4);
  });

  test('should treat uppercase and lowercase as same', () => {
    expect(countWords('Hello World')).toBe(2);
    expect(countWords('HELLO world')).toBe(2);
    expect(countWords('MiXeD cAsE tExT')).toBe(3);
  });

  test('should handle complex mixed cases', () => {
    expect(countWords('  Hello,  WORLD!  How are   you?  ')).toBe(5);
    expect(countWords('\t\nOne,\ttwo.\nThree!\t\n')).toBe(3);
  });

  test('should handle words with numbers', () => {
    expect(countWords('hello123 world456')).toBe(2);
    expect(countWords('test1 test2 test3')).toBe(3);
  });

  test('should handle edge cases with only punctuation', () => {
    expect(countWords('!@#$%^&*()')).toBe(0);
    expect(countWords('.,;:!?')).toBe(0);
  });
});