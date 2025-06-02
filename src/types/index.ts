export interface TextDocument {
  text: string;
  done: boolean;
  numberOfWords?: number;
  numberOfCharacters?: number;
  numberOfSentences?: number;
  numberOfParagraphs?: number;
  longestWordsInParagraphs?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
  meta?: any;
}
