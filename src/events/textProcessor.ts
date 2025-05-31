import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { 
  countWords, 
  countCharacters, 
  countSentences, 
  countParagraphs, 
  getLongestWordsInParagraphs 
} from '../helpers/text';
import Text from '../models/Text';

export interface TextProcessingData {
  textId: mongoose.Types.ObjectId;
  text: string;
}

class TextProcessor extends EventEmitter {
  private isShuttingDown = false;

  constructor() {
    super();
    this.setupEventListeners();
    this.setupGracefulShutdown();
  }

  private setupEventListeners() {
    this.on('text:created', this.processTextAnalysis.bind(this));
  }

  private async processTextAnalysis(data: TextProcessingData) {
    if (this.isShuttingDown) {
      console.log('Skipping text processing due to shutdown');
      return;
    }

    try {
      console.log(`Processing text analysis for ID: ${data.textId}`);
      
      // Calculate text metrics using helper functions
      const numberOfWords = countWords(data.text);
      const numberOfCharacters = countCharacters(data.text);
      const numberOfSentences = countSentences(data.text);
      const numberOfParagraphs = countParagraphs(data.text);
      const longestWordsInParagraphs = getLongestWordsInParagraphs(data.text);

      // Update the document in the database
      await Text.findByIdAndUpdate(
        data.textId,
        {
          numberOfWords,
          numberOfCharacters,
          numberOfSentences,
          numberOfParagraphs,
          longestWordsInParagraphs,
          done: true,
        },
        { new: true }
      );

      console.log(`Text analysis completed for ID: ${data.textId}`);
    } catch (error) {
      // Log error but silently discard it
      console.error(`Error processing text analysis for ID: ${data.textId}`, error);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = () => {
      console.log('Shutting down text processor...');
      this.isShuttingDown = true;
      this.removeAllListeners();
      console.log('Text processor shutdown complete');
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  public emitTextCreated(textId: mongoose.Types.ObjectId, text: string) {
    if (!this.isShuttingDown) {
      this.emit('text:created', { textId, text });
    }
  }
}

// Create a singleton instance
export const textProcessor = new TextProcessor();
