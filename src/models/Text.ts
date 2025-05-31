import mongoose, { Schema, Document } from 'mongoose';
import { TextDocument } from '../types';

const TextSchema = new Schema<TextDocument>({
  text: {
    type: String,
    required: [true, 'Text is required'],
    trim: true,
    minlength: [1, 'Text must be at least 1 character'],
    maxlength: [50000, 'Text cannot exceed 50000 characters']
  },
  done: {
    type: Boolean,
    default: false
  },
  numberOfWords: {
    type: Number,
    min: [0, 'Number of words cannot be negative'],
    default: 0
  },
  numberOfCharacters: {
    type: Number,
    min: [0, 'Number of characters cannot be negative'],
    default: 0
  },
  numberOfSentences: {
    type: Number,
    min: [0, 'Number of sentences cannot be negative'],
    default: 0
  },
  numberOfParagraphs: {
    type: Number,
    min: [0, 'Number of paragraphs cannot be negative'],
    default: 0
  },
  longestWordsInParagraphs: [{
    type: String,
    trim: true,
    maxlength: [50000, 'Word cannot exceed 50000 characters']
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes for better performance
TextSchema.index({ text: 'text' });
TextSchema.index({ createdAt: -1 });
TextSchema.index({ done: 1 });

export default mongoose.model<TextDocument>('Text', TextSchema);
