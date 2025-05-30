import { countWords, countCharacters } from '../../src/helpers/text';

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

describe('countCharacters', () => {
  test('should return 0 for empty string', () => {
    expect(countCharacters('')).toBe(0);
  });

  test('should count single character', () => {
    expect(countCharacters('a')).toBe(1);
    expect(countCharacters('Z')).toBe(1);
    expect(countCharacters('5')).toBe(1);
  });

  test('should count multiple characters', () => {
    expect(countCharacters('hello')).toBe(5);
    expect(countCharacters('world')).toBe(5);
    expect(countCharacters('JavaScript')).toBe(10);
  });

  test('should count spaces as characters', () => {
    expect(countCharacters(' ')).toBe(1);
    expect(countCharacters('hello world')).toBe(11);
    expect(countCharacters('a b c')).toBe(5);
  });

  test('should count multiple spaces and whitespace', () => {
    expect(countCharacters('  ')).toBe(2);
    expect(countCharacters('hello   world')).toBe(13);
    expect(countCharacters('\t')).toBe(1);
    expect(countCharacters('\n')).toBe(1);
    expect(countCharacters('hello\tworld\n')).toBe(12);
  });

  test('should count punctuation marks', () => {
    expect(countCharacters('!')).toBe(1);
    expect(countCharacters('hello!')).toBe(6);
    expect(countCharacters('Hello, world!')).toBe(13);
    expect(countCharacters('!@#$%^&*()')).toBe(10);
  });

  test('should count numbers and special characters', () => {
    expect(countCharacters('123')).toBe(3);
    expect(countCharacters('test123')).toBe(7);
    expect(countCharacters('$100.50')).toBe(7);
    expect(countCharacters('user@email.com')).toBe(14);
  });

  test('should handle mixed case characters', () => {
    expect(countCharacters('Hello')).toBe(5);
    expect(countCharacters('HELLO')).toBe(5);
    expect(countCharacters('HeLLo')).toBe(5);
  });

  test('should count Unicode characters', () => {
    expect(countCharacters('café')).toBe(4);
    expect(countCharacters('naïve')).toBe(5);
    expect(countCharacters('🙂')).toBe(2); // Emoji is 2 UTF-16 code units
    expect(countCharacters('Hello 👋')).toBe(8);
  });

  test('should handle long strings', () => {
    const longString = 'a'.repeat(1000);
    expect(countCharacters(longString)).toBe(1000);
  });

  test('should count all types of characters together', () => {
    expect(countCharacters('Hello, World! 123 🌍')).toBe(20);
    expect(countCharacters('Mix3d Ch@rs & Numb3rs!')).toBe(22);
  });
});