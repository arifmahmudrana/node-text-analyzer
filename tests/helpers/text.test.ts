import { countWords, countCharacters, countSentences, countParagraphs, getLongestWordsInParagraphs } from '../../src/helpers/text';

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

describe('countSentences', () => {
  test('should return 0 for empty string', () => {
    expect(countSentences('')).toBe(0);
  });

  test('should return 0 for string with only whitespace', () => {
    expect(countSentences('   ')).toBe(0);
    expect(countSentences('\t\n  ')).toBe(0);
  });

  test('should count single sentence ending with period', () => {
    expect(countSentences('Hello world.')).toBe(1);
    expect(countSentences('This is a test.')).toBe(1);
  });

  test('should count single sentence ending with exclamation mark', () => {
    expect(countSentences('Hello world!')).toBe(1);
    expect(countSentences('What a great day!')).toBe(1);
  });

  test('should count single sentence ending with question mark', () => {
    expect(countSentences('How are you?')).toBe(1);
    expect(countSentences('What time is it?')).toBe(1);
  });

  test('should count multiple sentences with different endings', () => {
    expect(countSentences('Hello world. How are you?')).toBe(2);
    expect(countSentences('This is great! Are you sure? Yes, I am.')).toBe(3);
  });

  test('should handle multiple spaces between sentences', () => {
    expect(countSentences('First sentence.  Second sentence.')).toBe(2);
    expect(countSentences('One.   Two!    Three?')).toBe(3);
  });

  test('should handle sentences with multiple punctuation marks', () => {
    expect(countSentences('Really?!')).toBe(1);
    expect(countSentences('Wow!!!')).toBe(1);
    expect(countSentences('What???')).toBe(1);
    expect(countSentences('Amazing... Right?')).toBe(2);
  });

  test('should handle sentences ending at end of string', () => {
    expect(countSentences('Hello world.')).toBe(1);
    expect(countSentences('First sentence. Second sentence.')).toBe(2);
    expect(countSentences('Question?')).toBe(1);
  });

  test('should handle newlines and mixed whitespace', () => {
    expect(countSentences('First sentence.\nSecond sentence.')).toBe(2);
    expect(countSentences('One!\tTwo? Three.')).toBe(3);
  });

  test('should handle abbreviations and numbers (simple counting)', () => {
    expect(countSentences('The price is $12.99')).toBe(1); // Counts decimal as sentence ending
    expect(countSentences('Mr. Smith went to the store')).toBe(1); // Counts abbreviation as sentence ending
    expect(countSentences('The temperature was 98.6 degrees')).toBe(1); // Counts decimal as sentence ending
    expect(countSentences('Dr. Johnson and Ms. Williams arrived')).toBe(2); // Counts both abbreviations
  });

  test('should handle mixed content with abbreviations and sentences', () => {
    expect(countSentences('Mr. Smith said hello. How are you?')).toBe(3); // Counts abbreviation + 2 real sentences
    expect(countSentences('The cost is $15.99. Do you want it?')).toBe(3); // Counts decimal + 1 real sentence
  });

  test('should handle text without sentence endings', () => {
    expect(countSentences('Hello world')).toBe(0);
    expect(countSentences('This is a test')).toBe(0);
    expect(countSentences('No punctuation here')).toBe(0);
  });

  test('should handle complex punctuation scenarios', () => {
    expect(countSentences('Hello... world.')).toBe(2);
    expect(countSentences('Wait! Stop! Go!')).toBe(3);
    expect(countSentences('Is this right? Yes! No?')).toBe(3);
  });

  test('should handle edge cases with only punctuation', () => {
    expect(countSentences('.')).toBe(0);
    expect(countSentences('!')).toBe(0);
    expect(countSentences('?')).toBe(0);
    expect(countSentences('...')).toBe(0); // Ellipsis alone doesn't count
  });

  test('should handle long paragraphs', () => {
    const paragraph = 'This is the first sentence. This is the second sentence! Is this the third? Yes, it is.';
    expect(countSentences(paragraph)).toBe(4);
  });
});

describe('countParagraphs', () => {
  test('should return 0 for empty string', () => {
    expect(countParagraphs('')).toBe(0);
  });

  test('should return 0 for string with only whitespace', () => {
    expect(countParagraphs('   ')).toBe(0);
    expect(countParagraphs('\n\n\n')).toBe(0);
    expect(countParagraphs('\t\n  \n\t')).toBe(0);
  });

  test('should return 1 for single paragraph', () => {
    expect(countParagraphs('This is a single paragraph.')).toBe(1);
    expect(countParagraphs('Hello world')).toBe(1);
  });

  test('should return 1 for single paragraph with single newlines', () => {
    expect(countParagraphs('Line one\nLine two\nLine three')).toBe(1);
    expect(countParagraphs('First line.\nSecond line!')).toBe(1);
  });

  test('should count paragraphs separated by double newlines', () => {
    expect(countParagraphs('First paragraph.\n\nSecond paragraph.')).toBe(2);
    expect(countParagraphs('Para one.\n\nPara two.\n\nPara three.')).toBe(3);
  });

  test('should handle multiple empty lines between paragraphs', () => {
    expect(countParagraphs('First paragraph.\n\n\nSecond paragraph.')).toBe(2);
    expect(countParagraphs('One.\n\n\n\nTwo.')).toBe(2);
  });

  test('should handle paragraphs with spaces and tabs between newlines', () => {
    expect(countParagraphs('First paragraph.\n \nSecond paragraph.')).toBe(2);
    expect(countParagraphs('Para one.\n\t\nPara two.')).toBe(2);
    expect(countParagraphs('One.\n  \t  \nTwo.')).toBe(2);
  });

  test('should ignore leading and trailing empty lines', () => {
    expect(countParagraphs('\n\nFirst paragraph.\n\n')).toBe(1);
    expect(countParagraphs('\n\nPara one.\n\nPara two.\n\n')).toBe(2);
  });

  test('should handle mixed content', () => {
    const text = 'First paragraph with multiple sentences. This is still the first paragraph.\n\nSecond paragraph here!\n\nThird paragraph.';
    expect(countParagraphs(text)).toBe(3);
  });

  test('should handle paragraphs with different line endings', () => {
    expect(countParagraphs('First.\n\nSecond.')).toBe(2);
    expect(countParagraphs('First.\r\n\r\nSecond.')).toBe(2);
  });

  test('should handle single lines as one paragraph', () => {
    expect(countParagraphs('Just one line of text here.')).toBe(1);
    expect(countParagraphs('No newlines at all')).toBe(1);
  });

  test('should handle complex paragraph structures', () => {
    const complexText = `
      First paragraph starts here.
      It continues on the next line.

      This is the second paragraph.
      It also has multiple lines.

      Third paragraph is short.

      Fourth paragraph ends the text.
    `;
    expect(countParagraphs(complexText)).toBe(4);
  });
});

describe('getLongestWordsInParagraphs', () => {
  test('should return empty array for empty string', () => {
    expect(getLongestWordsInParagraphs('')).toEqual([]);
  });

  test('should return empty array for string with only whitespace', () => {
    expect(getLongestWordsInParagraphs('   ')).toEqual([]);
    expect(getLongestWordsInParagraphs('\n\n\n')).toEqual([]);
  });

  test('should return longest word for single paragraph', () => {
    expect(getLongestWordsInParagraphs('Hello world')).toEqual(['hello']);
    expect(getLongestWordsInParagraphs('This is a test')).toEqual(['this']);
    expect(getLongestWordsInParagraphs('Short word')).toEqual(['short']);
  });

  test('should return longest word when all words are same length', () => {
    expect(getLongestWordsInParagraphs('cat dog fox')).toEqual(['cat']); // First one wins
    expect(getLongestWordsInParagraphs('one two six')).toEqual(['one']); // First one wins
  });

  test('should handle single word paragraph', () => {
    expect(getLongestWordsInParagraphs('Hello')).toEqual(['hello']);
    expect(getLongestWordsInParagraphs('Programming')).toEqual(['programming']);
  });

  test('should return longest words for multiple paragraphs', () => {
    const text = 'This is short.\n\nThis paragraph has longer words.';
    expect(getLongestWordsInParagraphs(text)).toEqual(['short', 'paragraph']);
  });

  test('should handle punctuation by removing it', () => {
    expect(getLongestWordsInParagraphs('Hello, world!')).toEqual(['hello']);
    expect(getLongestWordsInParagraphs('Great! Excellent work.')).toEqual(['excellent']);
  });

  test('should handle mixed case by converting to lowercase', () => {
    expect(getLongestWordsInParagraphs('HELLO world')).toEqual(['hello']);
    expect(getLongestWordsInParagraphs('JavaScript Programming')).toEqual(['programming']);
  });

  test('should handle multiple spaces between words', () => {
    expect(getLongestWordsInParagraphs('short    longer   word')).toEqual(['longer']);
    expect(getLongestWordsInParagraphs('a  very   long    sentence')).toEqual(['sentence']);
  });

  test('should handle complex multi-paragraph text', () => {
    const text = `
      First paragraph with simple words.

      Second paragraph contains extraordinary vocabulary.

      Third.
    `;
    expect(getLongestWordsInParagraphs(text)).toEqual(['paragraph', 'extraordinary', 'third']);
  });

  test('should handle paragraphs with numbers', () => {
    expect(getLongestWordsInParagraphs('test123 word')).toEqual(['test123']);
    expect(getLongestWordsInParagraphs('number1 longer2')).toEqual(['number1']);
  });

  test('should handle empty paragraphs between content', () => {
    const text = 'First paragraph.\n\n\n\nSecond paragraph with longer words.';
    expect(getLongestWordsInParagraphs(text)).toEqual(['paragraph', 'paragraph']);
  });

  test('should handle paragraphs with only punctuation', () => {
    const text = 'Normal words.\n\n!!!\n\nMore normal text.';
    expect(getLongestWordsInParagraphs(text)).toEqual(['normal', '', 'normal']);
  });

  test('should handle real-world example', () => {
    const text = `
      JavaScript is a programming language.

      TypeScript extends JavaScript with type definitions.

      Both are popular.
    `;
    expect(getLongestWordsInParagraphs(text)).toEqual(['programming', 'definitions', 'popular']);
  });

  test('should handle single newlines within paragraph', () => {
    const text = 'This is one\nparagraph with\nmultiple lines.\n\nThis is another paragraph.';
    expect(getLongestWordsInParagraphs(text)).toEqual(['paragraph', 'paragraph']);
  });
});
