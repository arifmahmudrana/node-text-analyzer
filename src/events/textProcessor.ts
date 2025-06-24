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
  public isShuttingDown = false;

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

      // Check if shutting down before database operation
      if (this.isShuttingDown) {
        console.log('Aborting text processing due to shutdown');
        return;
      }

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
      // Only log error if not shutting down to avoid Jest teardown issues
      if (!this.isShuttingDown) {
        console.error(`Error processing text analysis for ID: ${data.textId}`, error);
      }
    }
  }

  private setupGracefulShutdown() {
    const shutdown = () => {
      console.log('Shutting down text processor...');
      this.isShuttingDown = true;
      this.removeAllListeners();
      console.log('Text processor shutdown complete');
    };

    // Don't set up process listeners in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    }
  }

  public emitTextCreated(textId: mongoose.Types.ObjectId, text: string) {
    if (!this.isShuttingDown) {
      this.emit('text:created', { textId, text });
    }
  }
}

// Create a singleton instance
export const textProcessor = new TextProcessor();
