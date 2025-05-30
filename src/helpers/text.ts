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