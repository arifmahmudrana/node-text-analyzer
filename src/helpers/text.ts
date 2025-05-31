export function countWords(text: string): number {
  // Remove punctuation and convert to lowercase
  const cleanText = text.replace(/[^\w\s]/g, '').toLowerCase();
  
  // Split by whitespace and filter out empty strings
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  
  return words.length;
}

export function countCharacters(text: string): number {
  return text.length;
}

// count sentences by spiting sentence ending chars
// filter by trimming
// check if the sentence ends with a line ending
// if not count one less
// limitation doesn't handle abbreviations or complex sentence structures
export function countSentences(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Split by sentence endings and count non-empty parts
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  // If the original text ends with punctuation, we have that many sentences
  // If it doesn't end with punctuation, we have one less sentence
  const endsWithPunctuation = /[.!?]$/.test(text.trim());
  
  return endsWithPunctuation ? sentences.length : Math.max(0, sentences.length - 1);
}

export function countParagraphs(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // Split by double newlines (or more) and count non-empty paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  
  return paragraphs.length;
}

// Get the longest word in each paragraph
// Returns an array of longest words, one for each paragraph
// If a paragraph has no words, it returns an empty string for that paragraph
// If the text is empty or only contains whitespace, it returns an empty array
// Assumes words are separated by whitespace and punctuation is ignored
// If there are ties, it returns the first longest word found
// Words are lowercased
export function getLongestWordsInParagraphs(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  
  return paragraphs.map(paragraph => {
    // Clean paragraph and split into words
    const cleanParagraph = paragraph.replace(/[^\w\s]/g, '').toLowerCase();
    const words = cleanParagraph.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return '';
    }
    
    // Find the longest word (first one if there are ties)
    return words.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  });
}
