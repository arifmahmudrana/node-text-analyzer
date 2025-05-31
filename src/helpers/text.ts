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
